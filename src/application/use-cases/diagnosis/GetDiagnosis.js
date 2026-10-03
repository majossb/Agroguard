import { NotFoundError } from '../../../domain/errors/DomainError.js';
import { REVIEW_STATUS } from '../../../domain/entities/Condition.js';

/**
 * Caso de uso para obtener el detalle de un diagnóstico propio del usuario.
 */
export class GetDiagnosis {
  /**
   * @param {object} dependencies
   * @param {import('../../ports/DiagnosisRepository.js').DiagnosisRepository} dependencies.diagnosisRepository
   * @param {import('../../ports/ConditionCatalogRepository.js').ConditionCatalogRepository} [dependencies.conditionCatalogRepository]
   */
  constructor({ diagnosisRepository, conditionCatalogRepository = null }) {
    this.diagnosisRepository = diagnosisRepository;
    this.conditionCatalogRepository = conditionCatalogRepository;
  }

  /**
   * @param {object} params
   * @param {string} params.id
   * @param {string} params.ownerId
   * @returns {Promise<object>}
   */
  async execute({ id, ownerId }) {
    const diagnosis = await this.diagnosisRepository.findById(id);

    // Si no existe o pertenece a otro usuario, devolvemos 404 (no 403) para no revelar existencia
    if (!diagnosis || diagnosis.ownerId !== ownerId) {
      throw new NotFoundError('Diagnóstico no encontrado.', 'DIAGNOSIS_NOT_FOUND');
    }

    let recommendation = null;
    if (!diagnosis.verdict.healthStatus.isInconclusive()) {
      if (this.conditionCatalogRepository) {
        const condition = await this.conditionCatalogRepository.findByClassKey(
          diagnosis.prediction.classKey
        );
        if (condition) {
          recommendation = condition.getRecommendation();
        }
      }

      if (!recommendation) {
        recommendation = {
          reviewStatus: REVIEW_STATUS.PENDING_REVIEW,
          summary: `Diagnóstico para ${diagnosis.prediction.cropName}: ${diagnosis.prediction.conditionName}.`,
          generalAdvice:
            'Consulta a un ingeniero agrónomo antes de aplicar cualquier tratamiento.',
          actions: [],
        };
      }
    }

    return {
      id: diagnosis.id,
      persisted: true,
      createdAt: diagnosis.createdAt.toISOString(),
      verdict: {
        healthStatus: diagnosis.verdict.healthStatus.value,
        confidence: diagnosis.verdict.confidence,
        healthyProbability: diagnosis.verdict.healthyProbability,
      },
      prediction: diagnosis.prediction,
      topPredictions: diagnosis.topPredictions,
      warnings: diagnosis.warnings,
      message: diagnosis.message,
      recommendation,
      model: diagnosis.model,
      processingTimeMs: diagnosis.processingTimeMs,
      context: diagnosis.context,
      image: {
        url: `/api/v1/diagnoses/${diagnosis.id}/image`,
        width: diagnosis.image.width,
        height: diagnosis.image.height,
      },
    };
  }
}
