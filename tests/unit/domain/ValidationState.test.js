/**
 * Tests unitarios para el Value Object ValidationState
 */
import { describe, it, expect } from 'vitest';
import { ValidationState } from '../../../src/domain/value-objects/ValidationState.js';

describe('Domain — ValidationState Value Object', () => {
  it('crea ACEPTAR correctamente', () => {
    const vs = new ValidationState('ACEPTAR');
    expect(vs.value).toBe('ACEPTAR');
    expect(vs.isAccepted()).toBe(true);
    expect(vs.isRejected()).toBe(false);
    expect(vs.isReview()).toBe(false);
  });

  it('crea RECHAZAR correctamente', () => {
    const vs = new ValidationState('RECHAZAR');
    expect(vs.value).toBe('RECHAZAR');
    expect(vs.isAccepted()).toBe(false);
    expect(vs.isRejected()).toBe(true);
    expect(vs.isReview()).toBe(false);
  });

  it('crea REVISAR correctamente', () => {
    const vs = new ValidationState('REVISAR');
    expect(vs.value).toBe('REVISAR');
    expect(vs.isAccepted()).toBe(false);
    expect(vs.isRejected()).toBe(false);
    expect(vs.isReview()).toBe(true);
  });

  it('rechaza valores inválidos', () => {
    expect(() => new ValidationState('INVALID')).toThrow(/inválido/);
    expect(() => new ValidationState('')).toThrow(/inválido/);
    expect(() => new ValidationState('aceptar')).toThrow(/inválido/);
  });

  it('toString devuelve el valor', () => {
    expect(new ValidationState('ACEPTAR').toString()).toBe('ACEPTAR');
  });

  it('toJSON devuelve el valor', () => {
    const vs = new ValidationState('RECHAZAR');
    expect(JSON.parse(JSON.stringify(vs))).toBe('RECHAZAR');
  });

  it('equals compara correctamente', () => {
    const a = new ValidationState('ACEPTAR');
    const b = new ValidationState('ACEPTAR');
    const c = new ValidationState('RECHAZAR');
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
    expect(a.equals('ACEPTAR')).toBe(false);
  });

  it('es inmutable (frozen)', () => {
    const vs = new ValidationState('ACEPTAR');
    expect(Object.isFrozen(vs)).toBe(true);
  });

  it('constantes estáticas existen', () => {
    expect(ValidationState.ACEPTAR).toBe('ACEPTAR');
    expect(ValidationState.RECHAZAR).toBe('RECHAZAR');
    expect(ValidationState.REVISAR).toBe('REVISAR');
  });
});
