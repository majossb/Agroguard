import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { CreateDiagnosis } from '../../../src/application/use-cases/diagnosis/CreateDiagnosis.js';
import { FakeImageProcessor } from '../../fakes/FakeImageProcessor.js';
import { FakeInferenceEngine } from '../../fakes/FakeInferenceEngine.js';
import { FakeDiagnosisRepository } from '../../fakes/FakeDiagnosisRepository.js';
import { FakeConditionCatalogRepository } from '../../fakes/FakeConditionCatalogRepository.js';
import { FakeImageStorage } from '../../fakes/FakeImageStorage.js';
import { FakeIdGenerator } from '../../fakes/FakeIdGenerator.js';
import { FakeClock } from '../../fakes/FakeClock.js';
import { Condition, REVIEW_STATUS } from '../../../src/domain/entities/Condition.js';
import {
  InvalidImageError,
  InferenceUnavailableError,
  ValidationError,
} from '../../../src/domain/errors/DomainError.js';

const classNames = JSON.parse(
  readFileSync(resolve(process.cwd(), 'data/class_names.json'), 'utf-8')
);

describe('Application Use Case — CreateDiagnosis', () => {
  let imageProcessor;
  let inferenceEngine;
  let diagnosisRepository;
  let conditionCatalogRepository;
  let imageStorage;
  let idGenerator;
  let clock;
  let useCase;

  const dummyImageBuffer = Buffer.from('fake-image-bytes-for-testing');

  beforeEach(() => {
    imageProcessor = new FakeImageProcessor();
    inferenceEngine = new FakeInferenceEngine({
      classNames,
      forceClass: 'Tomato___Early_blight',
    });
    diagnosisRepository = new FakeDiagnosisRepository();
    conditionCatalogRepository = new FakeConditionCatalogRepository();
    imageStorage = new FakeImageStorage();
    idGenerator = new FakeIdGenerator(['diag-123-uuid']);
    clock = new FakeClock(new Date('2026-09-20T15:00:00.000Z'));

    // Sembrar condición de prueba en el catálogo fake
    conditionCatalogRepository.save(
      new Condition({
        classKey: 'Tomato___Early_blight',
        cropKey: 'Tomato',
        conditionKey: 'Early_blight',
        isHealthy: false,
        names: { es: { cropName: 'Tomate', conditionName: 'Tizón temprano' } },
        description: 'Enfermedad fungosa común en tomate.',
        symptoms: ['Manchas concéntricas en hojas bajas'],
        management: { cultural: ['Rotación de cultivos'], biological: [], chemical: [] },
        reviewStatus: REVIEW_STATUS.REVIEWED,
      })
    );

    useCase = new CreateDiagnosis({
      imageProcessor,
      inferenceEngine,
      diagnosisRepository,
      conditionCatalogRepository,
      imageStorage,
      idGenerator,
      clock,
      validClassKeys: classNames,
      minConfidence: 0.6,
    });
  });

  it('Debe procesar un diagnóstico exitoso para usuario autenticado (persisted: true)', async () => {
    const result = await useCase.execute({
      imageBuffer: dummyImageBuffer,
      ownerId: 'user-farmer-1',
      plotName: 'Lote Norte',
      notes: 'Hojas amarillentas',
    });

    expect(result.id).toBe('diag-123-uuid');
    expect(result.persisted).toBe(true);
    expect(result.createdAt).toBe('2026-09-20T15:00:00.000Z');
    expect(result.verdict.healthStatus).toBe('DISEASED');
    expect(result.verdict.confidence).toBeGreaterThan(0.9);
    expect(result.prediction.classKey).toBe('Tomato___Early_blight');
    expect(result.prediction.cropName).toBe('Tomate');
    expect(result.recommendation).toBeDefined();
    expect(result.recommendation.reviewStatus).toBe('REVIEWED');
    expect(result.image).toEqual({
      url: '/api/v1/diagnoses/diag-123-uuid/image',
      width: 800,
      height: 600,
    });

    // Verificar persistencia en repositorios
    expect(diagnosisRepository.size).toBe(1);
    const saved = await diagnosisRepository.findById('diag-123-uuid');
    expect(saved.ownerId).toBe('user-farmer-1');
    expect(saved.image.storageKey).toBe('images/2026/09/diag-123-uuid.jpg');
    expect(imageStorage.has('images/2026/09/diag-123-uuid.jpg')).toBe(true);
  });

  it('Debe procesar un diagnóstico anónimo sin persistir imagen ni entidad (persisted: false)', async () => {
    const result = await useCase.execute({
      imageBuffer: dummyImageBuffer,
      ownerId: null, // Anónimo
    });

    expect(result.id).toBeNull();
    expect(result.persisted).toBe(false);
    expect(result.image).toBeNull();
    expect(result.verdict.healthStatus).toBe('DISEASED');

    // Verificar que nada se guardó en BD ni almacenamiento
    expect(diagnosisRepository.size).toBe(0);
    expect(imageStorage.size).toBe(0);
  });

  it('Debe fallar y propagar InvalidImageError si la imagen es inválida', async () => {
    const failingProcessor = new FakeImageProcessor({
      shouldFail: true,
      failCode: 'IMAGE_TOO_SMALL',
    });

    const brokenUseCase = new CreateDiagnosis({
      imageProcessor: failingProcessor,
      inferenceEngine,
      diagnosisRepository,
      imageStorage,
      idGenerator,
      clock,
      validClassKeys: classNames,
    });

    await expect(
      brokenUseCase.execute({
        imageBuffer: dummyImageBuffer,
        ownerId: 'user-1',
      })
    ).rejects.toThrow(InvalidImageError);

    expect(diagnosisRepository.size).toBe(0);
    expect(imageStorage.size).toBe(0);
  });

  it('Debe fallar y propagar InferenceUnavailableError si el motor de inferencia falla', async () => {
    const failingEngine = new FakeInferenceEngine({
      classNames,
      shouldFail: true,
    });

    const brokenUseCase = new CreateDiagnosis({
      imageProcessor,
      inferenceEngine: failingEngine,
      diagnosisRepository,
      imageStorage,
      idGenerator,
      clock,
      validClassKeys: classNames,
    });

    await expect(
      brokenUseCase.execute({
        imageBuffer: dummyImageBuffer,
        ownerId: 'user-1',
      })
    ).rejects.toThrow(InferenceUnavailableError);

    expect(diagnosisRepository.size).toBe(0);
    expect(imageStorage.size).toBe(0);
  });

  it('Debe ejecutar compensación y eliminar la imagen si la persistencia en BD falla tras guardar el archivo', async () => {
    const failingRepo = new FakeDiagnosisRepository({ shouldFailOnSave: true });

    const compensatingUseCase = new CreateDiagnosis({
      imageProcessor,
      inferenceEngine,
      diagnosisRepository: failingRepo,
      imageStorage,
      idGenerator,
      clock,
      validClassKeys: classNames,
    });

    await expect(
      compensatingUseCase.execute({
        imageBuffer: dummyImageBuffer,
        ownerId: 'user-farmer-1',
      })
    ).rejects.toThrow('Fallo simulado al guardar diagnóstico en BD');

    // La imagen guardada debió ser eliminada por la compensación
    expect(imageStorage.size).toBe(0);
  });

  it('Debe rechazar cropHint que no pertenezca a los cultivos válidos del modelo con ValidationError', async () => {
    await expect(
      useCase.execute({
        imageBuffer: dummyImageBuffer,
        cropHint: 'Mango_Desconocido',
      })
    ).rejects.toThrow(ValidationError);
  });

  it('Debe aceptar cropHint válido independientemente de mayúsculas/minúsculas', async () => {
    const result = await useCase.execute({
      imageBuffer: dummyImageBuffer,
      cropHint: 'tomato',
    });

    expect(result.prediction.cropKey).toBe('Tomato');
  });
});
