import { z } from 'zod';

// Expresión regular para nombres en español: solo letras, caracteres acentuados, ñ, diéresis y espacios
const SPANISH_NAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'El correo electrónico es requerido')
    .email('Ingresa un correo electrónico válido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida'),
});

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, 'El nombre completo es requerido')
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede exceder 100 caracteres')
      .regex(SPANISH_NAME_REGEX, 'El nombre solo puede contener letras y espacios'),
    email: z
      .string()
      .trim()
      .min(1, 'El correo electrónico es requerido')
      .email('Ingresa un correo electrónico válido'),
    password: z
      .string()
      .min(1, 'La contraseña es requerida')
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .max(128, 'La contraseña no puede exceder 128 caracteres'),
    confirmPassword: z
      .string()
      .min(1, 'Por favor confirma tu contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });
