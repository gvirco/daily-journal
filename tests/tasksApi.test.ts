import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ getSupabaseClient: vi.fn() }))
vi.mock('../src/services/supabase', () => ({ getSupabaseClient: mocks.getSupabaseClient }))

import { ApiError } from '../src/services/journalApi'
import { createTask, deleteTask, getTasks, updateTask } from '../src/services/tasksApi'

const user = { id: 'user-1', email: 'one@example.com' }
function client(options?: { session?: { user: typeof user } | null; error?: { message: string; status?: number } | null }) {
  const table = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), abortSignal: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn(), single: vi.fn() }
  table.select.mockReturnValue(table); table.eq.mockReturnValue(table); table.order.mockReturnValue(table); table.abortSignal.mockResolvedValue({ data: [], error: options?.error ?? null })
  const deleteQuery = { eq: vi.fn() }
  deleteQuery.eq.mockReturnValueOnce(deleteQuery).mockResolvedValueOnce({ error: options?.error ?? null })
  table.insert.mockReturnValue(table); table.update.mockReturnValue(table); table.delete.mockReturnValue(deleteQuery); table.single.mockResolvedValue({ data: { id: 'task-1', title: 'Task', due_date: '2026-10-31', priority: 'High', completed: false }, error: options?.error ?? null })
  return { auth: { getSession: vi.fn().mockResolvedValue({ data: { session: options?.session === undefined ? { user } : options.session }, error: null }) }, from: vi.fn().mockReturnValue(table), table }
}
describe('tasksApi', () => {
  beforeEach(() => mocks.getSupabaseClient.mockReset())
  it('scopes reads and writes to the authenticated owner', async () => {
    const instance = client(); mocks.getSupabaseClient.mockReturnValue(instance)
    await getTasks(user.id); await createTask({ title: 'Task', dueDate: '2026-10-31', priority: 'High' }, user.id); await updateTask('task-1', { completed: true }, user.id); await deleteTask('task-1', user.id)
    expect(instance.table.eq).toHaveBeenCalledWith('user_id', user.id)
  })
  it('rejects unauthenticated and switched-session requests before database access', async () => {
    const signedOut = client({ session: null }); mocks.getSupabaseClient.mockReturnValue(signedOut)
    await expect(getTasks('user-1')).rejects.toBeInstanceOf(ApiError); expect(signedOut.from).not.toHaveBeenCalled()
    const switched = client(); mocks.getSupabaseClient.mockReturnValue(switched)
    await expect(createTask({ title: 'Task', dueDate: '2026-10-31', priority: 'Low' }, 'other-user')).rejects.toMatchObject({ status: 401 }); expect(switched.from).not.toHaveBeenCalled()
  })
  it('surfaces database failures without swallowing them', async () => {
    mocks.getSupabaseClient.mockReturnValue(client({ error: { message: 'RLS denied', status: 403 } }))
    await expect(getTasks(user.id)).rejects.toMatchObject({ message: 'RLS denied', status: 403 })
  })
})
