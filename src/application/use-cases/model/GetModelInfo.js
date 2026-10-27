import fs from 'fs';
import crypto from 'crypto';

/**
 * Caso de uso para obtener la información, versión, métricas del modelo de inferencia,
 * metadatos de validación visual CLIP y el hash criptográfico del diccionario de clases.
 */
export class GetModelInfo {
  /**
   * @param {object} dependencies
   * @param {import('../../ports/InferenceEngine.js').InferenceEngine} dependencies.inferenceEngine
   * @param {object} [dependencies.config]
   * @param {string} [dependencies.dictionaryPath]
   */
  constructor({ inferenceEngine, config = null, dictionaryPath = null }) {
    this.inferenceEngine = inferenceEngine;
    this.config = config;
    this.dictionaryPath = dictionaryPath;
  }

  /**
   * @returns {Promise<import('../../ports/InferenceEngine.js').ModelInfo & { clip: object, classDictionarySha256: string|null }>}
   */
  async execute() {
    const baseInfo = await this.inferenceEngine.info();

    let classDictionarySha256 = null;
    const candidatePaths = [
      this.dictionaryPath,
      'agroguard_modelos_completos/class_dictionary.json',
      'data/class_names.json',
    ].filter(Boolean);

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        try {
          const content = fs.readFileSync(p);
          classDictionarySha256 = crypto
            .createHash('sha256')
            .update(content)
            .digest('hex');
          break;
        } catch {
          // Si no se puede leer, intentar siguiente ruta
        }
      }
    }

    const clipInfo = {
      model: 'openai/clip-vit-base-patch32',
      enabled: this.config ? Boolean(this.config.CLIP_ENABLED) : true,
      thresholds: {
        plant: this.config?.CLIP_THRESHOLD_PLANT ?? 0.3,
        noPlant: this.config?.CLIP_THRESHOLD_NO_PLANT ?? 0.7,
        unsupportedCrop: this.config?.CLIP_THRESHOLD_UNSUPPORTED_CROP ?? 0.6,
      },
    };

    return {
      ...baseInfo,
      clip: clipInfo,
      classDictionarySha256,
    };
  }
}
