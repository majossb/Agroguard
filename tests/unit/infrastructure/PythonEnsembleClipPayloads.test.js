/**
 * Unit tests for PythonEnsembleInferenceEngine — CLIP payload handling
 *
 * These tests exercise _handleDaemonLine with the new 'rejected' and 'review'
 * payloads introduced by the CLIP filter, without spawning a real Python process.
 * The daemon start-up is bypassed by overriding _startDaemon.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { PythonEnsembleInferenceEngine } from '../../../src/infrastructure/inference/PythonEnsembleInferenceEngine.js';
import {
  ImageRejectedError,
  ImageReviewRequiredError,
} from '../../../src/domain/errors/DomainError.js';

// Minimal class that skips daemon startup so we can call _handleDaemonLine directly
class TestableEngine extends PythonEnsembleInferenceEngine {
  constructor(classNames) {
    // Bypass super constructor side-effects (spawn) by passing a sentinel that we override
    super({
      pythonBin: '/usr/bin/false', // does not exist / not used in tests
      scriptPath: '/dev/null',
      classNames,
      clipEnabled: true,
      clipThresholdPlant: 0.70,
      clipThresholdReject: 0.70,
    });
  }

  // Override to prevent actual daemon spawn
  async _startDaemon() {
    // no-op: skip spawning Python for unit tests
    this.isDaemonReady = true;
  }
}

const CLASS_NAMES = [
  'Apple___Apple_scab',
  'Tomato___Early_blight',
  'Tomato___healthy',
];

describe('Infrastructure — PythonEnsembleInferenceEngine (CLIP payloads)', () => {
  let engine;

  beforeEach(() => {
    engine = new TestableEngine(CLASS_NAMES);
    // Simulate that a request is currently active so _handleDaemonLine has something to resolve/reject
  });

  /**
   * Helper: registers a fake active request and dispatches a line to _handleDaemonLine.
   * Returns a promise that resolves/rejects according to the handler's behaviour.
   */
  function dispatchLine(payload) {
    return new Promise((resolve, reject) => {
      // Simulate an active request (the pending promise from a predict() call)
      engine.activeRequest = {
        resolve,
        reject,
        timer: null, // no real timer needed in unit tests
      };
      engine._handleDaemonLine(JSON.stringify(payload), () => {});
    });
  }

  it('Payload { status: "rejected" } lanza ImageRejectedError', async () => {
    const payload = {
      status: 'rejected',
      estado: 'RECHAZAR',
      motivo: 'Contenido ajeno a una hoja/planta (etiqueta: \'a meme with text and characters\', confianza: 0.93).',
    };

    await expect(dispatchLine(payload)).rejects.toBeInstanceOf(ImageRejectedError);
  });

  it('El ImageRejectedError contiene el motivo del payload', async () => {
    const motivo = 'Contenido ajeno a una hoja/planta.';
    const payload = { status: 'rejected', estado: 'RECHAZAR', motivo };

    try {
      await dispatchLine(payload);
      throw new Error('Deberia haber rechazado');
    } catch (err) {
      expect(err).toBeInstanceOf(ImageRejectedError);
      expect(err.message).toBe(motivo);
      expect(err.reason).toBe(motivo);
    }
  });

  it('Payload { status: "review" } lanza ImageReviewRequiredError', async () => {
    const payload = {
      status: 'review',
      estado: 'REVISAR',
      motivo: 'Resultado ambiguo (mejor etiqueta: \'a real photograph of a plant leaf\', confianza: 0.55).',
    };

    await expect(dispatchLine(payload)).rejects.toBeInstanceOf(ImageReviewRequiredError);
  });

  it('El ImageReviewRequiredError contiene el motivo del payload', async () => {
    const motivo = 'Resultado ambiguo.';
    const payload = { status: 'review', estado: 'REVISAR', motivo };

    try {
      await dispatchLine(payload);
      throw new Error('Deberia haber rechazado');
    } catch (err) {
      expect(err).toBeInstanceOf(ImageReviewRequiredError);
      expect(err.message).toBe(motivo);
      expect(err.reason).toBe(motivo);
    }
  });

  it('Payload { status: "success" } resuelve la promesa normalmente', async () => {
    const payload = {
      status: 'success',
      inferenceTimeMs: 123,
      models: {
        EfficientNetB0: [0.01, 0.97, 0.02],
        ResNet50: [0.01, 0.95, 0.04],
        MobileNetV2: [0.02, 0.93, 0.05],
        CNN_Base: [0.03, 0.90, 0.07],
      },
      clipMotivo: 'Fotografia de planta detectada.',
    };

    const result = await dispatchLine(payload);
    expect(result.status).toBe('success');
    expect(result.inferenceTimeMs).toBe(123);
  });

  it('Payload con status desconocido lanza InvalidInferenceResultError', async () => {
    const { InvalidInferenceResultError } = await import('../../../src/domain/errors/DomainError.js');
    const payload = { status: 'unknown', message: 'Error inesperado' };

    await expect(dispatchLine(payload)).rejects.toBeInstanceOf(InvalidInferenceResultError);
  });

  it('constructor acepta clipEnabled=false sin errores', () => {
    expect(() => {
      const eng = new TestableEngine(CLASS_NAMES);
      eng.clipEnabled = false;
    }).not.toThrow();
  });
});
