import { ClassKeyParser } from './ClassKeyParser.js';
import { InvalidInferenceResultError } from '../errors/DomainError.js';

/**
 * Pesos canónicos del método de ensamble por Votación Ponderada (Weighted Voting)
 * definidos según la capacidad de generalización y exactitud empírica:
 *   - EfficientNetB0: 35% (0.35)
 *   - ResNet50:       30% (0.30)
 *   - MobileNetV2:    20% (0.20)
 *   - CNN_Base:       15% (0.15)
 * Total: 100% (1.00)
 */
export const ENSEMBLE_WEIGHTS = Object.freeze({
  EfficientNetB0: 0.35,
  ResNet50: 0.30,
  MobileNetV2: 0.20,
  CNN_Base: 0.15,
});

export const MODEL_DISPLAY_NAMES = Object.freeze({
  EfficientNetB0: 'EfficientNet-B0 (Transfer)',
  ResNet50: 'ResNet-50 (Residual Deep)',
  MobileNetV2: 'MobileNet-V2 (Edge Optimized)',
  CNN_Base: 'CNN Base (Baseline ConvNet)',
});

/**
 * Servicio de Dominio para el ensamble de votación ponderada de los modelos de AgroGuard.
 */
export class WeightedVotingEnsemble {
  /**
   * Combina matemáticamente las salidas probabilísticas de los 4 modelos de Keras.
   *
   * @param {object} params
   * @param {Record<string, number[]>} params.modelOutputs - Diccionario con probabilidades por modelo
   * @param {readonly string[]} params.classNames - Lista ordenada de las 38 clases
   * @param {Record<string, number>} [params.weights=ENSEMBLE_WEIGHTS] - Pesos ponderados
   * @returns {{
   *   ensembleProbabilities: Array<{ classKey: string, probability: number }>,
   *   winningClassKey: string,
   *   globalConfidence: number,
   *   modelsBreakdown: Array<{
   *     modelKey: string,
   *     displayName: string,
   *     weight: number,
   *     topClassKey: string,
   *     topCropName: string,
   *     topConditionName: string,
   *     individualConfidence: number,
   *     contribution: number,
   *     agreesWithEnsemble: boolean
   *   }>,
   *   consensus: {
   *     agreeingCount: number,
   *     totalCount: number,
   *     ratio: number,
   *     level: 'UNANIMOUS' | 'STRONG' | 'MODERATE' | 'DIVERGENT',
   *     label: string
   *   }
   * }}
   */
  static combine({ modelOutputs, classNames, weights = ENSEMBLE_WEIGHTS }) {
    if (!modelOutputs || typeof modelOutputs !== 'object') {
      throw new InvalidInferenceResultError('Salida de modelos inválida para el ensamble.');
    }

    if (!Array.isArray(classNames) || classNames.length === 0) {
      throw new InvalidInferenceResultError('Lista de nombres de clases requerida.');
    }

    const numClasses = classNames.length;
    const requiredKeys = Object.keys(weights);

    // Verificar que todos los modelos requeridos están presentes
    for (const key of requiredKeys) {
      if (!Array.isArray(modelOutputs[key]) || modelOutputs[key].length !== numClasses) {
        throw new InvalidInferenceResultError(
          `El modelo '${key}' no devolvió el vector de ${numClasses} probabilidades esperado.`
        );
      }
    }

    // Inicializar vector de suma ponderada
    const combinedVector = new Array(numClasses).fill(0);
    const modelsBreakdown = [];

    // Calcular suma ponderada: P_ensamble = sum(w_i * P_i)
    for (const [key, weight] of Object.entries(weights)) {
      const probs = modelOutputs[key];
      let modelTopIdx = 0;
      let modelTopProb = -1;

      for (let i = 0; i < numClasses; i++) {
        const p = probs[i];
        combinedVector[i] += p * weight;
        if (p > modelTopProb) {
          modelTopProb = p;
          modelTopIdx = i;
        }
      }

      const topClassKey = classNames[modelTopIdx];
      let parsed = { cropName: topClassKey, conditionName: topClassKey };
      try {
        parsed = ClassKeyParser.parse(topClassKey);
      } catch {
        // En caso de clase sin separador
      }

      modelsBreakdown.push({
        modelKey: key,
        displayName: MODEL_DISPLAY_NAMES[key] || key,
        weight,
        topClassKey,
        topCropName: parsed.cropName,
        topConditionName: parsed.conditionName,
        individualConfidence: Number(modelTopProb.toFixed(4)),
        contribution: 0, // se calcula tras conocer la clase ganadora del ensamble
        agreesWithEnsemble: false,
      });
    }

    // Normalizar vector combinado para garantizar suma estricta de 1.0 (eliminando sesgo numérico)
    const sumCombined = combinedVector.reduce((acc, val) => acc + val, 0);
    const normalizedEnsembleProbs = combinedVector.map((val) =>
      sumCombined > 0 ? val / sumCombined : 1 / numClasses
    );

    // Identificar clase ganadora del ensamble
    let winningIdx = 0;
    let maxEnsembleProb = -1;
    for (let i = 0; i < numClasses; i++) {
      if (normalizedEnsembleProbs[i] > maxEnsembleProb) {
        maxEnsembleProb = normalizedEnsembleProbs[i];
        winningIdx = i;
      }
    }

    const winningClassKey = classNames[winningIdx];

    // Enriquecer el desglose por modelo con el aporte a la clase ganadora y consenso
    let agreeingCount = 0;
    for (const item of modelsBreakdown) {
      const modelProbAtWinning = modelOutputs[item.modelKey][winningIdx] || 0;
      item.contribution = Number((item.weight * modelProbAtWinning).toFixed(4));
      item.agreesWithEnsemble = item.topClassKey === winningClassKey;
      if (item.agreesWithEnsemble) {
        agreeingCount++;
      }
    }

    // Nivel de consenso matemático entre las arquitecturas
    const totalCount = requiredKeys.length;
    const ratio = agreeingCount / totalCount;
    let level = 'MODERATE';
    let label = `${agreeingCount} de ${totalCount} modelos coinciden`;

    if (agreeingCount === totalCount) {
      level = 'UNANIMOUS';
      label = `Consenso Unánime (${agreeingCount}/${totalCount} modelos coinciden)`;
    } else if (agreeingCount >= 3) {
      level = 'STRONG';
      label = `Consenso Fuerte (${agreeingCount}/${totalCount} modelos coinciden)`;
    } else if (agreeingCount === 2) {
      level = 'MODERATE';
      label = `Consenso Parcial (${agreeingCount}/${totalCount} modelos coinciden)`;
    } else {
      level = 'DIVERGENT';
      label = `Discrepancia entre arquitecturas (${agreeingCount}/${totalCount} modelos)`;
    }

    // Lista estructurada de probabilidades requerida por el puerto InferenceEngine
    const ensembleProbabilities = classNames.map((classKey, idx) => ({
      classKey,
      probability: Number(normalizedEnsembleProbs[idx].toFixed(6)),
    }));

    return {
      ensembleProbabilities,
      winningClassKey,
      globalConfidence: Number(maxEnsembleProb.toFixed(4)),
      modelsBreakdown,
      consensus: {
        agreeingCount,
        totalCount,
        ratio: Number(ratio.toFixed(2)),
        level,
        label,
      },
    };
  }
}
