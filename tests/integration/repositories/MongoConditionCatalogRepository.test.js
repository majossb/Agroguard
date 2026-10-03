import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { MongoConditionCatalogRepository } from '../../../src/infrastructure/persistence/mongo/repositories/MongoConditionCatalogRepository.js';
import { Condition, REVIEW_STATUS } from '../../../src/domain/entities/Condition.js';
import { ConditionModel } from '../../../src/infrastructure/persistence/mongo/schemas/ConditionSchema.js';

describe('Integration — MongoConditionCatalogRepository with MongoMemoryServer', () => {
  let mongoServer;
  let repository;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    repository = new MongoConditionCatalogRepository();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await ConditionModel.deleteMany({});
  });

  it('Debe guardar y consultar condiciones en MongoDB', async () => {
    const condition = new Condition({
      classKey: 'Corn_(maize)___Common_rust_',
      cropKey: 'Corn_(maize)',
      conditionKey: 'Common_rust_',
      isHealthy: false,
      names: { es: { cropName: 'Maíz', conditionName: 'Roya común' } },
      description: 'Roya común del maíz.',
      symptoms: ['Pústulas de color canela a marrón rojizo'],
      management: { cultural: ['Uso de híbridos resistentes'], biological: [], chemical: [] },
      reviewStatus: REVIEW_STATUS.REVIEWED,
    });

    await repository.save(condition);

    const byKey = await repository.findByClassKey('Corn_(maize)___Common_rust_');
    expect(byKey).not.toBeNull();
    expect(byKey.cropKey).toBe('Corn_(maize)');
    expect(byKey.names.es.cropName).toBe('Maíz');
    expect(byKey.management.cultural).toContain('Uso de híbridos resistentes');
  });

  it('Debe agrupar y calcular estadísticas de cultivos con findCrops()', async () => {
    await repository.save(
      new Condition({
        classKey: 'Tomato___Early_blight',
        cropKey: 'Tomato',
        conditionKey: 'Early_blight',
        isHealthy: false,
        names: { es: { cropName: 'Tomate', conditionName: 'Tizón temprano' } },
      })
    );
    await repository.save(
      new Condition({
        classKey: 'Tomato___healthy',
        cropKey: 'Tomato',
        conditionKey: 'healthy',
        isHealthy: true,
        names: { es: { cropName: 'Tomate', conditionName: 'Hoja sana' } },
      })
    );
    await repository.save(
      new Condition({
        classKey: 'Apple___healthy',
        cropKey: 'Apple',
        conditionKey: 'healthy',
        isHealthy: true,
        names: { es: { cropName: 'Manzana', conditionName: 'Hoja sana' } },
      })
    );

    const crops = await repository.findCrops();
    expect(crops).toHaveLength(2);

    const tomato = crops.find((c) => c.cropKey === 'Tomato');
    expect(tomato.cropName).toBe('Tomate');
    expect(tomato.conditionsCount).toBe(2);

    const apple = crops.find((c) => c.cropKey === 'Apple');
    expect(apple.cropName).toBe('Manzana');
    expect(apple.conditionsCount).toBe(1);
  });
});
