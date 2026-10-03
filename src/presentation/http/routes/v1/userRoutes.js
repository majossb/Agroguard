import { Router } from 'express';

/**
 * Crea las rutas de usuarios y gestión de cuenta
 * @param {object} dependencies
 * @param {import('../../controllers/AuthController.js').AuthController} dependencies.authController
 * @param {Function} dependencies.authenticate
 */
export function createUserRoutes({ authController, authenticate }) {
  const router = Router();

  // GET /users/me — perfil del usuario
  router.get('/users/me', authenticate, (req, res, next) =>
    authController.me(req, res, next)
  );

  // DELETE /users/me — borrar cuenta y todos los datos en cascada
  router.delete('/users/me', authenticate, (req, res, next) =>
    authController.deleteAccount(req, res, next)
  );

  return router;
}
