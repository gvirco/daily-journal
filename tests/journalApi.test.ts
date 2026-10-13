import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getSupabaseClient: vi.fn(),
}))

vi.mock('../src/services/supabase', () => ({
  getSupabaseClient: mocks.getSupabaseClient,
}))

import {
  ApiError,
  deleteJournalEntry,
  getCurrentUser,
  getJournalEntry,
  login,
  register,
  saveJournalEntry,
} from '../src/services/journalApi'

const user = { email: 'person@example.com', id: 'user-1' }

function createClient(options?: {
  authError?: { message: string; status?: number } | null
  session?: { user: typeof user } | null
  tableError?: { message: string; status?: number } | null
  content?: unknown
}) {
  const table = {
    abortSignal: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
    select: vi.fn(),
    upsert: vi.fn(),
  }
  const deleteQuery = { eq: vi.fn() }
  table.select.mockReturnValue(table)
  table.eq.mockReturnValue(table)
  table.abortSignal.mockReturnValue(table)
  table.delete.mockReturnValue(deleteQuery)
  deleteQuery.eq.mockReturnValueOnce(deleteQuery).mockResolvedValueOnce({ error: options?.tableError ?? null })
  table.maybeSingle.mockResolvedValue({ data: options?.content === undefined ? null : { content: options.content }, error: options?.tableError ?? null })
  table.upsert.mockResolvedValue({ error: options?.tableError ?? null })
  const auth = {
    getSession: vi.fn().mockResolvedValue({ data: { session: options?.session === undefined ? { user } : options.session }, error: options?.authError ?? null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: { user }, error: options?.authError ?? null }),
    signUp: vi.fn().mockResolvedValue({ data: { user }, error: options?.authError ?? null }),
  }

  return { client: { auth, from: vi.fn().mockReturnValue(table) }, deleteQuery, table }
}

describe('journalApi', () => {
  beforeEach(() => {
    mocks.getSupabaseClient.mockReset()
  })

  it('returns null for a normal signed-out session', async () => {
    const { client } = createClient({ session: null })
    mocks.getSupabaseClient.mockReturnValue(client)

    await expect(getCurrentUser()).resolves.toBeNull()
  })

  it('surfaces authentication service errors', async () => {
    const { client } = createClient({ authError: { message: 'Invalid login credentials', status: 400 } })
    mocks.getSupabaseClient.mockReturnValue(client)

    await expect(login('person@example.com', 'password')).rejects.toMatchObject<ApiError>({ message: 'Invalid login credentials', status: 400 })
    await expect(register('person@example.com', 'password')).rejects.toMatchObject<ApiError>({ message: 'Invalid login credentials', status: 400 })
  })

  it('loads and saves only the authenticated user date', async () => {
    const entry = { date: '2026-10-13', notes: 'A note' }
    const { client, table } = createClient({ content: entry })
    mocks.getSupabaseClient.mockReturnValue(client)

    await expect(getJournalEntry(entry.date)).resolves.toEqual(entry)
    await saveJournalEntry(entry, user.id)

    expect(table.eq).toHaveBeenCalledWith('user_id', user.id)
    expect(table.eq).toHaveBeenCalledWith('entry_date', entry.date)
    expect(table.upsert).toHaveBeenCalledWith(
      { content: entry, entry_date: entry.date, user_id: user.id },
      { onConflict: 'user_id,entry_date' },
    )
  })

  it('deletes only the authenticated user date', async () => {
    const { client, deleteQuery } = createClient()
    mocks.getSupabaseClient.mockReturnValue(client)

    await deleteJournalEntry('2026-10-13', user.id)

    expect(deleteQuery.eq).toHaveBeenCalledWith('user_id', user.id)
    expect(deleteQuery.eq).toHaveBeenCalledWith('entry_date', '2026-10-13')
  })

  it('rejects a save or delete if the session user changed before the request', async () => {
    const { client, table } = createClient()
    mocks.getSupabaseClient.mockReturnValue(client)

    await expect(saveJournalEntry({ date: '2026-10-13' }, 'another-user')).rejects.toMatchObject<ApiError>({ status: 401 })
    await expect(deleteJournalEntry('2026-10-13', 'another-user')).rejects.toMatchObject<ApiError>({ status: 401 })
    expect(table.upsert).not.toHaveBeenCalled()
    expect(table.delete).not.toHaveBeenCalled()
  })
})
