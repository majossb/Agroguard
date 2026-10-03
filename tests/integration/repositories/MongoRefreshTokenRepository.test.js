import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { MongoRefreshTokenRepository } from '../../../src/infrastructure/persistence/mongo/repositories/MongoRefreshTokenRepository.js';
import { RefreshTokenModel } from '../../../src/infrastructure/persistence/mongo/schemas/RefreshTokenSchema.js';

describe('Integration — MongoRefreshTokenRepository with MongoMemoryServer', () => {
  let mongoServer;
  let repository;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    repository = new MongoRefreshTokenRepository();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await RefreshTokenModel.deleteMany({});
  });

  it('Debe guardar y recuperar un Refresh Token por su hash', async () => {
    const tokenData = {
      tokenHash: 'hash-abc-123',
      userId: 'user-1',
      familyId: 'fam-1',
      expiresAt: new Date('2026-10-20T10:00:00.000Z'),
      revokedAt: null,
      replacedBy: null,
      createdAt: new Date('2026-09-20T10:00:00.000Z'),
    };

    await repository.save(tokenData);

    const retrieved = await repository.findByHash('hash-abc-123');
    expect(retrieved).not.toBeNull();
    expect(retrieved.tokenHash).toBe('hash-abc-123');
    expect(retrieved.userId).toBe('user-1');
    expect(retrieved.familyId).toBe('fam-1');
  });

  it('Debe revocar y marcar reemplazo de un token', async () => {
    await repository.save({
      tokenHash: 'hash-viejo',
      userId: 'user-1',
      familyId: 'fam-1',
      expiresAt: new Date('2026-10-20T10:00:00.000Z'),
      revokedAt: null,
      replacedBy: null,
      createdAt: new Date(),
    });

    await repository.revokeAndReplace('hash-viejo', 'hash-nuevo');

    const updated = await repository.findByHash('hash-viejo');
    expect(updated.revokedAt).not.toBeNull();
    expect(updated.replacedBy).toBe('hash-nuevo');
  });

  it('Debe revocar toda una familia de tokens ante detección de reutilización', async () => {
    await repository.save({
      tokenHash: 'hash-1',
      userId: 'user-1',
      familyId: 'fam-ataque',
      expiresAt: new Date('2026-10-20T10:00:00.000Z'),
      revokedAt: null,
      replacedBy: null,
      createdAt: new Date(),
    });
    await repository.save({
      tokenHash: 'hash-2',
      userId: 'user-1',
      familyId: 'fam-ataque',
      expiresAt: new Date('2026-10-20T10:00:00.000Z'),
      revokedAt: null,
      replacedBy: null,
      createdAt: new Date(),
    });

    await repository.revokeFamily('fam-ataque');

    const t1 = await repository.findByHash('hash-1');
    const t2 = await repository.findByHash('hash-2');

    expect(t1.revokedAt).not.toBeNull();
    expect(t1.replacedBy).toBe('FAMILY_REVOKED');
    expect(t2.revokedAt).not.toBeNull();
    expect(t2.replacedBy).toBe('FAMILY_REVOKED');
  });
});
