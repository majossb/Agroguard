/**
 * Puerto de repositorio para usuarios.
 * @interface UserRepository
 */
export class UserRepository {
  /**
   * Guarda un nuevo usuario o actualiza sus datos.
   * @param {import('../../domain/entities/User.js').User} user
   * @returns {Promise<import('../../domain/entities/User.js').User>}
   */
  async save(_user) {
    throw new Error('Method save() must be implemented');
  }

  /**
   * Busca un usuario por su ID.
   * @param {string} id
   * @returns {Promise<import('../../domain/entities/User.js').User|null>}
   */
  async findById(_id) {
    throw new Error('Method findById() must be implemented');
  }

  /**
   * Busca un usuario por su correo electrónico normalizado.
   * @param {import('../../domain/value-objects/Email.js').Email|string} email
   * @returns {Promise<import('../../domain/entities/User.js').User|null>}
   */
  async findByEmail(_email) {
    throw new Error('Method findByEmail() must be implemented');
  }

  /**
   * Elimina un usuario por su ID.
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async deleteById(_id) {
    throw new Error('Method deleteById() must be implemented');
  }
}
