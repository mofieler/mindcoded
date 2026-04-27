import { Pool } from 'pg'

let pool: Pool | null = null

export function getDb(): Pool {
  if (!pool) {
    const config = useRuntimeConfig()
    pool = new Pool({ connectionString: config.databaseUrl as string })
  }
  return pool
}

export async function initDb() {
  const db = getDb()
  await db.query(`
    CREATE TABLE IF NOT EXISTS pending_confirmations (
      token       TEXT PRIMARY KEY,
      email       TEXT NOT NULL,
      locale      TEXT NOT NULL DEFAULT 'de',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at  TIMESTAMPTZ NOT NULL,
      confirmed   BOOLEAN NOT NULL DEFAULT FALSE,
      confirmed_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS rate_limits (
      key          TEXT PRIMARY KEY,
      requests     BIGINT[] NOT NULL DEFAULT '{}',
      last_request BIGINT NOT NULL DEFAULT 0
    );
  `)
}

// Removes expired confirmations and stale rate-limit entries.
// Called fire-and-forget after each successful submission.
export async function cleanupExpired() {
  const db = getDb()
  const rateLimitCutoff = Date.now() - 2 * 60 * 60 * 1000 // 2 hours ago
  await Promise.all([
    db.query(`DELETE FROM pending_confirmations WHERE expires_at < NOW()`),
    db.query(`DELETE FROM rate_limits WHERE last_request < $1`, [rateLimitCutoff]),
  ])
}
