import { Router } from 'express';

/**
 * Crea las rutas de salud del sistema
 * @param {object} dependencies
 * @param {import('../../controllers/HealthController.js').HealthController} dependencies.healthController
 */
export function createHealthRoutes({ healthController }) {
  const router = Router();

  router.get('/health', (req, res, next) => healthController.getHealth(req, res, next));

  return router;
}
