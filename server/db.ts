import pkg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { config } from './config';

const { Pool } = pkg;

// Create PostgreSQL pool
const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.isDev ? undefined : { rejectUnauthorized: false }
});

// Create Drizzle db instance
export const db = drizzle(pool);