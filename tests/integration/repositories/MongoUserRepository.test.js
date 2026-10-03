import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { MongoUserRepository } from '../../../src/infrastructure/persistence/mongo/repositories/MongoUserRepository.js';
import { User, USER_ROLES } from '../../../src/domain/entities/User.js';
import { Email } from '../../../src/domain/value-objects/Email.js';
import { UserModel } from '../../../src/infrastructure/persistence/mongo/schemas/UserSchema.js';

describe('Integration — MongoUserRepository with MongoMemoryServer', () => {
  let mongoServer;
  let repository;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    repository = new MongoUserRepository();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await UserModel.deleteMany({});
  });

  it('Debe guardar y recuperar un usuario por ID y por Email', async () => {
    const user = new User({
      id: 'user-mongo-1',
      email: new Email('agricultor.mongo@agroguard.dev'),
      passwordHash: '$2a$12$hashedPasswordExample',
      fullName: 'Pedro Cultivador',
      role: USER_ROLES.FARMER,
      createdAt: new Date('2026-09-20T10:00:00.000Z'),
    });

    await repository.save(user);

    const byId = await repository.findById('user-mongo-1');
    expect(byId).not.toBeNull();
    expect(byId.id).toBe('user-mongo-1');
    expect(byId.email.value).toBe('agricultor.mongo@agroguard.dev');
    expect(byId.fullName).toBe('Pedro Cultivador');

    const byEmail = await repository.findByEmail('AGRICULTOR.MONGO@AGROGUARD.DEV');
    expect(byEmail).not.toBeNull();
    expect(byEmail.id).toBe('user-mongo-1');
  });

  it('Debe retornar null cuando un usuario no existe', async () => {
    const byId = await repository.findById('id-inexistente');
    expect(byId).toBeNull();

    const byEmail = await repository.findByEmail('inexistente@agroguard.dev');
    expect(byEmail).toBeNull();
  });

  it('Debe eliminar un usuario por ID', async () => {
    const user = new User({
      id: 'user-to-delete',
      email: new Email('delete@agroguard.dev'),
      passwordHash: 'hash',
      fullName: 'Para Eliminar',
    });

    await repository.save(user);
    const deleted = await repository.deleteById('user-to-delete');
    expect(deleted).toBe(true);

    const notFound = await repository.findById('user-to-delete');
    expect(notFound).toBeNull();
  });
});
