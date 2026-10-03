import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { MongoDiagnosisRepository } from '../../../src/infrastructure/persistence/mongo/repositories/MongoDiagnosisRepository.js';
import { Diagnosis } from '../../../src/domain/entities/Diagnosis.js';
import { DiagnosisModel } from '../../../src/infrastructure/persistence/mongo/schemas/DiagnosisSchema.js';

describe('Integration — MongoDiagnosisRepository with MongoMemoryServer', () => {
  let mongoServer;
  let repository;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    repository = new MongoDiagnosisRepository();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await DiagnosisModel.deleteMany({});
  });

  it('Debe guardar y recuperar un diagnóstico por su ID', async () => {
    const diagnosis = new Diagnosis({
      id: 'diag-mongo-1',
      ownerId: 'user-1',
      image: {
        storageKey: 'images/2026/09/diag-1.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 2048,
        width: 1000,
        height: 1000,
        sha256: 'c'.repeat(64),
      },
      verdict: { healthStatus: 'DISEASED', confidence: 0.92, healthyProbability: 0.05 },
      prediction: {
        classKey: 'Potato___Early_blight',
        cropKey: 'Potato',
        conditionKey: 'Early_blight',
        cropName: 'Papa',
        conditionName: 'Tizón temprano',
      },
      topPredictions: [{ classKey: 'Potato___Early_blight', probability: 0.92 }],
      context: { plotName: 'Lote Papa' },
      model: { name: 'ResNet50', version: '1.0.0', provider: 'mock' },
      processingTimeMs: 150,
      createdAt: new Date('2026-09-20T10:00:00.000Z'),
    });

    await repository.save(diagnosis);

    const retrieved = await repository.findById('diag-mongo-1');
    expect(retrieved).not.toBeNull();
    expect(retrieved.id).toBe('diag-mongo-1');
    expect(retrieved.ownerId).toBe('user-1');
    expect(retrieved.verdict.healthStatus.value).toBe('DISEASED');
    expect(retrieved.prediction.cropName).toBe('Papa');
  });

  it('Debe listar diagnósticos de un usuario con paginación y filtros', async () => {
    for (let i = 1; i <= 5; i++) {
      await repository.save(
        new Diagnosis({
          id: `diag-user1-${i}`,
          ownerId: 'user-1',
          image: {
            storageKey: `images/2026/09/diag-${i}.jpg`,
            mimeType: 'image/jpeg',
            sizeBytes: 1000,
            width: 800,
            height: 600,
            sha256: 'd'.repeat(64),
          },
          verdict: {
            healthStatus: i % 2 === 0 ? 'HEALTHY' : 'DISEASED',
            confidence: 0.9,
            healthyProbability: 0.1,
          },
          prediction: {
            classKey: 'Tomato___Early_blight',
            cropKey: 'Tomato',
            conditionKey: 'Early_blight',
          },
          topPredictions: [{ classKey: 'Tomato___Early_blight', probability: 0.9 }],
          model: { name: 'ResNet50', version: '1.0.0', provider: 'mock' },
          processingTimeMs: 100,
          createdAt: new Date(`2026-09-20T1${i}:00:00.000Z`),
        })
      );
    }

    const paged = await repository.findByOwner('user-1', {}, { page: 1, pageSize: 3 });
    expect(paged.totalItems).toBe(5);
    expect(paged.totalPages).toBe(2);
    expect(paged.items).toHaveLength(3);

    const healthyOnly = await repository.findByOwner(
      'user-1',
      { healthStatus: 'HEALTHY' },
      { page: 1, pageSize: 10 }
    );
    expect(healthyOnly.totalItems).toBe(2);
  });

  it('Debe eliminar diagnósticos por ID y por OwnerId', async () => {
    await repository.save(
      new Diagnosis({
        id: 'diag-del-1',
        ownerId: 'user-del',
        image: {
          storageKey: 'img.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 100,
          width: 300,
          height: 300,
          sha256: 'e'.repeat(64),
        },
        verdict: { healthStatus: 'HEALTHY', confidence: 0.9, healthyProbability: 0.9 },
        prediction: { classKey: 'Apple___healthy', cropKey: 'Apple', conditionKey: 'healthy' },
        topPredictions: [{ classKey: 'Apple___healthy', probability: 0.9 }],
        model: { name: 'ResNet50', version: '1.0.0', provider: 'mock' },
        processingTimeMs: 50,
      })
    );

    const deletedCount = await repository.deleteByOwnerId('user-del');
    expect(deletedCount).toBe(1);

    const notFound = await repository.findById('diag-del-1');
    expect(notFound).toBeNull();
  });
});
