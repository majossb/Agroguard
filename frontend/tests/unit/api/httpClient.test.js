import { describe, it, expect, beforeEach, vi } from 'vitest';
import { httpClient, ApiError, setRefreshHandler } from '../../../src/shared/api/httpClient.js';
import { tokenStorage } from '../../../src/shared/api/tokenStorage.js';
import { server } from '../../mocks/server.js';
import { http, HttpResponse } from 'msw';

describe('Shared/API — httpClient y tokenStorage', () => {
  beforeEach(() => {
    tokenStorage.clearAccessToken();
    setRefreshHandler(null);
  });

  it('tokenStorage mantiene el token estrictamente en memoria y no en localStorage', () => {
    tokenStorage.setAccessToken('mi-secreto-jwt-en-memoria');
    expect(tokenStorage.getAccessToken()).toBe('mi-secreto-jwt-en-memoria');

    // Comprobar que NUNCA toca localStorage ni sessionStorage
    expect(window.localStorage.getItem('accessToken')).toBeNull();
    expect(window.localStorage.getItem('token')).toBeNull();
    expect(window.sessionStorage.getItem('accessToken')).toBeNull();

    tokenStorage.clearAccessToken();
    expect(tokenStorage.getAccessToken()).toBeNull();
  });

  it('Adjunta cabecera Authorization: Bearer cuando hay token en memoria', async () => {
    tokenStorage.setAccessToken('bearer-token-123');
    let capturedAuth = null;

    server.use(
      http.get('/api/v1/test-auth', ({ request }) => {
        capturedAuth = request.headers.get('Authorization');
        return HttpResponse.json({ ok: true });
      })
    );

    const res = await httpClient('/test-auth');
    expect(res).toEqual({ ok: true });
    expect(capturedAuth).toBe('Bearer bearer-token-123');
  });

  it('Convierte respuestas RFC 9457 application/problem+json en instancias ApiError con código y detalle', async () => {
    server.use(
      http.get('/api/v1/test-error', () => {
        return HttpResponse.json(
          {
            type: 'https://agroguard.dev/errors/validation-error',
            status: 400,
            code: 'VALIDATION_ERROR',
            detail: 'Parámetros no válidos para el cultivo.',
            traceId: 'trace-abc-123',
            errors: [{ field: 'cropHint', message: 'Cultivo inválido' }],
          },
          {
            status: 400,
            headers: { 'Content-Type': 'application/problem+json' },
          }
        );
      })
    );

    await expect(httpClient('/test-error')).rejects.toThrow(ApiError);

    try {
      await httpClient('/test-error');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.status).toBe(400);
      expect(err.code).toBe('VALIDATION_ERROR');
      expect(err.detail).toBe('Parámetros no válidos para el cultivo.');
      expect(err.traceId).toBe('trace-abc-123');
      expect(err.errors).toHaveLength(1);
    }
  });

  it('Maneja 503 INFERENCE_UNAVAILABLE con mensaje amigable', async () => {
    server.use(
      http.post('/api/v1/diagnoses-down', () => {
        return HttpResponse.json(
          {
            status: 503,
            code: 'INFERENCE_UNAVAILABLE',
            detail: 'El servicio de inferencia no está disponible temporalmente.',
          },
          { status: 503 }
        );
      })
    );

    try {
      await httpClient('/diagnoses-down', { method: 'POST' });
      expect.fail('Debería haber lanzado ApiError');
    } catch (err) {
      expect(err.status).toBe(503);
      expect(err.code).toBe('INFERENCE_UNAVAILABLE');
    }
  });

  it('Ejecuta single-flight refresh y reintenta la petición original ante un 401', async () => {
    tokenStorage.setAccessToken('token-vencido');
    let attempts = 0;

    const mockRefresh = vi.fn().mockImplementation(async () => {
      tokenStorage.setAccessToken('token-nuevo-renovado');
      return 'token-nuevo-renovado';
    });

    setRefreshHandler(mockRefresh);

    server.use(
      http.get('/api/v1/protected-data', ({ request }) => {
        attempts++;
        const auth = request.headers.get('Authorization');
        if (auth === 'Bearer token-vencido') {
          return HttpResponse.json({ code: 'TOKEN_EXPIRED' }, { status: 401 });
        }
        return HttpResponse.json({ success: true, authReceived: auth });
      })
    );

    const data = await httpClient('/protected-data');
    expect(attempts).toBe(2);
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(data.success).toBe(true);
    expect(data.authReceived).toBe('Bearer token-nuevo-renovado');
  });
});
