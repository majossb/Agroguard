import { describe, it, expect, vi } from 'vitest';
import { HttpInferenceEngine } from '../../../src/infrastructure/inference/HttpInferenceEngine.js';
import {
  InferenceUnavailableError,
  InvalidInferenceResultError,
  InvalidImageError,
} from '../../../src/domain/errors/DomainError.js';

describe('Infrastructure — HttpInferenceEngine', () => {
  const dummyImage = {
    buffer: Buffer.from('fake-jpeg-bytes'),
    mimeType: 'image/jpeg',
  };

  it('Debe enviar la imagen mediante multipart/form-data y procesar la respuesta exitosa', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        modelName: 'FastAPI_ResNet50',
        modelVersion: '2.1.0',
        provider: 'fastapi',
        probabilities: [
          { classKey: 'Tomato___Early_blight', probability: 0.95 },
          { classKey: 'Tomato___healthy', probability: 0.05 },
        ],
        inferenceTimeMs: 85,
        explanation: null,
      }),
    });

    const engine = new HttpInferenceEngine({
      url: 'http://localhost:8000',
      fetchFn: mockFetch,
    });

    const result = await engine.predict(dummyImage);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.modelName).toBe('FastAPI_ResNet50');
    expect(result.probabilities).toHaveLength(2);
    expect(result.probabilities[0].classKey).toBe('Tomato___Early_blight');
  });

  it('Debe inyectar la cabecera X-API-Key si se configura apiKey', async () => {
    let capturedHeaders = null;
    const mockFetch = vi.fn().mockImplementation(async (url, options) => {
      capturedHeaders = options.headers;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          modelName: 'RemoteModel',
          modelVersion: '1.0.0',
          provider: 'http',
          probabilities: [{ classKey: 'Apple___healthy', probability: 1.0 }],
          inferenceTimeMs: 40,
        }),
      };
    });

    const engine = new HttpInferenceEngine({
      url: 'http://localhost:8000',
      apiKey: 'mi_clave_secreta_de_inferencia',
      fetchFn: mockFetch,
    });

    await engine.predict(dummyImage);
    expect(capturedHeaders['X-API-Key']).toBe('mi_clave_secreta_de_inferencia');
  });

  it('Debe reintentar ante fallos transitorios (HTTP 503) y tener éxito si se recupera', async () => {
    let callCount = 0;
    const mockFetch = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return { ok: false, status: 503, statusText: 'Service Unavailable' };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          modelName: 'RemoteModel',
          probabilities: [{ classKey: 'Apple___healthy', probability: 1.0 }],
        }),
      };
    });

    const engine = new HttpInferenceEngine({
      url: 'http://localhost:8000',
      retries: 2,
      fetchFn: mockFetch,
    });

    const result = await engine.predict(dummyImage);

    expect(callCount).toBe(2);
    expect(result.probabilities).toHaveLength(1);
  });

  it('Debe lanzar InferenceUnavailableError si se agotan todos los reintentos', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

    const engine = new HttpInferenceEngine({
      url: 'http://localhost:8000',
      retries: 1,
      fetchFn: mockFetch,
    });

    await expect(engine.predict(dummyImage)).rejects.toThrow(InferenceUnavailableError);
    expect(mockFetch).toHaveBeenCalledTimes(2); // Intento 1 + 1 reintento
  });

  it('Debe lanzar InvalidImageError si el servicio remoto responde 415 o 422', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 415,
      json: async () => ({ detail: 'Formato de imagen no soportado por el modelo' }),
    });

    const engine = new HttpInferenceEngine({
      url: 'http://localhost:8000',
      fetchFn: mockFetch,
    });

    await expect(engine.predict(dummyImage)).rejects.toThrow(InvalidImageError);
  });

  it('Debe lanzar InvalidInferenceResultError si la respuesta no contiene probabilities', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ model: 'bad-response', sinProbabilidades: true }),
    });

    const engine = new HttpInferenceEngine({
      url: 'http://localhost:8000',
      fetchFn: mockFetch,
    });

    await expect(engine.predict(dummyImage)).rejects.toThrow(InvalidInferenceResultError);
  });

  it('Debe consultar info() y reportar isReady()', async () => {
    const mockFetch = vi.fn().mockImplementation(async (url) => {
      if (url.endsWith('/health')) {
        return { ok: true, status: 200 };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          name: 'Remote_TorchServe_ResNet',
          version: '1.2.0',
          inputSize: 224,
          classCount: 38,
          dataset: 'PlantVillage',
          metrics: null,
          evaluationNote: 'Métricas pendientes',
        }),
      };
    });

    const engine = new HttpInferenceEngine({
      url: 'http://localhost:8000',
      fetchFn: mockFetch,
    });

    expect(await engine.isReady()).toBe(true);
    const info = await engine.info();
    expect(info.name).toBe('Remote_TorchServe_ResNet');
    expect(info.metrics).toBeNull();
  });
});
