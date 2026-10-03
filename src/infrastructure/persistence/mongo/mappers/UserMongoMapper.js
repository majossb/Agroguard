import { User } from '../../../../domain/entities/User.js';
import { Email } from '../../../../domain/value-objects/Email.js';

export class UserMongoMapper {
  /**
   * Transforma un documento de Mongoose a una Entidad de Dominio User
   * @param {any} doc
   * @returns {User|null}
   */
  static toDomain(doc) {
    if (!doc) return null;
    return new User({
      id: doc._id.toString(),
      email: new Email(doc.email),
      passwordHash: doc.passwordHash,
      fullName: doc.fullName,
      role: doc.role,
      createdAt: doc.createdAt,
    });
  }

  /**
   * Transforma una Entidad de Dominio User a objeto plano para Mongoose
   * @param {User} user
   * @returns {object}
   */
  static toMongo(user) {
    return {
      _id: user.id,
      email: user.email.value,
      passwordHash: user.passwordHash,
      fullName: user.fullName,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
