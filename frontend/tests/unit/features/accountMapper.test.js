import { describe, it, expect } from 'vitest';
import { mapUserProfile } from '../../../src/features/account/mappers/accountMapper.js';

describe('Features/Account — accountMapper (Lista blanca estricta)', () => {
  it('Mapea un perfil de usuario permitiendo solo campos autorizados', () => {
    const raw = {
      id: 'usr-123',
      email: 'juan.perez@agroguard.dev',
      fullName: 'Juan Pérez',
      role: 'FARMER',
      createdAt: '2026-09-20T10:00:00.000Z',
      passwordHash: '$2b$12$secretHash', // Campo sensible
      internalToken: 'secretToken',       // Campo sensible
    };

    const user = mapUserProfile(raw);

    expect(user.id).toBe('usr-123');
    expect(user.email).toBe('juan.perez@agroguard.dev');
    expect(user.fullName).toBe('Juan Pérez');
    expect(user.role).toBe('FARMER');
    expect(user.createdAt).toBe('2026-09-20T10:00:00.000Z');

    expect(user.passwordHash).toBeUndefined();
    expect(user.internalToken).toBeUndefined();
  });

  it('Lanza error ante entrada nula o inválida', () => {
    expect(() => mapUserProfile(null)).toThrow();
    expect(() => mapUserProfile('invalid')).toThrow();
  });
});
