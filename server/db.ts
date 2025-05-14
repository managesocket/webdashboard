import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon to use WebSockets in Replit environment
neonConfig.webSocketConstructor = ws;

// Verify database URL exists
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Please add the database."
  );
}

// Create database connection pool
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// Helper function for logging SQL queries during development
export const logQuery = (query: string, params: any[] = []): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`SQL Query: ${query}`);
    if (params.length) {
      console.log(`Parameters: ${JSON.stringify(params)}`);
    }
  }
};