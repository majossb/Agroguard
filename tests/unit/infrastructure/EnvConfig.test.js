import { describe, it, expect } from 'vitest';
import { loadConfig } from '../../../src/infrastructure/config/env.js';

describe('Infrastructure — Env Config & Safe Startup Guards', () => {
  const baseValidEnv = {
    PORT: '3000',
    NODE_ENV: 'development',
    MONGO_URI: 'mongodb://localhost:27017/agroguard_test',
    JWT_ACCESS_SECRET: 'una_clave_secreta_para_jwt_super_segura_123456789',
    INFERENCE_DRIVER: 'mock',
  };

  it('Debe cargar la configuración correctamente con valores por defecto', () => {
    const config = loadConfig(baseValidEnv);
    expect(config.PORT).toBe(3000);
    expect(config.MIN_CONFIDENCE).toBe(0.6);
    expect(config.MAX_INPUT_PIXELS).toBe(40000000);
    expect(config.CORS_ORIGINS).toContain('http://localhost:5173');
  });

  it('Guardia de Producción: Debe fallar en NODE_ENV=production si INFERENCE_DRIVER=mock sin ALLOW_MOCK_IN_PRODUCTION=true', () => {
    const prodMockEnv = {
      ...baseValidEnv,
      NODE_ENV: 'production',
      INFERENCE_DRIVER: 'mock',
      ALLOW_MOCK_IN_PRODUCTION: 'false',
    };

    expect(() => loadConfig(prodMockEnv)).toThrowError(
      /No está permitido usar INFERENCE_DRIVER=mock en producción/
    );
  });

  it('Guardia de Producción: Debe permitir mock en production solo si ALLOW_MOCK_IN_PRODUCTION=true explícito', () => {
    const prodMockAllowedEnv = {
      ...baseValidEnv,
      NODE_ENV: 'production',
      INFERENCE_DRIVER: 'mock',
      ALLOW_MOCK_IN_PRODUCTION: 'true',
    };

    expect(() => loadConfig(prodMockAllowedEnv)).not.toThrow();
  });

  it('Debe validar que MIN_CONFIDENCE esté en el rango [0.5, 1.0]', () => {
    expect(() =>
      loadConfig({ ...baseValidEnv, MIN_CONFIDENCE: '0.4' })
    ).toThrowError(/MIN_CONFIDENCE/);

    expect(() =>
      loadConfig({ ...baseValidEnv, MIN_CONFIDENCE: '1.2' })
    ).toThrowError(/MIN_CONFIDENCE/);
  });
});
