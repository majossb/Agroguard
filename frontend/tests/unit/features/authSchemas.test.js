import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema } from '../../../src/features/auth/validators/authSchemas.js';

describe('Features/Auth — authSchemas (Validaciones de formulario)', () => {
  describe('loginSchema', () => {
    it('Acepta credenciales válidas', () => {
      const result = loginSchema.safeParse({
        email: 'juan.perez@agroguard.dev',
        password: 'Password123!',
      });
      expect(result.success).toBe(true);
    });

    it('Rechaza correo vacío o con formato inválido', () => {
      expect(loginSchema.safeParse({ email: '', password: 'Password123!' }).success).toBe(false);
      expect(loginSchema.safeParse({ email: 'correo-invalido', password: 'Password123!' }).success).toBe(false);
    });

    it('Rechaza contraseña vacía', () => {
      expect(loginSchema.safeParse({ email: 'juan.perez@agroguard.dev', password: '' }).success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('Permite nombres con letras, acentos en español (á, é, í, ó, ú, ü, ñ) y espacios', () => {
      const validCases = [
        'María José',
        'Juan Pérez',
        'Ángel de la Peña',
        'Inés Müller',
      ];

      for (const name of validCases) {
        const result = registerSchema.safeParse({
          fullName: name,
          email: 'test@agroguard.dev',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        });
        expect(result.success).toBe(true);
      }
    });

    it('Rechaza nombres que contienen números ("12345", "Juan2")', () => {
      const invalidCases = ['12345', 'Juan2', 'María 123'];

      for (const name of invalidCases) {
        const result = registerSchema.safeParse({
          fullName: name,
          email: 'test@agroguard.dev',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors.some((e) => e.message.includes('solo puede contener letras'))).toBe(true);
        }
      }
    });

    it('Rechaza nombres que contienen símbolos inválidos ("Maria@Jose", "Pedro#")', () => {
      const invalidSymbols = ['Maria@Jose', 'Pedro#', 'Juan_Perez'];

      for (const name of invalidSymbols) {
        const result = registerSchema.safeParse({
          fullName: name,
          email: 'test@agroguard.dev',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        });
        expect(result.success).toBe(false);
      }
    });

    it('Rechaza contraseñas menores a 8 caracteres', () => {
      const result = registerSchema.safeParse({
        fullName: 'María José',
        email: 'test@agroguard.dev',
        password: '1234567',
        confirmPassword: '1234567',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some((e) => e.message.includes('al menos 8 caracteres'))).toBe(true);
      }
    });

    it('Rechaza cuando las contraseñas no coinciden', () => {
      const result = registerSchema.safeParse({
        fullName: 'María José',
        email: 'test@agroguard.dev',
        password: 'Password123!',
        confirmPassword: 'DifferentPassword123!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some((e) => e.message.includes('Las contraseñas no coinciden'))).toBe(true);
      }
    });
  });
});
