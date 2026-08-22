import 'dotenv/config';
import { z } from 'zod';

const environment = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  MONGODB_URI: z.string().min(1),
  BIGDATA_API_KEY: z.string().min(1),
  BIGDATA_CONNECTOR_ID: z.string().min(1),
  // Comma-separated browser origins allowed to call this API.
  CORS_ORIGINS: z.string().min(1).default('http://localhost:5173'),
  // When absent, the manual sync endpoint is disabled in order to avoid public trigger abuse.
  SYNC_API_TOKEN: z.string().min(16).optional(),
  SYNC_CRON: z.string().default('0 0 0 * * 0'),
  SYNC_RETRY_ATTEMPTS: z.coerce.number().int().min(1).max(10).default(3),
  SYNC_RETRY_BASE_DELAY_MS: z.coerce.number().int().min(50).max(60_000).default(1_000),
}).parse(process.env);

export const env = environment;
