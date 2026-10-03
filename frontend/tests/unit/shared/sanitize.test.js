import { describe, it, expect } from 'vitest';
import { sanitizeReturnTo } from '../../../src/shared/lib/sanitize.js';

describe('Shared/Lib — sanitizeReturnTo (Prevención de Open Redirect)', () => {
  it('Permite rutas relativas internas válidas', () => {
    expect(sanitizeReturnTo('/escanear')).toBe('/escanear');
    expect(sanitizeReturnTo('/diagnosticos?page=2')).toBe('/diagnosticos?page=2');
    expect(sanitizeReturnTo('/cuenta')).toBe('/cuenta');
  });

  it('Rechaza valores vacíos, nulos o no strings retornando fallback', () => {
    expect(sanitizeReturnTo(null)).toBe('/');
    expect(sanitizeReturnTo(undefined)).toBe('/');
    expect(sanitizeReturnTo('')).toBe('/');
    expect(sanitizeReturnTo(123, '/custom')).toBe('/custom');
  });

  it('Bloquea URLs absolutas con esquema (http://, https://, javascript:)', () => {
    expect(sanitizeReturnTo('https://evil.com')).toBe('/');
    expect(sanitizeReturnTo('http://malicious.org/escanear')).toBe('/');
    expect(sanitizeReturnTo('javascript:alert(1)')).toBe('/');
  });

  it('Bloquea URLs relativas al protocolo (//evil.com)', () => {
    expect(sanitizeReturnTo('//evil.com')).toBe('/');
    expect(sanitizeReturnTo('/\\evil.com')).toBe('/');
  });
});
