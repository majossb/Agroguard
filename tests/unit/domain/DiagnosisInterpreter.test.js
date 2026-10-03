import { describe, it, expect } from 'vitest';
import { DiagnosisInterpreter } from '../../../src/domain/services/DiagnosisInterpreter.js';
import { InvalidInferenceResultError } from '../../../src/domain/errors/DomainError.js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const classNames = JSON.parse(
  readFileSync(resolve(process.cwd(), 'data/class_names.json'), 'utf-8')
);

// Helper para construir un arreglo válido de probabilidades que sumen 1.0
function createProbabilities(topClassKey, topProb, otherClasses = classNames) {
  const remainingProb = 1.0 - topProb;
  const others = otherClasses.filter((c) => c !== topClassKey);
  const eachOther = remainingProb / others.length;

  return otherClasses.map((c) => ({
    classKey: c,
    probability: c === topClassKey ? topProb : eachOther,
  }));
}

describe('Domain Service — DiagnosisInterpreter', () => {
  it('Debe interpretar correctamente un diagnóstico con alta confianza ENFERMO (DISEASED)', () => {
    const probabilities = createProbabilities('Tomato___Early_blight', 0.9421);

    const result = DiagnosisInterpreter.interpret({
      inferenceResult: {
        modelName: 'ResNet50_Transfer',
        modelVersion: '1.0.0',
        provider: 'mock',
        probabilities,
        inferenceTimeMs: 100,
        explanation: null,
      },
      validClassKeys: classNames,
      minConfidence: 0.6,
      imageDimensions: { width: 1200, height: 900 },
    });

    expect(result.verdict.healthStatus.value).toBe('DISEASED');
    expect(result.verdict.confidence).toBe(0.9421);
    expect(result.prediction.classKey).toBe('Tomato___Early_blight');
    expect(result.prediction.cropKey).toBe('Tomato');
    expect(result.prediction.conditionKey).toBe('Early_blight');
    expect(result.prediction.cropName).toBe('Tomate');
    expect(result.prediction.conditionName).toContain('Tizón temprano');
    expect(result.topPredictions).toHaveLength(3);
    expect(result.topPredictions[0].classKey).toBe('Tomato___Early_blight');
    expect(result.warnings).toEqual([]);
    expect(result.message).toBeNull();
  });

  it('Debe interpretar correctamente un diagnóstico con alta confianza SANO (HEALTHY)', () => {
    const probabilities = createProbabilities('Apple___healthy', 0.885);

    const result = DiagnosisInterpreter.interpret({
      inferenceResult: {
        modelName: 'ResNet50_Transfer',
        modelVersion: '1.0.0',
        provider: 'mock',
        probabilities,
        inferenceTimeMs: 90,
        explanation: null,
      },
      validClassKeys: classNames,
      minConfidence: 0.6,
      imageDimensions: { width: 1000, height: 1000 },
    });

    expect(result.verdict.healthStatus.value).toBe('HEALTHY');
    expect(result.verdict.confidence).toBe(0.885);
    expect(result.prediction.classKey).toBe('Apple___healthy');
    expect(result.prediction.cropKey).toBe('Apple');
    expect(result.prediction.conditionKey).toBe('healthy');
    expect(result.message).toBeNull();
  });

  it('Debe clasificar como INCONCLUSIVE si la confianza top-1 es menor a MIN_CONFIDENCE y adjuntar mensaje explicativo', () => {
    // Distribución plana con top en 0.45 (< 0.60)
    const probabilities = createProbabilities('Potato___Early_blight', 0.45);

    const result = DiagnosisInterpreter.interpret({
      inferenceResult: {
        modelName: 'ResNet50_Transfer',
        modelVersion: '1.0.0',
        provider: 'mock',
        probabilities,
        inferenceTimeMs: 80,
        explanation: null,
      },
      validClassKeys: classNames,
      minConfidence: 0.6,
      imageDimensions: { width: 800, height: 600 },
    });

    expect(result.verdict.healthStatus.value).toBe('INCONCLUSIVE');
    expect(result.warnings).toContain('LOW_CONFIDENCE');
    expect(result.message).toBe(
      'No pudimos identificar la hoja con seguridad. Toma otra foto con luz natural, fondo neutro y la hoja centrada.'
    );
  });

  it('Debe respetar un umbral personalizado de MIN_CONFIDENCE (ej. 0.80)', () => {
    const probabilities = createProbabilities('Tomato___Late_blight', 0.75);

    const result = DiagnosisInterpreter.interpret({
      inferenceResult: {
        modelName: 'ResNet50_Transfer',
        modelVersion: '1.0.0',
        provider: 'mock',
        probabilities,
        inferenceTimeMs: 80,
        explanation: null,
      },
      validClassKeys: classNames,
      minConfidence: 0.8,
    });

    expect(result.verdict.healthStatus.value).toBe('INCONCLUSIVE');
    expect(result.warnings).toContain('LOW_CONFIDENCE');
  });

  it('Debe calcular healthyProbability sumando todas las clases healthy presentes', () => {
    const probabilities = classNames.map((key) => {
      if (key.endsWith('___healthy')) {
        return { classKey: key, probability: 0.05 }; // Varias clases healthy
      }
      return { classKey: key, probability: 0.01 };
    });

    // Normalizar a suma 1.0
    const sum = probabilities.reduce((acc, p) => acc + p.probability, 0);
    const normalizedProbs = probabilities.map((p) => ({
      classKey: p.classKey,
      probability: p.probability / sum,
    }));

    const healthyCount = classNames.filter((k) => k.endsWith('___healthy')).length;
    const expectedHealthyProb = (healthyCount * 0.05) / sum;

    const result = DiagnosisInterpreter.interpret({
      inferenceResult: {
        modelName: 'ResNet50_Transfer',
        modelVersion: '1.0.0',
        provider: 'mock',
        probabilities: normalizedProbs,
        inferenceTimeMs: 50,
        explanation: null,
      },
      validClassKeys: classNames,
      minConfidence: 0.01,
    });

    expect(result.verdict.healthyProbability).toBeCloseTo(expectedHealthyProb, 3);
  });

  it('Debe desempate estable alfabéticamente por classKey cuando hay probabilidades idénticas', () => {
    const equalProb = 1.0 / classNames.length;
    const probabilities = classNames.map((key) => ({
      classKey: key,
      probability: equalProb,
    }));

    const result = DiagnosisInterpreter.interpret({
      inferenceResult: {
        modelName: 'ResNet50_Transfer',
        modelVersion: '1.0.0',
        provider: 'mock',
        probabilities,
        inferenceTimeMs: 50,
        explanation: null,
      },
      validClassKeys: classNames,
      minConfidence: 0.001,
    });

    const expectedFirstAlpha = [...classNames].sort()[0];
    expect(result.topPredictions[0].classKey).toBe(expectedFirstAlpha);
  });

  it('Debe agregar advertencia CROP_MISMATCH si el cropHint del usuario no coincide con el predicho', () => {
    const probabilities = createProbabilities('Tomato___Early_blight', 0.9);

    const result = DiagnosisInterpreter.interpret({
      inferenceResult: {
        modelName: 'ResNet50_Transfer',
        modelVersion: '1.0.0',
        provider: 'mock',
        probabilities,
        inferenceTimeMs: 50,
        explanation: null,
      },
      validClassKeys: classNames,
      context: { cropHint: 'Potato' },
      minConfidence: 0.6,
    });

    expect(result.warnings).toContain('CROP_MISMATCH');
  });

  it('NO debe agregar advertencia CROP_MISMATCH si el cropHint coincide (normalizado)', () => {
    const probabilities = createProbabilities('Tomato___Early_blight', 0.9);

    const result = DiagnosisInterpreter.interpret({
      inferenceResult: {
        modelName: 'ResNet50_Transfer',
        modelVersion: '1.0.0',
        provider: 'mock',
        probabilities,
        inferenceTimeMs: 50,
        explanation: null,
      },
      validClassKeys: classNames,
      context: { cropHint: 'tomato' },
      minConfidence: 0.6,
    });

    expect(result.warnings).not.toContain('CROP_MISMATCH');
  });

  it('Debe agregar advertencia LOW_RESOLUTION si el lado corto está entre 224 y 480 px', () => {
    const probabilities = createProbabilities('Tomato___Early_blight', 0.9);

    const result = DiagnosisInterpreter.interpret({
      inferenceResult: {
        modelName: 'ResNet50_Transfer',
        modelVersion: '1.0.0',
        provider: 'mock',
        probabilities,
        inferenceTimeMs: 50,
        explanation: null,
      },
      validClassKeys: classNames,
      imageDimensions: { width: 320, height: 240 },
    });

    expect(result.warnings).toContain('LOW_RESOLUTION');
  });

  it('NO debe agregar advertencia LOW_RESOLUTION si la resolución supera 480 px', () => {
    const probabilities = createProbabilities('Tomato___Early_blight', 0.9);

    const result = DiagnosisInterpreter.interpret({
      inferenceResult: {
        modelName: 'ResNet50_Transfer',
        modelVersion: '1.0.0',
        provider: 'mock',
        probabilities,
        inferenceTimeMs: 50,
        explanation: null,
      },
      validClassKeys: classNames,
      imageDimensions: { width: 800, height: 600 },
    });

    expect(result.warnings).not.toContain('LOW_RESOLUTION');
  });

  it('Debe permitir suma de probabilidades con tolerancia de 1 ± 0.01 y lanzar error si excede la tolerancia', () => {
    // Caso válido dentro de tolerancia (suma = 1.008)
    const validToleranceProbs = createProbabilities('Tomato___Early_blight', 0.9);
    const target = validToleranceProbs.find((p) => p.classKey === 'Tomato___Early_blight');
    target.probability = 0.908; // Suma total = 1.008

    expect(() =>
      DiagnosisInterpreter.interpret({
        inferenceResult: {
          modelName: 'ResNet50_Transfer',
          modelVersion: '1.0.0',
          provider: 'mock',
          probabilities: validToleranceProbs,
          inferenceTimeMs: 50,
          explanation: null,
        },
        validClassKeys: classNames,
      })
    ).not.toThrow();

    // Caso inválido fuera de tolerancia (suma = 1.05)
    const invalidToleranceProbs = createProbabilities('Tomato___Early_blight', 0.9);
    const targetInvalid = invalidToleranceProbs.find((p) => p.classKey === 'Tomato___Early_blight');
    targetInvalid.probability = 0.96; // Suma total = 1.06

    expect(() =>
      DiagnosisInterpreter.interpret({
        inferenceResult: {
          modelName: 'ResNet50_Transfer',
          modelVersion: '1.0.0',
          provider: 'mock',
          probabilities: invalidToleranceProbs,
          inferenceTimeMs: 50,
          explanation: null,
        },
        validClassKeys: classNames,
      })
    ).toThrow(InvalidInferenceResultError);
  });


  it('Debe lanzar InvalidInferenceResultError si una clase devuelta no existe en validClassKeys', () => {
    const invalidProbs = createProbabilities('Tomato___Early_blight', 0.9);
    invalidProbs[0].classKey = 'Clase_Inexistente___Alien_disease';

    expect(() =>
      DiagnosisInterpreter.interpret({
        inferenceResult: {
          modelName: 'ResNet50_Transfer',
          modelVersion: '1.0.0',
          provider: 'mock',
          probabilities: invalidProbs,
          inferenceTimeMs: 50,
          explanation: null,
        },
        validClassKeys: classNames,
      })
    ).toThrow(InvalidInferenceResultError);
  });

  it('Debe lanzar InvalidInferenceResultError si el número de clases no coincide', () => {
    expect(() =>
      DiagnosisInterpreter.interpret({
        inferenceResult: {
          modelName: 'ResNet50_Transfer',
          modelVersion: '1.0.0',
          provider: 'mock',
          probabilities: [{ classKey: 'Tomato___healthy', probability: 1.0 }],
          inferenceTimeMs: 50,
          explanation: null,
        },
        validClassKeys: classNames,
      })
    ).toThrow(InvalidInferenceResultError);
  });
});
