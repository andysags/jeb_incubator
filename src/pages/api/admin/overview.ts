import type { NextApiRequest, NextApiResponse } from 'next'

// TODO: Remplacer par un fetch vers l'API Django ou requêtes directes DB.
// Pour l'instant, on lit éventuellement des variables d'environnement pour override.
// Ex: export STARTUPS_COUNT=120 INVESTORS_COUNT=45 EVENTS_COUNT=7

import { simpleCount, haveDbCreds } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Tables configurables
  const startupsTable = process.env.STARTUPS_TABLE
  const investorsTable = process.env.INVESTORS_TABLE
  const eventsTable = process.env.EVENTS_TABLE
  const usersTable = process.env.USERS_TABLE || 'users'

  let startups = 0, investors = 0, events = 0, users = 0
  let partial = false
  try {
    if (haveDbCreds()) {
      try {
        ;[startups, investors, events, users] = await Promise.all([
          simpleCount(startupsTable),
          simpleCount(investorsTable),
          simpleCount(eventsTable),
          simpleCount(usersTable)
        ])
      } catch (connErr) {
        // Fallback env si la connexion échoue
        partial = true
        startups = parseInt(process.env.STARTUPS_COUNT || '0', 10)
        investors = parseInt(process.env.INVESTORS_COUNT || '0', 10)
        events = parseInt(process.env.EVENTS_COUNT || '0', 10)
        users = parseInt(process.env.USERS_COUNT || '0', 10)
        if (process.env.ADMIN_OVERVIEW_DEBUG === 'true') {
          return res.status(200).json({ startups, investors, events, users, partial, debug: 'db_connect_failed' })
        }
      }
    } else {
      partial = true
      startups = parseInt(process.env.STARTUPS_COUNT || '0', 10)
      investors = parseInt(process.env.INVESTORS_COUNT || '0', 10)
      events = parseInt(process.env.EVENTS_COUNT || '0', 10)
      users = parseInt(process.env.USERS_COUNT || '0', 10)
    }
    res.status(200).json({ startups, investors, events, users, partial })
  } catch (e) {
    console.error('overview api error', e)
    if (process.env.ADMIN_OVERVIEW_DEBUG === 'true') {
      return res.status(200).json({ startups, investors, events, users, partial: true, debug: 'fatal:' + (e as Error).message })
    }
    res.status(500).json({ error: 'internal_error' })
  }
}
