import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({
  deleteJournalEntry: vi.fn(),
  getAllJournalEntries: vi.fn(),
  getCurrentUser: vi.fn(),
  getJournalEntry: vi.fn(),
  logout: vi.fn(),
  onAuthStateChange: vi.fn(),
  saveJournalEntry: vi.fn(),
}))

vi.mock('../src/services/journalApi', () => ({
  ApiError: class ApiError extends Error {
    status: number | undefined

    constructor(message: string, status?: number) {
      super(message)
      this.status = status
    }
  },
  deleteJournalEntry: api.deleteJournalEntry,
  getAllJournalEntries: api.getAllJournalEntries,
  getCurrentUser: api.getCurrentUser,
  getJournalEntry: api.getJournalEntry,
  logout: api.logout,
  onAuthStateChange: api.onAuthStateChange,
  saveJournalEntry: api.saveJournalEntry,
}))

import App from '../src/App'

const user = { email: 'person@example.com', id: 'user-1' }
const entry = { date: '2026-10-13', goals: [{ completed: false, text: 'Existing priority' }] }

describe('journal deletion', () => {
  beforeEach(() => {
    api.getCurrentUser.mockResolvedValue(user)
    api.getAllJournalEntries.mockResolvedValue([])
    api.getJournalEntry.mockResolvedValue(entry)
    api.saveJournalEntry.mockResolvedValue(undefined)
    api.deleteJournalEntry.mockResolvedValue(undefined)
    api.logout.mockResolvedValue(undefined)
    api.onAuthStateChange.mockReturnValue(() => undefined)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('flushes a pending edit before deletion and leaves the selected day empty', async () => {
    render(<App />)

    const priority = await screen.findByLabelText('Priority 1') as HTMLInputElement
    await waitFor(() => expect(priority.value).toBe('Existing priority'))
    fireEvent.change(priority, { target: { value: 'Edited priority' } })
    fireEvent.click(screen.getByRole('button', { name: 'Delete entry' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete entry' }))

    await waitFor(() => expect(api.deleteJournalEntry).toHaveBeenCalledOnce())
    expect(api.saveJournalEntry.mock.invocationCallOrder[0]).toBeLessThan(api.deleteJournalEntry.mock.invocationCallOrder[0])
    expect((screen.getByLabelText('Priority 1') as HTMLInputElement).value).toBe('')
  })

  it('keeps the entry visible and reports a failed deletion', async () => {
    api.deleteJournalEntry.mockRejectedValueOnce(new Error('Network unavailable'))
    render(<App />)

    const priority = await screen.findByLabelText('Priority 1') as HTMLInputElement
    await waitFor(() => expect(priority.value).toBe('Existing priority'))
    fireEvent.click(screen.getByRole('button', { name: 'Delete entry' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete entry' }))

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('Network unavailable')
    expect((screen.getByLabelText('Priority 1') as HTMLInputElement).value).toBe('Existing priority')
  })

  it('opens search and navigates to a matching historical date', async () => {
    api.getAllJournalEntries.mockResolvedValueOnce([{ date: '2026-01-01', title: 'Winter reflection', notes: 'Snow day' }])
    render(<App />)
    await screen.findByLabelText('Priority 1')
    fireEvent.click(screen.getByRole('button', { name: 'Search' }))
    const searchInput = await screen.findByLabelText('Search title and content')
    fireEvent.change(searchInput, { target: { value: 'WINTER' } })
    fireEvent.click(await screen.findByRole('button', { name: /Winter reflection/ }))
    await waitFor(() => expect(api.getJournalEntry).toHaveBeenCalledWith('2026-01-01', expect.any(AbortSignal)))
  })

  it('saves an optional title via the existing journal autosave', async () => {
    render(<App />)
    await screen.findByLabelText('Priority 1')
    fireEvent.click(screen.getByRole('button', { name: /Daily Notebook/ }))
    const titleInput = screen.getByLabelText('Journal title (optional)')
    fireEvent.change(titleInput, { target: { value: 'My milestone' } })
    fireEvent.blur(titleInput)
    await waitFor(() => expect(api.saveJournalEntry).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'My milestone' }), user.id,
    ))
  })

  it('uses native input validation attributes for registration fields', async () => {
    const { AuthScreen } = await import('../src/components/AuthScreen')
    render(<AuthScreen initialError={null} onAuthenticated={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Need an account? Register' }))
    const email = screen.getByLabelText('Email') as HTMLInputElement
    const password = screen.getByLabelText('Password') as HTMLInputElement

    expect(email.type).toBe('email')
    expect(email.required).toBe(true)
    expect(password.minLength).toBe(8)
    expect(password.required).toBe(true)
  })
})
