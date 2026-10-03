import { RefreshTokenRepository } from '../../src/application/ports/RefreshTokenRepository.js';

export class FakeRefreshTokenRepository extends RefreshTokenRepository {
  constructor() {
    super();
    /** @type {Map<string, import('../../src/application/ports/RefreshTokenRepository.js').RefreshTokenData>} */
    this.store = new Map();
  }

  async save(tokenData) {
    this.store.set(tokenData.tokenHash, { ...tokenData });
    return tokenData;
  }

  async findByHash(tokenHash) {
    const data = this.store.get(tokenHash);
    return data ? { ...data } : null;
  }

  async revokeAndReplace(tokenHash, replacedByHash) {
    const data = this.store.get(tokenHash);
    if (data) {
      data.revokedAt = new Date();
      data.replacedBy = replacedByHash;
      this.store.set(tokenHash, data);
    }
  }

  async revokeFamily(familyId) {
    for (const [hash, data] of this.store.entries()) {
      if (data.familyId === familyId && !data.revokedAt) {
        data.revokedAt = new Date();
        data.replacedBy = 'FAMILY_REVOKED';
        this.store.set(hash, data);
      }
    }
  }

  async revokeAllForUser(userId) {
    for (const [hash, data] of this.store.entries()) {
      if (data.userId === userId && !data.revokedAt) {
        data.revokedAt = new Date();
        data.replacedBy = 'USER_LOGOUT_ALL';
        this.store.set(hash, data);
      }
    }
  }

  get size() {
    return this.store.size;
  }
}
