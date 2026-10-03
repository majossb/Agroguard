import { z } from 'zod';

export const listConditionsQuerySchema = z.object({
  cropKey: z.string().trim().optional(),
  isHealthy: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
});
