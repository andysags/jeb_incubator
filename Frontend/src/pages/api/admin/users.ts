import type { NextApiRequest, NextApiResponse } from 'next'
import { getPool, sanitizeIdentifier, haveDbCreds } from '@/lib/db'

// Par défaut, table users, colonnes id, name, email, role
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const table = sanitizeIdentifier(process.env.USERS_TABLE || 'users')
  const idCol = 'id'
  const nameCol = sanitizeIdentifier(process.env.USERS_NAME_COLUMN || 'name') || 'name'
  const emailCol = sanitizeIdentifier(process.env.USERS_EMAIL_COLUMN || 'email') || 'email'
  const roleCol = sanitizeIdentifier(process.env.USERS_ROLE_COLUMN || 'role') || 'role'

  const page = Math.max(parseInt((req.query.page as string) || '1', 10), 1)
  const limit = Math.min(Math.max(parseInt((req.query.limit as string) || '10', 10), 1), 100)
  const offset = (page - 1) * limit

  if (!haveDbCreds() || !table) {
    return res.status(200).json({ partial: true, users: [], total: 0, page, limit })
  }

  try {
    const client = await getPool().connect()
    try {
      if (req.method === 'PUT') {
        const id = req.query.id || req.body?.id
        if (!id) return res.status(400).json({ error: 'missing_id' })
        const name = (req.body?.name || req.query?.name || '').trim()
        const email = (req.body?.email || req.query?.email || '').trim()
        const role = (req.body?.role || req.query?.role || '').trim()
        const updates: string[] = []
        const params: any[] = []
        let idx = 1
        if (name) { updates.push(`${nameCol} = $${idx++}`); params.push(name) }
        if (email) { updates.push(`${emailCol} = $${idx++}`); params.push(email) }
        if (role) { updates.push(`${roleCol} = $${idx++}`); params.push(role) }
        if (updates.length === 0) return res.status(400).json({ error: 'nothing_to_update' })
        params.push(id)
        const sql = `UPDATE ${table} SET ${updates.join(', ')} WHERE ${idCol} = $${idx} RETURNING ${idCol} AS id, ${nameCol} AS name, ${emailCol} AS email, ${roleCol} AS role`
        const upd = await client.query(sql, params)
        if (upd.rowCount === 0) return res.status(404).json({ error: 'not_found' })
        return res.status(200).json({ user: upd.rows[0] })
      }

      const countSql = `SELECT COUNT(*)::int AS c FROM ${table}`
      const countR = await client.query(countSql)
      const total = countR.rows[0]?.c ?? 0

      const sql = `SELECT ${idCol} AS id, ${nameCol} AS name, ${emailCol} AS email, ${roleCol} AS role FROM ${table} ORDER BY ${nameCol} ASC LIMIT ${limit} OFFSET ${offset}`
      const r = await client.query(sql)
      const users = r.rows.map(row => ({
        id: row.id,
        name: row.name ?? '',
        email: row.email ?? '',
        role: row.role ?? ''
      }))
      return res.status(200).json({ users, total, page, limit, partial: false })
    } finally {
      client.release()
    }
  } catch (e) {
    console.warn('[users] error', e)
    return res.status(500).json({ partial: true, users: [], total: 0, page, limit, error: 'query_failed', detail: String(e) })
  }
}