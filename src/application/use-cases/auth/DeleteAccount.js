import { NotFoundError } from '../../../domain/errors/DomainError.js';

/**
 * Caso de uso para eliminar la cuenta de un usuario y todos sus datos en cascada.
 */
export class DeleteAccount {
  /**
   * @param {object} dependencies
   * @param {import('../../ports/UserRepository.js').UserRepository} dependencies.userRepository
   * @param {import('../../ports/DiagnosisRepository.js').DiagnosisRepository} dependencies.diagnosisRepository
   * @param {import('../../ports/FeedbackRepository.js').FeedbackRepository} dependencies.feedbackRepository
   * @param {import('../../ports/RefreshTokenRepository.js').RefreshTokenRepository} dependencies.refreshTokenRepository
   * @param {import('../../ports/ImageStorage.js').ImageStorage} dependencies.imageStorage
   */
  constructor({
    userRepository,
    diagnosisRepository,
    feedbackRepository,
    refreshTokenRepository,
    imageStorage,
  }) {
    this.userRepository = userRepository;
    this.diagnosisRepository = diagnosisRepository;
    this.feedbackRepository = feedbackRepository;
    this.refreshTokenRepository = refreshTokenRepository;
    this.imageStorage = imageStorage;
  }

  /**
   * @param {string} userId
   * @returns {Promise<void>}
   */
  async execute(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado.', 'USER_NOT_FOUND');
    }

    // 1. Obtener todos los diagnósticos del usuario para borrar sus archivos de imagen
    const userDiagnoses = await this.diagnosisRepository.findByOwner(
      userId,
      {},
      { page: 1, pageSize: 1000 }
    );

    for (const diagnosis of userDiagnoses.items) {
      if (diagnosis.image && diagnosis.image.storageKey) {
        try {
          await this.imageStorage.delete(diagnosis.image.storageKey);
        } catch {
          // Continuar borrando los demás recursos
        }
      }
    }

    // 2. Borrar todos los diagnósticos de la base de datos
    await this.diagnosisRepository.deleteByOwnerId(userId);

    // 3. Borrar todos los feedbacks registrados por el usuario
    if (this.feedbackRepository) {
      await this.feedbackRepository.deleteByOwnerId(userId);
    }

    // 4. Revocar todos los refresh tokens asociados
    if (this.refreshTokenRepository) {
      await this.refreshTokenRepository.revokeAllForUser(userId);
    }

    // 5. Borrar la entidad del usuario
    await this.userRepository.deleteById(userId);
  }
}
