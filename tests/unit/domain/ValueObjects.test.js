import { describe, it, expect } from 'vitest';
import { Email } from '../../../src/domain/value-objects/Email.js';
import { Confidence } from '../../../src/domain/value-objects/Confidence.js';
import { HealthStatus, HEALTH_STATUS_VALUES } from '../../../src/domain/value-objects/HealthStatus.js';
import { ImageInfo } from '../../../src/domain/value-objects/ImageInfo.js';
import { ClassKey } from '../../../src/domain/value-objects/ClassKey.js';
import { ValidationError } from '../../../src/domain/errors/DomainError.js';

describe('Domain — Value Objects', () => {
  describe('Email', () => {
    it('Debe crear y normalizar a minúsculas un email válido', () => {
      const email = new Email('  Agricultor@AgroGuard.DEV  ');
      expect(email.value).toBe('agricultor@agroguard.dev');
      expect(email.toString()).toBe('agricultor@agroguard.dev');
      expect(Object.isFrozen(email)).toBe(true);
    });

    it('Debe comparar correctamente dos emails', () => {
      const email1 = new Email('test@agroguard.dev');
      const email2 = new Email('TEST@agroguard.dev');
      expect(email1.equals(email2)).toBe(true);
      expect(email1.equals('test@agroguard.dev')).toBe(true);
    });

    it('Debe lanzar ValidationError si el email tiene formato inválido', () => {
      expect(() => new Email('invalido')).toThrow(ValidationError);
      expect(() => new Email('')).toThrow(ValidationError);
      expect(() => new Email(null)).toThrow(ValidationError);
    });
  });

  describe('Confidence', () => {
    it('Debe aceptar valores en el rango [0, 1] y ser inmutable', () => {
      const conf = new Confidence(0.95432);
      expect(conf.value).toBe(0.95432);
      expect(conf.toRounded(2)).toBe(0.95);
      expect(Object.isFrozen(conf)).toBe(true);
    });

    it('Debe comparar con greaterThanOrEqual y lessThan', () => {
      const conf = new Confidence(0.75);
      expect(conf.greaterThanOrEqual(0.70)).toBe(true);
      expect(conf.greaterThanOrEqual(new Confidence(0.75))).toBe(true);
      expect(conf.lessThan(0.80)).toBe(true);
      expect(conf.lessThan(new Confidence(0.60))).toBe(false);
    });

    it('Debe rechazar valores fuera de rango [0, 1] o NaN', () => {
      expect(() => new Confidence(-0.01)).toThrow(ValidationError);
      expect(() => new Confidence(1.01)).toThrow(ValidationError);
      expect(() => new Confidence(NaN)).toThrow(ValidationError);
      expect(() => new Confidence('0.5')).toThrow(ValidationError);
    });
  });

  describe('HealthStatus', () => {
    it('Debe aceptar valores permitidos y proveer métodos de consulta', () => {
      const healthy = new HealthStatus(HEALTH_STATUS_VALUES.HEALTHY);
      expect(healthy.isHealthy()).toBe(true);
      expect(healthy.isDiseased()).toBe(false);
      expect(healthy.isInconclusive()).toBe(false);

      const diseased = new HealthStatus(HEALTH_STATUS_VALUES.DISEASED);
      expect(diseased.isDiseased()).toBe(true);

      const inconclusive = new HealthStatus(HEALTH_STATUS_VALUES.INCONCLUSIVE);
      expect(inconclusive.isInconclusive()).toBe(true);
    });

    it('Debe rechazar estados no reconocidos', () => {
      expect(() => new HealthStatus('UNKNOWN')).toThrow(ValidationError);
    });
  });

  describe('ImageInfo', () => {
    const validSha256 = 'a'.repeat(64);

    it('Debe crear un ImageInfo inmutable con metadatos válidos', () => {
      const info = new ImageInfo({
        storageKey: 'images/2026/09/uuid.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 102400,
        width: 1200,
        height: 900,
        sha256: validSha256,
      });

      expect(info.storageKey).toBe('images/2026/09/uuid.jpg');
      expect(info.mimeType).toBe('image/jpeg');
      expect(info.width).toBe(1200);
      expect(Object.isFrozen(info)).toBe(true);
    });

    it('Debe validar parámetros obligatorios', () => {
      expect(
        () =>
          new ImageInfo({
            storageKey: null,
            mimeType: 'text/plain',
            sizeBytes: 100,
            width: 100,
            height: 100,
            sha256: validSha256,
          })
      ).toThrow(ValidationError);

      expect(
        () =>
          new ImageInfo({
            storageKey: null,
            mimeType: 'image/jpeg',
            sizeBytes: -1,
            width: 100,
            height: 100,
            sha256: validSha256,
          })
      ).toThrow(ValidationError);

      expect(
        () =>
          new ImageInfo({
            storageKey: null,
            mimeType: 'image/jpeg',
            sizeBytes: 100,
            width: 100,
            height: 100,
            sha256: 'invalido',
          })
      ).toThrow(ValidationError);
    });
  });

  describe('ClassKey', () => {
    it('Debe crear un ClassKey inmutable y exponer campos derivados', () => {
      const ck = new ClassKey('Cherry_(including_sour)___healthy');
      expect(ck.cropKey).toBe('Cherry_(including_sour)');
      expect(ck.conditionKey).toBe('healthy');
      expect(ck.isHealthy).toBe(true);
      expect(ck.cropName).toBe('Cereza');
      expect(Object.isFrozen(ck)).toBe(true);
    });
  });
});
