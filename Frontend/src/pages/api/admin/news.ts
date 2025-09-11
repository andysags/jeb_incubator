import type { NextApiRequest, NextApiResponse } from 'next'
import { getPool, sanitizeIdentifier, haveDbCreds } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const table = sanitizeIdentifier(process.env.NEWS_TABLE || 'news')
  const idCol = 'id'
  const titleCol = sanitizeIdentifier(process.env.NEWS_TITLE_COLUMN || 'titre') || 'titre'
  const contentCol = sanitizeIdentifier(process.env.NEWS_CONTENT_COLUMN || 'contenu') || 'contenu'
  const createdCol = sanitizeIdentifier(process.env.NEWS_CREATED_COLUMN || 'publie_le') || 'publie_le'
  const imageCol = sanitizeIdentifier(process.env.NEWS_IMAGE_COLUMN || 'image_url') || 'image_url'
  const statusCol = sanitizeIdentifier(process.env.NEWS_STATUS_COLUMN || 'status') || 'status'

  if (!haveDbCreds() || !table) return res.status(200).json({ partial: true })

  // DELETE
  if (req.method === 'DELETE') {
    const idVal = parseInt(String(req.query.id), 10)
    if (!idVal) return res.status(400).json({ error: 'invalid_id' })
    try {
      const r = await getPool().query(`DELETE FROM ${table} WHERE ${idCol}=$1 RETURNING ${idCol} AS id`, [idVal])
      if (!r.rowCount) return res.status(404).json({ error: 'not_found' })
      return res.status(200).json({ ok: true })
    } catch (e:any) { console.warn('[news] delete error', e); return res.status(500).json({ error: 'delete_failed', detail: e?.message }) }
  }

  // PUT (update)
  if (req.method === 'PUT') {
    const idVal = parseInt(String(req.query.id), 10)
    if (!idVal) return res.status(400).json({ error: 'invalid_id' })
    const body = req.body || {}
    const sets:string[] = []
    const vals:any[] = []
    if (body.title !== undefined) { vals.push(body.title); sets.push(`${titleCol}=$${vals.length}`) }
    if (body.content !== undefined) { vals.push(body.content); sets.push(`${contentCol}=$${vals.length}`) }
    if (body.image_base64 !== undefined) { vals.push(body.image_base64); sets.push(`${imageCol}=$${vals.length}`) }
    if (body.draft !== undefined) {
      const now = new Date()
      const futureMs = 365 * 100 * 24 * 60 * 60 * 1000
      const publie_le = body.draft ? new Date(now.getTime() + futureMs).toISOString() : new Date().toISOString()
      vals.push(publie_le); sets.push(`${createdCol}=$${vals.length}`)
      // align status column if it exists
      if (statusCol) {
        console.log('[news] aligning status column', statusCol)
        vals.push(body.draft ? 'draft' : 'published'); sets.push(`${statusCol}=$${vals.length}`)
      }
    }
    if (!sets.length) return res.status(400).json({ error: 'nothing_to_update' })
    vals.push(idVal)
    console.log('[news] PUT SQL:', `UPDATE ${table} SET ${sets.join(', ')} WHERE ${idCol}=$${vals.length}`)
    console.log('[news] PUT values:', vals)
    try {
      const r = await getPool().query(`UPDATE ${table} SET ${sets.join(', ')} WHERE ${idCol}=$${vals.length} RETURNING ${idCol} AS id`, vals)
      if (!r.rowCount) return res.status(404).json({ error: 'not_found' })
      return res.status(200).json({ ok: true })
    } catch (e:any) { console.warn('[news] update error', e); return res.status(500).json({ error: 'update_failed', detail: e?.message }) }
  }

  // POST (create)
  if (req.method === 'POST') {
    const body = req.body || {}
    const title = body.title || ''
    const content = body.content || ''
    const image_base64 = body.image_base64 || null
    const draftFlag = Boolean(body.draft)
    if (!title || !content) return res.status(400).json({ error: 'missing_fields' })
    try {
      const now = new Date()
      const futureMs = 365 * 100 * 24 * 60 * 60 * 1000
  const publie_le = draftFlag ? new Date(now.getTime() + futureMs).toISOString() : new Date().toISOString()
  const statusValue = draftFlag ? 'draft' : 'published'

      // Try to create with a slug based on title; if conflict, append suffix
      const baseSlug = encodeURIComponent(title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) || Date.now().toString()
      let slugCandidate = baseSlug
      let suffix = 0
      while (true) {
        try {
          const r = await getPool().query(
            `INSERT INTO ${table} (${titleCol}, ${contentCol}, ${imageCol}, ${createdCol}, ${statusCol}, slug) VALUES ($1,$2,$3,$4,$5,$6) RETURNING ${idCol} AS id`,
            [title, content, image_base64, publie_le, statusValue, slugCandidate]
          )
          return res.status(201).json({ id: r.rows[0].id, title, status: statusValue })
        } catch (err:any) {
          // if unique violation on slug, try a new slug
          const msg = String(err?.message || '')
          if (msg.includes('duplicate') || msg.includes('unique') || msg.includes('violat')) {
            suffix += 1
            slugCandidate = `${baseSlug}-${suffix}`
            continue
          }
          console.warn('[news] create error', err)
          return res.status(500).json({ error: 'create_failed', detail: err?.message })
        }
      }
    } catch (e:any) { console.warn('[news] create outer error', e); return res.status(500).json({ error: 'create_failed', detail: e?.message }) }
  }

  return res.status(405).json({ error: 'method_not_allowed' })
}
