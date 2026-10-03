import { NotFoundError } from '../../../domain/errors/DomainError.js';

/**
 * Caso de uso para listar el historial paginado de diagnósticos del usuario autenticado.
 */
export class ListDiagnoses {
  /**
   * @param {object} dependencies
   * @param {import('../../ports/DiagnosisRepository.js').DiagnosisRepository} dependencies.diagnosisRepository
   */
  constructor({ diagnosisRepository }) {
    this.diagnosisRepository = diagnosisRepository;
  }

  /**
   * @param {object} params
   * @param {string} params.ownerId
   * @param {import('../../ports/DiagnosisRepository.js').DiagnosisFilters} [params.filters={}]
   * @param {import('../../ports/DiagnosisRepository.js').PaginationParams} [params.pagination={ page: 1, pageSize: 20 }]
   * @returns {Promise<import('../../ports/DiagnosisRepository.js').PaginatedResult<object>>}
   */
  async execute({ ownerId, filters = {}, pagination = { page: 1, pageSize: 20 } }) {
    if (!ownerId) {
      throw new NotFoundError('Usuario no especificado.', 'USER_REQUIRED');
    }

    const pageSize = Math.min(Math.max(1, pagination.pageSize || 20), 50);
    const page = Math.max(1, pagination.page || 1);

    const result = await this.diagnosisRepository.findByOwner(
      ownerId,
      filters,
      { page, pageSize }
    );

    const items = result.items.map((d) => ({
      id: d.id,
      createdAt: d.createdAt.toISOString(),
      verdict: {
        healthStatus: d.verdict.healthStatus.value,
        confidence: d.verdict.confidence,
        healthyProbability: d.verdict.healthyProbability,
      },
      prediction: d.prediction,
      topPredictions: d.topPredictions,
      warnings: d.warnings,
      message: d.message,
      model: d.model,
      processingTimeMs: d.processingTimeMs,
      context: d.context,
      image: {
        url: `/api/v1/diagnoses/${d.id}/image`,
        width: d.image.width,
        height: d.image.height,
      },
    }));

    return {
      items,
      page: result.page,
      pageSize: result.pageSize,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
    };
  }
}
