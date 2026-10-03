import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/presentation/http/app.js';
import { createContainer } from '../../src/main/container.js';

describe('E2E — Model API', () => {
  const container = createContainer();
  const app = createApp(container);

  it('GET /api/v1/model/info debe responder 200 con metadatos técnicos y metrics: null', async () => {
    const response = await request(app).get('/api/v1/model/info');

    expect(response.status).toBe(200);
    expect(response.body.name).toBeDefined();
    expect(response.body.version).toBeDefined();
    expect(response.body.classCount).toBe(38);
    expect(response.body.metrics).toBeNull();
    expect(response.body.evaluationNote).toBe(
      'Métricas pendientes de verificación con una evaluación reproducible'
    );
  });
});
