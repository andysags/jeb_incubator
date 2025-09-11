import type { NextApiRequest, NextApiResponse } from 'next'
import { getPool, sanitizeIdentifier, haveDbCreds } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const table = sanitizeIdentifier(process.env.EVENTS_TABLE || 'events')
  const idCol = 'id'
  const titleCol = sanitizeIdentifier(process.env.EVENTS_TITLE_COLUMN || 'titre') || 'titre'
  const descCol = sanitizeIdentifier(process.env.EVENTS_DESC_COLUMN || 'description') || 'description'
  const startCol = sanitizeIdentifier(process.env.EVENTS_START_COLUMN || 'date_debut') || 'date_debut'
  const endCol = sanitizeIdentifier(process.env.EVENTS_END_COLUMN || 'date_fin') || 'date_fin'
  const locationCol = sanitizeIdentifier(process.env.EVENTS_LOCATION_COLUMN || 'lieu') || 'lieu'
  const attendeesCol = sanitizeIdentifier(process.env.EVENTS_ATTENDEES_COLUMN || 'nb_registered') || 'nb_registered'
  const imageCol = sanitizeIdentifier(process.env.EVENTS_IMAGE_COLUMN || 'photo_url') || 'photo_url'
  // detect which column holds the event type (could be 'type', 'event_type', 'type_event', etc.)
  const typeColCandidates = [
    sanitizeIdentifier(process.env.EVENTS_TYPE_COLUMN || 'event_type'),
    sanitizeIdentifier('type'),
    sanitizeIdentifier('type_event'),
  ].filter(Boolean) as string[]
  let detectedTypeCol: string | undefined = undefined

  // target/audience column: support common spellings and allow env override
  const targetColCandidates = [
    sanitizeIdentifier(process.env.EVENTS_TARGET_COLUMN || 'target_audience'),
    sanitizeIdentifier('target_audiance'),
    sanitizeIdentifier('target'),
  ].filter(Boolean) as string[]
  let selectedTargetCol: string | undefined = undefined
  // capacity column (optional) - try environment variable or common names
  const capacityColCandidates = [
    sanitizeIdentifier(process.env.EVENTS_CAPACITY_COLUMN || 'max_attendees'),
    sanitizeIdentifier('capacity'),
    sanitizeIdentifier('max_capacity'),
    sanitizeIdentifier('nb_max'),
    sanitizeIdentifier('places'),
  ].filter(Boolean) as string[]
  let capacityCol: string | undefined = undefined
  const datesCol = sanitizeIdentifier(process.env.EVENTS_DATES_COLUMN || 'dates') || 'dates'

  // check whether the dates column actually exists in the table (optional)
  let datesColExists = false
  try {
    const client = await getPool().connect()
    try {
      const check = await client.query(`SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2 LIMIT 1`, [table, datesCol])
      if (check.rowCount) datesColExists = true
    } finally { client.release() }
  } catch (e) { /* ignore - treat as not existing */ }

  // decide which target column exists (support mis-spellings)
  try {
    const client = await getPool().connect()
    try {
      for (const c of targetColCandidates) {
        try {
          const check = await client.query(`SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2 LIMIT 1`, [table, c])
          if (check.rowCount) { selectedTargetCol = c; break }
        } catch (e) { continue }
      }
    } finally { client.release() }
  } catch (e) { /* ignore */ }

  // decide which type column exists (must pick one to avoid null constraint issues)
  try {
    const client = await getPool().connect()
    try {
      for (const c of typeColCandidates) {
        try {
          const check = await client.query(`SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2 LIMIT 1`, [table, c])
          if (check.rowCount) { detectedTypeCol = c; break }
        } catch (e) { continue }
      }
    } finally { client.release() }
  } catch (e) { /* ignore */ }

  // also collect all present type-like columns so we can set them all (avoid leaving 'type' null)
  const typeColsPresent: string[] = []
  try {
    const client = await getPool().connect()
    try {
      for (const c of typeColCandidates) {
        try {
          const check = await client.query(`SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2 LIMIT 1`, [table, c])
          if (check.rowCount) typeColsPresent.push(c)
        } catch (e) { continue }
      }
      // also explicitly check for a plain `type` column (common) in case candidates didn't match
      try {
        const checkType = await client.query(`SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2 LIMIT 1`, [table, 'type'])
        if (checkType.rowCount && !typeColsPresent.includes('type')) typeColsPresent.push('type')
      } catch (e) { /* ignore */ }
    } finally { client.release() }
  } catch (e) { /* ignore */ }

  if (!haveDbCreds() || !table) return res.status(500).json({ error: 'db_not_configured' })

  // decide which capacity column exists
  try {
    const client = await getPool().connect()
    try {
      for (const c of capacityColCandidates) {
        try {
          const check = await client.query(`SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2 LIMIT 1`, [table, c])
          if (check.rowCount) { capacityCol = c; break }
        } catch (e) { continue }
      }
    } finally { client.release() }
  } catch (e) { /* ignore, capacity will be undefined */ }

  // Create
  if (req.method === 'POST') {
    const body = req.body || {}
    const title = String(body.title || '').trim()
    const description = String(body.description || '').trim()
    const start = body.start_datetime || null
    const end = body.end_datetime || null
    const location = body.location || null
    const attendees = Number(body.attendees || 0)
    const image_base64 = body.image_base64 || null
    const event_type = body.event_type || null
    const target_audience = body.target_audience || null

    if (!title || !description || !start) return res.status(400).json({ error: 'missing_fields' })

    try {
      // store start date (YYYY-MM-DD) in JSONB `dates` column as a JSON string when available
      function dateOnlyFrom(s: any) {
        if (!s) return null
        try {
          const str = String(s)
          if (str.includes('T')) return str.split('T')[0]
          if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
          const d = new Date(str)
          if (!isNaN(d.getTime())) return d.toISOString().slice(0,10)
        } catch (e) {}
        return null
      }
      const dateOnly = dateOnlyFrom(start)
      const datesJson = dateOnly ? JSON.stringify(dateOnly) : null

      // build INSERT dynamically to avoid referencing missing optional columns
      const cols: string[] = [titleCol, descCol, startCol]
      const placeholders: string[] = ['$1','$2','$3']
      const vals: any[] = [title, description, start]

      let idx = vals.length
      if (datesColExists) {
        cols.push(datesCol)
        idx += 1
        placeholders.push(`$${idx}`)
        vals.push(datesJson)
      }

      // always include remaining columns (end, location, attendees, image, type)
      cols.push(endCol, locationCol, attendeesCol, imageCol)
      for (const v of [end, location, attendees, image_base64]) {
        idx += 1
        placeholders.push(`$${idx}`)
        vals.push(v)
      }

      // include all present type-like columns and set them to the same event_type value
      if (typeColsPresent.length) {
        for (const tc of typeColsPresent) {
          cols.push(tc)
          idx += 1
          placeholders.push(`$${idx}`)
          vals.push(event_type)
        }
      } else {
        // fallback: include environment-specified candidate or 'event_type'
        const fallbackType = typeColCandidates[0] || 'event_type'
        cols.push(fallbackType)
        idx += 1
        placeholders.push(`$${idx}`)
        vals.push(event_type)
      }

      // include target column/value only if the column exists
      if (selectedTargetCol) {
        cols.push(selectedTargetCol)
        idx += 1
        placeholders.push(`$${idx}`)
        vals.push(target_audience)
      }

  const sql = `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING ${idCol} AS id`
  const r = await getPool().query(sql, vals)
  return res.status(201).json({ id: r.rows[0].id, ok: true })
    } catch (e:any) {
      console.warn('[events] create error', e)
      // debug: list columns of the table to help diagnose schema mismatch
      try {
        const client = await getPool().connect()
        try {
          const cols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`, [table])
          const names = (cols.rows || []).map((r:any)=>r.column_name)
          return res.status(500).json({ error: 'create_failed', detail: e?.message, columns: names })
        } finally { client.release() }
      } catch (e2) {
        return res.status(500).json({ error: 'create_failed', detail: e?.message })
      }
    }
  }

  // Update
  if (req.method === 'PUT') {
    const rawId = String(req.query.id || '')
    if (!rawId) return res.status(400).json({ error: 'invalid_id' })
    const body = req.body || {}
    const sets: string[] = []
    const vals: any[] = []
    if (body.title !== undefined) { vals.push(body.title); sets.push(`${titleCol}=$${vals.length}`) }
    if (body.description !== undefined) { vals.push(body.description); sets.push(`${descCol}=$${vals.length}`) }
    if (body.start_datetime !== undefined) {
      vals.push(body.start_datetime); sets.push(`${startCol}=$${vals.length}`)
      // compute YYYY-MM-DD and store as JSON string only when dates column exists
      if (datesColExists) {
        const str = String(body.start_datetime)
        let dateOnly: string | null = null
        if (str.includes('T')) dateOnly = str.split('T')[0]
        else if (/^\d{4}-\d{2}-\d{2}$/.test(str)) dateOnly = str
        else {
          const d = new Date(str)
          if (!isNaN(d.getTime())) dateOnly = d.toISOString().slice(0,10)
        }
        const datesJson = dateOnly ? JSON.stringify(dateOnly) : null
        vals.push(datesJson); sets.push(`${datesCol}=$${vals.length}`)
      }
    }
    if (body.end_datetime !== undefined) { vals.push(body.end_datetime); sets.push(`${endCol}=$${vals.length}`) }
    if (body.location !== undefined) { vals.push(body.location); sets.push(`${locationCol}=$${vals.length}`) }
    if (body.attendees !== undefined) { vals.push(Number(body.attendees)); sets.push(`${attendeesCol}=$${vals.length}`) }
    if (body.image_base64 !== undefined) { vals.push(body.image_base64); sets.push(`${imageCol}=$${vals.length}`) }
    if (body.event_type !== undefined) {
      if (typeColsPresent.length) {
        for (const tc of typeColsPresent) {
          vals.push(body.event_type); sets.push(`${tc}=$${vals.length}`)
        }
      } else {
        const fallbackType = typeColCandidates[0] || 'event_type'
        vals.push(body.event_type); sets.push(`${fallbackType}=$${vals.length}`)
      }
    }
  if (body.target_audience !== undefined && selectedTargetCol) { vals.push(body.target_audience); sets.push(`${selectedTargetCol}=$${vals.length}`) }
    if (!sets.length) return res.status(400).json({ error: 'nothing_to_update' })
    // decide whether id is numeric or text (uuid)
    const maybeInt = parseInt(rawId, 10)
    const idIsInt = !isNaN(maybeInt) && String(maybeInt) === rawId
    const idForQuery = idIsInt ? maybeInt : rawId
    vals.push(idForQuery)
    try {
      const whereClause = idIsInt ? `${idCol}=$${vals.length}` : `${idCol}::text=$${vals.length}`
      const sql = `UPDATE ${table} SET ${sets.join(', ')} WHERE ${whereClause} RETURNING ${idCol} AS id`
      const r = await getPool().query(sql, vals)
      if (!r.rowCount) return res.status(404).json({ error: 'not_found' })
      return res.status(200).json({ ok: true })
    } catch (e:any) { console.warn('[events] update error', e); return res.status(500).json({ error: 'update_failed', detail: e?.message }) }
  }

  // Read - single event when id provided, otherwise list events
  if (req.method === 'GET') {
    const rawId = String(req.query.id || '')
    // build SELECT columns dynamically to include only existing optional columns
    const selectCols: string[] = [
      `${idCol} AS id`,
      `${titleCol} AS title`,
      `${descCol} AS description`,
      `${startCol} AS start_datetime`,
      `${endCol} AS end_datetime`,
    ]
    if (datesColExists) selectCols.push(`${datesCol} AS dates`)
    selectCols.push(`${locationCol} AS location`, `${attendeesCol} AS attendees`)
    if (capacityCol) selectCols.push(`${capacityCol} AS max_attendees`)
    selectCols.push(`${imageCol} AS image`)
    const typeColumnToUseForSelect = detectedTypeCol || typeColCandidates[0] || 'event_type'
    selectCols.push(`${typeColumnToUseForSelect} AS event_type`)
    if (selectedTargetCol) selectCols.push(`${selectedTargetCol} AS target_audience`)

    try {
      if (!rawId) {
        // list mode - return recent/upcoming events
        const limit = Number(req.query.limit || 200)
        const sql = `SELECT ${selectCols.join(', ')} FROM ${table} ORDER BY ${startCol} ASC LIMIT $1`
        const r = await getPool().query(sql, [limit])
        return res.status(200).json(r.rows)
      }

      // single read by id
      const maybeInt = parseInt(rawId, 10)
      const idIsInt = !isNaN(maybeInt) && String(maybeInt) === rawId
      const vals = [ idIsInt ? maybeInt : rawId ]
      const whereClause = idIsInt ? `${idCol}=$1` : `${idCol}::text=$1`
      const sql = `SELECT ${selectCols.join(', ')} FROM ${table} WHERE ${whereClause} LIMIT 1`
      const r = await getPool().query(sql, vals)
      if (!r.rowCount) return res.status(404).json({ error: 'not_found' })
      return res.status(200).json(r.rows[0])
    } catch (e:any) { console.warn('[events] get error', e); return res.status(500).json({ error: 'read_failed', detail: e?.message }) }
  }

  // Delete
  if (req.method === 'DELETE') {
    const rawId = String(req.query.id || '')
    if (!rawId) return res.status(400).json({ error: 'invalid_id' })
    try {
      const maybeInt = parseInt(rawId, 10)
      const idIsInt = !isNaN(maybeInt) && String(maybeInt) === rawId
      const vals = [ idIsInt ? maybeInt : rawId ]
      const whereClause = idIsInt ? `${idCol}=$1` : `${idCol}::text=$1`
      const sql = `DELETE FROM ${table} WHERE ${whereClause} RETURNING ${idCol} AS id`
      const r = await getPool().query(sql, vals)
      if (!r.rowCount) return res.status(404).json({ error: 'not_found' })
      return res.status(200).json({ ok: true })
    } catch (e:any) { console.warn('[events] delete error', e); return res.status(500).json({ error: 'delete_failed', detail: e?.message }) }
  }

  return res.status(405).json({ error: 'method_not_allowed' })
}
