import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../../src/presentation/http/app.js';
import { createContainer } from '../../src/main/container.js';

describe('E2E — Health Check & Infrastructure Smoke Test', () => {
  let mongoServer;
  let container;
  let app;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    container = createContainer();
    app = createApp(container);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('GET /api/v1/health debe responder 200 con estado UP y timestamp', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.headers['x-request-id']).toBeDefined();
    expect(response.body).toMatchObject({
      status: 'UP',
      service: 'agroguard-backend',
      version: '1.0.0',
    });
    expect(response.body.timestamp).toBeDefined();
    expect(response.body.checks).toBeDefined();
    expect(response.body.checks.database).toBe('connected');
  });

  it('Ruta inexistente debe responder 404 con formato RFC 9457 application/problem+json', async () => {
    const response = await request(app).get('/api/v1/non-existent-route');

    expect(response.status).toBe(404);
    expect(response.headers['content-type']).toMatch(/problem\+json/);
    expect(response.headers['x-request-id']).toBeDefined();
    expect(response.body).toMatchObject({
      type: 'https://agroguard.dev/errors/not-found',
      title: 'Recurso no encontrado',
      status: 404,
      code: 'NOT_FOUND',
    });
    expect(response.body.detail).toContain('no existe en el servidor');
    expect(response.body.traceId).toBeDefined();
  });
});
