import { Router } from 'express';
import { createHealthRoutes } from './healthRoutes.js';
import { createDiagnosisRoutes } from './diagnosisRoutes.js';
import { createAuthRoutes } from './authRoutes.js';
import { createUserRoutes } from './userRoutes.js';
import { createCatalogRoutes } from './catalogRoutes.js';
import { createModelRoutes } from './modelRoutes.js';

/**
 * Agrupa todas las rutas de la versión 1 de la API REST
 * @param {object} dependencies
 */
export function createV1Router(dependencies) {
  const router = Router();

  router.use(createHealthRoutes(dependencies));

  if (dependencies.authController) {
    router.use(createAuthRoutes(dependencies));
  }

  if (dependencies.authController && dependencies.authenticate) {
    router.use(createUserRoutes(dependencies));
  }

  if (dependencies.diagnosisController) {
    router.use(createDiagnosisRoutes(dependencies));
  }

  if (dependencies.catalogController) {
    router.use(createCatalogRoutes(dependencies));
  }

  if (dependencies.modelController) {
    router.use(createModelRoutes(dependencies));
  }

  return router;
}
