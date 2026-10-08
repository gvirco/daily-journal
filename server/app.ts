import { createHash, randomBytes } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import argon2 from 'argon2'
import express, { type Express, type Request, type Response } from 'express'

const sessionCookieName = 'daily_journal_session'
const sessionLifetimeSeconds = 60 * 60 * 24 * 30
const usernamePattern = /^[A-Za-z0-9_-]{3,32}$/

type UserRecord = { id: number; username: string; password_hash: string | null }
type PublicUser = { id: number; username: string }
type Credentials = { username: string; password: string }

function publicUser(user: UserRecord): PublicUser {
  return { id: user.id, username: user.username }
}

function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function getCookie(request: Request, name: string): string | undefined {
  const cookie = (request.headers.cookie?.split(';') ?? []).find((value) => value.trim().startsWith(`${name}=`))
  return cookie?.trim().slice(name.length + 1)
}

function isSecureRequest(request: Request): boolean {
  return request.secure || request.get('x-forwarded-proto') === 'https'
}

function setSessionCookie(request: Request, response: Response, token: string): void {
  response.cookie(sessionCookieName, token, {
    httpOnly: true,
    maxAge: sessionLifetimeSeconds * 1000,
    sameSite: 'lax',
    secure: isSecureRequest(request),
  })
}

function clearSessionCookie(request: Request, response: Response): void {
  response.clearCookie(sessionCookieName, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureRequest(request),
  })
}

function credentialsFrom(request: Request): Credentials | undefined {
  const body = request.body as Partial<Credentials> | undefined
  if (typeof body?.username !== 'string' || typeof body.password !== 'string') return undefined

  const username = body.username.trim()
  if (!usernamePattern.test(username) || body.password.length < 8 || body.password.length > 128) return undefined

  return { username, password: body.password }
}

function findUserByUsername(database: DatabaseSync, username: string): UserRecord | undefined {
  return database.prepare('SELECT id, username, password_hash FROM users WHERE username = ?').get(username) as UserRecord | undefined
}

function createSession(database: DatabaseSync, userId: number): string {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + sessionLifetimeSeconds * 1000).toISOString()
  database.prepare('INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)').run(userId, hashSessionToken(token), expiresAt)
  return token
}

function sessionUser(database: DatabaseSync, request: Request): UserRecord | undefined {
  const token = getCookie(request, sessionCookieName)
  if (token === undefined) return undefined

  return database.prepare(`
    SELECT users.id, users.username, users.password_hash
    FROM sessions INNER JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?
  `).get(hashSessionToken(token), new Date().toISOString()) as UserRecord | undefined
}

export function createApp(database: DatabaseSync): Express {
  const app = express()
  app.set('trust proxy', 1)
  app.use(express.json({ limit: '16kb' }))

  app.get('/health', (_request, response) => response.status(200).json({ status: 'ok' }))

  app.post('/api/auth/register', async (request, response) => {
    const credentials = credentialsFrom(request)
    if (credentials === undefined) return response.status(400).json({ error: 'Username or password is invalid.' })
    if (findUserByUsername(database, credentials.username) !== undefined) return response.status(409).json({ error: 'Username is already in use.' })

    const passwordHash = await argon2.hash(credentials.password, { type: argon2.argon2id })
    try {
      const result = database.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(credentials.username, passwordHash)
      const user: UserRecord = { id: Number(result.lastInsertRowid), password_hash: passwordHash, username: credentials.username }
      setSessionCookie(request, response, createSession(database, user.id))
      return response.status(201).json({ user: publicUser(user) })
    } catch (error) {
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed: users.username')) {
        return response.status(409).json({ error: 'Username is already in use.' })
      }
      throw error
    }
  })

  app.post('/api/auth/login', async (request, response) => {
    const credentials = credentialsFrom(request)
    if (credentials === undefined) return response.status(401).json({ error: 'Invalid username or password.' })

    const user = findUserByUsername(database, credentials.username)
    if (user?.password_hash === null || user === undefined || !(await argon2.verify(user.password_hash, credentials.password))) {
      return response.status(401).json({ error: 'Invalid username or password.' })
    }

    setSessionCookie(request, response, createSession(database, user.id))
    return response.status(200).json({ user: publicUser(user) })
  })

  app.post('/api/auth/logout', (request, response) => {
    const token = getCookie(request, sessionCookieName)
    if (token !== undefined) database.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashSessionToken(token))
    clearSessionCookie(request, response)
    return response.status(204).end()
  })

  app.get('/api/auth/me', (request, response) => {
    const user = sessionUser(database, request)
    if (user === undefined) return response.status(401).json({ error: 'Unauthorized.' })
    return response.status(200).json({ user: publicUser(user) })
  })

  return app
}
