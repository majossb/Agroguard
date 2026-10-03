import { describe, it, expect, beforeEach } from 'vitest';
import { ListDiagnoses } from '../../../src/application/use-cases/diagnosis/ListDiagnoses.js';
import { GetDiagnosis } from '../../../src/application/use-cases/diagnosis/GetDiagnosis.js';
import { UpdateDiagnosisNotes } from '../../../src/application/use-cases/diagnosis/UpdateDiagnosisNotes.js';
import { DeleteDiagnosis } from '../../../src/application/use-cases/diagnosis/DeleteDiagnosis.js';
import { GetDiagnosisImage } from '../../../src/application/use-cases/diagnosis/GetDiagnosisImage.js';
import { SubmitDiagnosisFeedback } from '../../../src/application/use-cases/diagnosis/SubmitDiagnosisFeedback.js';
import { DeleteAccount } from '../../../src/application/use-cases/auth/DeleteAccount.js';

import { FakeDiagnosisRepository } from '../../fakes/FakeDiagnosisRepository.js';
import { FakeFeedbackRepository } from '../../fakes/FakeFeedbackRepository.js';
import { FakeUserRepository } from '../../fakes/FakeUserRepository.js';
import { FakeRefreshTokenRepository } from '../../fakes/FakeRefreshTokenRepository.js';
import { FakeImageStorage } from '../../fakes/FakeImageStorage.js';
import { FakeConditionCatalogRepository } from '../../fakes/FakeConditionCatalogRepository.js';
import { FakeIdGenerator } from '../../fakes/FakeIdGenerator.js';
import { FakeClock } from '../../fakes/FakeClock.js';

import { Diagnosis } from '../../../src/domain/entities/Diagnosis.js';
import { User } from '../../../src/domain/entities/User.js';
import { Email } from '../../../src/domain/value-objects/Email.js';
import { NotFoundError, ConflictError } from '../../../src/domain/errors/DomainError.js';

describe('Application Use Cases — Diagnoses, History, Feedback & Account Deletion', () => {
  let diagnosisRepository;
  let feedbackRepository;
  let userRepository;
  let refreshTokenRepository;
  let imageStorage;
  let conditionCatalogRepository;
  let idGenerator;
  let clock;

  let listDiagnoses;
  let getDiagnosis;
  let updateDiagnosisNotes;
  let deleteDiagnosis;
  let getDiagnosisImage;
  let submitDiagnosisFeedback;
  let deleteAccount;

  const owner1 = 'user-farmer-1';
  const owner2 = 'user-farmer-2';
  let diag1;
  let diag2;

  beforeEach(async () => {
    diagnosisRepository = new FakeDiagnosisRepository();
    feedbackRepository = new FakeFeedbackRepository();
    userRepository = new FakeUserRepository();
    refreshTokenRepository = new FakeRefreshTokenRepository();
    imageStorage = new FakeImageStorage();
    conditionCatalogRepository = new FakeConditionCatalogRepository();
    idGenerator = new FakeIdGenerator();
    clock = new FakeClock();

    listDiagnoses = new ListDiagnoses({ diagnosisRepository });
    getDiagnosis = new GetDiagnosis({ diagnosisRepository, conditionCatalogRepository });
    updateDiagnosisNotes = new UpdateDiagnosisNotes({ diagnosisRepository });
    deleteDiagnosis = new DeleteDiagnosis({ diagnosisRepository, imageStorage, feedbackRepository });
    getDiagnosisImage = new GetDiagnosisImage({ diagnosisRepository, imageStorage });
    submitDiagnosisFeedback = new SubmitDiagnosisFeedback({
      diagnosisRepository,
      feedbackRepository,
      idGenerator,
      clock,
    });
    deleteAccount = new DeleteAccount({
      userRepository,
      diagnosisRepository,
      feedbackRepository,
      refreshTokenRepository,
      imageStorage,
    });

    // Guardar imagen en FakeStorage
    await imageStorage.save('images/2026/09/diag-1.jpg', Buffer.from('image-1-bytes'));
    await imageStorage.save('images/2026/09/diag-2.jpg', Buffer.from('image-2-bytes'));

    // Crear diagnósticos iniciales
    diag1 = new Diagnosis({
      id: 'diag-1',
      ownerId: owner1,
      image: {
        storageKey: 'images/2026/09/diag-1.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 1024,
        width: 800,
        height: 600,
        sha256: 'a'.repeat(64),
      },
      verdict: { healthStatus: 'DISEASED', confidence: 0.95, healthyProbability: 0.02 },
      prediction: {
        classKey: 'Tomato___Early_blight',
        cropKey: 'Tomato',
        conditionKey: 'Early_blight',
        cropName: 'Tomate',
        conditionName: 'Tizón temprano',
      },
      topPredictions: [{ classKey: 'Tomato___Early_blight', probability: 0.95 }],
      context: { plotName: 'Lote 1', notes: 'Manchas iniciales' },
      model: { name: 'ResNet50', version: '1.0.0', provider: 'mock' },
      processingTimeMs: 120,
      createdAt: new Date('2026-09-20T10:00:00.000Z'),
    });

    diag2 = new Diagnosis({
      id: 'diag-2',
      ownerId: owner2,
      image: {
        storageKey: 'images/2026/09/diag-2.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 1024,
        width: 800,
        height: 600,
        sha256: 'b'.repeat(64),
      },
      verdict: { healthStatus: 'HEALTHY', confidence: 0.98, healthyProbability: 0.98 },
      prediction: {
        classKey: 'Tomato___healthy',
        cropKey: 'Tomato',
        conditionKey: 'healthy',
        cropName: 'Tomate',
        conditionName: 'Hoja sana',
      },
      topPredictions: [{ classKey: 'Tomato___healthy', probability: 0.98 }],
      context: { plotName: 'Lote 2', notes: 'Control de sanidad' },
      model: { name: 'ResNet50', version: '1.0.0', provider: 'mock' },
      processingTimeMs: 110,
      createdAt: new Date('2026-09-20T11:00:00.000Z'),
    });

    await diagnosisRepository.save(diag1);
    await diagnosisRepository.save(diag2);
  });

  describe('ListDiagnoses', () => {
    it('Debe listar únicamente los diagnósticos del usuario autenticado de forma paginada', async () => {
      const result = await listDiagnoses.execute({
        ownerId: owner1,
        pagination: { page: 1, pageSize: 10 },
      });

      expect(result.totalItems).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('diag-1');
      expect(result.items[0].prediction.classKey).toBe('Tomato___Early_blight');
    });

    it('Debe aplicar filtros por healthStatus', async () => {
      const result = await listDiagnoses.execute({
        ownerId: owner1,
        filters: { healthStatus: 'HEALTHY' },
      });

      expect(result.totalItems).toBe(0);
      expect(result.items).toHaveLength(0);
    });
  });

  describe('GetDiagnosis & Authorization Rules (404 a recursos ajenos)', () => {
    it('Debe obtener el detalle del diagnóstico propio', async () => {
      const result = await getDiagnosis.execute({ id: 'diag-1', ownerId: owner1 });

      expect(result.id).toBe('diag-1');
      expect(result.verdict.healthStatus).toBe('DISEASED');
      expect(result.recommendation).toBeDefined();
    });

    it('Debe responder 404 (NotFoundError) si el diagnóstico pertenece a otro usuario para no revelar existencia', async () => {
      await expect(
        getDiagnosis.execute({ id: 'diag-2', ownerId: owner1 })
      ).rejects.toThrow(NotFoundError);
    });

    it('Debe responder 404 si el diagnóstico no existe', async () => {
      await expect(
        getDiagnosis.execute({ id: 'id-inexistente', ownerId: owner1 })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('UpdateDiagnosisNotes', () => {
    it('Debe actualizar el nombre de lote y notas del diagnóstico propio', async () => {
      const updated = await updateDiagnosisNotes.execute({
        id: 'diag-1',
        ownerId: owner1,
        plotName: 'Lote Norte Actualizado',
        notes: 'Nuevas notas agronómicas',
      });

      expect(updated.plotName).toBe('Lote Norte Actualizado');
      expect(updated.notes).toBe('Nuevas notas agronómicas');

      const saved = await diagnosisRepository.findById('diag-1');
      expect(saved.context.plotName).toBe('Lote Norte Actualizado');
    });

    it('Debe responder 404 si se intenta actualizar el diagnóstico de otro usuario', async () => {
      await expect(
        updateDiagnosisNotes.execute({
          id: 'diag-2',
          ownerId: owner1,
          plotName: 'Ataque',
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('DeleteDiagnosis', () => {
    it('Debe eliminar el diagnóstico de la BD y su archivo de imagen en almacenamiento', async () => {
      expect(imageStorage.has('images/2026/09/diag-1.jpg')).toBe(true);

      await deleteDiagnosis.execute({ id: 'diag-1', ownerId: owner1 });

      expect(await diagnosisRepository.findById('diag-1')).toBeNull();
      expect(imageStorage.has('images/2026/09/diag-1.jpg')).toBe(false);
    });

    it('Debe responder 404 si se intenta borrar un diagnóstico ajeno', async () => {
      await expect(
        deleteDiagnosis.execute({ id: 'diag-2', ownerId: owner1 })
      ).rejects.toThrow(NotFoundError);

      expect(await diagnosisRepository.findById('diag-2')).not.toBeNull();
    });
  });

  describe('GetDiagnosisImage', () => {
    it('Debe recuperar el buffer de imagen para un diagnóstico propio', async () => {
      const result = await getDiagnosisImage.execute({ id: 'diag-1', ownerId: owner1 });

      expect(result.buffer.toString()).toBe('image-1-bytes');
      expect(result.mimeType).toBe('image/jpeg');
    });

    it('Debe responder 404 al intentar obtener la imagen de un diagnóstico de otro usuario', async () => {
      await expect(
        getDiagnosisImage.execute({ id: 'diag-2', ownerId: owner1 })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('SubmitDiagnosisFeedback', () => {
    it('Debe registrar feedback exitosamente para un diagnóstico propio', async () => {
      const result = await submitDiagnosisFeedback.execute({
        diagnosisId: 'diag-1',
        ownerId: owner1,
        wasCorrect: true,
        comment: 'Coincide con la sintomatología observada',
      });

      expect(result.id).toBeDefined();
      expect(result.diagnosisId).toBe('diag-1');
      expect(result.wasCorrect).toBe(true);

      const saved = await feedbackRepository.findByDiagnosisId('diag-1');
      expect(saved).not.toBeNull();
      expect(saved.wasCorrect).toBe(true);
    });

    it('Debe rechazar feedback duplicado para el mismo diagnóstico con ConflictError', async () => {
      await submitDiagnosisFeedback.execute({
        diagnosisId: 'diag-1',
        ownerId: owner1,
        wasCorrect: true,
      });

      await expect(
        submitDiagnosisFeedback.execute({
          diagnosisId: 'diag-1',
          ownerId: owner1,
          wasCorrect: false,
        })
      ).rejects.toThrow(ConflictError);
    });

    it('Debe responder 404 al intentar enviar feedback a un diagnóstico de otro usuario', async () => {
      await expect(
        submitDiagnosisFeedback.execute({
          diagnosisId: 'diag-2',
          ownerId: owner1,
          wasCorrect: true,
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('DeleteAccount (Borrado en Cascada)', () => {
    it('Debe borrar en cascada el usuario, todos sus diagnósticos, imágenes, feedback y sesiones', async () => {
      // 1. Crear usuario y feedback
      await userRepository.save(
        new User({
          id: owner1,
          email: new Email('agricultor1@agroguard.dev'),
          passwordHash: 'hash',
          fullName: 'Agricultor 1',
        })
      );
      await submitDiagnosisFeedback.execute({
        diagnosisId: 'diag-1',
        ownerId: owner1,
        wasCorrect: true,
      });
      await refreshTokenRepository.save({
        tokenHash: 'hash-tok-1',
        userId: owner1,
        familyId: 'fam-1',
        expiresAt: new Date(Date.now() + 100000),
      });

      expect(await userRepository.findById(owner1)).not.toBeNull();
      expect(await diagnosisRepository.findById('diag-1')).not.toBeNull();
      expect(imageStorage.has('images/2026/09/diag-1.jpg')).toBe(true);
      expect(await feedbackRepository.findByDiagnosisId('diag-1')).not.toBeNull();

      // 2. Ejecutar borrado de cuenta en cascada
      await deleteAccount.execute(owner1);

      // 3. Verificar que todo fue eliminado
      expect(await userRepository.findById(owner1)).toBeNull();
      expect(await diagnosisRepository.findById('diag-1')).toBeNull();
      expect(imageStorage.has('images/2026/09/diag-1.jpg')).toBe(false);
      expect(await feedbackRepository.findByDiagnosisId('diag-1')).toBeNull();

      // El usuario 2 debe permanecer intacto
      expect(await diagnosisRepository.findById('diag-2')).not.toBeNull();
      expect(imageStorage.has('images/2026/09/diag-2.jpg')).toBe(true);
    });
  });
});
