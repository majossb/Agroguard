import { describe, it, expect, beforeEach } from 'vitest';
import { ListConditions } from '../../../src/application/use-cases/catalog/ListConditions.js';
import { GetCondition } from '../../../src/application/use-cases/catalog/GetCondition.js';
import { ListCrops } from '../../../src/application/use-cases/catalog/ListCrops.js';
import { FakeConditionCatalogRepository } from '../../fakes/FakeConditionCatalogRepository.js';
import { Condition, REVIEW_STATUS } from '../../../src/domain/entities/Condition.js';
import { NotFoundError } from '../../../src/domain/errors/DomainError.js';

describe('Application Use Cases — Catalog', () => {
  let conditionCatalogRepository;
  let listConditions;
  let getCondition;
  let listCrops;

  beforeEach(async () => {
    conditionCatalogRepository = new FakeConditionCatalogRepository();
    listConditions = new ListConditions({ conditionCatalogRepository });
    getCondition = new GetCondition({ conditionCatalogRepository });
    listCrops = new ListCrops({ conditionCatalogRepository });

    await conditionCatalogRepository.save(
      new Condition({
        classKey: 'Tomato___Early_blight',
        cropKey: 'Tomato',
        conditionKey: 'Early_blight',
        isHealthy: false,
        names: { es: { cropName: 'Tomate', conditionName: 'Tizón temprano' } },
        description: 'Tizón temprano en tomate.',
        symptoms: ['Manchas necróticas'],
        management: { cultural: ['Rotación'], biological: [], chemical: [] },
        reviewStatus: REVIEW_STATUS.REVIEWED,
      })
    );

    await conditionCatalogRepository.save(
      new Condition({
        classKey: 'Tomato___healthy',
        cropKey: 'Tomato',
        conditionKey: 'healthy',
        isHealthy: true,
        names: { es: { cropName: 'Tomate', conditionName: 'Hoja sana' } },
        description: 'Tomate sano.',
        symptoms: [],
        management: { cultural: [], biological: [], chemical: [] },
        reviewStatus: REVIEW_STATUS.REVIEWED,
      })
    );

    await conditionCatalogRepository.save(
      new Condition({
        classKey: 'Apple___Apple_scab',
        cropKey: 'Apple',
        conditionKey: 'Apple_scab',
        isHealthy: false,
        names: { es: { cropName: 'Manzana', conditionName: 'Sarna del manzano' } },
        description: 'Sarna del manzano.',
        symptoms: ['Lesiones oliváceas'],
        management: { cultural: [], biological: [], chemical: [] },
        reviewStatus: REVIEW_STATUS.PENDING_REVIEW,
      })
    );
  });

  describe('ListConditions', () => {
    it('Debe listar todas las condiciones del catálogo', async () => {
      const all = await listConditions.execute();
      expect(all).toHaveLength(3);
    });

    it('Debe filtrar por cultivo (cropKey)', async () => {
      const tomatoes = await listConditions.execute({ cropKey: 'Tomato' });
      expect(tomatoes).toHaveLength(2);
      expect(tomatoes.every((c) => c.cropKey === 'Tomato')).toBe(true);
    });

    it('Debe filtrar por estado de salud (isHealthy)', async () => {
      const healthy = await listConditions.execute({ isHealthy: true });
      expect(healthy).toHaveLength(1);
      expect(healthy[0].classKey).toBe('Tomato___healthy');
    });
  });

  describe('GetCondition', () => {
    it('Debe retornar el detalle de la condición si existe', async () => {
      const condition = await getCondition.execute('Tomato___Early_blight');
      expect(condition.classKey).toBe('Tomato___Early_blight');
      expect(condition.names.es.cropName).toBe('Tomate');
      expect(condition.management.cultural).toContain('Rotación');
    });

    it('Debe lanzar NotFoundError si la condición no existe', async () => {
      await expect(getCondition.execute('Inexistente___Class')).rejects.toThrow(NotFoundError);
    });
  });

  describe('ListCrops', () => {
    it('Debe listar los cultivos agrupados con la cantidad de condiciones de cada uno', async () => {
      const crops = await listCrops.execute();
      expect(crops).toHaveLength(2);

      const tomato = crops.find((c) => c.cropKey === 'Tomato');
      expect(tomato).toBeDefined();
      expect(tomato.cropName).toBe('Tomate');
      expect(tomato.conditionsCount).toBe(2);

      const apple = crops.find((c) => c.cropKey === 'Apple');
      expect(apple).toBeDefined();
      expect(apple.cropName).toBe('Manzana');
      expect(apple.conditionsCount).toBe(1);
    });
  });
});
