import crypto from 'crypto';
import { TokenService } from '../../src/application/ports/TokenService.js';
import { UnauthorizedError } from '../../src/domain/errors/DomainError.js';

export class FakeTokenService extends TokenService {
  constructor() {
    super();
    this.tokenCounter = 0;
  }

  generateAccessToken(payload) {
    return `fake-jwt-token-for-${payload.userId}-${payload.role}`;
  }

  verifyAccessToken(token) {
    if (!token || !token.startsWith('fake-jwt-token-for-')) {
      throw new UnauthorizedError('Token de acceso inválido.', 'TOKEN_INVALID');
    }
    if (token.includes('expired')) {
      throw new UnauthorizedError('El token de acceso ha expirado.', 'TOKEN_EXPIRED');
    }
    const parts = token.replace('fake-jwt-token-for-', '').split('-');
    const userId = parts[0];
    const role = parts[1] || 'FARMER';
    return {
      userId,
      role,
      email: `${userId}@agroguard.dev`,
    };
  }

  generateOpaqueRefreshToken() {
    this.tokenCounter++;
    const token = `fake-opaque-token-${this.tokenCounter}`;
    const tokenHash = this.hashOpaqueToken(token);
    return { token, tokenHash };
  }

  hashOpaqueToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
