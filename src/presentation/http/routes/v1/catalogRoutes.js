import { Router } from 'express';

/**
 * Crea las rutas públicas del catálogo fitopatológico
 * @param {object} dependencies
 * @param {import('../../controllers/CatalogController.js').CatalogController} dependencies.catalogController
 */
export function createCatalogRoutes({ catalogController }) {
  const router = Router();

  router.get('/catalog/conditions', (req, res, next) =>
    catalogController.listConditionsHandler(req, res, next)
  );

  router.get('/catalog/conditions/:classKey', (req, res, next) =>
    catalogController.getConditionHandler(req, res, next)
  );

  router.get('/catalog/crops', (req, res, next) =>
    catalogController.listCropsHandler(req, res, next)
  );

  return router;
}
