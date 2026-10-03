import { UserRepository } from '../../src/application/ports/UserRepository.js';

export class FakeUserRepository extends UserRepository {
  constructor() {
    super();
    /** @type {Map<string, import('../../src/domain/entities/User.js').User>} */
    this.store = new Map();
  }

  async save(user) {
    this.store.set(user.id, user);
    return user;
  }

  async findById(id) {
    return this.store.get(id) || null;
  }

  async findByEmail(email) {
    const emailStr = typeof email === 'string' ? email.trim().toLowerCase() : email.value;
    for (const user of this.store.values()) {
      if (user.email.value === emailStr) {
        return user;
      }
    }
    return null;
  }

  async deleteById(id) {
    return this.store.delete(id);
  }

  get size() {
    return this.store.size;
  }
}
