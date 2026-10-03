import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/presentation/http/app.js';
import { createContainer } from '../../src/main/container.js';

describe('E2E — Documentation & Swagger UI', () => {
  const container = createContainer();
  const app = createApp(container);

  it('GET /docs debe responder con la interfaz HTML de Swagger UI', async () => {
    const response = await request(app).get('/docs/');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/html/);
    expect(response.text).toContain('swagger-ui');
  });

  it('GET /docs/openapi.json debe devolver la especificación OpenAPI válida en JSON', async () => {
    const response = await request(app).get('/docs/openapi.json');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.openapi).toBe('3.1.0');
    expect(response.body.info.title).toBe('AgroGuard API');
    expect(response.body.paths['/diagnoses']).toBeDefined();
    expect(response.body.paths['/auth/login']).toBeDefined();
  });

  it('GET /docs/openapi.yaml debe devolver la especificación en formato texto YAML', async () => {
    const response = await request(app).get('/docs/openapi.yaml');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/yaml/);
    expect(response.text).toContain('openapi: 3.1.0');
    expect(response.text).toContain('title: AgroGuard API');
  });
});
