import { useEffect, useMemo, useRef, useState } from 'react'
import type { DailyJournalEntry } from '../domain/DailyJournalEntry'
import { getJournalSearchExcerpt, matchesJournalEntry } from '../domain/journalSearch'
import { ApiError, getAllJournalEntries } from '../services/journalApi'

type SearchState =
  | { status: 'loading'; entries: DailyJournalEntry[] }
  | { status: 'ready'; entries: DailyJournalEntry[] }
  | { status: 'error'; entries: DailyJournalEntry[]; message: string }

type Props = {
  onClose: () => void
  onSelectDate: (date: string) => void
  onSessionExpired: () => void
}

export function JournalSearch({ onClose, onSelectDate, onSessionExpired }: Props) {
  const [query, setQuery] = useState('')
  const [reload, setReload] = useState(0)
  const [state, setState] = useState<SearchState>({ status: 'loading', entries: [] })
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    getAllJournalEntries(controller.signal)
      .then((entries) => {
        if (active && !controller.signal.aborted) setState({ status: 'ready', entries })
      })
      .catch((error: unknown) => {
        if (!active || controller.signal.aborted) return
        if (error instanceof ApiError && error.status === 401) {
          onSessionExpired()
          return
        }
        setState({
          status: 'error',
          entries: [],
          message: error instanceof Error ? error.message : 'Unable to search journal entries.',
        })
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [reload, onSessionExpired])

  const results = useMemo(
    () => state.status === 'ready' ? state.entries.filter((entry) => matchesJournalEntry(entry, query)) : [],
    [state, query],
  )
  const hasQuery = query.trim().length > 0

  function retry() {
    setState({ status: 'loading', entries: [] })
    setReload((value) => value + 1)
  }

  return (
    <div className="morning-modal-backdrop">
      <section className="morning-modal search-modal" role="dialog" aria-modal="true" aria-labelledby="search-modal-title">
        <div className="morning-modal-header">
          <div>
            <p className="morning-modal-eyebrow">Journal history</p>
            <h2 id="search-modal-title">Search entries</h2>
          </div>
          <button className="morning-modal-close" type="button" onClick={onClose} aria-label="Close journal search">Close</button>
        </div>
        <label className="search-label" htmlFor="journal-search-query">Search title and content</label>
        <input
          ref={inputRef}
          className="search-input"
          id="journal-search-query"
          type="search"
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find a day, idea or reflection"
        />
        {state.status === 'loading' ? (
          <p className="search-status" role="status">Loading journal history…</p>
        ) : state.status === 'error' ? (
          <div className="search-error" role="alert">
            <span>{state.message}</span>
            <button type="button" className="date-navigation-button" onClick={retry}>Retry</button>
          </div>
        ) : !hasQuery ? (
          <p className="search-status">Enter a term to search your saved entries.</p>
        ) : results.length === 0 ? (
          <p className="search-status" role="status">No matching entries.</p>
        ) : (
          <>
            <p className="search-status" role="status">{results.length} matching {results.length === 1 ? 'entry' : 'entries'}</p>
            <ul className="search-results">
              {results.map((entry) => (
                <li key={entry.date}>
                  <button className="search-result" type="button" onClick={() => onSelectDate(entry.date)}>
                    <time className="search-result-date" dateTime={entry.date}>{entry.date}</time>
                    <span className="search-result-title">{entry.title?.trim() || 'Untitled entry'}</span>
                    <span className="search-result-preview">{getJournalSearchExcerpt(entry, query)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  )
}
