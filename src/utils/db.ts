import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function query<T = any>(sql: string): Promise<T> {
  try {
    // Escape single quotes for shell (wrapping in single quotes)
    const escapedSql = sql.replace(/'/g, "'\\''");
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
