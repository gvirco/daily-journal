import type { DailyJournalEntry } from '../domain/DailyJournalEntry'

export type AuthenticatedUser = {
  id: number
  username: string
}

type UserResponse = {
  user: AuthenticatedUser
}

export class ApiError extends Error {
  readonly status: number

  constructor(
    message: string,
    status: number,
  ) {
    super(message)
    this.status = status
  }
}

async function request(path: string, options: RequestInit = {}): Promise<Response> {
  const response = await fetch(path, { credentials: 'include', ...options })
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null
    throw new ApiError(body?.error ?? 'The request could not be completed.', response.status)
  }

  return response
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const response = await request('/api/auth/me')
    return (await response.json() as UserResponse).user
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}

export async function register(username: string, password: string): Promise<AuthenticatedUser> {
  const response = await request('/api/auth/register', {
    body: JSON.stringify({ password, username }),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  })
  return (await response.json() as UserResponse).user
}

export async function login(username: string, password: string): Promise<AuthenticatedUser> {
  const response = await request('/api/auth/login', {
    body: JSON.stringify({ password, username }),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  })
  return (await response.json() as UserResponse).user
}

export async function logout(): Promise<void> {
  await request('/api/auth/logout', { method: 'POST' })
}

export async function getJournalEntry(date: string, signal?: AbortSignal): Promise<DailyJournalEntry | null> {
  try {
    const response = await request(`/api/entries/${date}`, { signal })
    return await response.json() as DailyJournalEntry
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export async function saveJournalEntry(entry: DailyJournalEntry): Promise<void> {
  await request(`/api/entries/${entry.date}`, {
    body: JSON.stringify(entry),
    headers: { 'content-type': 'application/json' },
    method: 'PUT',
  })
}
