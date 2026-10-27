/**
 * Mapper con lista blanca estricta para el resultado del diagnóstico fitopatológico.
 */

/**
 * @param {any} raw
 * @returns {object} ViewModel del diagnóstico fitopatológico sanitizado
 */
export function mapDiagnosisResponse(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Respuesta de diagnóstico inválida o vacía.');
  }

  const verdict = raw.verdict || {};
  const prediction = raw.prediction || {};
  const model = raw.model || {};
  const recommendation = raw.recommendation || null;
  const context = raw.context || {};
  const image = raw.image || null;

  return {
    id: typeof raw.id === 'string' ? raw.id : null,
    persisted: Boolean(raw.persisted),
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
    validationState: typeof raw.validationState === 'string' ? raw.validationState : null,
    validationReason: typeof raw.validationReason === 'string' ? raw.validationReason : null,
    clipTopLabels: Array.isArray(raw.clipTopLabels)
      ? raw.clipTopLabels
          .filter((lbl) => lbl && typeof lbl.label === 'string')
          .slice(0, 5)
          .map((lbl) => ({
            label: String(lbl.label),
            score: typeof lbl.score === 'number' ? Math.max(0, Math.min(1, lbl.score)) : 0,
          }))
      : null,
    verdict: {

      healthStatus: ['HEALTHY', 'DISEASED', 'INCONCLUSIVE'].includes(verdict.healthStatus)
        ? verdict.healthStatus
        : 'INCONCLUSIVE',
      confidence: typeof verdict.confidence === 'number' ? Math.max(0, Math.min(1, verdict.confidence)) : 0,
      healthyProbability:
        typeof verdict.healthyProbability === 'number'
          ? Math.max(0, Math.min(1, verdict.healthyProbability))
          : 0,
    },
    prediction: {
      classKey: typeof prediction.classKey === 'string' ? prediction.classKey : '',
      cropKey: typeof prediction.cropKey === 'string' ? prediction.cropKey : '',
      conditionKey: typeof prediction.conditionKey === 'string' ? prediction.conditionKey : '',
      cropName: typeof prediction.cropName === 'string' ? prediction.cropName : 'Cultivo no identificado',
      conditionName:
        typeof prediction.conditionName === 'string'
          ? prediction.conditionName
          : 'Condición no especificada',
    },
    topPredictions: Array.isArray(raw.topPredictions)
      ? raw.topPredictions
          .filter((item) => item && typeof item.classKey === 'string')
          .slice(0, 3)
          .map((item) => ({
            classKey: String(item.classKey),
            probability: typeof item.probability === 'number' ? Math.max(0, Math.min(1, item.probability)) : 0,
            cropName: typeof item.cropName === 'string' ? item.cropName : '',
            conditionName: typeof item.conditionName === 'string' ? item.conditionName : '',
          }))
      : [],
    warnings: Array.isArray(raw.warnings)
      ? raw.warnings.filter((w) => ['LOW_CONFIDENCE', 'CROP_MISMATCH', 'LOW_RESOLUTION'].includes(w))
      : [],
    message: typeof raw.message === 'string' ? raw.message : null,
    recommendation: recommendation
      ? {
          reviewStatus:
            recommendation.reviewStatus === 'REVIEWED' ? 'REVIEWED' : 'PENDING_REVIEW',
          summary: typeof recommendation.summary === 'string' ? recommendation.summary : '',
          generalAdvice:
            typeof recommendation.generalAdvice === 'string' ? recommendation.generalAdvice : '',
          actions: Array.isArray(recommendation.actions)
            ? recommendation.actions
                .filter((a) => a && typeof a.description === 'string')
                .map((a) => ({
                  type: ['cultural', 'biological', 'chemical'].includes(a.type) ? a.type : 'cultural',
                  description: String(a.description),
                }))
            : [],
        }
      : null,
    model: {
      name: typeof model.name === 'string' ? model.name : 'AgroGuard Deep Ensemble',
      version: typeof model.version === 'string' ? model.version : '1.0',
      provider: typeof model.provider === 'string' ? model.provider : 'ensemble',
      isMock: model.provider === 'mock',
    },
    ensembleBreakdown: raw.ensembleBreakdown || null,
    report: raw.report || null,
    processingTimeMs: typeof raw.processingTimeMs === 'number' ? raw.processingTimeMs : 0,
    context: {
      plotName: typeof context.plotName === 'string' ? context.plotName : null,
      cropHint: typeof context.cropHint === 'string' ? context.cropHint : null,
      notes: typeof context.notes === 'string' ? context.notes : null,
    },
    image: image
      ? {
          url: typeof image.url === 'string' ? image.url : null,
          width: typeof image.width === 'number' ? image.width : null,
          height: typeof image.height === 'number' ? image.height : null,
        }
      : null,
  };
}
