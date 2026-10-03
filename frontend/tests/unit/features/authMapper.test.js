import { describe, it, expect } from 'vitest';
import { mapAuthResponse, mapUserResponse } from '../../../src/features/auth/mappers/authMapper.js';

describe('Features/Auth — authMapper (Lista blanca estricta)', () => {
  const rawUserData = {
    id: 'user-001',
    email: 'farmer@agroguard.dev',
    fullName: 'Ana Agrónoma',
    role: 'FARMER',
    createdAt: '2026-09-20T10:00:00.000Z',
    passwordHash: 'hashed_super_secret_string',
    refreshTokenHash: 'refresh_hash_secret',
    internalFlag: true,
  };

  it('Filtra campos sensibles de la entidad de usuario', () => {
    const user = mapUserResponse(rawUserData);

    expect(user.id).toBe('user-001');
    expect(user.email).toBe('farmer@agroguard.dev');
    expect(user.fullName).toBe('Ana Agrónoma');
    expect(user.role).toBe('FARMER');

    // Comprobar que no existen hashes ni datos internos
    expect(user.passwordHash).toBeUndefined();
    expect(user.refreshTokenHash).toBeUndefined();
    expect(user.internalFlag).toBeUndefined();
  });

  it('Mapea respuesta completa de autenticación con token de acceso', () => {
    const rawAuth = {
      accessToken: 'jwt-access-token-example',
      user: rawUserData,
      internalSessionKey: 'session-key-secret',
    };

    const auth = mapAuthResponse(rawAuth);

    expect(auth.accessToken).toBe('jwt-access-token-example');
    expect(auth.user.fullName).toBe('Ana Agrónoma');
    expect(auth.internalSessionKey).toBeUndefined();
  });

  it('Lanza error ante cargas vacías o incompletas', () => {
    expect(() => mapAuthResponse(null)).toThrow();
    expect(() => mapAuthResponse({})).toThrow();
    expect(() => mapAuthResponse({ accessToken: 123 })).toThrow();
  });
});
