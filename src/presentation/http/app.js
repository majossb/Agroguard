import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { requestIdMiddleware } from './middlewares/requestIdMiddleware.js';
import { createErrorHandler } from './middlewares/errorHandler.js';
import { createV1Router } from './routes/v1/index.js';
import { createDocsRoutes } from './routes/docsRoutes.js';

/**
 * Crea y configura la aplicación Express
 * @param {object} dependencies
 * @param {object} dependencies.config
 * @param {object} dependencies.logger
 * @param {import('./controllers/HealthController.js').HealthController} dependencies.healthController
 */
export function createApp(dependencies) {
  const { config, logger } = dependencies;
  const app = express();

  // Configuración de proxies
  if (config.TRUST_PROXY) {
    app.set('trust proxy', config.TRUST_PROXY);
  }

  // Middlewares de seguridad y parsing
  app.use(
    helmet({
      contentSecurityPolicy: false, // Permite cargar Swagger UI sin bloqueos de scripts inline
    })
  );

  const allowedOrigins = Array.isArray(config.CORS_ORIGINS) ? config.CORS_ORIGINS : [];
  app.use(
    cors({
      origin: (origin, callback) => {
        // Permitir peticiones sin origin (como curl, herramientas de prueba, apps móviles o requests internas)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Origen no permitido por CORS: ${origin}`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    })
  );

  app.use(requestIdMiddleware);
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));
  app.use(cookieParser());

  // Documentación OpenAPI / Swagger UI en /docs
  app.use(createDocsRoutes());

  // Rate Limiting General
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => config.NODE_ENV === 'test',
    message: {
      type: 'https://agroguard.dev/errors/rate-limit-exceeded',
      title: 'Límite de peticiones excedido',
      status: 429,
      code: 'TOO_MANY_REQUESTS',
      detail: 'Has superado el límite de solicitudes permitido. Intenta más tarde.',
      errors: [],
    },
  });
  app.use(generalLimiter);

  // Rutas de la API v1
  app.use('/api/v1', createV1Router(dependencies));

  // Manejo de ruta no encontrada (404)
  app.use((req, res) => {
    res.status(404).type('application/problem+json').json({
      type: 'https://agroguard.dev/errors/not-found',
      title: 'Recurso no encontrado',
      status: 404,
      code: 'NOT_FOUND',
      detail: `La ruta ${req.method} ${req.originalUrl} no existe en el servidor.`,
      traceId: req.id || 'unknown',
      errors: [],
    });
  });

  // Manejador central de errores
  app.use(createErrorHandler(logger));

  return app;
}
