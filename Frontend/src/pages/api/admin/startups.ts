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
  const needsCol = sanitizeIdentifier(process.env.STARTUPS_NEEDS_COLUMN || 'needs') || 'needs'
  const joinCol = sanitizeIdentifier(process.env.STARTUPS_JOIN_COLUMN || 'join_date') || 'join_date'
  const legalCol = sanitizeIdentifier(process.env.STARTUPS_LEGAL_STATUS_COLUMN || 'legal_status') || 'legal_status'
  const websiteCol = sanitizeIdentifier(process.env.STARTUPS_WEBSITE_COLUMN || 'website_url') || 'website_url'
  const socialCol = sanitizeIdentifier(process.env.STARTUPS_SOCIAL_COLUMN || 'social_media_url') || 'social_media_url'
  const emailColBase = sanitizeIdentifier(process.env.STARTUPS_EMAIL_COLUMN || 'contact_email') || 'contact_email'
  const phoneCol = sanitizeIdentifier(process.env.STARTUPS_PHONE_COLUMN || 'phone') || 'phone'

  if (!haveDbCreds() || !table) return res.status(200).json({ partial: true, items: [] })

  // DETAIL
  if (req.method === 'GET' && req.query.id) {
    const idVal = parseInt(String(req.query.id), 10)
    if (!idVal) return res.status(400).json({ error: 'invalid_id' })
    const client = await getPool().connect()
    try {
      let emailReadCol = emailColBase
      try {
        const chkE = await client.query(`SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name=$2 LIMIT 1`, [table.replace(/"/g,''), emailReadCol])
        if (chkE.rowCount === 0) emailReadCol = 'email'
      } catch {}
      
      // Check for description columns
      const tableNameParam = table.replace(/"/g,'')
      let descriptionSelect = 'NULL AS description'
      let descriptionLongueSelect = 'NULL AS description_longue'
      try {
        const descCheck = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name=$1 AND column_name IN ('description', 'description_longue', 'description_long', 'long_description') ORDER BY column_name`, [tableNameParam])
        if (descCheck.rowCount && descCheck.rowCount > 0) {
          const availableDescCols = descCheck.rows.map(r => r.column_name)
          // Prefer description_longue, then description_long, then long_description, then description
          if (availableDescCols.includes('description_longue')) {
            descriptionLongueSelect = 'description_longue AS description_longue'
          } else if (availableDescCols.includes('description_long')) {
            descriptionLongueSelect = 'description_long AS description_longue'
          } else if (availableDescCols.includes('long_description')) {
            descriptionLongueSelect = 'long_description AS description_longue'
          }
          
          if (availableDescCols.includes('description')) {
            descriptionSelect = 'description AS description'
          }
        }
      } catch {}
      
      const statusSelect = statusCol ? `${statusCol} AS status` : 'NULL AS status'
      const needsSelect = needsCol ? `${needsCol} AS needs` : 'NULL AS needs'
      const detailSql = `SELECT ${idCol} AS id, ${nameCol} AS name, ${sectorCol} AS sector, ${stageCol} AS stage, ${locationCol} AS location, ${legalCol} AS legal_status, ${logoCol} AS logo, ${websiteCol} AS website_url, ${socialCol} AS social_media_url, ${emailReadCol} AS email, ${phoneCol} AS phone, ${statusSelect}, ${needsSelect}, ${joinCol} AS join_date, ${descriptionSelect}, ${descriptionLongueSelect} FROM ${table} WHERE ${idCol}=$1 LIMIT 1`
      const dr = await client.query(detailSql, [idVal])
      if (!dr.rowCount) return res.status(404).json({ error: 'not_found' })
      const row = dr.rows[0]
      let founders: any[] = []
      try {
        const foundersTable = sanitizeIdentifier(process.env.FOUNDERS_TABLE || 'founders') || 'founders'
        const foundersFkCol = sanitizeIdentifier(process.env.FOUNDERS_STARTUP_FK_COLUMN || 'startup_id') || 'startup_id'
        // detect available columns in founders table
        let founderIdCol = 'id'
        let founderNameCol = 'name'
        let founderRoleCol = null
        let founderEmailCol = null
        try {
          const fcols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name=$1`, [foundersTable.replace(/"/g,'')])
          const cols = (fcols.rows || []).map((r:any) => r.column_name)
          if (!cols.includes('id')) founderIdCol = cols[0] || 'id'
          if (!cols.includes('name')) founderNameCol = cols.includes('full_name') ? 'full_name' : (cols[1] || 'name')
          if (cols.includes('role')) founderRoleCol = 'role'
          if (cols.includes('email')) founderEmailCol = 'email'
        } catch (e:any) {
          // ignore
        }
        const selectParts = [
          `${founderIdCol} AS id`,
          `${founderNameCol} AS name`,
          (founderRoleCol ? `${founderRoleCol} AS role` : `NULL AS role`),
          (founderEmailCol ? `${founderEmailCol} AS email` : `NULL AS email`)
        ]
        const fr = await client.query(`SELECT ${selectParts.join(', ')} FROM ${foundersTable} WHERE ${foundersFkCol} = $1 ORDER BY ${founderIdCol} ASC`, [idVal])
        founders = fr.rows
      } catch (e:any) { if (e?.code !== '42P01') console.warn('founders fetch fail', e) }
      return res.status(200).json({
        id: row.id,
        name: row.name ?? '',
        sector: row.sector ?? '',
        stage: row.stage ?? '',
        location: row.location ?? '',
        legal_status: row.legal_status ?? null,
        logo: row.logo ?? null,
        website_url: row.website_url ?? '',
        social_media_url: row.social_media_url ?? '',
        email: row.email ?? '',
        phone: row.phone ?? '',
        status: row.status ?? '',
        needs: row.needs ?? null,
        description: row.description ?? null,
        description_longue: row.description_longue ?? null,
        join_date: row.join_date instanceof Date ? row.join_date.toISOString() : row.join_date,
        founders
      })
    } finally { client.release() }
  }

  // CREATE
  if (req.method === 'POST') {
    const { name, sector, stage, location, website_url, social_media_url, email, phone, legal_status, needs, logo_base64 } = req.body || {}
    if (!name || !sector || !stage || !legal_status) return res.status(400).json({ error: 'missing_required' })
    const client = await getPool().connect()
    try {
      // detect email col existence
      let emailCol = emailColBase
      const tableNameParam = table.replace(/"/g,'')
      try {
        const chk = await client.query(`SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name=$2 LIMIT 1`, [tableNameParam, emailCol])
        if (chk.rowCount === 0) {
          const chk2 = await client.query(`SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name='email' LIMIT 1`, [tableNameParam])
          if (chk2.rowCount) emailCol = 'email'
        }
      } catch {}
      // slug unique
      const rawSlugBase = String(name).toLowerCase().normalize('NFD').replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')
      let candidate = rawSlugBase || 'startup'
      let counter = 1
      while (true) {
        const check = await client.query(`SELECT 1 FROM ${table} WHERE slug=$1 LIMIT 1`, [candidate])
        if (check.rowCount === 0) break
        counter += 1
        candidate = `${rawSlugBase}-${counter}`
      }
      const safeEmail = (email ?? '').trim()
      const safePhone = (phone ?? '').trim()
      const cols = [nameCol, 'slug', sectorCol, stageCol, locationCol, websiteCol, socialCol, emailCol, phoneCol, legalCol, needsCol]
      const vals = [name, candidate, sector, stage, location || '', website_url || '', social_media_url || '', safeEmail, safePhone, legal_status, needs || null]
      if (logo_base64 && logoCol) { cols.push(logoCol); vals.push(logo_base64) }
      const placeholders = cols.map((_,i)=>`$${i+1}`)
      const sqlInsert = `INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders.join(',')}) RETURNING ${idCol} AS id, slug`
      let r
      try { r = await client.query(sqlInsert, vals) } catch (err:any) {
        if (err?.code === '23505') { // sequence fix
          await client.query(`SELECT setval('"Startup_id_seq"', (SELECT COALESCE(MAX(id),0)+1 FROM ${table}), false)`)
          r = await client.query(sqlInsert, vals)
        } else throw err
      }
      return res.status(201).json({ ok: true, id: r!.rows[0].id, slug: r!.rows[0].slug })
    } catch (e:any) {
      console.warn('create startup error', e)
      return res.status(500).json({ error: 'create_failed', detail: e?.message })
    } finally { client.release() }
  }

  // UPDATE
  if (req.method === 'PUT') {
    const idVal = parseInt(String(req.query.id),10)
    if (!idVal) return res.status(400).json({ error: 'invalid_id' })
    const body = req.body || {}
    const allowedMap: Record<string,string> = {
      name: nameCol,
      sector: sectorCol,
      stage: stageCol,
      location: locationCol,
      website_url: websiteCol,
      social_media_url: socialCol,
      email: emailColBase,
      phone: phoneCol,
      legal_status: legalCol,
      needs: needsCol,
      logo_base64: logoCol
    }
    const sets:string[] = []
    const values:any[] = []
    Object.entries(body).forEach(([k,v]) => {
      if (v === undefined) return
      if (k === 'logo_base64') { if (logoCol) { sets.push(`${logoCol}=$${values.length+1}`); values.push(v) } }
      else if (allowedMap[k]) { sets.push(`${allowedMap[k]}=$${values.length+1}`); values.push(v) }
    })
    if (!sets.length) return res.status(400).json({ error: 'nothing_to_update' })
    values.push(idVal)
    try {
      const r = await getPool().query(`UPDATE ${table} SET ${sets.join(', ')} WHERE ${idCol}=$${values.length} RETURNING ${idCol} AS id`, values)
      if (!r.rowCount) return res.status(404).json({ error: 'not_found' })
      return res.status(200).json({ ok: true, id: r.rows[0].id })
    } catch (e:any) {
      console.warn('update startup error', e)
      return res.status(500).json({ error: 'update_failed', detail: e?.message })
    }
  }

  // DELETE
  if (req.method === 'DELETE') {
    const idVal = parseInt(String(req.query.id),10)
    if (!idVal) return res.status(400).json({ error: 'invalid_id' })
    const client = await getPool().connect()
    try {
      await client.query('BEGIN')
      try {
        const foundersTable = sanitizeIdentifier(process.env.FOUNDERS_TABLE || 'founders') || 'founders'
        const foundersFkCol = sanitizeIdentifier(process.env.FOUNDERS_STARTUP_FK_COLUMN || 'startup_id') || 'startup_id'
        const ftName = foundersTable.replace(/"/g,'')
        const chk = await client.query(`SELECT 1 FROM information_schema.tables WHERE table_name=$1 LIMIT 1`, [ftName])
        if (chk.rowCount) await client.query(`DELETE FROM ${foundersTable} WHERE ${foundersFkCol}=$1`, [idVal])
      } catch (e:any) { if (e?.code !== '42P01') throw e }
      const del = await client.query(`DELETE FROM ${table} WHERE ${idCol}=$1`, [idVal])
      if (!del.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'not_found' }) }
      await client.query('COMMIT')
      return res.status(200).json({ ok: true })
    } catch (e:any) {
      try { await client.query('ROLLBACK') } catch {}
      console.warn('delete startup error', e)
      return res.status(500).json({ error: 'delete_failed', detail: e?.message })
    } finally { client.release() }
  }

  // LIST
  const limit = Math.min(parseInt((req.query.limit as string) || '50', 10), 200)
  const page = Math.max(parseInt((req.query.page as string) || '1', 10), 1)
  const offset = (page - 1) * limit
  const orderByParam = (req.query.order_by as string) || ''
  const orderDir = ((req.query.order_dir as string) || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC'
  const stageFilter = ((req.query.stage as string) || '').trim()
  const client = await getPool().connect()
  try {
    const statusSelect = statusCol ? `${statusCol} AS status` : 'NULL AS status'
    const needsSelect = needsCol ? `${needsCol} AS needs` : 'NULL AS needs'
    const orderMap:Record<string,string> = { id: idCol, name: nameCol, sector: sectorCol, stage: stageCol, location: locationCol, join_date: joinCol, legal_status: legalCol }
    const orderCol = sanitizeIdentifier(orderMap[orderByParam] || joinCol) || joinCol
    const where:string[] = []
    const params:any[] = []
    if (stageFilter) { params.push(stageFilter); where.push(`LOWER(${stageCol}) = LOWER($${params.length})`) }
    const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const totalRes = await client.query(`SELECT COUNT(*)::int AS c FROM ${table} ${whereSQL}`, params)
    const total = totalRes.rows[0]?.c ?? 0
    const sql = `SELECT ${idCol} AS id, ${nameCol} AS name, ${sectorCol} AS sector, ${stageCol} AS stage, ${locationCol} AS location, ${legalCol} AS legal_status, ${logoCol} AS logo, ${statusSelect}, ${needsSelect}, ${joinCol} AS join_date FROM ${table} ${whereSQL} ORDER BY ${orderCol} ${orderDir} LIMIT ${limit} OFFSET ${offset}`
    const r = await client.query(sql, params)
    const items = r.rows.map(row => ({
      id: row.id,
      name: row.name ?? '',
      sector: row.sector ?? '',
      stage: row.stage ?? '',
      location: row.location ?? '',
      logo: row.logo ?? null,
      status: row.status ?? '',
      needs: row.needs ?? null,
      join_date: row.join_date instanceof Date ? row.join_date.toISOString() : row.join_date,
      legal_status: row.legal_status ?? null
    }))
    return res.status(200).json({ items, total, page, limit, partial: false })
  } catch (e) {
    console.warn('[startups] list error', e)
    return res.status(200).json({ partial: true, items: [], error: 'query_failed' })
  } finally { client.release() }
}
