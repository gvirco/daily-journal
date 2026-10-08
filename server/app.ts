import { createHash, randomBytes } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import argon2 from 'argon2'
import express, { type Express, type Request, type Response } from 'express'
import type { DailyGoal, DailyJournalEntry, EveningReview, MorningJournal, Rating10 } from '../src/domain/DailyJournalEntry.js'

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasOnlyKeys(value: Record<string, unknown>, allowedKeys: string[]): boolean {
  return Object.keys(value).every((key) => allowedKeys.includes(key))
}

function isRating10(value: unknown): value is Rating10 {
  return Number.isInteger(value) && typeof value === 'number' && value >= 1 && value <= 10
}

function isRealDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const [year, month, day] = date.split('-').map(Number)
  const parsedDate = new Date(Date.UTC(year, month - 1, day))
  return parsedDate.getUTCFullYear() === year && parsedDate.getUTCMonth() === month - 1 && parsedDate.getUTCDate() === day
}

function validMorning(value: unknown): value is MorningJournal {
  if (!isRecord(value) || !hasOnlyKeys(value, ['energy', 'mood', 'focus'])) return false
  return Object.values(value).every((rating) => isRating10(rating))
}

function validGoals(value: unknown): value is DailyGoal[] {
  return Array.isArray(value) && value.every((goal) => {
    return isRecord(goal) && hasOnlyKeys(goal, ['text', 'completed']) && typeof goal.text === 'string' && typeof goal.completed === 'boolean'
  })
}

function validEvening(value: unknown): value is EveningReview {
  if (!isRecord(value) || !hasOnlyKeys(value, ['dayRating', 'whatWorked', 'whatDidNotWork', 'whatDidILearn'])) return false
  return Object.entries(value).every(([key, entry]) => {
    if (key === 'dayRating') return isRating10(entry)
    return typeof entry === 'string'
  })
}

function journalEntryFrom(value: unknown, date: string): DailyJournalEntry | undefined {
  if (!isRealDate(date) || !isRecord(value) || !hasOnlyKeys(value, ['date', 'morning', 'goals', 'notes', 'evening'])) return undefined
  if (value.date !== date) return undefined
  if (value.morning !== undefined && !validMorning(value.morning)) return undefined
  if (value.goals !== undefined && !validGoals(value.goals)) return undefined
  if (value.notes !== undefined && typeof value.notes !== 'string') return undefined
  if (value.evening !== undefined && !validEvening(value.evening)) return undefined
  return value as unknown as DailyJournalEntry
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

  app.get('/api/entries/:date', (request, response) => {
    const user = sessionUser(database, request)
    if (user === undefined) return response.status(401).json({ error: 'Unauthorized.' })
    if (!isRealDate(request.params.date)) return response.status(400).json({ error: 'Date must be a real YYYY-MM-DD value.' })

    const row = database.prepare('SELECT content FROM journal_entries WHERE user_id = ? AND entry_date = ?').get(user.id, request.params.date) as {
      content: string
    } | undefined
    if (row === undefined) return response.status(404).json({ error: 'Entry not found.' })

    return response.status(200).json(JSON.parse(row.content) as DailyJournalEntry)
  })

  app.put('/api/entries/:date', (request, response) => {
    const user = sessionUser(database, request)
    if (user === undefined) return response.status(401).json({ error: 'Unauthorized.' })

    const entry = journalEntryFrom(request.body, request.params.date)
    if (entry === undefined) return response.status(400).json({ error: 'Entry or date is invalid.' })

    database.prepare(`
      INSERT INTO journal_entries (user_id, entry_date, content)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id, entry_date) DO UPDATE SET content = excluded.content, updated_at = CURRENT_TIMESTAMP
    `).run(user.id, entry.date, JSON.stringify(entry))

    return response.status(200).json(entry)
  })

  return app
}
