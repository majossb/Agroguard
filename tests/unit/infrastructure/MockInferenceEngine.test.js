import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { MockInferenceEngine } from '../../../src/infrastructure/inference/MockInferenceEngine.js';
import {
  InferenceUnavailableError,
} from '../../../src/domain/errors/DomainError.js';

const classNames = JSON.parse(
  readFileSync(resolve(process.cwd(), 'data/class_names.json'), 'utf-8')
);

describe('Infrastructure — MockInferenceEngine', () => {
  const dummyImage = {
    buffer: Buffer.from('mock-test-image-content-for-sha256-seeding'),
    mimeType: 'image/jpeg',
  };

  it('Debe generar un resultado determinista con exactamente 38 clases cuya suma de probabilidades sea 1.0', async () => {
    const engine = new MockInferenceEngine({ classNames });

    const result1 = await engine.predict(dummyImage);
    const result2 = await engine.predict(dummyImage);

    expect(result1.modelName).toBe('ResNet50_Transfer_Mock');
    expect(result1.provider).toBe('mock');
    expect(result1.probabilities).toHaveLength(38);

    // Mismo buffer da exactamente el mismo resultado (determinismo)
    expect(result1.probabilities).toEqual(result2.probabilities);

    // Suma de probabilidades debe ser 1.0
    const sum = result1.probabilities.reduce((acc, p) => acc + p.probability, 0);
    expect(sum).toBeCloseTo(1.0, 4);
  });

  it('Debe forzar la clase especificada en forceClass con alta probabilidad', async () => {
    const forced = 'Tomato___Septoria_leaf_spot';
    const engine = new MockInferenceEngine({ classNames, forceClass: forced });

    const result = await engine.predict(dummyImage);
    const target = result.probabilities.find((p) => p.classKey === forced);

    expect(target).toBeDefined();
    expect(target.probability).toBeGreaterThan(0.9);
  });

  it('Debe simular baja confianza cuando simulateLowConfidence es true', async () => {
    const engine = new MockInferenceEngine({
      classNames,
      simulateLowConfidence: true,
    });

    const result = await engine.predict(dummyImage);
    const maxProb = Math.max(...result.probabilities.map((p) => p.probability));

    expect(maxProb).toBeLessThan(0.60);
  });

  it('Debe lanzar InferenceUnavailableError cuando simulateFailure es true', async () => {
    const engine = new MockInferenceEngine({
      classNames,
      simulateFailure: true,
    });

    await expect(engine.predict(dummyImage)).rejects.toThrow(InferenceUnavailableError);
    expect(await engine.isReady()).toBe(false);
  });

  it('Debe devolver la información del modelo con metrics en null', async () => {
    const engine = new MockInferenceEngine({ classNames });
    const info = await engine.info();

    expect(info.name).toBe('ResNet50_Transfer_Mock');
    expect(info.classCount).toBe(38);
    expect(info.metrics).toBeNull();
    expect(info.evaluationNote).toBeDefined();
  });
});
