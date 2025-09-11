import type { NextApiRequest, NextApiResponse } from 'next'
import { getPool, sanitizeIdentifier, haveDbCreds } from '@/lib/db'
import crypto from 'crypto'

function hashPassword(password: string) {
  // Use scrypt for a reasonable default without adding deps
  const salt = crypto.randomBytes(16).toString('hex')
  const derived = crypto.scryptSync(password, salt, 64)
  return `${salt}$${derived.toString('hex')}`
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })

  if (!haveDbCreds()) return res.status(500).json({ error: 'db_unavailable' })

  const table = sanitizeIdentifier(process.env.USERS_TABLE || 'users')
  const nameCol = sanitizeIdentifier(process.env.USERS_NAME_COLUMN || 'name') || 'name'
  const emailCol = sanitizeIdentifier(process.env.USERS_EMAIL_COLUMN || 'email') || 'email'
  const roleCol = sanitizeIdentifier(process.env.USERS_ROLE_COLUMN || 'role') || 'role'
  const passCol = sanitizeIdentifier(process.env.USERS_PASSWORD_COLUMN || 'password') || 'password'
  const createdCol = sanitizeIdentifier(process.env.USERS_CREATED_AT_COLUMN || 'cree_le') || 'cree_le'
  const updatedCol = sanitizeIdentifier(process.env.USERS_UPDATED_AT_COLUMN || 'maj_le') || 'maj_le'

  if (!table) return res.status(500).json({ error: 'invalid_table' })

  const body = req.body || {}
  const nomRaw = body.nom || body.name
  const nom = typeof nomRaw === 'string' ? nomRaw.trim() : null
  const email = (body.email || '').trim()
  const password = (body.password || '').toString()
  // map frontend role 'startup' to backend role 'founder'
  let role = (body.role || 'startup').toString()
  if (role === 'startup') role = 'founder'

  // Name is optional here; profile completion will collect it later
  if (!email || !password) return res.status(400).json({ error: 'missing_fields' })

  try {
    const client = await getPool().connect()
    try {
      // Check existing email
  const existing = await client.query(`SELECT ${emailCol} FROM ${table} WHERE ${emailCol} = $1 LIMIT 1`, [email])
  if (existing && existing.rowCount && existing.rowCount > 0) return res.status(409).json({ error: 'email_exists' })

  const hashed = hashPassword(password)
  // allow nom to be null
  // Ensure created timestamp is set to avoid NOT NULL violations on tables with a required created column
  const sql = `INSERT INTO ${table} (${nameCol}, ${emailCol}, ${passCol}, ${roleCol}, ${createdCol}, ${updatedCol}) VALUES ($1,$2,$3,$4, NOW(), NOW()) RETURNING id, ${nameCol} AS name, ${emailCol} AS email, ${roleCol} AS role, ${createdCol} AS cree_le, ${updatedCol} AS maj_le`
  const vals = [nom, email, hashed, role]
  try {
    const r = await client.query(sql, vals)
    const user = r.rows[0]
    return res.status(201).json({ user })
  } catch (err: any) {
    // handle duplicate pk due to sequence out-of-sync
    if (err && err.code === '23505') {
      try {
        // sync sequence to max(id)
        const seqRes = await client.query(`SELECT setval(pg_get_serial_sequence($1,'id'), COALESCE(MAX(id), 1)) FROM ${table}`,[table])
        console.warn('[auth/register] sequence synced', seqRes.rows)
        // retry insert once
        const r2 = await client.query(sql, vals)
        const user2 = r2.rows[0]
        return res.status(201).json({ user: user2 })
      } catch (err2) {
        console.error('[auth/register] retry failed', err2)
        throw err2
      }
    }
    throw err
  }
    } finally {
      client.release()
    }
  } catch (e) {
    console.error('[auth/register] error', e)
    return res.status(500).json({ error: 'insert_failed', detail: String(e) })
  }
}
