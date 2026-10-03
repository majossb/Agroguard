import { UnauthorizedError } from '../../../domain/errors/DomainError.js';

/**
 * Crea middlewares de autenticación estricta y opcional.
 * @param {object} dependencies
 * @param {import('../../../application/ports/TokenService.js').TokenService} dependencies.tokenService
 */
export function createAuthMiddlewares({ tokenService }) {
  /**
   * Middleware de autenticación obligatoria (requiere Bearer token JWT válido).
   */
  const authenticate = (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || typeof authHeader !== 'string') {
        throw new UnauthorizedError(
          'Token de acceso no proporcionado.',
          'TOKEN_REQUIRED'
        );
      }

      if (!authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError(
          'Formato de cabecera de autorización inválido. Use "Bearer <token>".',
          'TOKEN_INVALID'
        );
      }

      const token = authHeader.slice(7).trim();
      if (!token) {
        throw new UnauthorizedError(
          'Token de acceso no proporcionado.',
          'TOKEN_REQUIRED'
        );
      }

      const payload = tokenService.verifyAccessToken(token);
      req.user = {
        id: payload.userId,
        role: payload.role,
        email: payload.email,
      };

      next();
    } catch (error) {
      next(error);
    }
  };

  /**
   * Middleware de autenticación opcional.
   * Si no hay Authorization header -> req.user = null y continúa.
   * Si hay Authorization header -> debe ser un Bearer token válido (de lo contrario lanza 401).
   */
  const optionalAuthenticate = (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        req.user = null;
        return next();
      }

      if (!authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError(
          'Formato de cabecera de autorización inválido.',
          'TOKEN_INVALID'
        );
      }

      const token = authHeader.slice(7).trim();
      if (!token) {
        throw new UnauthorizedError(
          'Token de acceso vacío.',
          'TOKEN_INVALID'
        );
      }

      const payload = tokenService.verifyAccessToken(token);
      req.user = {
        id: payload.userId,
        role: payload.role,
        email: payload.email,
      };

      next();
    } catch (error) {
      next(error);
    }
  };

  return {
    authenticate,
    optionalAuthenticate,
  };
}
