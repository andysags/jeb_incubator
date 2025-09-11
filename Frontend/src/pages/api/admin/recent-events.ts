import type { NextApiRequest, NextApiResponse } from 'next'
import { getPool, sanitizeIdentifier, haveDbCreds } from '@/lib/db'

interface EventItem {
  id: number | string
  title: string
  status: string | null
  created_at: string
  attendees: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const table = sanitizeIdentifier(process.env.EVENTS_TABLE)
  const idCol = 'id'
  const titleCol = sanitizeIdentifier(process.env.EVENTS_TITLE_COLUMN || 'title') || 'title'
  const statusCol = sanitizeIdentifier(process.env.EVENTS_STATUS_COLUMN || 'status') || 'status'
  const createdCol = sanitizeIdentifier(process.env.EVENTS_CREATED_COLUMN || 'created_at') || 'created_at'
  const attendeesCol = sanitizeIdentifier(process.env.EVENTS_ATTENDEES_COLUMN || 'attendees') || 'attendees'
  const limit = 3

  if (!haveDbCreds() || !table) {
    return res.status(200).json({ partial: true, items: [] })
  }

  try {
    const client = await getPool().connect()
    try {
      // Tri par id décroissant (plus grands id en premier)
      const sql = `SELECT ${idCol} AS id, ${titleCol} AS title, ${statusCol} AS status, ${createdCol} AS created_at, COALESCE(${attendeesCol},0)::int AS attendees
                   FROM ${table}
                   ORDER BY ${idCol} DESC
                   LIMIT ${limit}`
      const r = await client.query(sql)
      const items: EventItem[] = r.rows.map(row => ({
        id: row.id,
        title: row.title ?? '(sans titre)',
        status: row.status ?? 'planning',
        created_at: (row.created_at instanceof Date) ? row.created_at.toISOString() : row.created_at,
        attendees: row.attendees ?? 0
      }))
      return res.status(200).json({ items, partial: false })
    } finally {
      client.release()
    }
  } catch (e) {
    console.warn('[recent-events] error', e)
    return res.status(200).json({ partial: true, items: [], error: 'query_failed' })
  }
}
