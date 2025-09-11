import type { NextApiRequest, NextApiResponse } from 'next'
import { getPool, sanitizeIdentifier, haveDbCreds } from '@/lib/db'

// Endpoint: GET /api/me/startup
// - reads Authorization: Bearer <token>
// - tries to decode JWT with SECRET_KEY (if token from Django backend)
// - if decode yields email or sub, use it to find user row and then startup row
// - returns startup detail similar to admin/startups detail response

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'PUT') return res.status(405).json({ error: 'method_not_allowed' })
  if (!haveDbCreds()) return res.status(500).json({ error: 'db_unavailable' })

  const auth = String(req.headers.authorization || '')
  let token: string | null = null
  if (auth.startsWith('Bearer ')) token = auth.split(' ',2)[1].trim()
  // when called from client, token will be forwarded in header

  // Try to obtain email for current user. Prefer calling the auth backend `/api/auth/me/` with the token.
  let emailFromToken: string | null = null
  if (token) {
    try {
      const base = (process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_BASE_URL || '')
      if (base) {
        try {
          const meRes = await fetch(`${base.replace(/\/$/, '')}/api/auth/me/`, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
          })
          if (meRes.ok) {
            const meJson = await meRes.json().catch(() => null)
            emailFromToken = meJson?.email || meJson?.data?.email || meJson?.user?.email || null
          }
        } catch (e) {
          // ignore network errors and fallback to DB lookups
        }
      }
    } catch (e) {}
  }

    const usersTable = sanitizeIdentifier(process.env.USERS_TABLE || 'users') || 'users'
    const usersEmailCol = sanitizeIdentifier(process.env.USERS_EMAIL_COLUMN || 'email') || 'email'
    const userStartupIdCol = sanitizeIdentifier(process.env.USERS_STARTUP_FK_COLUMN || 'startup_id') || 'startup_id'
    const startupsTable = sanitizeIdentifier(process.env.STARTUPS_TABLE || 'startups') || 'startups'
    const startupsEmailCol = sanitizeIdentifier(process.env.STARTUPS_EMAIL_COLUMN || 'contact_email') || 'contact_email'

  const client = await getPool().connect()
  try {
  // If we don't yet have an email, try to find it in the users table using token or treat token as email
    let emailToUse = emailFromToken
    if (!emailToUse && token) {
      try {
        // some setups store token in users table; try to find by token if a token column exists
        const tokenColCheck = await client.query(`SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name='token' LIMIT 1`, [usersTable.replace(/"/g,'')])
        if (tokenColCheck.rowCount) {
          const r = await client.query(`SELECT ${usersEmailCol} AS email FROM ${usersTable} WHERE token=$1 LIMIT 1`, [token])
          if (r.rowCount) emailToUse = r.rows[0].email
        }
      } catch (e) { /* ignore */ }
    }

    // If still no email, try to decode token as plain email (some clients store email directly as token)
    if (!emailToUse && token && token.includes('@')) emailToUse = token

    if (!emailToUse) return res.status(401).json({ error: 'no_email' })

    // find startup by email
    // detect actual email column existence on startups table
    let emailCol = startupsEmailCol
    try {
      const chk = await client.query(`SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name=$2 LIMIT 1`, [startupsTable.replace(/"/g,''), emailCol])
      if (chk.rowCount === 0) {
        const chk2 = await client.query(`SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name='email' LIMIT 1`, [startupsTable.replace(/"/g,'')])
        if (chk2.rowCount) emailCol = 'email'
      }
    } catch (e) { /* ignore */ }

  const idCol = 'id'
    const nameCol = sanitizeIdentifier(process.env.STARTUPS_NAME_COLUMN || 'name') || 'name'
    const sectorCol = sanitizeIdentifier(process.env.STARTUPS_SECTOR_COLUMN || 'sector') || 'sector'
    const stageCol = sanitizeIdentifier(process.env.STARTUPS_STAGE_COLUMN || 'stage') || 'stage'
    const locationCol = sanitizeIdentifier(process.env.STARTUPS_LOCATION_COLUMN || 'location') || 'location'
    const logoCol = sanitizeIdentifier(process.env.STARTUPS_LOGO_COLUMN || 'logo') || 'logo'
    const websiteCol = sanitizeIdentifier(process.env.STARTUPS_WEBSITE_COLUMN || 'site_web') || 'site_web'
    const phoneCol = sanitizeIdentifier(process.env.STARTUPS_PHONE_COLUMN || 'contact_tel') || 'phone'
    const needsCol = sanitizeIdentifier(process.env.STARTUPS_NEEDS_COLUMN || 'needs') || 'needs'
    const legalCol = sanitizeIdentifier(process.env.STARTUPS_LEGAL_STATUS_COLUMN || 'legal_status') || 'legal_status'
    const joinCol = sanitizeIdentifier(process.env.STARTUPS_JOIN_COLUMN || 'join_date') || 'join_date'
    const descCol = sanitizeIdentifier(process.env.STARTUPS_DESCRIPTION_COLUMN || 'description_courte') || 'description'
    const socialCol = sanitizeIdentifier(process.env.STARTUPS_SOCIAL_COLUMN || 'social_media_url') || 'social_media_url'
    const teamSizeCol = sanitizeIdentifier(process.env.STARTUPS_TEAM_SIZE_COLUMN || 'nb_pers') || 'team_size'

    // Build list of optional columns to probe (some peuvent ne pas exister)
    const optionalCols = [needsCol, legalCol, joinCol, descCol, socialCol, teamSizeCol]
    const existing: Record<string, boolean> = {}
    try {
      if (startupsTable) {
        const names = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name=$1`, [startupsTable.replace(/"/g,'')])
        const set = new Set(names.rows.map(r => r.column_name))
  optionalCols.forEach(c => { if (c && set.has(c)) existing[c] = true })
  // detect views column
  const hasViews = set.has('views')
  if (hasViews) existing['views'] = true
      }
    } catch {/* ignore */}

    const selectParts = [
      `${idCol} AS id`,
      `${nameCol} AS name`,
      `${sectorCol} AS sector`,
      `${stageCol} AS stage`,
      `${locationCol} AS location`,
      `${logoCol} AS logo`,
      `${websiteCol} AS website_url`,
      `${emailCol} AS email`,
      `${phoneCol} AS phone`,
      existing[needsCol] ? `${needsCol} AS needs` : `NULL AS needs`,
      existing[legalCol] ? `${legalCol} AS legal_status` : `NULL AS legal_status`,
      existing[joinCol] ? `${joinCol} AS join_date` : `NULL AS join_date`,
      existing[descCol] ? `${descCol} AS description` : `'' AS description`,
      existing[socialCol] ? `${socialCol} AS social_media_url` : `'' AS social_media_url`,
      existing[teamSizeCol] ? `${teamSizeCol} AS team_size` : `'' AS team_size`
  , existing['views'] ? `views` : `0 AS views`
    ]

    // Try alternate path: if users table has startup foreign key, fetch by id first
    let row: any = null
    try {
      const fkCheck = await client.query(`SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name=$2 LIMIT 1`, [usersTable.replace(/"/g,''), userStartupIdCol])
      if (fkCheck.rowCount) {
        const ur = await client.query(`SELECT ${userStartupIdCol} AS sid FROM ${usersTable} WHERE LOWER(${usersEmailCol}) = LOWER($1) LIMIT 1`, [emailToUse])
        if (ur.rowCount && ur.rows[0].sid) {
          const sid = ur.rows[0].sid
          const byIdSql = `SELECT ${selectParts.join(', ')} FROM ${startupsTable} WHERE ${idCol}=$1 LIMIT 1`
          const ir = await client.query(byIdSql, [sid])
          if (ir.rowCount) row = ir.rows[0]
        }
      }
    } catch { /* ignore */ }

    if (!row) {
  const detailSql = `SELECT ${selectParts.join(', ')} FROM ${startupsTable} WHERE LOWER(${emailCol}) = LOWER($1) LIMIT 1`
      const dr = await client.query(detailSql, [emailToUse])
      if (dr.rowCount) row = dr.rows[0]
    }
    if (!row) return res.status(404).json({ error: 'not_found' })

    if (req.method === 'PUT') {
      const body = req.body || {}
      const allowed: Record<string,string> = {
        name: nameCol,
        sector: sectorCol,
        stage: stageCol,
        location: locationCol,
        website_url: websiteCol,
        phone: phoneCol,
        description: descCol,
        needs: needsCol,
        team_size: teamSizeCol
      }
      const sets: string[] = []
      const values: any[] = []
      Object.entries(body).forEach(([k,v]) => {
        if (v === undefined || v === null) return
        const col = allowed[k]
        if (!col) return
        sets.push(`${col}=$${values.length+1}`)
        // If updating JSON-like column (needs), ensure we store a JSON string
        if (col === needsCol) {
          try {
            // If it's already a string, pass as-is; if array/object, stringify
            if (typeof v === 'string') values.push(v)
            else values.push(JSON.stringify(v))
          } catch { values.push(JSON.stringify(v)) }
        } else if (col === teamSizeCol) {
          // coerce numeric-looking team size to integer when possible
          if (typeof v === 'string' && /^\d+$/.test(v.trim())) values.push(parseInt(v.trim(), 10))
          else values.push(v)
        } else {
          values.push(v)
        }
      })
      if (!sets.length) return res.status(400).json({ error: 'nothing_to_update' })
      // identify startup row id (already in row.id)
      values.push(row.id)
      const updateSql = `UPDATE ${startupsTable} SET ${sets.join(', ')} WHERE ${idCol}=$${values.length}`
      await client.query(updateSql, values)
      return res.status(200).json({ ok: true })
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('[me/startup] resolved startup', { id: row.id, email: row.email })
    }
    return res.status(200).json({
      id: row.id,
      name: row.name ?? '',
      sector: row.sector ?? '',
      stage: row.stage ?? '',
      location: row.location ?? '',
  logo: row.logo ?? null,
      website_url: row.website_url ?? '',
      email: row.email ?? '',
      phone: row.phone ?? '',
      needs: row.needs ?? null,
      legal_status: row.legal_status ?? null,
      join_date: row.join_date instanceof Date ? row.join_date.toISOString() : row.join_date,
      description: row.description ?? '',
  views: row.views ?? 0,
      social_media_url: row.social_media_url ?? '',
      team_size: row.team_size ?? ''
    })
  } catch (e:any) {
    return res.status(500).json({ error: 'query_setup_failed', detail: e?.message || String(e) })
  } finally {
    client.release()
  }
}
