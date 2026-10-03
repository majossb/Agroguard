import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import sharp from 'sharp';
import { createApp } from '../../src/presentation/http/app.js';
import { createContainer } from '../../src/main/container.js';
import { UserModel } from '../../src/infrastructure/persistence/mongo/schemas/UserSchema.js';
import { DiagnosisModel } from '../../src/infrastructure/persistence/mongo/schemas/DiagnosisSchema.js';
import { FeedbackModel } from '../../src/infrastructure/persistence/mongo/schemas/FeedbackSchema.js';
import { Condition, REVIEW_STATUS } from '../../src/domain/entities/Condition.js';

import { MongoConditionCatalogRepository } from '../../src/infrastructure/persistence/mongo/repositories/MongoConditionCatalogRepository.js';

describe('E2E — Diagnoses API (Full Lifecycle & Authorization)', () => {
  let mongoServer;
  let container;
  let app;

  let tokenUser1;
  let tokenUser2;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    container = createContainer();
    app = createApp(container);

    // Sembrar catálogo de prueba
    const catalogRepo = new MongoConditionCatalogRepository();
    await catalogRepo.save(
      new Condition({
        classKey: 'Tomato___Early_blight',
        cropKey: 'Tomato',
        conditionKey: 'Early_blight',
        isHealthy: false,
        names: { es: { cropName: 'Tomate', conditionName: 'Tizón temprano' } },
        description: 'Enfermedad fungosa común en tomate.',
        symptoms: ['Manchas concéntricas'],
        management: { cultural: ['Rotación'], biological: [], chemical: [] },
        reviewStatus: REVIEW_STATUS.REVIEWED,
      })
    );
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await UserModel.deleteMany({});
    await DiagnosisModel.deleteMany({});
    await FeedbackModel.deleteMany({});

    // Registrar Usuario 1
    const res1 = await request(app).post('/api/v1/auth/register').send({
      email: 'user1@agroguard.dev',
      password: 'passwordSeguro1!',
      fullName: 'Agricultor Uno',
    });
    tokenUser1 = res1.body.accessToken;

    // Registrar Usuario 2
    const res2 = await request(app).post('/api/v1/auth/register').send({
      email: 'user2@agroguard.dev',
      password: 'passwordSeguro2!',
      fullName: 'Agricultor Dos',
    });
    tokenUser2 = res2.body.accessToken;
  });

  const generateValidImage = () =>
    sharp({
      create: {
        width: 600,
        height: 600,
        channels: 3,
        background: { r: 30, g: 120, b: 30 },
      },
    })
      .jpeg()
      .toBuffer();

  it('Flujo completo autenticado: Crear diagnóstico, listar historial, ver detalle, actualizar notas, dar feedback y descargar imagen', async () => {
    const imageBuffer = await generateValidImage();

    // 1. Crear diagnóstico autenticado
    const createRes = await request(app)
      .post('/api/v1/diagnoses')
      .set('Authorization', `Bearer ${tokenUser1}`)
      .attach('image', imageBuffer, 'hoja_tomate.jpg')
      .field('plotName', 'Parcela 1')
      .field('notes', 'Primeras manchas');

    expect(createRes.status).toBe(201);
    expect(createRes.body.persisted).toBe(true);
    expect(createRes.body.id).toBeDefined();
    expect(createRes.body.image.url).toContain(`/api/v1/diagnoses/${createRes.body.id}/image`);
    const diagnosisId = createRes.body.id;

    // 2. Listar historial
    const listRes = await request(app)
      .get('/api/v1/diagnoses?page=1&pageSize=10')
      .set('Authorization', `Bearer ${tokenUser1}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.totalItems).toBe(1);
    expect(listRes.body.items[0].id).toBe(diagnosisId);

    // 3. Obtener detalle por ID
    const getRes = await request(app)
      .get(`/api/v1/diagnoses/${diagnosisId}`)
      .set('Authorization', `Bearer ${tokenUser1}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.id).toBe(diagnosisId);
    expect(getRes.body.verdict).toBeDefined();

    // 4. Actualizar notas y nombre de lote
    const patchRes = await request(app)
      .patch(`/api/v1/diagnoses/${diagnosisId}`)
      .set('Authorization', `Bearer ${tokenUser1}`)
      .send({
        plotName: 'Parcela 1 Modificada',
        notes: 'Síntomas avanzados',
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.plotName).toBe('Parcela 1 Modificada');
    expect(patchRes.body.notes).toBe('Síntomas avanzados');

    // 5. Descargar imagen del diagnóstico
    const imageRes = await request(app)
      .get(`/api/v1/diagnoses/${diagnosisId}/image`)
      .set('Authorization', `Bearer ${tokenUser1}`);

    expect(imageRes.status).toBe(200);
    expect(imageRes.headers['content-type']).toBe('image/jpeg');
    expect(imageRes.body.length).toBeGreaterThan(0);

    // 6. Enviar feedback sobre la corrección
    const feedbackRes = await request(app)
      .post(`/api/v1/diagnoses/${diagnosisId}/feedback`)
      .set('Authorization', `Bearer ${tokenUser1}`)
      .send({
        wasCorrect: true,
        comment: 'Efectivamente era tizón temprano',
      });

    expect(feedbackRes.status).toBe(201);
    expect(feedbackRes.body.wasCorrect).toBe(true);

    // 7. Borrar diagnóstico
    const deleteRes = await request(app)
      .delete(`/api/v1/diagnoses/${diagnosisId}`)
      .set('Authorization', `Bearer ${tokenUser1}`);

    expect(deleteRes.status).toBe(204);

    // Verificar que ya no existe (404)
    const afterDeleteRes = await request(app)
      .get(`/api/v1/diagnoses/${diagnosisId}`)
      .set('Authorization', `Bearer ${tokenUser1}`);

    expect(afterDeleteRes.status).toBe(404);
  });

  it('Reglas de Autorización: Un usuario NO puede acceder ni modificar diagnósticos de otro usuario (responde 404)', async () => {
    const imageBuffer = await generateValidImage();

    // Usuario 1 crea un diagnóstico
    const createRes = await request(app)
      .post('/api/v1/diagnoses')
      .set('Authorization', `Bearer ${tokenUser1}`)
      .attach('image', imageBuffer, 'hoja_privada.jpg');

    const diagIdUser1 = createRes.body.id;

    // Usuario 2 intenta consultar el diagnóstico de Usuario 1 -> DEBE responder 404 (no 403)
    const getRes = await request(app)
      .get(`/api/v1/diagnoses/${diagIdUser1}`)
      .set('Authorization', `Bearer ${tokenUser2}`);

    expect(getRes.status).toBe(404);
    expect(getRes.body.code).toBe('DIAGNOSIS_NOT_FOUND');

    // Usuario 2 intenta actualizar notas de Usuario 1 -> DEBE responder 404
    const patchRes = await request(app)
      .patch(`/api/v1/diagnoses/${diagIdUser1}`)
      .set('Authorization', `Bearer ${tokenUser2}`)
      .send({ notes: 'Ataque de usurpación' });

    expect(patchRes.status).toBe(404);

    // Usuario 2 intenta borrar diagnóstico de Usuario 1 -> DEBE responder 404
    const deleteRes = await request(app)
      .delete(`/api/v1/diagnoses/${diagIdUser1}`)
      .set('Authorization', `Bearer ${tokenUser2}`);

    expect(deleteRes.status).toBe(404);

    // Usuario 2 intenta descargar imagen de Usuario 1 -> DEBE responder 404
    const imageRes = await request(app)
      .get(`/api/v1/diagnoses/${diagIdUser1}/image`)
      .set('Authorization', `Bearer ${tokenUser2}`);

    expect(imageRes.status).toBe(404);

    // Usuario 2 intenta enviar feedback al diagnóstico de Usuario 1 -> DEBE responder 404
    const feedbackRes = await request(app)
      .post(`/api/v1/diagnoses/${diagIdUser1}/feedback`)
      .set('Authorization', `Bearer ${tokenUser2}`)
      .send({ wasCorrect: false });

    expect(feedbackRes.status).toBe(404);
  });
});
