import { NotFoundError } from '../../../domain/errors/DomainError.js';

/**
 * Caso de uso para obtener el buffer binario de la imagen de un diagnóstico.
 */
export class GetDiagnosisImage {
  /**
   * @param {object} dependencies
   * @param {import('../../ports/DiagnosisRepository.js').DiagnosisRepository} dependencies.diagnosisRepository
   * @param {import('../../ports/ImageStorage.js').ImageStorage} dependencies.imageStorage
   */
  constructor({ diagnosisRepository, imageStorage }) {
    this.diagnosisRepository = diagnosisRepository;
    this.imageStorage = imageStorage;
  }

  /**
   * @param {object} params
   * @param {string} params.id
   * @param {string} params.ownerId
   * @returns {Promise<{ buffer: Buffer, mimeType: string }>}
   */
  async execute({ id, ownerId }) {
    const diagnosis = await this.diagnosisRepository.findById(id);

    if (!diagnosis || diagnosis.ownerId !== ownerId) {
      throw new NotFoundError('Diagnóstico no encontrado.', 'DIAGNOSIS_NOT_FOUND');
    }

    if (!diagnosis.image || !diagnosis.image.storageKey) {
      throw new NotFoundError(
        'La imagen de este diagnóstico no se encuentra disponible.',
        'IMAGE_NOT_FOUND'
      );
    }

    const buffer = await this.imageStorage.get(diagnosis.image.storageKey);

    return {
      buffer,
      mimeType: diagnosis.image.mimeType || 'image/jpeg',
    };
  }
}
