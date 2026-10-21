import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({ getAllJournalEntries: vi.fn() }))
vi.mock('../src/services/journalApi', () => ({
  ApiError: class ApiError extends Error {
    status: number | undefined
    constructor(message: string, status?: number) {
      super(message)
      this.status = status
    }
  },
  getAllJournalEntries: api.getAllJournalEntries,
}))
import { ApiError } from '../src/services/journalApi'
import { JournalSearch } from '../src/components/JournalSearch'

const records = [
  { date: '2026-10-13', title: 'Planning day', notes: 'Architecture work' },
  { date: '2026-01-01', notes: 'Winter running' },
]
const onClose = vi.fn()
const onSelectDate = vi.fn()
const onSessionExpired = vi.fn()

beforeEach(() => {
  api.getAllJournalEntries.mockReset()
  onClose.mockReset()
  onSelectDate.mockReset()
  onSessionExpired.mockReset()
})
afterEach(() => cleanup())

describe('journal search dialog', () => {
  it.each([390, 1280])('finds and opens matching entries at a %ipx viewport', async (width) => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
    api.getAllJournalEntries.mockResolvedValue(records)
    render(<JournalSearch onClose={onClose} onSelectDate={onSelectDate} onSessionExpired={onSessionExpired} />)
    const input = screen.getByLabelText('Search title and content') as HTMLInputElement
    await waitFor(() => expect(document.activeElement).toBe(input))
    fireEvent.change(input, { target: { value: 'PLAN' } })
    expect(await screen.findByText('1 matching entry')).toBeTruthy()
    expect(screen.queryByText('Winter running')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Planning day/ }))
    expect(onSelectDate).toHaveBeenCalledWith('2026-10-13')
  })

  it('shows loading, initial guidance and no matches', async () => {
    let resolveEntries: (entries: typeof records) => void = () => undefined
    api.getAllJournalEntries.mockReturnValue(new Promise<typeof records>((resolve) => { resolveEntries = resolve }))
    render(<JournalSearch onClose={onClose} onSelectDate={onSelectDate} onSessionExpired={onSessionExpired} />)
    expect(screen.getByText('Loading journal history…')).toBeTruthy()
    resolveEntries(records)
    expect(await screen.findByText('Enter a term to search your saved entries.')).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Search title and content'), { target: { value: 'unfindable' } })
    expect(screen.getByText('No matching entries.')).toBeTruthy()
  })

  it('shows errors and can retry successfully', async () => {
    api.getAllJournalEntries.mockRejectedValueOnce(new Error('Network unavailable')).mockResolvedValueOnce(records)
    render(<JournalSearch onClose={onClose} onSelectDate={onSelectDate} onSessionExpired={onSessionExpired} />)
    expect((await screen.findByRole('alert')).textContent).toContain('Network unavailable')
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText('Enter a term to search your saved entries.')).toBeTruthy()
    expect(api.getAllJournalEntries).toHaveBeenCalledTimes(2)
  })

  it('closes on Escape', () => {
    api.getAllJournalEntries.mockResolvedValue(records)
    render(<JournalSearch onClose={onClose} onSelectDate={onSelectDate} onSessionExpired={onSessionExpired} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('expires a revoked session without showing stale results', async () => {
    api.getAllJournalEntries.mockRejectedValue(new ApiError('Unauthorized', 401))
    render(<JournalSearch onClose={onClose} onSelectDate={onSelectDate} onSessionExpired={onSessionExpired} />)
    await waitFor(() => expect(onSessionExpired).toHaveBeenCalledOnce())
  })
})
