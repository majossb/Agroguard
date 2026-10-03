import { z } from 'zod';

export const createDiagnosisSchema = z.object({
  plotName: z
    .string()
    .trim()
    .max(100, 'El nombre del lote no puede exceder 100 caracteres')
    .optional(),
  cropHint: z
    .string()
    .trim()
    .max(100, 'La sugerencia de cultivo no puede exceder 100 caracteres')
    .optional(),
  notes: z
    .string()
    .trim()
    .max(500, 'Las notas no pueden exceder 500 caracteres')
    .optional(),
});

export const updateDiagnosisNotesSchema = z.object({
  plotName: z
    .string()
    .trim()
    .max(100, 'El nombre del lote no puede exceder 100 caracteres')
    .optional(),
  notes: z
    .string()
    .trim()
    .max(500, 'Las notas no pueden exceder 500 caracteres')
    .optional(),
});

export const listDiagnosesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  healthStatus: z.enum(['HEALTHY', 'DISEASED', 'INCONCLUSIVE']).optional(),
  cropKey: z.string().trim().optional(),
  from: z.string().datetime({ message: 'El parámetro "from" debe ser una fecha ISO 8601 válida' }).optional(),
  to: z.string().datetime({ message: 'El parámetro "to" debe ser una fecha ISO 8601 válida' }).optional(),
});

export const submitFeedbackSchema = z.object({
  wasCorrect: z.boolean({
    required_error: 'Debe indicar si el diagnóstico fue correcto (wasCorrect: true|false)',
  }),
  correctClassKey: z.string().trim().optional().nullable(),
  comment: z
    .string()
    .trim()
    .max(500, 'El comentario no puede exceder 500 caracteres')
    .optional()
    .nullable(),
});
