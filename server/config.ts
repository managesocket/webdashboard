import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

// Define environment variables schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  PGDATABASE: z.string(),
  PGHOST: z.string(),
  PGPORT: z.string().transform(Number),
  PGUSER: z.string(),
  PGPASSWORD: z.string(),
  
  // Session
  SESSION_SECRET: z.string().min(32),
  
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Validate and extract environment variables
const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error('❌ Invalid environment variables:', env.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

// Export validated config
export const config = {
  databaseUrl: env.data.DATABASE_URL,
  pg: {
    database: env.data.PGDATABASE,
    host: env.data.PGHOST,
    port: env.data.PGPORT,
    user: env.data.PGUSER,
    password: env.data.PGPASSWORD,
  },
  sessionSecret: env.data.SESSION_SECRET,
  isDev: env.data.NODE_ENV === 'development',
  isProd: env.data.NODE_ENV === 'production',
  isTest: env.data.NODE_ENV === 'test',
} as const;
