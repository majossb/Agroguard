import { describe, it, expect } from 'vitest';
import {
  WeightedVotingEnsemble,
  ENSEMBLE_WEIGHTS,
} from '../../../src/domain/services/WeightedVotingEnsemble.js';

describe('Domain — WeightedVotingEnsemble (Mathematical Formulation)', () => {
  const classNames = [
    'Apple___Apple_scab',
    'Tomato___Late_blight',
    'Tomato___healthy',
  ];

  it('Verifica los pesos canónicos del ensamble (35%, 30%, 20%, 15% -> 100%)', () => {
    expect(ENSEMBLE_WEIGHTS.EfficientNetB0).toBe(0.35);
    expect(ENSEMBLE_WEIGHTS.ResNet50).toBe(0.30);
    expect(ENSEMBLE_WEIGHTS.MobileNetV2).toBe(0.20);
    expect(ENSEMBLE_WEIGHTS.CNN_Base).toBe(0.15);

    const sumWeights = Object.values(ENSEMBLE_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sumWeights).toBeCloseTo(1.0, 5);
  });

  it('Calcula la suma ponderada lineal P_ensamble = sum(w_i * P_i) con consenso unánime', () => {
    // Todos los modelos votan mayoritariamente por Tomato___Late_blight (idx 1)
    const modelOutputs = {
      EfficientNetB0: [0.01, 0.98, 0.01],
      ResNet50: [0.05, 0.90, 0.05],
      MobileNetV2: [0.10, 0.85, 0.05],
      CNN_Base: [0.15, 0.70, 0.15],
    };

    const result = WeightedVotingEnsemble.combine({
      modelOutputs,
      classNames,
      weights: ENSEMBLE_WEIGHTS,
    });

    // P_esperado para Tomato___Late_blight:
    // 0.35*0.98 + 0.30*0.90 + 0.20*0.85 + 0.15*0.70
    // = 0.343 + 0.270 + 0.170 + 0.105 = 0.888
    expect(result.winningClassKey).toBe('Tomato___Late_blight');
    expect(result.globalConfidence).toBeCloseTo(0.888, 2);

    // Suma de probabilidades del ensamble debe ser exactamente 1.0 +- 0.0001
    const sumProbs = result.ensembleProbabilities.reduce((acc, p) => acc + p.probability, 0);
    expect(sumProbs).toBeCloseTo(1.0, 4);

    // Consenso unánime (4 de 4)
    expect(result.consensus.agreeingCount).toBe(4);
    expect(result.consensus.totalCount).toBe(4);
    expect(result.consensus.level).toBe('UNANIMOUS');
  });

  it('Calcula el aporte matemático individual ponderado (w_i · P_i) para cada modelo', () => {
    const modelOutputs = {
      EfficientNetB0: [0.10, 0.80, 0.10], // w=0.35 -> contribución = 0.35 * 0.80 = 0.28
      ResNet50: [0.10, 0.70, 0.20],       // w=0.30 -> contribución = 0.30 * 0.70 = 0.21
      MobileNetV2: [0.20, 0.60, 0.20],    // w=0.20 -> contribución = 0.20 * 0.60 = 0.12
      CNN_Base: [0.40, 0.40, 0.20],       // w=0.15 -> contribución = 0.15 * 0.40 = 0.06
    };

    const result = WeightedVotingEnsemble.combine({
      modelOutputs,
      classNames,
      weights: ENSEMBLE_WEIGHTS,
    });

    const effBreakdown = result.modelsBreakdown.find((m) => m.modelKey === 'EfficientNetB0');
    expect(effBreakdown.contribution).toBeCloseTo(0.28, 2);
    expect(effBreakdown.weight).toBe(0.35);
    expect(effBreakdown.agreesWithEnsemble).toBe(true);

    const resnetBreakdown = result.modelsBreakdown.find((m) => m.modelKey === 'ResNet50');
    expect(resnetBreakdown.contribution).toBeCloseTo(0.21, 2);
  });

  it('Determina correctamente consenso fuerte cuando 3 de 4 modelos coinciden', () => {
    const modelOutputs = {
      EfficientNetB0: [0.05, 0.90, 0.05], // Vota clase 1
      ResNet50: [0.10, 0.80, 0.10],       // Vota clase 1
      MobileNetV2: [0.05, 0.85, 0.10],    // Vota clase 1
      CNN_Base: [0.80, 0.10, 0.10],       // Vota clase 0 (discrepa)
    };

    const result = WeightedVotingEnsemble.combine({
      modelOutputs,
      classNames,
      weights: ENSEMBLE_WEIGHTS,
    });

    expect(result.winningClassKey).toBe('Tomato___Late_blight');
    expect(result.consensus.agreeingCount).toBe(3);
    expect(result.consensus.level).toBe('STRONG');

    const cnnBreakdown = result.modelsBreakdown.find((m) => m.modelKey === 'CNN_Base');
    expect(cnnBreakdown.agreesWithEnsemble).toBe(false);
    expect(cnnBreakdown.topClassKey).toBe('Apple___Apple_scab');
  });

  it('Lanza error si falta la salida de uno de los 4 modelos requeridos', () => {
    const incompleteOutputs = {
      EfficientNetB0: [0.1, 0.8, 0.1],
      ResNet50: [0.1, 0.8, 0.1],
      // Falta MobileNetV2 y CNN_Base
    };

    expect(() =>
      WeightedVotingEnsemble.combine({
        modelOutputs: incompleteOutputs,
        classNames,
        weights: ENSEMBLE_WEIGHTS,
      })
    ).toThrow();
  });
});
