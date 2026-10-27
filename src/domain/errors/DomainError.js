/**
 * Clase base para todos los errores de dominio de la aplicación.
 */
export class DomainError extends Error {
  /**
   * @param {string} message - Mensaje descriptivo del error en español
   * @param {string} code - Código legible y estable de error en inglés
   */
  constructor(message, code = 'DOMAIN_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
  }
}

export class ValidationError extends DomainError {
  /**
   * @param {string} message
   * @param {string} [code='VALIDATION_ERROR']
   * @param {Array<any>} [details=[]]
   */
  constructor(message, code = 'VALIDATION_ERROR', details = []) {
    super(message, code);
    this.details = details;
  }
}

export class NotFoundError extends DomainError {
  constructor(message = 'Recurso no encontrado', code = 'NOT_FOUND') {
    super(message, code);
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = 'No autorizado', code = 'UNAUTHORIZED') {
    super(message, code);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = 'Acceso denegado', code = 'FORBIDDEN') {
    super(message, code);
  }
}

export class ConflictError extends DomainError {
  constructor(message = 'Conflicto con el estado actual del recurso', code = 'CONFLICT') {
    super(message, code);
  }
}

export class InvalidImageError extends DomainError {
  constructor(message = 'Imagen inválida', code = 'IMAGE_INVALID') {
    super(message, code);
  }
}

export class InferenceUnavailableError extends DomainError {
  constructor(
    message = 'El servicio de inferencia no se encuentra disponible temporalmente',
    code = 'INFERENCE_UNAVAILABLE'
  ) {
    super(message, code);
  }
}

export class InvalidInferenceResultError extends DomainError {
  constructor(
    message = 'El motor de inferencia devolvió una respuesta inválida',
    code = 'INVALID_INFERENCE_RESULT'
  ) {
    super(message, code);
  }
}

export class ImageRejectedError extends DomainError {
  /**
   * Lanzado cuando el filtro CLIP determina con alta confianza que la imagen
   * NO corresponde a una hoja o planta.
   * @param {string} [message]
   * @param {string} [reason] - Motivo detallado devuelto por CLIP
   * @param {Array<{label: string, score: number}>} [topLabels=[]]
   */
  constructor(
    message = 'La imagen no parece corresponder a una hoja o planta.',
    reason = '',
    topLabels = []
  ) {
    super(message, 'IMAGE_REJECTED');
    this.reason = reason;
    this.topLabels = topLabels;
  }
}

export class ImageReviewRequiredError extends DomainError {
  /**
   * Lanzado cuando el filtro CLIP produce un resultado ambiguo
   * (ni suficiente confianza de planta ni de rechazo).
   * @param {string} [message]
   * @param {string} [reason] - Motivo detallado devuelto por CLIP
   * @param {Array<{label: string, score: number}>} [topLabels=[]]
   */
  constructor(
    message = 'No pudimos determinar con certeza si la imagen es una hoja de planta. Intenta con una foto más clara.',
    reason = '',
    topLabels = []
  ) {
    super(message, 'IMAGE_REVIEW_REQUIRED');
    this.reason = reason;
    this.topLabels = topLabels;
  }
}

