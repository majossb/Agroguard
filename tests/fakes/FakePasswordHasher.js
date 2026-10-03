import { PasswordHasher } from '../../src/application/ports/PasswordHasher.js';

export class FakePasswordHasher extends PasswordHasher {
  async hash(plainPassword) {
    return `hashed-${plainPassword}`;
  }

  async compare(plainPassword, hash) {
    return hash === `hashed-${plainPassword}`;
  }
}
