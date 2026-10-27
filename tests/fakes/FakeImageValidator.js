import { ImageValidator } from '../../src/application/ports/ImageValidator.js';

/**
 * Fake del puerto ImageValidator para tests.
 */
export class FakeImageValidator extends ImageValidator {
  /**
   * @param {object} [options]
   * @param {'ACEPTAR'|'RECHAZAR'|'REVISAR'} [options.defaultState='ACEPTAR']
   * @param {string} [options.defaultReason='Fake validation']
   * @param {boolean} [options.shouldFail=false]
   */
  constructor({
    defaultState = 'ACEPTAR',
    defaultReason = 'Fake validation',
    shouldFail = false,
  } = {}) {
    super();
    this.defaultState = defaultState;
    this.defaultReason = defaultReason;
    this.shouldFail = shouldFail;
    this.validateCallCount = 0;
    this.lastBuffer = null;
  }

  async validate(imageBuffer) {
    this.validateCallCount++;
    this.lastBuffer = imageBuffer;

    if (this.shouldFail) {
      const { InferenceUnavailableError } = await import(
        '../../src/domain/errors/DomainError.js'
      );
      throw new InferenceUnavailableError('Fake CLIP service unavailable');
    }

    return {
      state: this.defaultState,
      reason: this.defaultReason,
      topLabels: [
        { label: 'a real photograph of a plant leaf', score: 0.85 },
        { label: 'a photograph of a person', score: 0.10 },
        { label: 'an unrelated object or landscape', score: 0.05 },
      ],
    };
  }

  async isReady() {
    return !this.shouldFail;
  }
}
