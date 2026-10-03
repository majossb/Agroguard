import { ForbiddenError } from '../../../domain/errors/DomainError.js';

/**
 * Middleware para validar el encabezado Origin en rutas críticas basadas en cookies (/auth/refresh, /auth/logout)
 * @param {object} dependencies
 * @param {object} dependencies.config
 */
export function createOriginValidationMiddleware({ config }) {
  const allowedOrigins = new Set(
    Array.isArray(config.CORS_ORIGINS) ? config.CORS_ORIGINS : []
  );

  return (req, res, next) => {
    const origin = req.headers.origin;

    // Si no hay Origin (clientes nativos, curl, Postman, Supertest), se permite
    if (!origin) {
      return next();
    }

    // Si viene Origin, debe estar en la lista blanca o coincidir con el host de la API
    const host = req.headers.host;
    const isSelfHost =
      origin === `http://${host}` ||
      origin === `https://${host}` ||
      origin.includes(host);

    if (allowedOrigins.has(origin) || isSelfHost) {
      return next();
    }

    return next(
      new ForbiddenError(
        `Origen no autorizado para operaciones de sesión: ${origin}`,
        'FORBIDDEN_ORIGIN'
      )
    );
  };
}
