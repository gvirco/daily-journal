import type { User } from '@supabase/supabase-js'
import type { DailyJournalEntry } from '../domain/DailyJournalEntry'
import { getSupabaseClient, type Json } from './supabase'

export type AuthenticatedUser = {
  id: string
  email: string
}

export class ApiError extends Error {
  readonly status: number | undefined

  constructor(message: string, status?: number) {
    super(message)
    this.status = status
  }
}

function toAuthenticatedUser(user: User): AuthenticatedUser {
  return { email: user.email ?? '', id: user.id }
}

function toApiError(error: { message: string; status?: number }): ApiError {
  return new ApiError(error.message, error.status)
}

async function requireCurrentUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser()
  if (user === null) throw new ApiError('You must be signed in to access journal entries.', 401)
  return user
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const { data, error } = await getSupabaseClient().auth.getSession()
  if (error !== null) throw toApiError(error)

  return data.session === null ? null : toAuthenticatedUser(data.session.user)
}

export async function register(email: string, password: string): Promise<AuthenticatedUser> {
  const { data, error } = await getSupabaseClient().auth.signUp({ email, password })
  if (error !== null) throw toApiError(error)
  if (data.user === null) throw new ApiError('Unable to create your account.')

  return toAuthenticatedUser(data.user)
}

export async function login(email: string, password: string): Promise<AuthenticatedUser> {
  const { data, error } = await getSupabaseClient().auth.signInWithPassword({ email, password })
  if (error !== null) throw toApiError(error)
  if (data.user === null) throw new ApiError('Unable to sign in.')

  return toAuthenticatedUser(data.user)
}

export async function logout(): Promise<void> {
  const { error } = await getSupabaseClient().auth.signOut()
  if (error !== null) throw toApiError(error)
}

export function onAuthStateChange(callback: (user: AuthenticatedUser | null) => void): () => void {
  const { data } = getSupabaseClient().auth.onAuthStateChange((_event, session) => {
    callback(session === null ? null : toAuthenticatedUser(session.user))
  })

  return () => data.subscription.unsubscribe()
}

export async function getJournalEntry(date: string, signal?: AbortSignal): Promise<DailyJournalEntry | null> {
  const user = await requireCurrentUser()
  const { data, error } = await getSupabaseClient()
    .from('journal_entries')
    .select('content')
    .eq('user_id', user.id)
    .eq('entry_date', date)
    .abortSignal(signal ?? new AbortController().signal)
    .maybeSingle()

  if (error !== null) throw toApiError(error)
  return data === null ? null : data.content as unknown as DailyJournalEntry
}

export async function getJournalEntriesForDateRange(
  startDate: string,
  endDate: string,
  signal?: AbortSignal,
): Promise<DailyJournalEntry[]> {
  const user = await requireCurrentUser()
  const { data, error } = await getSupabaseClient()
    .from('journal_entries')
    .select('content')
    .eq('user_id', user.id)
    .gte('entry_date', startDate)
    .lt('entry_date', endDate)
    .abortSignal(signal ?? new AbortController().signal)

  if (error !== null) throw toApiError(error)
  return data.map((row) => row.content as unknown as DailyJournalEntry)
}

export async function saveJournalEntry(entry: DailyJournalEntry, expectedUserId?: string): Promise<void> {
  const user = await requireCurrentUser()
  if (expectedUserId !== undefined && user.id !== expectedUserId) {
    throw new ApiError('Your session changed before this entry could be saved.', 401)
  }
  const { error } = await getSupabaseClient()
    .from('journal_entries')
    .upsert(
      { content: entry as unknown as Json, entry_date: entry.date, user_id: user.id },
      { onConflict: 'user_id,entry_date' },
    )

  if (error !== null) throw toApiError(error)
}

export async function deleteJournalEntry(date: string, expectedUserId?: string): Promise<void> {
  const user = await requireCurrentUser()
  if (expectedUserId !== undefined && user.id !== expectedUserId) {
    throw new ApiError('Your session changed before this entry could be deleted.', 401)
  }

  const { error } = await getSupabaseClient()
    .from('journal_entries')
    .delete()
    .eq('user_id', user.id)
    .eq('entry_date', date)

  if (error !== null) throw toApiError(error)
}
