import type { NextApiRequest, NextApiResponse } from 'next'
import { getPool, sanitizeIdentifier, haveDbCreds } from '@/lib/db'

interface NewsItem {
  id: number | string
  title: string
  status: string | null
  created_at: string
  views: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const table = sanitizeIdentifier(process.env.NEWS_TABLE)
  const createdCol = sanitizeIdentifier(process.env.NEWS_CREATED_COLUMN || 'created_at') || 'created_at'
  const titleCol = sanitizeIdentifier(process.env.NEWS_TITLE_COLUMN || 'title') || 'title'
  const statusCol = sanitizeIdentifier(process.env.NEWS_STATUS_COLUMN || 'status') || 'status'
  const viewsCol = sanitizeIdentifier(process.env.NEWS_VIEWS_COLUMN || 'views') || 'views'
  const limit = 3

  if (!haveDbCreds() || !table) {
    return res.status(200).json({ partial: true, items: [] })
  }

  try {
    const client = await getPool().connect()
    try {
      const sql = `SELECT id, ${titleCol} AS title, ${statusCol} AS status, ${createdCol} AS created_at, COALESCE(${viewsCol},0)::int AS views
                   FROM ${table}
                   ORDER BY ${createdCol} DESC
                   LIMIT ${limit}`
      const r = await client.query(sql)
      const items: NewsItem[] = r.rows.map(row => ({
        id: row.id,
        title: row.title ?? '(sans titre)',
        status: row.status ?? 'draft',
        created_at: (row.created_at instanceof Date) ? row.created_at.toISOString() : row.created_at,
        views: row.views ?? 0
      }))
      return res.status(200).json({ items, partial: false })
    } finally {
      client.release()
    }
  } catch (e) {
    console.warn('[recent-news] error', e)
  return res.status(200).json({ partial: true, items: [], error: 'query_failed' })
  }
}
