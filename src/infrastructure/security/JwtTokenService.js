import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { TokenService } from '../../application/ports/TokenService.js';
import { UnauthorizedError } from '../../domain/errors/DomainError.js';

/**
 * Adaptador para emisión y verificación de JWT y Refresh Tokens opacos de 256 bits.
 * @implements {TokenService}
 */
export class JwtTokenService extends TokenService {
  /**
   * @param {object} options
   * @param {string} options.accessSecret - Clave secreta para JWT
   * @param {string} [options.accessTtl='15m'] - Tiempo de vida del JWT
   */
  constructor({ accessSecret, accessTtl = '15m' }) {
    super();
    if (!accessSecret || typeof accessSecret !== 'string') {
      throw new Error('JwtTokenService requiere un accessSecret válido.');
    }
    this.accessSecret = accessSecret;
    this.accessTtl = accessTtl;
  }

  /**
   * Genera un Access Token JWT de vida corta.
   * @param {import('../../application/ports/TokenService.js').TokenPayload} payload
   * @returns {string}
   */
  generateAccessToken(payload) {
    return jwt.sign(
      {
        sub: payload.userId,
        role: payload.role,
        email: payload.email,
      },
      this.accessSecret,
      {
        expiresIn: this.accessTtl,
        algorithm: 'HS256',
      }
    );
  }

  /**
   * Verifica y decodifica un Access Token JWT.
   * @param {string} token
   * @returns {import('../../application/ports/TokenService.js').TokenPayload}
   */
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, this.accessSecret, {
        algorithms: ['HS256'],
      });
      return {
        userId: decoded.sub,
        role: decoded.role,
        email: decoded.email,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError(
          'El token de acceso ha expirado.',
          'TOKEN_EXPIRED'
        );
      }
      throw new UnauthorizedError(
        'El token de acceso es inválido.',
        'TOKEN_INVALID'
      );
    }
  }

  /**
   * Genera un Refresh Token opaco y criptográficamente seguro de 256 bits.
   * @returns {{ token: string, tokenHash: string }}
   */
  generateOpaqueRefreshToken() {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashOpaqueToken(token);
    return { token, tokenHash };
  }

  /**
   * Calcula el hash SHA-256 de un token opaco para almacenamiento seguro.
   * @param {string} token
   * @returns {string}
   */
  hashOpaqueToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
