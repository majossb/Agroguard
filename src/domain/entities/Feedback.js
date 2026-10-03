import { ValidationError } from '../errors/DomainError.js';

/**
 * Entidad de Dominio Feedback (para medir precisión en campo).
 */
export class Feedback {
  /**
   * @param {object} params
   * @param {string} params.id
   * @param {string} params.diagnosisId
   * @param {string} params.ownerId
   * @param {boolean} params.wasCorrect
   * @param {string|null} [params.correctClassKey=null]
   * @param {string|null} [params.comment=null]
   * @param {Date} [params.createdAt]
   */
  constructor({
    id,
    diagnosisId,
    ownerId,
    wasCorrect,
    correctClassKey = null,
    comment = null,
    createdAt,
  }) {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('El ID del feedback es obligatorio', 'FEEDBACK_ID_REQUIRED');
    }
    if (!diagnosisId || typeof diagnosisId !== 'string') {
      throw new ValidationError('El ID del diagnóstico es obligatorio', 'FEEDBACK_DIAGNOSIS_ID_REQUIRED');
    }
    if (!ownerId || typeof ownerId !== 'string') {
      throw new ValidationError('El ID del usuario es obligatorio', 'FEEDBACK_OWNER_ID_REQUIRED');
    }
    if (typeof wasCorrect !== 'boolean') {
      throw new ValidationError('Debe indicar si el diagnóstico fue correcto o no', 'FEEDBACK_WAS_CORRECT_REQUIRED');
    }

    this.id = id;
    this.diagnosisId = diagnosisId;
    this.ownerId = ownerId;
    this.wasCorrect = wasCorrect;
    this.correctClassKey = correctClassKey || null;
    this.comment = comment ? comment.trim() : null;
    this.createdAt = createdAt || new Date();

    Object.freeze(this);
  }
}
