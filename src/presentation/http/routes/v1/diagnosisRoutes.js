import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createUploadMiddleware } from '../../middlewares/uploadMiddleware.js';

/**
 * Crea las rutas completas para diagnósticos, historial, imágenes y feedback.
 * @param {object} dependencies
 * @param {import('../../controllers/DiagnosisController.js').DiagnosisController} dependencies.diagnosisController
 * @param {object} dependencies.config
 * @param {Function} dependencies.authenticate
 * @param {Function} dependencies.optionalAuthenticate
 */
export function createDiagnosisRoutes({
  diagnosisController,
  config,
  authenticate,
  optionalAuthenticate,
}) {
  const router = Router();
  const upload = createUploadMiddleware({ maxUploadMb: config.MAX_UPLOAD_MB });

  // Rate Limiter para diagnósticos (30 req / hora para usuarios autenticados, 10 req / hora para anónimos)
  const diagnosisLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: (req) => (req.user ? 30 : 10),
    keyGenerator: (req) => (req.user ? `user_${req.user.id}` : req.ip),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => config.NODE_ENV === 'test',
    message: {
      type: 'https://agroguard.dev/errors/rate-limit-exceeded',
      title: 'Límite de diagnósticos excedido',
      status: 429,
      code: 'DIAGNOSIS_RATE_LIMIT_EXCEEDED',
      detail: 'Has superado el límite de solicitudes de diagnóstico permitido por hora. Intenta más tarde.',
      errors: [],
    },
  });

  // POST /diagnoses — diagnóstico con autenticación opcional
  router.post(
    '/diagnoses',
    optionalAuthenticate,
    diagnosisLimiter,
    upload,
    (req, res, next) => diagnosisController.create(req, res, next)
  );

  // GET /diagnoses — historial paginado
  router.get('/diagnoses', authenticate, (req, res, next) =>
    diagnosisController.list(req, res, next)
  );

  // GET /diagnoses/:id — detalle
  router.get('/diagnoses/:id', authenticate, (req, res, next) =>
    diagnosisController.getById(req, res, next)
  );

  // PATCH /diagnoses/:id — actualizar notas / lote
  router.patch('/diagnoses/:id', authenticate, (req, res, next) =>
    diagnosisController.updateNotes(req, res, next)
  );

  // DELETE /diagnoses/:id — borrar diagnóstico e imagen
  router.delete('/diagnoses/:id', authenticate, (req, res, next) =>
    diagnosisController.delete(req, res, next)
  );

  // GET /diagnoses/:id/image — obtener imagen
  router.get('/diagnoses/:id/image', authenticate, (req, res, next) =>
    diagnosisController.getImage(req, res, next)
  );

  // POST /diagnoses/:id/feedback — enviar feedback
  router.post('/diagnoses/:id/feedback', authenticate, (req, res, next) =>
    diagnosisController.submitFeedback(req, res, next)
  );

  return router;
}
