import assert from 'node:assert/strict'
import type { Server } from 'node:http'
import { mkdtempSync, rmSync } from 'node:fs'
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

function sessionCookie(response: Response): string {
  const cookie = response.headers.getSetCookie()[0]
  if (cookie === undefined) throw new Error('Expected a session cookie.')
  return cookie.split(';', 1)[0]
}

test('registers, authenticates, persists sessions, and logs out users', async (testContext) => {
  const temporaryDirectory = mkdtempSync(join(tmpdir(), 'daily-journal-auth-'))
  const databasePath = join(temporaryDirectory, 'journal.sqlite')
  testContext.after(() => {
    try {
      rmSync(temporaryDirectory, { force: true, maxRetries: 3, recursive: true, retryDelay: 100 })
    } catch {
      // Windows may retain a temporary SQLite handle briefly after the test exits.
    }
  })

  let api = await startServer(databasePath)
  assert.equal((await fetch(`${api.baseUrl}/api/auth/me`)).status, 401)

  const invalidRegistration = await fetch(`${api.baseUrl}/api/auth/register`, {
    body: JSON.stringify({ username: 'no', password: 'short' }),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  })
  assert.equal(invalidRegistration.status, 400)

  const registration = await fetch(`${api.baseUrl}/api/auth/register`, {
    body: JSON.stringify({ username: 'journal-user', password: 'correct horse battery staple' }),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  })
  assert.equal(registration.status, 201)
  assert.deepEqual(await registration.json(), { user: { id: 1, username: 'journal-user' } })
  const registeredCookie = sessionCookie(registration)
  assert.match(registration.headers.getSetCookie()[0] ?? '', /HttpOnly/)
  assert.match(registration.headers.getSetCookie()[0] ?? '', /SameSite=Lax/)

  const duplicateRegistration = await fetch(`${api.baseUrl}/api/auth/register`, {
    body: JSON.stringify({ username: 'journal-user', password: 'another good password' }),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  })
  assert.equal(duplicateRegistration.status, 409)

  await stopServer(api)
  api = await startServer(databasePath)
  const persistedSession = await fetch(`${api.baseUrl}/api/auth/me`, { headers: { cookie: registeredCookie } })
  assert.equal(persistedSession.status, 200)
  assert.deepEqual(await persistedSession.json(), { user: { id: 1, username: 'journal-user' } })

  const invalidLogin = await fetch(`${api.baseUrl}/api/auth/login`, {
    body: JSON.stringify({ username: 'journal-user', password: 'wrong password' }),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  })
  assert.equal(invalidLogin.status, 401)

  const login = await fetch(`${api.baseUrl}/api/auth/login`, {
    body: JSON.stringify({ username: 'journal-user', password: 'correct horse battery staple' }),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  })
  assert.equal(login.status, 200)
  const loginCookie = sessionCookie(login)

  const httpsLogin = await fetch(`${api.baseUrl}/api/auth/login`, {
    body: JSON.stringify({ username: 'journal-user', password: 'correct horse battery staple' }),
    headers: { 'content-type': 'application/json', 'x-forwarded-proto': 'https' },
    method: 'POST',
  })
  assert.match(httpsLogin.headers.getSetCookie()[0] ?? '', /Secure/)

  const logout = await fetch(`${api.baseUrl}/api/auth/logout`, { headers: { cookie: loginCookie }, method: 'POST' })
  assert.equal(logout.status, 204)
  assert.equal((await fetch(`${api.baseUrl}/api/auth/me`, { headers: { cookie: loginCookie } })).status, 401)
  await stopServer(api)
})
