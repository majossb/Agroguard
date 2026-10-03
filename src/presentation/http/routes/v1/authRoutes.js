import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createOriginValidationMiddleware } from '../../middlewares/originValidationMiddleware.js';

/**
 * Crea las rutas de autenticación
 * @param {object} dependencies
 * @param {import('../../controllers/AuthController.js').AuthController} dependencies.authController
 * @param {object} dependencies.config
 */
export function createAuthRoutes({ authController, config }) {
  const router = Router();

  // Rate Limiter específico para endpoints de autenticación (anti brute-force)
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // 10 intentos por IP
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => config.NODE_ENV === 'test',
    message: {
      type: 'https://agroguard.dev/errors/rate-limit-exceeded',
      title: 'Demasiados intentos de autenticación',
      status: 429,
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      detail: 'Has superado el límite de intentos de autenticación. Intenta nuevamente en 15 minutos.',
      errors: [],
    },
  });

  const originValidator = createOriginValidationMiddleware({ config });

  router.post('/auth/register', authLimiter, (req, res, next) =>
    authController.register(req, res, next)
  );

  router.post('/auth/login', authLimiter, (req, res, next) =>
    authController.login(req, res, next)
  );

  router.post('/auth/refresh', originValidator, (req, res, next) =>
    authController.refresh(req, res, next)
  );

  router.post('/auth/logout', originValidator, (req, res, next) =>
    authController.logout(req, res, next)
  );

  return router;
}
