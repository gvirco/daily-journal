import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import type { Server } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { createApp } from './app.js'
import { initializeDatabase } from './db.js'

type RunningApi = {
  baseUrl: string
  database: ReturnType<typeof initializeDatabase>
  server: Server
}

async function startServer(databasePath: string): Promise<RunningApi> {
  const database = initializeDatabase(databasePath)
  const server = createApp(database).listen(0, '127.0.0.1')
  await new Promise<void>((resolve) => server.once('listening', resolve))
  const address = server.address()
  if (address === null || typeof address === 'string') throw new Error('Expected an HTTP server address.')
  return { baseUrl: `http://127.0.0.1:${address.port}`, database, server }
}

async function stopServer(api: RunningApi): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    api.server.close((error) => (error === undefined ? resolve() : reject(error)))
  })
  api.database.close()
}

async function register(api: RunningApi, username: string): Promise<string> {
  const response = await fetch(`${api.baseUrl}/api/auth/register`, {
    body: JSON.stringify({ username, password: 'correct horse battery staple' }),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  })
  assert.equal(response.status, 201)
  const cookie = response.headers.getSetCookie()[0]
  if (cookie === undefined) throw new Error('Expected a session cookie.')
  return cookie.split(';', 1)[0]
}

function jsonPut(baseUrl: string, date: string, entry: unknown, cookie?: string): Promise<Response> {
  return fetch(`${baseUrl}/api/entries/${date}`, {
    body: JSON.stringify(entry),
    headers: { 'content-type': 'application/json', ...(cookie === undefined ? {} : { cookie }) },
    method: 'PUT',
  })
}

test('creates, replaces, isolates, validates, and persists journal entries', async (testContext) => {
  const temporaryDirectory = mkdtempSync(join(tmpdir(), 'daily-journal-entries-'))
  const databasePath = join(temporaryDirectory, 'journal.sqlite')
  testContext.after(() => {
    try {
      rmSync(temporaryDirectory, { force: true, maxRetries: 3, recursive: true, retryDelay: 100 })
    } catch {
      // Windows may retain a temporary SQLite handle briefly after the test exits.
    }
  })

  let api = await startServer(databasePath)
  const firstUserCookie = await register(api, 'first-user')
  const secondUserCookie = await register(api, 'second-user')
  const date = '2026-10-08'
  const fullEntry = {
    date,
    evening: { dayRating: 8, whatDidILearn: 'Keep it simple.', whatDidNotWork: 'Too many meetings.', whatWorked: 'Deep work.' },
    goals: [{ completed: false, text: 'Ship the API' }],
    morning: { energy: 7, focus: 8, mood: 6 },
    notes: 'Implementation notes',
  }

  assert.equal((await fetch(`${api.baseUrl}/api/entries/${date}`)).status, 401)
  assert.equal((await jsonPut(api.baseUrl, date, fullEntry)).status, 401)
  assert.equal((await fetch(`${api.baseUrl}/api/entries/${date}`, { headers: { cookie: firstUserCookie } })).status, 404)

  assert.equal((await jsonPut(api.baseUrl, '2026-02-30', { date: '2026-02-30' }, firstUserCookie)).status, 400)
  assert.equal((await jsonPut(api.baseUrl, date, { ...fullEntry, date: '2026-10-09' }, firstUserCookie)).status, 400)
  assert.equal((await jsonPut(api.baseUrl, date, { ...fullEntry, morning: { energy: 11 } }, firstUserCookie)).status, 400)

  const creation = await jsonPut(api.baseUrl, date, fullEntry, firstUserCookie)
  assert.equal(creation.status, 200)
  assert.deepEqual(await creation.json(), fullEntry)

  const firstUserEntry = await fetch(`${api.baseUrl}/api/entries/${date}`, { headers: { cookie: firstUserCookie } })
  assert.equal(firstUserEntry.status, 200)
  assert.deepEqual(await firstUserEntry.json(), fullEntry)

  assert.equal((await fetch(`${api.baseUrl}/api/entries/${date}`, { headers: { cookie: secondUserCookie } })).status, 404)
  const secondUserEntry = { date, notes: 'Private second-user entry' }
  assert.equal((await jsonPut(api.baseUrl, date, secondUserEntry, secondUserCookie)).status, 200)

  const replacement = { date, notes: 'Only the replacement remains' }
  assert.equal((await jsonPut(api.baseUrl, date, replacement, firstUserCookie)).status, 200)
  const entryCount = api.database.prepare('SELECT COUNT(*) AS count FROM journal_entries WHERE user_id = ? AND entry_date = ?').get(1, date) as { count: number }
  assert.equal(entryCount.count, 1)

  await stopServer(api)
  api = await startServer(databasePath)
  const persistedEntry = await fetch(`${api.baseUrl}/api/entries/${date}`, { headers: { cookie: firstUserCookie } })
  assert.equal(persistedEntry.status, 200)
  assert.deepEqual(await persistedEntry.json(), replacement)
  const persistedSecondUserEntry = await fetch(`${api.baseUrl}/api/entries/${date}`, { headers: { cookie: secondUserCookie } })
  assert.deepEqual(await persistedSecondUserEntry.json(), secondUserEntry)
  await stopServer(api)
})
