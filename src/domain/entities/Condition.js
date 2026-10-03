import { ValidationError } from '../errors/DomainError.js';

export const REVIEW_STATUS = Object.freeze({
  PENDING_REVIEW: 'PENDING_REVIEW',
  REVIEWED: 'REVIEWED',
});

/**
 * Entidad de Catálogo Fitopatológico Condition.
 */
export class Condition {
  /**
   * @param {object} params
   * @param {string} params.classKey - Identificador único de clase (ej. Tomato___Early_blight)
   * @param {string} params.cropKey - Clave del cultivo (ej. Tomato)
   * @param {string} params.conditionKey - Clave de la condición (ej. Early_blight)
   * @param {boolean} params.isHealthy - Si representa hoja sana
   * @param {{ es: { cropName: string, conditionName: string } }} params.names - Nombres en español
   * @param {string} [params.description='']
   * @param {string[]} [params.symptoms=[]]
   * @param {{ cultural: string[], biological: string[], chemical: string[] }} [params.management]
   * @param {'PENDING_REVIEW'|'REVIEWED'} [params.reviewStatus='PENDING_REVIEW']
   * @param {string|null} [params.reviewedBy=null]
   * @param {Date|null} [params.reviewedAt=null]
   * @param {string[]} [params.sources=[]]
   */
  constructor({
    classKey,
    cropKey,
    conditionKey,
    isHealthy,
    names,
    description = '',
    symptoms = [],
    management = { cultural: [], biological: [], chemical: [] },
    reviewStatus = REVIEW_STATUS.PENDING_REVIEW,
    reviewedBy = null,
    reviewedAt = null,
    sources = [],
  }) {
    if (!classKey || typeof classKey !== 'string') {
      throw new ValidationError('El classKey es obligatorio', 'CONDITION_CLASSKEY_REQUIRED');
    }
    if (!cropKey || !conditionKey) {
      throw new ValidationError('El cultivo y la condición son obligatorios', 'CONDITION_KEYS_REQUIRED');
    }
    if (!Object.values(REVIEW_STATUS).includes(reviewStatus)) {
      throw new ValidationError(`Estado de revisión inválido: ${reviewStatus}`, 'INVALID_REVIEW_STATUS');
    }

    this.classKey = classKey;
    this.cropKey = cropKey;
    this.conditionKey = conditionKey;
    this.isHealthy = Boolean(isHealthy);
    this.names = Object.freeze({ ...names });
    this.description = description;
    this.symptoms = Object.freeze([...symptoms]);
    this.management = Object.freeze({
      cultural: Object.freeze([...(management.cultural || [])]),
      biological: Object.freeze([...(management.biological || [])]),
      chemical: Object.freeze([...(management.chemical || [])]),
    });
    this.reviewStatus = reviewStatus;
    this.reviewedBy = reviewedBy;
    this.reviewedAt = reviewedAt;
    this.sources = Object.freeze([...sources]);

    Object.freeze(this);
  }

  /**
   * Genera el objeto de recomendación para la respuesta de diagnóstico
   */
  getRecommendation() {
    if (this.isHealthy) {
      return {
        reviewStatus: this.reviewStatus,
        summary: 'La hoja no presenta signos visibles de enfermedad fitopatológica.',
        generalAdvice: 'Mantén las buenas prácticas agronómicas y monitoreo periódico del cultivo.',
        actions: [],
      };
    }

    if (this.reviewStatus === REVIEW_STATUS.PENDING_REVIEW) {
      return {
        reviewStatus: this.reviewStatus,
        summary: `Posible presencia de ${this.names.es?.conditionName || this.conditionKey}.`,
        generalAdvice: 'Consulta a un ingeniero agrónomo antes de aplicar cualquier tratamiento.',
        actions: [],
      };
    }

    return {
      reviewStatus: this.reviewStatus,
      summary: this.description,
      generalAdvice: 'Aplica las siguientes medidas integradas de manejo.',
      actions: [
        ...this.management.cultural.map((item) => ({ type: 'cultural', description: item })),
        ...this.management.biological.map((item) => ({ type: 'biological', description: item })),
        ...this.management.chemical.map((item) => ({ type: 'chemical', description: item })),
      ],
    };
  }
}
