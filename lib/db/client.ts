import "server-only";
import { Pool, type PoolClient } from "pg";
const globalDb = globalThis as unknown as { visuallearnPool?: Pool };
export function getPool() {
  if (!process.env.DATABASE_URL)
    throw new Error("Research database is not configured");
  if (!globalDb.visuallearnPool)
    globalDb.visuallearnPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 8,
      connectionTimeoutMillis: 5000,
      statement_timeout: 15000,
    });
  return globalDb.visuallearnPool;
}
export async function transaction<T>(
  run: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await run(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
