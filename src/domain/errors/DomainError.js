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
