import { describe, it, expect } from 'vitest';
import {
  mapCropsResponse,
  mapConditionSummary,
  mapConditionsResponse,
  mapConditionDetail,
} from '../../../src/features/catalog/mappers/catalogMapper.js';

const rawCondition = {
  classKey: 'Tomato___Early_blight',
  cropKey: 'Tomato',
  conditionKey: 'Early_blight',
  isHealthy: false,
  names: {
    es: { cropName: 'Tomate', conditionName: 'Tizón temprano' },
  },
  description: 'Enfermedad fúngica causada por Alternaria solani.',
  symptoms: ['Manchas necróticas circulares', 'Amarillamiento foliar'],
  management: {
    cultural: ['Rotación de cultivos', 'Eliminar restos vegetales'],
    biological: ['Aplicar Trichoderma harzianum'],
    chemical: ['Fungicidas cúpricos preventivos'],
  },
  reviewStatus: 'REVIEWED',        // Campo interno — filtrar
  reviewedBy: 'admin@agroguard',   // Campo interno — filtrar
  sources: ['FAO 2021'],           // Campo interno — filtrar
};

describe('Features/Catalog — catalogMapper (Lista blanca estricta)', () => {
  // --- mapCropsResponse ---
  describe('mapCropsResponse', () => {
    it('Mapea lista de cultivos con campos de lista blanca', () => {
      const result = mapCropsResponse([
        { cropKey: 'Tomato', cropName: 'Tomate', conditionsCount: 10, internalField: 'secreto' },
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].cropKey).toBe('Tomato');
      expect(result[0].cropName).toBe('Tomate');
      expect(result[0].conditionsCount).toBe(10);
      expect(result[0].internalField).toBeUndefined();
    });

    it('Devuelve [] ante entrada nula o no array', () => {
      expect(mapCropsResponse(null)).toEqual([]);
      expect(mapCropsResponse('no-array')).toEqual([]);
    });
  });

  // --- mapConditionSummary ---
  describe('mapConditionSummary', () => {
    it('Extrae campos de lista blanca y traduce nombres desde names.es', () => {
      const result = mapConditionSummary(rawCondition);

      expect(result.classKey).toBe('Tomato___Early_blight');
      expect(result.isHealthy).toBe(false);
      expect(result.cropName).toBe('Tomate');
      expect(result.conditionName).toBe('Tizón temprano');
      // Campos internos no deben aparecer
      expect(result.reviewStatus).toBeUndefined();
      expect(result.sources).toBeUndefined();
      expect(result.symptoms).toBeUndefined();
    });

    it('Lanza error si la condición es nula o inválida', () => {
      expect(() => mapConditionSummary(null)).toThrow();
    });
  });

  // --- mapConditionsResponse ---
  describe('mapConditionsResponse', () => {
    it('Filtra items sin classKey', () => {
      const result = mapConditionsResponse([rawCondition, { noKey: true }, null]);
      expect(result).toHaveLength(1);
    });

    it('Devuelve [] ante entrada no array', () => {
      expect(mapConditionsResponse(undefined)).toEqual([]);
    });
  });

  // --- mapConditionDetail ---
  describe('mapConditionDetail', () => {
    it('Mapea síntomas y secciones de manejo (lista blanca)', () => {
      const result = mapConditionDetail(rawCondition);

      expect(result.symptoms).toEqual(['Manchas necróticas circulares', 'Amarillamiento foliar']);
      expect(result.management.cultural).toEqual(['Rotación de cultivos', 'Eliminar restos vegetales']);
      expect(result.management.biological).toEqual(['Aplicar Trichoderma harzianum']);
      expect(result.management.chemical).toEqual(['Fungicidas cúpricos preventivos']);
      expect(result.description).toBe('Enfermedad fúngica causada por Alternaria solani.');
      // Campos internos no deben aparecer
      expect(result.reviewStatus).toBeUndefined();
      expect(result.reviewedBy).toBeUndefined();
      expect(result.sources).toBeUndefined();
    });

    it('Devuelve arrays vacíos si no hay síntomas ni manejo', () => {
      const result = mapConditionDetail({
        classKey: 'Tomato___healthy',
        cropKey: 'Tomato',
        conditionKey: 'healthy',
        isHealthy: true,
        names: { es: { cropName: 'Tomate', conditionName: 'Sana' } },
      });

      expect(result.symptoms).toEqual([]);
      expect(result.management.cultural).toEqual([]);
      expect(result.management.chemical).toEqual([]);
      expect(result.isHealthy).toBe(true);
    });

    it('Lanza error si el detalle es nulo o no objeto', () => {
      expect(() => mapConditionDetail(null)).toThrow();
      expect(() => mapConditionDetail('invalido')).toThrow();
    });
  });
});
