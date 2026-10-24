import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({ createTask: vi.fn(), deleteTask: vi.fn(), getTasks: vi.fn(), updateTask: vi.fn() }))
vi.mock('../src/services/tasksApi', () => api)

import { TasksPage } from '../src/components/TasksPage'

describe('TasksPage', () => {
  beforeEach(() => {
    api.getTasks.mockResolvedValue([])
    api.createTask.mockResolvedValue({ id: 'task-1', title: 'Review plan', dueDate: '2026-10-31', priority: 'High', completed: false })
    api.updateTask.mockImplementation(async (_id: string, task: unknown) => task)
    api.deleteTask.mockResolvedValue(undefined)
  })
  afterEach(() => { cleanup(); vi.clearAllMocks() })

  it('selects a calendar day and persists a high-priority task', async () => {
    render(<TasksPage userId="user-1" onBack={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Add a task' }))
    fireEvent.change(screen.getByLabelText('Task'), { target: { value: 'Review plan' } })
    fireEvent.change(screen.getByLabelText('Priority'), { target: { value: 'High' } })
    fireEvent.click(screen.getByRole('button', { name: 'Due date' }))
    fireEvent.click(screen.getByRole('button', { name: /October 31st, 2026/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Add task' }))
    await waitFor(() => expect(api.createTask).toHaveBeenCalledWith({ title: 'Review plan', dueDate: '2026-10-31', priority: 'High' }, 'user-1'))
    expect(await screen.findByText('Review plan')).toBeTruthy()
  })

  it('sorts open tasks and can complete, edit, and confirm-delete a task', async () => {
    api.getTasks.mockResolvedValue([{ id: 'late', title: 'Later', dueDate: '2026-11-02', priority: 'Low', completed: false }, { id: 'early', title: 'Earlier', dueDate: '2026-10-20', priority: 'Medium', completed: false }])
    render(<TasksPage userId="user-1" onBack={vi.fn()} />)
    const list = await screen.findByRole('list', { name: 'Open tasks' })
    expect(list.textContent?.indexOf('Earlier')).toBeLessThan(list.textContent?.indexOf('Later') ?? 0)
    fireEvent.click(screen.getByLabelText('Complete Earlier'))
    await waitFor(() => expect(api.updateTask).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('button', { name: 'Task actions for Later' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }))
    const editDialog = screen.getByRole('dialog', { name: 'Edit task' })
    fireEvent.change(within(editDialog).getByLabelText('Task'), { target: { value: 'Edited' } })
    fireEvent.click(within(editDialog).getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Edit task' })).toBeNull())
    fireEvent.click(screen.getByRole('button', { name: 'Task actions for Edited' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }))
    const deleteDialog = screen.getByRole('dialog', { name: 'Delete task' })
    fireEvent.click(within(deleteDialog).getByRole('button', { name: 'Delete task' }))
    await waitFor(() => expect(api.deleteTask).toHaveBeenCalled())
  })

  it('does not duplicate a pending create request', async () => {
    let resolveCreate: (task: { id: string; title: string; dueDate: string; priority: 'High'; completed: boolean }) => void = () => undefined
    api.createTask.mockImplementationOnce(() => new Promise((resolve) => { resolveCreate = resolve }))
    render(<TasksPage userId="user-1" onBack={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Add a task' }))
    fireEvent.change(screen.getByLabelText('Task'), { target: { value: 'Only once' } })
    fireEvent.click(screen.getByRole('button', { name: 'Due date' }))
    fireEvent.click(screen.getByRole('button', { name: /October 31st, 2026/i }))
    const add = screen.getByRole('button', { name: 'Add task' })
    fireEvent.click(add); fireEvent.click(add)
    expect(api.createTask).toHaveBeenCalledOnce()
    expect((screen.getByRole('button', { name: 'Saving…' }) as HTMLButtonElement).disabled).toBe(true)
    resolveCreate({ id: 'one', title: 'Only once', dueDate: '2026-10-31', priority: 'High', completed: false })
    expect(await screen.findByText('Only once')).toBeTruthy()
  })

  it('keeps a newly created task when the initial load resolves afterwards', async () => {
    let resolveLoad: (tasks: Array<{ id: string; title: string; dueDate: string; priority: 'Medium'; completed: boolean }>) => void = () => undefined
    api.getTasks.mockImplementationOnce(() => new Promise((resolve) => { resolveLoad = resolve }))
    api.createTask.mockResolvedValueOnce({ id: 'created', title: 'Created while loading', dueDate: '2026-10-31', priority: 'Medium', completed: false })
    render(<TasksPage userId="user-1" onBack={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Add a task' }))
    fireEvent.change(screen.getByLabelText('Task'), { target: { value: 'Created while loading' } })
    fireEvent.click(screen.getByRole('button', { name: 'Due date' }))
    fireEvent.click(screen.getByRole('button', { name: /October 31st, 2026/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Add task' }))

    expect(await screen.findByText('Created while loading')).toBeTruthy()
    resolveLoad([{ id: 'stale', title: 'Stale server result', dueDate: '2026-10-30', priority: 'Medium', completed: false }])
    await waitFor(() => expect(screen.getByText('Created while loading')).toBeTruthy())
    expect(screen.queryByText('Stale server result')).toBeNull()
  })

  it('keeps an existing task after an update failure', async () => {
    api.getTasks.mockResolvedValue([{ id: 'task-1', title: 'Keep me', dueDate: '2026-10-31', priority: 'Medium', completed: false }])
    api.updateTask.mockRejectedValueOnce(new Error('Network unavailable'))
    render(<TasksPage userId="user-1" onBack={vi.fn()} />)
    fireEvent.click(await screen.findByLabelText('Complete Keep me'))
    expect((await screen.findByRole('alert')).textContent).toContain('Network unavailable')
    expect(screen.getByText('Keep me')).toBeTruthy()
  })

  it('keeps a task visible and reports a failed deletion', async () => {
    api.getTasks.mockResolvedValue([{ id: 'task-1', title: 'Keep delete', dueDate: '2026-10-31', priority: 'Medium', completed: false }])
    api.deleteTask.mockRejectedValueOnce(new Error('Delete unavailable'))
    render(<TasksPage userId="user-1" onBack={vi.fn()} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Task actions for Keep delete' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }))
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Delete task' })).getByRole('button', { name: 'Delete task' }))
    expect((await screen.findByRole('alert')).textContent).toContain('Delete unavailable')
    expect(screen.getByText('Keep delete')).toBeTruthy()
  })

  it('does not allow a delete to start while an update for that task is pending', async () => {
    let resolveUpdate: (task: { id: string; title: string; dueDate: string; priority: 'Medium'; completed: boolean }) => void = () => undefined
    api.getTasks.mockResolvedValue([{ id: 'task-1', title: 'Busy', dueDate: '2026-10-31', priority: 'Medium', completed: false }])
    api.updateTask.mockImplementationOnce(() => new Promise((resolve) => { resolveUpdate = resolve }))
    render(<TasksPage userId="user-1" onBack={vi.fn()} />)
    fireEvent.click(await screen.findByLabelText('Complete Busy'))
    await waitFor(() => expect(api.updateTask).toHaveBeenCalledOnce())
    expect((screen.getByRole('button', { name: 'Task actions for Busy' }) as HTMLButtonElement).disabled).toBe(true)
    expect(api.deleteTask).not.toHaveBeenCalled()
    resolveUpdate({ id: 'task-1', title: 'Busy', dueDate: '2026-10-31', priority: 'Medium', completed: true })
  })

  it('ignores a stale create result after switching accounts', async () => {
    let resolveCreate: (task: { id: string; title: string; dueDate: string; priority: 'Medium'; completed: boolean }) => void = () => undefined
    api.createTask.mockImplementationOnce(() => new Promise((resolve) => { resolveCreate = resolve }))
    const view = render(<TasksPage userId="user-a" onBack={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Add a task' }))
    fireEvent.change(screen.getByLabelText('Task'), { target: { value: 'From A' } })
    fireEvent.click(screen.getByRole('button', { name: 'Due date' })); fireEvent.click(screen.getByRole('button', { name: /October 31st, 2026/i })); fireEvent.click(screen.getByRole('button', { name: 'Add task' }))
    view.rerender(<TasksPage userId="user-b" onBack={vi.fn()} />)
    resolveCreate({ id: 'a-task', title: 'From A', dueDate: '2026-10-31', priority: 'Medium', completed: false })
    await waitFor(() => expect(screen.queryByText('From A')).toBeNull())
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('shows confirmation after a successful mutation', async () => {
    render(<TasksPage userId="user-1" onBack={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Add a task' }))
    fireEvent.change(screen.getByLabelText('Task'), { target: { value: 'Confirmed' } })
    fireEvent.click(screen.getByRole('button', { name: 'Due date' })); fireEvent.click(screen.getByRole('button', { name: /October 31st, 2026/i })); fireEvent.click(screen.getByRole('button', { name: 'Add task' }))
    expect((await screen.findByRole('status')).textContent).toContain('Task added.')
    expect(screen.queryByRole('alert')).toBeNull()
  })
  it('keeps progressive quick-add collapsed until explicitly opened', async () => {
    render(<TasksPage userId="user-1" onBack={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Add a task' })).toBeTruthy()
    expect(screen.queryByLabelText('Task')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Add a task' }))
    expect(screen.getByRole('dialog', { name: 'Add a new task' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog', { name: 'Add a new task' })).toBeNull()
  })

  it('collapses completed tasks by default and reopens them on demand', async () => {
    api.getTasks.mockResolvedValueOnce([
      { id: 'done', title: 'Finished task', dueDate: '2026-10-24', priority: 'Low', completed: true },
    ])
    render(<TasksPage userId="user-1" onBack={vi.fn()} />)
    const toggle = await screen.findByRole('button', { name: /Completed tasks \(1\)/ })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByText('Finished task')).toBeNull()
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByText('Finished task')).toBeTruthy()
  })

  it('exposes edit and delete via a contextual task-action menu', async () => {
    api.getTasks.mockResolvedValueOnce([
      { id: 'item', title: 'Review prototype', dueDate: '2026-10-24', priority: 'Medium', completed: false },
    ])
    render(<TasksPage userId="user-1" onBack={vi.fn()} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Task actions for Review prototype' }))
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeTruthy()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }))
    expect(screen.getByRole('dialog', { name: 'Edit task' })).toBeTruthy()
  })

})
