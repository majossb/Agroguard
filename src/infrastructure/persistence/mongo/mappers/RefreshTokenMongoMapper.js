export class RefreshTokenMongoMapper {
  /**
   * @param {any} doc
   * @returns {import('../../../../application/ports/RefreshTokenRepository.js').RefreshTokenData|null}
   */
  static toDomain(doc) {
    if (!doc) return null;
    return {
      tokenHash: doc.tokenHash,
      userId: doc.userId,
      familyId: doc.familyId,
      expiresAt: doc.expiresAt,
      revokedAt: doc.revokedAt,
      replacedBy: doc.replacedBy,
      createdAt: doc.createdAt,
    };
  }

  /**
   * @param {import('../../../../application/ports/RefreshTokenRepository.js').RefreshTokenData} data
   * @returns {object}
   */
  static toMongo(data) {
    return {
      _id: data.tokenHash,
      tokenHash: data.tokenHash,
      userId: data.userId,
      familyId: data.familyId,
      expiresAt: data.expiresAt,
      revokedAt: data.revokedAt,
      replacedBy: data.replacedBy,
      createdAt: data.createdAt,
    };
  }
}
