import { Router } from 'express';

/**
 * Crea las rutas para consultar información del modelo
 * @param {object} dependencies
 * @param {import('../../controllers/ModelController.js').ModelController} dependencies.modelController
 */
export function createModelRoutes({ modelController }) {
  const router = Router();

  router.get('/model/info', (req, res, next) =>
    modelController.getInfo(req, res, next)
  );

  return router;
}
