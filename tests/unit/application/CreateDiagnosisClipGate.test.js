/**
 * Tests unitarios para CreateDiagnosis con CLIP gate (ImageValidator).
 *
 * Verifica que:
 * 1. RECHAZAR → lanza ImageRejectedError (no ejecuta ensemble)
 * 2. REVISAR → retorna HTTP 200 con validationState, sin prediction
 * 3. ACEPTAR → ejecuta ensemble normalmente y retorna validationState + clipTopLabels
 * 4. Sin imageValidator → funciona como antes (sin gate)
 * 5. imageValidator.validate() falla → propaga InferenceUnavailableError
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { CreateDiagnosis } from '../../../src/application/use-cases/diagnosis/CreateDiagnosis.js';
import {
  ImageRejectedError,
  InferenceUnavailableError,
} from '../../../src/domain/errors/DomainError.js';
import { FakeImageProcessor } from '../../fakes/FakeImageProcessor.js';
import { FakeInferenceEngine } from '../../fakes/FakeInferenceEngine.js';
import { FakeImageValidator } from '../../fakes/FakeImageValidator.js';
import { FakeDiagnosisRepository } from '../../fakes/FakeDiagnosisRepository.js';
import { FakeImageStorage } from '../../fakes/FakeImageStorage.js';
import { FakeIdGenerator } from '../../fakes/FakeIdGenerator.js';
import { FakeClock } from '../../fakes/FakeClock.js';

const CLASS_NAMES = [
  'Apple___Apple_scab',
  'Apple___healthy',
  'Tomato___Early_blight',
  'Tomato___healthy',
  'Corn___healthy',
  'Corn___Northern_Leaf_Blight',
  'Grape___healthy',
  'Grape___Black_rot',
  'Potato___healthy',
  'Potato___Late_blight',
  'Strawberry___healthy',
  'Strawberry___Leaf_scorch',
  'Cherry___healthy',
  'Cherry___Powdery_mildew',
  'Peach___healthy',
  'Peach___Bacterial_spot',
  'Pepper_bell___healthy',
  'Pepper_bell___Bacterial_spot',
  'Soybean___healthy',
  'Squash___Powdery_mildew',
  'Orange___Haunglongbing',
  'Raspberry___healthy',
  'Blueberry___healthy',
  'Tomato___Late_blight',
  'Tomato___Leaf_Mold',
  'Tomato___Septoria_leaf_spot',
  'Tomato___Spider_mites',
  'Tomato___Target_Spot',
  'Tomato___mosaic_virus',
  'Tomato___Yellow_Leaf_Curl_Virus',
  'Tomato___healthy_v2',
  'Apple___Black_rot',
  'Apple___Cedar_apple_rust',
  'Corn___Cercospora_leaf_spot',
  'Corn___Common_rust',
  'Grape___Esca',
  'Grape___Leaf_blight',
  'Potato___Early_blight',
];

const IMAGE_BUFFER = Buffer.from('fake-image-data-for-test');

function createDeps(overrides = {}) {
  return {
    imageProcessor: new FakeImageProcessor(),
    inferenceEngine: new FakeInferenceEngine({ classNames: CLASS_NAMES }),
    imageValidator: overrides.imageValidator || null,
    diagnosisRepository: new FakeDiagnosisRepository(),
    imageStorage: new FakeImageStorage(),
    idGenerator: new FakeIdGenerator(),
    clock: new FakeClock(),
    validClassKeys: CLASS_NAMES,
    minConfidence: 0.6,
    ...overrides,
  };
}

describe('Application — CreateDiagnosis con CLIP Gate', () => {
  it('RECHAZAR: lanza ImageRejectedError y NO ejecuta el ensemble', async () => {
    const validator = new FakeImageValidator({ defaultState: 'RECHAZAR', defaultReason: 'No es planta' });
    const engine = new FakeInferenceEngine({ classNames: CLASS_NAMES });
    const deps = createDeps({ imageValidator: validator, inferenceEngine: engine });
    const uc = new CreateDiagnosis(deps);

    await expect(
      uc.execute({ imageBuffer: IMAGE_BUFFER })
    ).rejects.toBeInstanceOf(ImageRejectedError);

    // El ensemble NO debe haberse ejecutado
    expect(engine.predictCallCount).toBe(0);
    expect(validator.validateCallCount).toBe(1);
  });

  it('REVISAR: retorna HTTP 200 con validationState=REVISAR, sin prediction ni ensemble', async () => {
    const validator = new FakeImageValidator({ defaultState: 'REVISAR', defaultReason: 'Resultado ambiguo' });
    const engine = new FakeInferenceEngine({ classNames: CLASS_NAMES });
    const deps = createDeps({ imageValidator: validator, inferenceEngine: engine });
    const uc = new CreateDiagnosis(deps);

    const result = await uc.execute({ imageBuffer: IMAGE_BUFFER });

    expect(result.validationState).toBe('REVISAR');
    expect(result.validationReason).toBe('Resultado ambiguo');
    expect(result.prediction).toBeNull();
    expect(result.verdict).toBeNull();
    expect(result.clipTopLabels).toBeDefined();
    expect(Array.isArray(result.clipTopLabels)).toBe(true);
    // El ensemble NO debe haberse ejecutado
    expect(engine.predictCallCount).toBe(0);
    expect(validator.validateCallCount).toBe(1);
  });

  it('ACEPTAR: ejecuta ensemble normalmente y retorna validationState + clipTopLabels', async () => {
    const validator = new FakeImageValidator({ defaultState: 'ACEPTAR', defaultReason: 'Planta detectada' });
    const engine = new FakeInferenceEngine({ classNames: CLASS_NAMES });
    const deps = createDeps({ imageValidator: validator, inferenceEngine: engine });
    const uc = new CreateDiagnosis(deps);

    const result = await uc.execute({ imageBuffer: IMAGE_BUFFER });

    expect(result.validationState).toBe('ACEPTAR');
    expect(result.validationReason).toBe('Planta detectada');
    expect(result.clipTopLabels).toBeDefined();
    expect(result.prediction).toBeDefined();
    expect(result.verdict).toBeDefined();
    expect(engine.predictCallCount).toBe(1);
    expect(validator.validateCallCount).toBe(1);
  });

  it('Sin imageValidator: funciona como antes (sin gate CLIP)', async () => {
    const engine = new FakeInferenceEngine({ classNames: CLASS_NAMES });
    const deps = createDeps({ imageValidator: null, inferenceEngine: engine });
    const uc = new CreateDiagnosis(deps);

    const result = await uc.execute({ imageBuffer: IMAGE_BUFFER });

    expect(result.validationState).toBeNull();
    expect(result.clipTopLabels).toBeNull();
    expect(result.prediction).toBeDefined();
    expect(result.verdict).toBeDefined();
    expect(engine.predictCallCount).toBe(1);
  });

  it('imageValidator falla: propaga InferenceUnavailableError (fail-safe)', async () => {
    const validator = new FakeImageValidator({ shouldFail: true });
    const engine = new FakeInferenceEngine({ classNames: CLASS_NAMES });
    const deps = createDeps({ imageValidator: validator, inferenceEngine: engine });
    const uc = new CreateDiagnosis(deps);

    await expect(
      uc.execute({ imageBuffer: IMAGE_BUFFER })
    ).rejects.toBeInstanceOf(InferenceUnavailableError);

    // Ensemble NO debe ejecutarse si CLIP falla
    expect(engine.predictCallCount).toBe(0);
  });
});
