import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ getSupabaseClient: vi.fn() }))
vi.mock('../src/services/supabase', () => ({ getSupabaseClient: mocks.getSupabaseClient }))
import { ApiError, getAllJournalEntries } from '../src/services/journalApi'

const alice = { id: 'alice', email: 'a@example.com' }
const bob = { id: 'bob', email: 'b@example.com' }
const row = (index: number) => ({ entry_date: '2026-01-' + String(index % 28 + 1).padStart(2, '0'), content: { notes: 'Row ' + index } })

type Page = { data: ReturnType<typeof row>[]; error: null } | { data: null; error: { message: string; status: number } }
function setup(pages: Page[], session: { user: typeof alice } | null = { user: alice }) {
  const query = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), range: vi.fn(), abortSignal: vi.fn() }
  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  query.order.mockReturnValue(query)
  query.range.mockReturnValue(query)
  query.abortSignal.mockImplementation(async () => pages.shift())
  const auth = { getSession: vi.fn().mockResolvedValue({ data: { session }, error: null }) }
  const from = vi.fn().mockReturnValue(query)
  mocks.getSupabaseClient.mockReturnValue({ auth, from })
  return { auth, from, query }
}
beforeEach(() => mocks.getSupabaseClient.mockReset())

describe('complete historical journal retrieval', () => {
  it('fetches beyond a default page and filters by signed-in user', async () => {
    const { query, from } = setup([
      { data: Array.from({ length: 100 }, (_, i) => row(i)), error: null },
      { data: [row(100)], error: null },
    ])
    const results = await getAllJournalEntries()
    expect(results).toHaveLength(101)
    expect(results[100].notes).toBe('Row 100')
    expect(from).toHaveBeenCalledWith('journal_entries')
    expect(query.select).toHaveBeenCalledWith('entry_date, content')
    expect(query.eq).toHaveBeenCalledWith('user_id', alice.id)
    expect(query.order).toHaveBeenCalledWith('entry_date', { ascending: false })
    expect(query.range).toHaveBeenNthCalledWith(1, 0, 99)
    expect(query.range).toHaveBeenNthCalledWith(2, 100, 199)
  })

  it('does not issue queries for signed-out sessions', async () => {
    const { from } = setup([], null)
    await expect(getAllJournalEntries()).rejects.toMatchObject<ApiError>({ status: 401 })
    expect(from).not.toHaveBeenCalled()
  })

  it('propagates a later-page server failure instead of presenting partial results', async () => {
    const { query } = setup([
      { data: Array.from({ length: 100 }, (_, i) => row(i)), error: null },
      { data: null, error: { message: 'Database down', status: 503 } },
    ])
    await expect(getAllJournalEntries()).rejects.toMatchObject<ApiError>({ status: 503, message: 'Database down' })
    expect(query.range).toHaveBeenCalledTimes(2)
  })

  it('rejects data when account changes mid-pagination', async () => {
    const { auth } = setup([{ data: [row(0)], error: null }])
    auth.getSession.mockResolvedValueOnce({ data: { session: { user: alice } }, error: null })
      .mockResolvedValueOnce({ data: { session: { user: bob } }, error: null })
    await expect(getAllJournalEntries()).rejects.toMatchObject<ApiError>({ status: 401 })
  })

  it('navigates using the database date, not the JSON copy', async () => {
    setup([{ data: [{ entry_date: '2026-09-14', content: { date: '2000-01-01', notes: 'Correct date' } }], error: null }])
    expect((await getAllJournalEntries())[0].date).toBe('2026-09-14')
  })
})
