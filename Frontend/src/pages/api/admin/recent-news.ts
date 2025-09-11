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
  const limitParam = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit
  const pageParam = Array.isArray(req.query.page) ? req.query.page[0] : req.query.page
  let limit: number | null = null
  let offset = 0
  if (limitParam) {
    const n = parseInt(String(limitParam), 10)
    if (!Number.isNaN(n) && n > 0) limit = n
  }
  if (limit && pageParam) {
    const p = parseInt(String(pageParam), 10)
    const page = Number.isNaN(p) ? 1 : Math.max(1, p)
    offset = (page - 1) * limit
  }

  if (!haveDbCreds() || !table) {
    return res.status(200).json({ partial: true, items: [] })
  }

  try {
    const client = await getPool().connect()
    try {
      const limitSql = limit ? ` LIMIT ${limit} OFFSET ${offset}` : ''
  const sql = `SELECT id, ${titleCol} AS title, ${statusCol} AS status, ${createdCol} AS created_at, ${viewsCol} AS views_raw
       FROM ${table}
       ORDER BY ${createdCol} DESC${limitSql}`
      const r = await client.query(sql)
      let total: number | null = null
      if (limit) {
        try {
          const ct = await client.query(`SELECT COUNT(*)::int AS cnt FROM ${table}`)
          total = ct.rows?.[0]?.cnt ?? null
        } catch (e) {
          // ignore
        }
      }
      const items: NewsItem[] = r.rows.map(row => {
        const rawCreated = (row.created_at instanceof Date) ? row.created_at : (row.created_at ? new Date(row.created_at) : null)
        // Use status directly from database column, with fallback to 'draft'
        let status = 'draft'
        try {
          if (row.status !== undefined && row.status !== null) {
            const s = String(row.status).trim().toLowerCase()
            if (s === 'published') {
              status = 'published'
            } else if (s === 'Draft' || s === 'draft') {
              status = 'draft'
            }
          }
        } catch (e) { /* ignore */ }
        const rawViews = row.views_raw
        const views = Number.isFinite(Number(rawViews)) ? Number(rawViews) : (parseInt(String(rawViews || ''), 10) || 0)
        return {
          id: row.id,
          title: row.title ?? '(sans titre)',
          status: status,
          created_at: rawCreated ? rawCreated.toISOString() : row.created_at,
          views: views
        }
      })
  return res.status(200).json({ items, total, page: limit ? (offset / (limit||1)) + 1 : 1, partial: false })
    } finally {
      client.release()
    }
  } catch (e) {
    console.warn('[recent-news] error', e)
  return res.status(200).json({ partial: true, items: [], error: 'query_failed' })
  }
}
