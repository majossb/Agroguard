import { InvalidInferenceResultError } from '../errors/DomainError.js';
import { HealthStatus } from '../value-objects/HealthStatus.js';
import { Confidence } from '../value-objects/Confidence.js';
import { ClassKeyParser } from './ClassKeyParser.js';

/**
 * Servicio de dominio puro para interpretar los resultados de inferencia fitopatológica.
 */
export class DiagnosisInterpreter {
  /**
   * Interpreta el resultado crudo devuelto por el motor de inferencia.
   *
   * @param {object} params
   * @param {import('../../application/ports/InferenceEngine.js').InferenceResult} params.inferenceResult
   * @param {string[]} params.validClassKeys - Lista de clases válidas
   * @param {number} [params.minConfidence=0.60] - Umbral mínimo de confianza
   * @param {object} [params.context={}] - Contexto opcional enviado por el usuario
   * @param {string} [params.context.cropHint] - Sugerencia de cultivo
   * @param {string} [params.context.plotName]
   * @param {string} [params.context.notes]
   * @param {{ width: number, height: number }} [params.imageDimensions]
   * @returns {{
   *   verdict: {
   *     healthStatus: HealthStatus,
   *     confidence: number,
   *     healthyProbability: number
   *   },
   *   prediction: {
   *     classKey: string,
   *     cropKey: string,
   *     conditionKey: string,
   *     cropName: string,
   *     conditionName: string
   *   },
   *   topPredictions: Array<{ classKey: string, probability: number }>,
   *   warnings: string[],
   *   message: string|null
   * }}
   */
  static interpret({
    inferenceResult,
    validClassKeys,
    minConfidence = 0.6,
    context = {},
    imageDimensions,
  }) {
    if (!inferenceResult || !Array.isArray(inferenceResult.probabilities)) {
      throw new InvalidInferenceResultError(
        'El resultado de inferencia no contiene el arreglo de probabilidades esperado.'
      );
    }

    const { probabilities } = inferenceResult;

    if (!Array.isArray(validClassKeys) || validClassKeys.length === 0) {
      throw new InvalidInferenceResultError(
        'La lista de clases válidas de referencia no ha sido configurada.'
      );
    }

    if (probabilities.length !== validClassKeys.length) {
      throw new InvalidInferenceResultError(
        `Se esperaban ${validClassKeys.length} probabilidades pero se recibieron ${probabilities.length}.`
      );
    }

    const validClassKeySet = new Set(validClassKeys);
    let sumProbabilities = 0;

    for (const item of probabilities) {
      if (
        !item ||
        typeof item.classKey !== 'string' ||
        typeof item.probability !== 'number' ||
        Number.isNaN(item.probability)
      ) {
        throw new InvalidInferenceResultError(
          'Elemento de probabilidad mal estructurado en la salida de inferencia.'
        );
      }

      if (!validClassKeySet.has(item.classKey)) {
        throw new InvalidInferenceResultError(
          `La clase '${item.classKey}' no existe en la lista de clases válidas del modelo.`
        );
      }

      if (item.probability < 0 || item.probability > 1) {
        throw new InvalidInferenceResultError(
          `Probabilidad fuera de rango [0, 1] para la clase '${item.classKey}': ${item.probability}`
        );
      }

      sumProbabilities += item.probability;
    }

    // Invariante: La suma de probabilidades debe ser 1 +- 0.01
    if (Math.abs(sumProbabilities - 1.0) > 0.01) {
      throw new InvalidInferenceResultError(
        `La suma de probabilidades (${sumProbabilities.toFixed(4)}) excede la tolerancia permitida de 1 ± 0.01.`
      );
    }

    // Ordenar descendente por probabilidad con desempate estable por classKey
    const sorted = [...probabilities].sort((a, b) => {
      if (b.probability !== a.probability) {
        return b.probability - a.probability;
      }
      return a.classKey.localeCompare(b.classKey);
    });

    const top1 = sorted[0];
    const top1Parsed = ClassKeyParser.parse(top1.classKey);
    const top1Confidence = new Confidence(top1.probability);

    // Suma de probabilidades de todas las clases cuya condición es "healthy"
    let healthyProbabilitySum = 0;
    for (const item of probabilities) {
      const parsed = ClassKeyParser.parse(item.classKey);
      if (parsed.isHealthy) {
        healthyProbabilitySum += item.probability;
      }
    }
    // Asegurar que la suma total sana no exceda 1.0 por pequeñas tolerancias
    const healthyProbability = Math.min(1.0, healthyProbabilitySum);

    // Veredicto
    let healthStatusValue;
    if (top1Confidence.lessThan(minConfidence)) {
      healthStatusValue = 'INCONCLUSIVE';
    } else if (top1Parsed.isHealthy) {
      healthStatusValue = 'HEALTHY';
    } else {
      healthStatusValue = 'DISEASED';
    }

    const healthStatus = new HealthStatus(healthStatusValue);

    // Top 3 predicciones
    const topPredictions = sorted.slice(0, 3).map((p) => ({
      classKey: p.classKey,
      probability: p.probability,
    }));

    // Advertencias
    const warnings = [];

    if (top1Confidence.lessThan(minConfidence)) {
      warnings.push('LOW_CONFIDENCE');
    }

    if (context.cropHint && typeof context.cropHint === 'string') {
      const normalizedHint = context.cropHint.trim().toLowerCase();
      const normalizedCropKey = top1Parsed.cropKey.toLowerCase();
      const normalizedCropName = top1Parsed.cropName.toLowerCase();

      if (
        normalizedHint !== normalizedCropKey &&
        !normalizedCropName.includes(normalizedHint) &&
        !normalizedHint.includes(normalizedCropName)
      ) {
        warnings.push('CROP_MISMATCH');
      }
    }

    if (imageDimensions && imageDimensions.width && imageDimensions.height) {
      const shortSide = Math.min(imageDimensions.width, imageDimensions.height);
      if (shortSide >= 224 && shortSide <= 480) {
        warnings.push('LOW_RESOLUTION');
      }
    }

    const message = healthStatus.isInconclusive()
      ? 'No pudimos identificar la hoja con seguridad. Toma otra foto con luz natural, fondo neutro y la hoja centrada.'
      : null;

    return {
      verdict: {
        healthStatus,
        confidence: top1Confidence.value,
        healthyProbability,
      },
      prediction: {
        classKey: top1Parsed.classKey,
        cropKey: top1Parsed.cropKey,
        conditionKey: top1Parsed.conditionKey,
        cropName: top1Parsed.cropName,
        conditionName: top1Parsed.conditionName,
      },
      topPredictions,
      warnings,
      message,
    };
  }
}
