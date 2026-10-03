import { InferenceEngine } from '../../src/application/ports/InferenceEngine.js';
import {
  InferenceUnavailableError,
} from '../../src/domain/errors/DomainError.js';
import crypto from 'crypto';

export class FakeInferenceEngine extends InferenceEngine {
  /**
   * @param {object} [options]
   * @param {readonly string[]} options.classNames
   * @param {string} [options.forceClass]
   * @param {boolean} [options.shouldFail=false]
   */
  constructor({ classNames, forceClass = '', shouldFail = false } = {}) {
    super();
    this.classNames = classNames || [];
    this.forceClass = forceClass;
    this.shouldFail = shouldFail;
    this.predictCallCount = 0;
  }

  async predict(image) {
    this.predictCallCount++;

    if (this.shouldFail) {
      throw new InferenceUnavailableError(
        'El servicio de inferencia simulado no está disponible.'
      );
    }

    const hash = crypto.createHash('sha256').update(image.buffer).digest('hex');
    const classCount = this.classNames.length;

    let probabilities;
    if (this.forceClass && this.classNames.includes(this.forceClass)) {
      const topProb = 0.945;
      const remainingProb = 1 - topProb;
      const otherProb = remainingProb / (classCount - 1);
      probabilities = this.classNames.map((key) => ({
        classKey: key,
        probability: key === this.forceClass ? topProb : otherProb,
      }));
    } else {
      const seedInt = parseInt(hash.slice(0, 8), 16);
      const winnerIdx = seedInt % classCount;
      const rawScores = this.classNames.map((_, i) =>
        i === winnerIdx ? 50 + (seedInt % 30) : ((parseInt(hash.slice((i % 24), (i % 24) + 4), 16)) % 10) + 1
      );
      const total = rawScores.reduce((a, b) => a + b, 0);
      probabilities = this.classNames.map((key, i) => ({
        classKey: key,
        probability: rawScores[i] / total,
      }));
    }

    return {
      modelName: 'FakeModel',
      modelVersion: '1.0.0',
      provider: 'mock',
      probabilities,
      inferenceTimeMs: 42,
      explanation: null,
    };
  }

  async info() {
    return {
      name: 'FakeModel',
      version: '1.0.0',
      inputSize: 224,
      classCount: this.classNames.length,
      dataset: 'Fake Dataset',
      metrics: null,
      evaluationNote: 'Métricas pendientes de verificación con una evaluación reproducible',
    };
  }

  async isReady() {
    return !this.shouldFail;
  }
}
