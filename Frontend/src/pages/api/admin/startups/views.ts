import type { NextApiRequest, NextApiResponse } from 'next'
import { getPool, sanitizeIdentifier, haveDbCreds } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const table = sanitizeIdentifier(process.env.STARTUPS_TABLE || 'startups')
  const idCol = 'id'
  if (!haveDbCreds() || !table) return res.status(200).json({ partial: true })

  const idValStr = (req.query.id || req.body?.id || '') as string
  const idVal = parseInt(String(idValStr), 10)
  if (!idVal) return res.status(400).json({ error: 'invalid_id' })

  const client = await getPool().connect()
  try {
    // Perform an atomic increment; create column if missing is out of scope here
    const sql = `UPDATE ${table} SET views = COALESCE(views,0) + 1 WHERE ${idCol}=$1 RETURNING views`;
    const r = await client.query(sql, [idVal])
    if (!r.rowCount) return res.status(404).json({ error: 'not_found' })
    const views = r.rows[0].views ?? null
    return res.status(200).json({ id: idVal, views })
  } catch (e:any) {
    console.error('views increment error', e)
    return res.status(500).json({ error: 'db_error' })
  } finally { client.release() }
}
