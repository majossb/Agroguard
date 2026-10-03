import { RefreshTokenRepository } from '../../../../application/ports/RefreshTokenRepository.js';
import { RefreshTokenModel } from '../schemas/RefreshTokenSchema.js';
import { RefreshTokenMongoMapper } from '../mappers/RefreshTokenMongoMapper.js';

/**
 * Adaptador de repositorio de Refresh Tokens con MongoDB / Mongoose.
 * @implements {RefreshTokenRepository}
 */
export class MongoRefreshTokenRepository extends RefreshTokenRepository {
  async save(tokenData) {
    const mongoData = RefreshTokenMongoMapper.toMongo(tokenData);
    await RefreshTokenModel.findByIdAndUpdate(tokenData.tokenHash, mongoData, {
      upsert: true,
      new: true,
    });
    return tokenData;
  }

  async findByHash(tokenHash) {
    const doc = await RefreshTokenModel.findById(tokenHash).lean();
    return RefreshTokenMongoMapper.toDomain(doc);
  }

  async revokeAndReplace(tokenHash, replacedByHash) {
    await RefreshTokenModel.findByIdAndUpdate(tokenHash, {
      revokedAt: new Date(),
      replacedBy: replacedByHash,
    });
  }

  async revokeFamily(familyId) {
    await RefreshTokenModel.updateMany(
      { familyId, revokedAt: null },
      { revokedAt: new Date(), replacedBy: 'FAMILY_REVOKED' }
    );
  }

  async revokeAllForUser(userId) {
    await RefreshTokenModel.updateMany(
      { userId, revokedAt: null },
      { revokedAt: new Date(), replacedBy: 'USER_LOGOUT_ALL' }
    );
  }
}
