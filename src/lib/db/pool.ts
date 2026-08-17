import { Pool, types, type QueryResultRow } from "pg";

// pg parses timestamp/timestamptz into JS Date objects by default. The rest
// of the codebase (row types in lib/db/types.ts, JSON serialization to
// client components) expects ISO 8601 strings, matching what Supabase used
// to hand back — so return real ISO strings here instead of Date objects.
const TIMESTAMP_OID = 1114;
const TIMESTAMPTZ_OID = 1184;
types.setTypeParser(TIMESTAMP_OID, (value: string) => new Date(`${value}Z`).toISOString());
types.setTypeParser(TIMESTAMPTZ_OID, (value: string) => new Date(value).toISOString());

declare global {
  var __pryvexPool: Pool | undefined;
}

/**
 * Singleton connection pool. Reused across hot reloads in dev via the
 * global object, matching the usual Next.js pattern for stateful clients.
 * Node runtime only — never imported from proxy.ts (Edge) or a Client Component.
 */
function getPool(): Pool {
  if (!global.__pryvexPool) {
    global.__pryvexPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
    });
  }
  return global.__pryvexPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await getPool().query<T>(text, params);
  return result.rows;
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function withTransaction<T>(fn: (client: import("pg").PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
