import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../../src/presentation/http/app.js';
import { createContainer } from '../../src/main/container.js';
import { Condition, REVIEW_STATUS } from '../../src/domain/entities/Condition.js';
import { MongoConditionCatalogRepository } from '../../src/infrastructure/persistence/mongo/repositories/MongoConditionCatalogRepository.js';

describe('E2E — Catalog API (Public Endpoints)', () => {
  let mongoServer;
  let container;
  let app;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    container = createContainer();
    app = createApp(container);

    const catalogRepo = new MongoConditionCatalogRepository();
    await catalogRepo.save(
      new Condition({
        classKey: 'Tomato___Early_blight',
        cropKey: 'Tomato',
        conditionKey: 'Early_blight',
        isHealthy: false,
        names: { es: { cropName: 'Tomate', conditionName: 'Tizón temprano' } },
        description: 'Enfermedad fungosa.',
        symptoms: ['Manchas concéntricas'],
        management: { cultural: ['Rotación'], biological: [], chemical: [] },
        reviewStatus: REVIEW_STATUS.REVIEWED,
      })
    );

    await catalogRepo.save(
      new Condition({
        classKey: 'Tomato___healthy',
        cropKey: 'Tomato',
        conditionKey: 'healthy',
        isHealthy: true,
        names: { es: { cropName: 'Tomate', conditionName: 'Hoja sana' } },
        description: 'Tomate sano.',
      })
    );

    await catalogRepo.save(
      new Condition({
        classKey: 'Apple___healthy',
        cropKey: 'Apple',
        conditionKey: 'healthy',
        isHealthy: true,
        names: { es: { cropName: 'Manzana', conditionName: 'Hoja sana' } },
        description: 'Manzana sana.',
      })
    );
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('GET /api/v1/catalog/conditions debe listar condiciones públicas con soporte de filtros', async () => {
    const allRes = await request(app).get('/api/v1/catalog/conditions');
    expect(allRes.status).toBe(200);
    expect(allRes.body).toHaveLength(3);

    const tomatoRes = await request(app).get('/api/v1/catalog/conditions?cropKey=Tomato');
    expect(tomatoRes.status).toBe(200);
    expect(tomatoRes.body).toHaveLength(2);

    const healthyRes = await request(app).get('/api/v1/catalog/conditions?isHealthy=true');
    expect(healthyRes.status).toBe(200);
    expect(healthyRes.body).toHaveLength(2);
  });

  it('GET /api/v1/catalog/conditions/:classKey debe devolver el detalle de una condición', async () => {
    const res = await request(app).get('/api/v1/catalog/conditions/Tomato___Early_blight');
    expect(res.status).toBe(200);
    expect(res.body.classKey).toBe('Tomato___Early_blight');
    expect(res.body.names.es.cropName).toBe('Tomate');
    expect(res.body.management.cultural).toContain('Rotación');
  });

  it('GET /api/v1/catalog/conditions/:classKey con clave inexistente debe responder 404', async () => {
    const res = await request(app).get('/api/v1/catalog/conditions/Inexistente___Class');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('CONDITION_NOT_FOUND');
  });

  it('GET /api/v1/catalog/crops debe listar los cultivos soportados con conteos', async () => {
    const res = await request(app).get('/api/v1/catalog/crops');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);

    const tomato = res.body.find((c) => c.cropKey === 'Tomato');
    expect(tomato.cropName).toBe('Tomate');
    expect(tomato.conditionsCount).toBe(2);
  });
});
