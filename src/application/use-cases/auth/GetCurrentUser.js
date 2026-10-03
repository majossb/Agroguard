import { NotFoundError } from '../../../domain/errors/DomainError.js';

/**
 * Caso de uso para obtener el perfil del usuario autenticado.
 */
export class GetCurrentUser {
  /**
   * @param {object} dependencies
   * @param {import('../../ports/UserRepository.js').UserRepository} dependencies.userRepository
   */
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  /**
   * @param {string} userId
   * @returns {Promise<{ id: string, email: string, fullName: string, role: string, createdAt: string }>}
   */
  async execute(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado.', 'USER_NOT_FOUND');
    }

    return {
      id: user.id,
      email: user.email.value,
      fullName: user.fullName,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
