import crypto from 'crypto';
import { InferenceEngine } from '../../application/ports/InferenceEngine.js';
import {
  InferenceUnavailableError,
} from '../../domain/errors/DomainError.js';

/**
 * Adaptador de inferencia simulado determinista para desarrollo y pruebas.
 * @implements {InferenceEngine}
 */
export class MockInferenceEngine extends InferenceEngine {
  /**
   * @param {object} params
   * @param {readonly string[]} params.classNames - Lista de 38 clases en orden del modelo
   * @param {object} [params.logger]
   * @param {string} [params.forceClass] - Forzar una clase específica como ganadora
   * @param {boolean} [params.simulateLowConfidence=false]
   * @param {boolean} [params.simulateFailure=false]
   * @param {boolean} [params.simulateInvalidResult=false]
   */
  constructor({
    classNames,
    logger = null,
    forceClass = '',
    simulateLowConfidence = false,
    simulateFailure = false,
    simulateInvalidResult = false,
  }) {
    super();
    if (!Array.isArray(classNames) || classNames.length === 0) {
      throw new Error('MockInferenceEngine requiere una lista válida de classNames.');
    }
    this.classNames = classNames;
    this.logger = logger;
    this.forceClass = forceClass;
    this.simulateLowConfidence = simulateLowConfidence;
    this.simulateFailure = simulateFailure;
    this.simulateInvalidResult = simulateInvalidResult;

    if (this.logger) {
      this.logger.warn(
        'USANDO INFERENCIA SIMULADA — los diagnósticos NO son reales'
      );
    }
  }

  /**
   * @param {{ buffer: Buffer, mimeType: 'image/jpeg' }} image
   * @returns {Promise<import('../../application/ports/InferenceEngine.js').InferenceResult>}
   */
  async predict(image) {
    if (this.simulateFailure) {
      throw new InferenceUnavailableError(
        'El servicio de inferencia simulado ha fallado deliberadamente.'
      );
    }

    if (this.simulateInvalidResult) {
      return {
        modelName: 'ResNet50_Transfer_Mock',
        modelVersion: '1.0.0',
        provider: 'mock',
        probabilities: [
          { classKey: 'Clase_Invalida_Inexistente', probability: 0.5 },
        ],
        inferenceTimeMs: 50,
        explanation: null,
      };
    }

    const start = Date.now();
    const hash = crypto.createHash('sha256').update(image.buffer).digest('hex');
    const classCount = this.classNames.length;

    let probabilities = [];

    if (this.forceClass && this.classNames.includes(this.forceClass)) {
      const topProb = 0.945;
      const remainingProb = 1 - topProb;
      const otherClassProb = remainingProb / (classCount - 1);

      probabilities = this.classNames.map((key) => ({
        classKey: key,
        probability: key === this.forceClass ? topProb : otherClassProb,
      }));
    } else if (this.simulateLowConfidence) {
      // Distribución plana donde el valor máximo no supera 0.40
      const uniformProb = 1.0 / classCount;
      probabilities = this.classNames.map((key, idx) => {
        const delta = ((idx % 5) - 2) * 0.005;
        return {
          classKey: key,
          probability: uniformProb + delta,
        };
      });
      // Normalizar para que sume 1.0
      const sum = probabilities.reduce((acc, p) => acc + p.probability, 0);
      probabilities = probabilities.map((p) => ({
        classKey: p.classKey,
        probability: p.probability / sum,
      }));
    } else {
      // Derivar pseudo-aleatoriamente del SHA-256 de forma determinista
      const seedInt = parseInt(hash.slice(0, 8), 16);
      const targetWinnerIndex = seedInt % classCount;

      const rawScores = this.classNames.map((_, i) => {
        if (i === targetWinnerIndex) return 50.0 + (seedInt % 30);
        const subSeed = parseInt(hash.slice((i % 24), (i % 24) + 4), 16);
        return (subSeed % 10) + 1;
      });

      const totalScore = rawScores.reduce((a, b) => a + b, 0);
      probabilities = this.classNames.map((key, i) => ({
        classKey: key,
        probability: rawScores[i] / totalScore,
      }));
    }

    const inferenceTimeMs = Math.max(1, Date.now() - start + 45);

    return {
      modelName: 'ResNet50_Transfer_Mock',
      modelVersion: '1.0.0',
      provider: 'mock',
      probabilities,
      inferenceTimeMs,
      explanation: null,
    };
  }

  /**
   * @returns {Promise<import('../../application/ports/InferenceEngine.js').ModelInfo>}
   */
  async info() {
    return {
      name: 'ResNet50_Transfer_Mock',
      version: '1.0.0',
      inputSize: 224,
      classCount: this.classNames.length,
      dataset: 'New Plant Diseases Dataset (Augmented), derivado de PlantVillage',
      metrics: null,
      evaluationNote: 'Métricas pendientes de verificación con una evaluación reproducible',
    };
  }

  async isReady() {
    return !this.simulateFailure;
  }
}
