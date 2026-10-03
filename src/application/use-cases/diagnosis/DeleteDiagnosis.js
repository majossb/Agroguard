import { NotFoundError } from '../../../domain/errors/DomainError.js';

/**
 * Caso de uso para eliminar un diagnóstico y su imagen asociada.
 */
export class DeleteDiagnosis {
  /**
   * @param {object} dependencies
   * @param {import('../../ports/DiagnosisRepository.js').DiagnosisRepository} dependencies.diagnosisRepository
   * @param {import('../../ports/ImageStorage.js').ImageStorage} dependencies.imageStorage
   * @param {import('../../ports/FeedbackRepository.js').FeedbackRepository} [dependencies.feedbackRepository]
   */
  constructor({ diagnosisRepository, imageStorage, feedbackRepository = null }) {
    this.diagnosisRepository = diagnosisRepository;
    this.imageStorage = imageStorage;
    this.feedbackRepository = feedbackRepository;
  }

  /**
   * @param {object} params
   * @param {string} params.id
   * @param {string} params.ownerId
   * @returns {Promise<void>}
   */
  async execute({ id, ownerId }) {
    const diagnosis = await this.diagnosisRepository.findById(id);

    if (!diagnosis || diagnosis.ownerId !== ownerId) {
      throw new NotFoundError('Diagnóstico no encontrado.', 'DIAGNOSIS_NOT_FOUND');
    }

    // 1. Eliminar archivo de imagen del almacenamiento si existe
    if (diagnosis.image && diagnosis.image.storageKey) {
      try {
        await this.imageStorage.delete(diagnosis.image.storageKey);
      } catch {
        // Continuar con borrado de datos aunque el archivo físico ya no existiera
      }
    }

    // 2. Eliminar feedback asociado si existe
    if (this.feedbackRepository) {
      try {
        await this.feedbackRepository.deleteByDiagnosisId(id);
      } catch {
        // Continuar
      }
    }

    // 3. Eliminar registro en base de datos
    await this.diagnosisRepository.deleteById(id);
  }
}
