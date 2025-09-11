import { Pool } from 'pg'

// Singleton Pool pour éviter la recréation en mode dev (HMR)
let pool: Pool | undefined

export function getPool(): Pool {
  if (pool) return pool
  const url = process.env.DATABASE_URL
  const urlLooksPlaceholder = url && /user:password@/.test(url)
  try {
    if (url && !urlLooksPlaceholder) {
      pool = new Pool({ connectionString: url })
    } else {
      pool = new Pool({
        host: process.env.PGHOST || 'localhost',
        port: Number(process.env.PGPORT || 5432),
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
        ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
      })
    }
  } catch (e) {
    console.error('[db] pool init error', e)
  }
  return pool!
}

// Sécurise un identifiant SQL (table / colonne). Retourne undefined si invalide.
export function sanitizeIdentifier(name: string | undefined) {
  if (!name) return undefined
  return /^[a-zA-Z0-9_]+$/.test(name) ? name : undefined
}

import type { PoolClient } from 'pg'

export async function withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect()
  try {
    return await fn(client)
  } finally {
    client.release()
  }
}

export async function simpleCount(table: string | undefined): Promise<number> {
  const safe = sanitizeIdentifier(table)
  if (!safe) return 0
  return withClient(async (c) => {
    try {
      const r = await c.query(`SELECT COUNT(*)::int AS c FROM ${safe}`)
      return r.rows[0]?.c ?? 0
    } catch (e) {
      console.warn('[db] count failed for', safe, e)
      return 0
    }
  })
}

export function haveDbCreds(): boolean {
  return Boolean(
    (process.env.DATABASE_URL && !/user:password@/.test(process.env.DATABASE_URL!)) ||
    process.env.PGUSER
  )
}
