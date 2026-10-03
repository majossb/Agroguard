import { UserRepository } from '../../../../application/ports/UserRepository.js';
import { UserModel } from '../schemas/UserSchema.js';
import { UserMongoMapper } from '../mappers/UserMongoMapper.js';

/**
 * Adaptador de repositorio de usuarios con MongoDB / Mongoose.
 * @implements {UserRepository}
 */
export class MongoUserRepository extends UserRepository {
  async save(user) {
    const mongoData = UserMongoMapper.toMongo(user);
    await UserModel.findByIdAndUpdate(user.id, mongoData, {
      upsert: true,
      new: true,
      runValidators: true,
    });
    return user;
  }

  async findById(id) {
    const doc = await UserModel.findById(id).lean();
    return UserMongoMapper.toDomain(doc);
  }

  async findByEmail(email) {
    const emailStr = typeof email === 'string' ? email.trim().toLowerCase() : email.value;
    const doc = await UserModel.findOne({ email: emailStr }).lean();
    return UserMongoMapper.toDomain(doc);
  }

  async deleteById(id) {
    const result = await UserModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }
}
