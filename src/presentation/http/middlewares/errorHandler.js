import { ZodError } from 'zod';
import {
  DomainError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  InvalidImageError,
  InferenceUnavailableError,
  InvalidInferenceResultError,
  ImageRejectedError,
  ImageReviewRequiredError,
} from '../../../domain/errors/index.js';

/**
 * Mapea errores de dominio, validaciones y técnicos al formato estándar RFC 9457
 */
export function createErrorHandler(logger) {
  return (err, req, res, _next) => {
    const traceId = req.id || 'unknown';

    let status = 500;
    let code = 'INTERNAL_SERVER_ERROR';
    let title = 'Error interno del servidor';
    let detail = 'Ocurrió un error inesperado al procesar la solicitud.';
    let typeSlug = 'internal-error';
    let errors = [];

    if (err instanceof ZodError) {
      status = 400;
      code = 'VALIDATION_ERROR';
      title = 'Error de validación';
      detail = 'Los datos proporcionados no cumplen con el formato requerido.';
      typeSlug = 'validation-error';
      errors = err.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
    } else if (err instanceof ValidationError) {
      status = 400;
      code = err.code || 'VALIDATION_ERROR';
      title = 'Error de validación';
      detail = err.message;
      typeSlug = 'validation-error';
      errors = err.details || [];
    } else if (err instanceof UnauthorizedError) {
      status = 401;
      code = err.code || 'UNAUTHORIZED';
      title = 'No autorizado';
      detail = err.message;
      typeSlug = 'unauthorized';
    } else if (err instanceof ForbiddenError) {
      status = 403;
      code = err.code || 'FORBIDDEN';
      title = 'Acceso denegado';
      detail = err.message;
      typeSlug = 'forbidden';
    } else if (err instanceof NotFoundError) {
      status = 404;
      code = err.code || 'NOT_FOUND';
      title = 'Recurso no encontrado';
      detail = err.message;
      typeSlug = 'not-found';
    } else if (err instanceof ConflictError) {
      status = 409;
      code = err.code || 'CONFLICT';
      title = 'Conflicto';
      detail = err.message;
      typeSlug = 'conflict';
    } else if (err instanceof InvalidImageError) {
      if (err.code === 'IMAGE_TOO_LARGE') {
        status = 413;
      } else if (err.code === 'IMAGE_INVALID_TYPE') {
        status = 415;
      } else {
        status = 422;
      }
      code = err.code || 'IMAGE_INVALID';
      title = 'Imagen inválida';
      detail = err.message;
      typeSlug = 'invalid-image';
    } else if (err instanceof ImageRejectedError) {
      status = 422;
      code = 'IMAGE_REJECTED';
      title = 'Imagen rechazada por el filtro de validación visual';
      detail = err.message;
      typeSlug = 'image-rejected';
      const payload = {
        type: `https://agroguard.dev/errors/${typeSlug}`,
        title,
        status,
        code,
        detail,
        validationState: 'RECHAZAR',
        validationReason: err.reason || err.message,
        clipTopLabels: err.topLabels || [],
        traceId,
        errors,
      };
      logger.warn({ code, status, detail, traceId, path: req.path }, 'Client/Business Handled Error');
      res.status(status).type('application/problem+json').json(payload);
      return;
    } else if (err instanceof ImageReviewRequiredError) {
      // REVISAR: HTTP 200, no es un error sino un resultado parcial sin predicción
      const payload = {
        type: 'https://agroguard.dev/results/review-required',
        title: 'Imagen con resultado ambiguo',
        status: 200,
        code: 'IMAGE_REVIEW_REQUIRED',
        validationState: 'REVISAR',
        validationReason: err.reason || err.message,
        clipTopLabels: err.topLabels || [],
        detail: err.message,
        traceId,
        errors: [],
      };
      logger.warn({ code: payload.code, status: 200, detail: err.message, traceId, path: req.path }, 'Client/Business Handled Warning');
      res.status(200).type('application/json').json(payload);
      return;

    } else if (err instanceof InvalidInferenceResultError) {
      status = 502;
      code = err.code || 'INVALID_INFERENCE_RESULT';
      title = 'Respuesta inválida del motor de inferencia';
      detail = err.message;
      typeSlug = 'bad-gateway';
    } else if (err instanceof InferenceUnavailableError) {
      status = 503;
      code = err.code || 'INFERENCE_UNAVAILABLE';
      title = 'Servicio de inferencia no disponible';
      detail = err.message;
      typeSlug = 'service-unavailable';
    } else if (err instanceof DomainError) {
      status = 400;
      code = err.code || 'DOMAIN_ERROR';
      title = 'Error de regla de negocio';
      detail = err.message;
      typeSlug = 'domain-error';
    } else if (err.status || err.statusCode) {
      status = err.status || err.statusCode;
      title = err.name || 'Error HTTP';
      detail = err.message || detail;
    }

    if (status >= 500) {
      logger.error({ err, traceId, req: { method: req.method, url: req.url } }, 'Unhandled Server Error');
    } else {
      logger.warn({ code, status, detail, traceId, path: req.path }, 'Client/Business Handled Error');
    }

    const payload = {
      type: `https://agroguard.dev/errors/${typeSlug}`,
      title,
      status,
      code,
      detail,
      traceId,
      errors,
    };

    res.status(status).type('application/problem+json').json(payload);
  };
}
