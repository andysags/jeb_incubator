import type { NextApiRequest, NextApiResponse } from 'next'
import { getPool, sanitizeIdentifier, haveDbCreds } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const table = sanitizeIdentifier(process.env.STARTUPS_TABLE || 'startups')
  const idCol = 'id'
  const nameCol = sanitizeIdentifier(process.env.STARTUPS_NAME_COLUMN || 'name') || 'name'
  const sectorCol = sanitizeIdentifier(process.env.STARTUPS_SECTOR_COLUMN || 'sector') || 'sector'
  const stageCol = sanitizeIdentifier(process.env.STARTUPS_STAGE_COLUMN || 'stage') || 'stage'
  const locationCol = sanitizeIdentifier(process.env.STARTUPS_LOCATION_COLUMN || 'location') || 'location'
  const logoCol = sanitizeIdentifier(process.env.STARTUPS_LOGO_COLUMN || 'logo') || 'logo'
  const statusCol = sanitizeIdentifier(process.env.STARTUPS_STATUS_COLUMN)
  const joinCol = sanitizeIdentifier(process.env.STARTUPS_JOIN_COLUMN || 'join_date') || 'join_date'

  const limit = Math.min(parseInt((req.query.limit as string) || '50', 10), 200)
  const page = Math.max(parseInt((req.query.page as string) || '1', 10), 1)
  const offset = (page - 1) * limit
  const orderByParam = (req.query.order_by as string) || ''
  const orderDir = ((req.query.order_dir as string) || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC'

  if (!haveDbCreds() || !table) {
    return res.status(200).json({ partial: true, items: [] })
  }

  try {
    const client = await getPool().connect()
    try {
      // Build select list safely: only include status column if configured; otherwise return NULL as status
      const statusSelect = statusCol ? `${statusCol} AS status` : `NULL AS status`

      // Map client order_by keys to actual columns we selected. Accept only a small set of keys.
      const orderMap: Record<string, string> = {
        id: idCol,
        name: nameCol,
        sector: sectorCol,
        stage: stageCol,
        location: locationCol,
        join_date: joinCol
      }
      const orderCol = sanitizeIdentifier(orderMap[orderByParam] || joinCol) || joinCol

      // Total count for pagination
      const totalRes = await client.query(`SELECT COUNT(*)::int AS c FROM ${table}`)
      const total = totalRes.rows[0]?.c ?? 0

      const sql = `SELECT ${idCol} AS id, ${nameCol} AS name, ${sectorCol} AS sector, ${stageCol} AS stage, ${locationCol} AS location, ${logoCol} AS logo, ${statusSelect}, ${joinCol} AS join_date FROM ${table} ORDER BY ${orderCol} ${orderDir} LIMIT ${limit} OFFSET ${offset}`
      const r = await client.query(sql)
      const items = r.rows.map(row => ({
        id: row.id,
        name: row.name ?? '',
        sector: row.sector ?? '',
        stage: row.stage ?? '',
        location: row.location ?? '',
        logo: row.logo ?? null,
        status: row.status ?? '',
        join_date: row.join_date instanceof Date ? row.join_date.toISOString() : row.join_date
      }))
      return res.status(200).json({ items, total, page, limit, partial: false })
    } finally {
      client.release()
    }
  } catch (e) {
    console.warn('[startups] error', e)
    return res.status(200).json({ partial: true, items: [], error: 'query_failed' })
  }
}
