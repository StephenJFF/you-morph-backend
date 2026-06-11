import { createClient } from '@libsql/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

dotenv.config();

const execPromise = promisify(exec);

const isProduction = process.env.NODE_ENV === 'production' || process.env.TURSO_DATABASE_URL;

const client = isProduction ? createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
}) : null;

export async function query<T = any>(sql: string, params: any[] = []): Promise<T> {
  if (isProduction && client) {
    try {
      const result = await client.execute({ sql, args: params });
      // Convert LibSQL result to a format compatible with the rest of the app
      // Standard SQLite/JSON format is an array of objects
      return result.rows.map((row: any) => {
        const obj: any = {};
        result.columns.forEach((col: string, i: number) => {
          obj[col] = row[i];
        });
        return obj;
      }) as any;
    } catch (error) {
      console.error('LibSQL query error:', error);
      throw error;
    }
  }

  try {
    // Escape single quotes for shell (wrapping in single quotes)
    const escapedSql = sql.replace(/'/g, "'\\''");
    // Note: team-db doesn't easily support params in this exec mode, 
    // so we assume the SQL is already formatted for now, or we'd need to interpolate.
    const { stdout, stderr } = await execPromise(`team-db '${escapedSql}'`);
    
    if (stderr && !stdout) {
      throw new Error(stderr);
    }

    if (!stdout || stdout.trim() === '') {
      return [] as any;
    }

    try {
      return JSON.parse(stdout);
    } catch (parseError) {
      return stdout as any;
    }
  } catch (error: any) {
    console.error('Database query error:', error);
    throw error;
  }
}
