import { describe, it, expect } from 'vitest';
import { ClassKeyParser } from '../../../src/domain/services/ClassKeyParser.js';
import { ValidationError } from '../../../src/domain/errors/DomainError.js';

describe('Domain Service — ClassKeyParser', () => {
  it('Debe parsear correctamente una clase estándar', () => {
    const result = ClassKeyParser.parse('Tomato___Early_blight');

    expect(result.cropKey).toBe('Tomato');
    expect(result.conditionKey).toBe('Early_blight');
    expect(result.isHealthy).toBe(false);
    expect(result.cropName).toBe('Tomate');
    expect(result.conditionName).toContain('Tizón temprano');
  });

  it('Debe identificar correctamente una clase de hoja sana', () => {
    const result = ClassKeyParser.parse('Apple___healthy');

    expect(result.cropKey).toBe('Apple');
    expect(result.conditionKey).toBe('healthy');
    expect(result.isHealthy).toBe(true);
    expect(result.cropName).toBe('Manzana');
    expect(result.conditionName).toBe('Hoja sana');
  });

  it('Debe manejar irregularidades en nombres de cultivo (paréntesis, comas)', () => {
    const cherry = ClassKeyParser.parse('Cherry_(including_sour)___Powdery_mildew');
    expect(cherry.cropKey).toBe('Cherry_(including_sour)');
    expect(cherry.cropName).toBe('Cereza');

    const pepper = ClassKeyParser.parse('Pepper,_bell___Bacterial_spot');
    expect(pepper.cropKey).toBe('Pepper,_bell');
    expect(pepper.cropName).toContain('Pimiento');

    const corn = ClassKeyParser.parse('Corn_(maize)___Common_rust_');
    expect(corn.cropKey).toBe('Corn_(maize)');
    expect(corn.cropName).toBe('Maíz');
  });

  it('Debe manejar irregularidades en nombres de condición (espacios, guiones bajos finales)', () => {
    const mites = ClassKeyParser.parse('Tomato___Spider_mites Two-spotted_spider_mite');
    expect(mites.conditionKey).toBe('Spider_mites Two-spotted_spider_mite');
    expect(mites.conditionName).toContain('Araña roja');

    const grayLeaf = ClassKeyParser.parse('Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot');
    expect(grayLeaf.conditionKey).toBe('Cercospora_leaf_spot Gray_leaf_spot');
    expect(grayLeaf.conditionName).toContain('Cercospora');
  });

  it('Debe lanzar ValidationError si el formato no contiene ___', () => {
    expect(() => ClassKeyParser.parse('Tomato_Early_blight')).toThrow(ValidationError);
    expect(() => ClassKeyParser.parse('')).toThrow(ValidationError);
    expect(() => ClassKeyParser.parse(null)).toThrow(ValidationError);
  });

  it('Debe lanzar ValidationError si falta el cultivo o la condición', () => {
    expect(() => ClassKeyParser.parse('___Early_blight')).toThrow(ValidationError);
    expect(() => ClassKeyParser.parse('Tomato___')).toThrow(ValidationError);
  });
});
