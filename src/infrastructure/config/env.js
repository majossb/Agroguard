import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const booleanStringSchema = z
  .union([z.boolean(), z.string()])
  .transform((val) => {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') {
      const lower = val.trim().toLowerCase();
      return lower === 'true' || lower === '1';
    }
    return false;
  });

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    TRUST_PROXY: booleanStringSchema.default(false),

    MONGO_URI: z.string().default('mongodb://localhost:27017/agroguard'),

    JWT_ACCESS_SECRET: z.string().min(16).default('development_super_secret_jwt_access_key_min_32_chars!'),
    JWT_ACCESS_TTL: z.string().default('15m'),
    REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),

    COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),
    COOKIE_SECURE: booleanStringSchema.default(false),
    COOKIE_DOMAIN: z.string().optional().default(''),

    CORS_ORIGINS: z
      .string()
      .default('http://localhost:5173,http://localhost:3000')
      .transform((val) =>
        val
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      ),

    INFERENCE_DRIVER: z
      .enum(['ensemble', 'http', 'mock'])
      .default(process.env.NODE_ENV === 'test' ? 'mock' : 'ensemble'),
    INFERENCE_URL: z.string().url().default('http://localhost:8000'),
    INFERENCE_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
    PYTHON_BIN: z.string().default('/home/pablo/env/bin/python3'),
    MODEL_ROOT: z.string().default('agroguard_modelos_completos'),
    REPORTS_DIR: z.string().default('data/reports'),
    MIN_CONFIDENCE: z
      .coerce
      .number()
      .min(0.5, 'MIN_CONFIDENCE debe ser al menos 0.50')
      .max(1.0, 'MIN_CONFIDENCE no puede exceder 1.0')
      .default(0.6),
    EXPECTED_NUM_CLASSES: z.coerce.number().int().positive().default(38),
    MOCK_FORCE_CLASS: z.string().optional().default(''),
    ALLOW_MOCK_IN_PRODUCTION: booleanStringSchema.default(false),

    MAX_UPLOAD_MB: z.coerce.number().positive().default(8),
    MAX_INPUT_PIXELS: z.coerce.number().int().positive().default(40000000),
    STORAGE_DIR: z.string().default('uploads/images'),
  })
  .superRefine((data, ctx) => {
    if (
      data.NODE_ENV === 'production' &&
      data.INFERENCE_DRIVER === 'mock' &&
      !data.ALLOW_MOCK_IN_PRODUCTION
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['INFERENCE_DRIVER'],
        message:
          'No está permitido usar INFERENCE_DRIVER=mock en producción a menos que se establezca explícitamente ALLOW_MOCK_IN_PRODUCTION=true.',
      });
    }
  });

/**
 * Valida y carga la configuración del entorno desde process.env
 * @param {NodeJS.ProcessEnv} [rawEnv=process.env]
 * @returns {z.infer<typeof envSchema>}
 */
export function loadConfig(rawEnv = process.env) {
  const result = envSchema.safeParse(rawEnv);
  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => ` - [${issue.path.join('.')}] ${issue.message}`)
      .join('\n');
    throw new Error(
      `Error de configuración al arrancar AgroGuard Backend:\n${errorDetails}`
    );
  }
  return Object.freeze(result.data);
}

export const config = loadConfig(process.env);
