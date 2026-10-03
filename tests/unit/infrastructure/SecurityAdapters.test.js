import { describe, it, expect } from 'vitest';
import { BcryptPasswordHasher } from '../../../src/infrastructure/security/BcryptPasswordHasher.js';
import { JwtTokenService } from '../../../src/infrastructure/security/JwtTokenService.js';
import { UnauthorizedError } from '../../../src/domain/errors/DomainError.js';

describe('Infrastructure — Security Adapters', () => {
  describe('BcryptPasswordHasher', () => {
    const hasher = new BcryptPasswordHasher();

    it('Debe generar un hash bcrypt válido y verificar contraseñas correctas', async () => {
      const password = 'miPasswordSeguro123!';
      const hash = await hasher.hash(password);

      expect(hash).toMatch(/^\$2[aby]\$12\$/); // Costo 12
      expect(await hasher.compare(password, hash)).toBe(true);
      expect(await hasher.compare('passwordIncorrecto', hash)).toBe(false);
    });

    it('Debe manejar comparaciones con parámetros nulos o vacíos retornando false', async () => {
      expect(await hasher.compare('', 'hash')).toBe(false);
      expect(await hasher.compare('pass', '')).toBe(false);
    });
  });

  describe('JwtTokenService', () => {
    const tokenService = new JwtTokenService({
      accessSecret: 'clave_super_secreta_para_pruebas_unitarias_jwt_123',
      accessTtl: '1s', // 1 segundo para probar expiración
    });

    it('Debe emitir y verificar un JWT de acceso válido', () => {
      const payload = {
        userId: 'user-123',
        role: 'FARMER',
        email: 'user@agroguard.dev',
      };

      const token = tokenService.generateAccessToken(payload);
      expect(typeof token).toBe('string');

      const verified = tokenService.verifyAccessToken(token);
      expect(verified.userId).toBe('user-123');
      expect(verified.role).toBe('FARMER');
      expect(verified.email).toBe('user@agroguard.dev');
    });

    it('Debe rechazar tokens con firma alterada con UnauthorizedError (TOKEN_INVALID)', () => {
      const token = tokenService.generateAccessToken({
        userId: 'user-1',
        role: 'FARMER',
        email: 'u@a.dev',
      });

      const tampered = token.slice(0, -5) + 'xxxxx';
      expect(() => tokenService.verifyAccessToken(tampered)).toThrow(UnauthorizedError);
      expect(() => tokenService.verifyAccessToken(tampered)).toThrowError(/inválido/);
    });

    it('Debe rechazar tokens expirados con UnauthorizedError (TOKEN_EXPIRED)', async () => {
      const token = tokenService.generateAccessToken({
        userId: 'user-1',
        role: 'FARMER',
        email: 'u@a.dev',
      });

      // Esperar a que el token de 1s expire
      await new Promise((resolve) => setTimeout(resolve, 1100));

      expect(() => tokenService.verifyAccessToken(token)).toThrow(UnauthorizedError);
      expect(() => tokenService.verifyAccessToken(token)).toThrowError(/expirado/);
    });

    it('Debe generar Refresh Tokens opacos de 256 bits (64 caracteres hex)', () => {
      const { token, tokenHash } = tokenService.generateOpaqueRefreshToken();

      expect(token).toHaveLength(64);
      expect(tokenHash).toHaveLength(64);
      expect(tokenService.hashOpaqueToken(token)).toBe(tokenHash);
    });
  });
});
