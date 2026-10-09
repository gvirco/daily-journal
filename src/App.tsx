import { useEffect, useRef, useState } from 'react'
import type {
  DailyGoal,
  DailyJournalEntry,
  EveningReview,
  MorningJournal,
  Rating10,
} from './domain/DailyJournalEntry'
import './App.css'
import { AuthScreen } from './components/AuthScreen'
import {
  ApiError,
  getCurrentUser,
  getJournalEntry,
  logout,
  saveJournalEntry,
  type AuthenticatedUser,
} from './services/journalApi'

function getCurrentLocalDate() {
  const now = new Date()

  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function addCalendarDays(date: Date, days: number) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)

  return nextDate
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const eveningReflectionFields = [
  { field: 'whatWorked', label: 'What worked?' },
  { field: 'whatDidNotWork', label: "What didn't?" },
  { field: 'whatDidILearn', label: 'What did I learn?' },
] as const

function App() {
  const [selectedDate, setSelectedDate] = useState(getCurrentLocalDate)
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [journalEntry, setJournalEntry] = useState<DailyJournalEntry | null>(null)
  const [isEntryLoading, setIsEntryLoading] = useState(false)
  const [entryError, setEntryError] = useState<{ date: string; message: string; phase: 'load' | 'save' } | null>(null)
  const [pendingSaveCount, setPendingSaveCount] = useState(0)
  const [reloadNonce, setReloadNonce] = useState(0)
  const [isMorningOpen, setIsMorningOpen] = useState(false)
  const [isNotebookOpen, setIsNotebookOpen] = useState(false)
  const [isEveningOpen, setIsEveningOpen] = useState(false)
  const loadSequence = useRef(0)
  const entryRevisions = useRef(new Map<string, number>())
  const saveQueues = useRef(new Map<string, Promise<void>>())
  const today = getCurrentLocalDate()
  const selectedDateValue = toDateInputValue(selectedDate)
  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(selectedDate)
  const isToday = selectedDateValue === toDateInputValue(today)

  useEffect(() => {
    let isCurrent = true

    getCurrentUser()
      .then((restoredUser) => {
        if (isCurrent) setUser(restoredUser)
      })
      .catch((error: unknown) => {
        if (isCurrent) setAuthError(error instanceof Error ? error.message : 'Unable to restore your session.')
      })
      .finally(() => {
        if (isCurrent) setIsAuthLoading(false)
      })

    return () => { isCurrent = false }
  }, [])

  useEffect(() => {
    if (user === null) return

    const date = selectedDateValue
    const controller = new AbortController()
    const requestId = loadSequence.current + 1
    loadSequence.current = requestId
    const revisionAtRequestStart = entryRevisions.current.get(date) ?? 0
    queueMicrotask(() => {
      if (loadSequence.current === requestId) {
        setIsEntryLoading(true)
        setEntryError(null)
      }
    })

    getJournalEntry(date, controller.signal)
      .then((entry) => {
        const currentRevision = entryRevisions.current.get(date) ?? 0
        if (loadSequence.current === requestId && currentRevision === revisionAtRequestStart) setJournalEntry(entry)
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || loadSequence.current !== requestId) return
        if (error instanceof ApiError && error.status === 401) {
          setUser(null)
          return
        }
        setEntryError({ date, message: error instanceof Error ? error.message : 'Unable to load this entry.', phase: 'load' })
      })
      .finally(() => {
        if (loadSequence.current === requestId) setIsEntryLoading(false)
      })

    return () => controller.abort()
  }, [reloadNonce, selectedDateValue, user])

  function selectDate(date: Date) {
    setSelectedDate(date)
    setJournalEntry(null)
    setIsEntryLoading(true)
    setEntryError(null)
    setIsMorningOpen(false)
    setIsNotebookOpen(false)
    setIsEveningOpen(false)
  }

  function updateMorningRating(field: keyof MorningJournal, rating: Rating10) {
    const updatedEntry: DailyJournalEntry = {
      ...(journalEntry ?? { date: selectedDateValue }),
      date: selectedDateValue,
      morning: {
        ...journalEntry?.morning,
        [field]: rating,
      },
    }

    saveEntry(updatedEntry)
  }

  function saveEntry(entry: DailyJournalEntry) {
    const revision = (entryRevisions.current.get(entry.date) ?? 0) + 1
    entryRevisions.current.set(entry.date, revision)
    setEntryError(null)
    setJournalEntry(entry)
    setPendingSaveCount((count) => count + 1)

    const previousSave = saveQueues.current.get(entry.date) ?? Promise.resolve()
    const queuedSave = previousSave
      .catch(() => undefined)
      .then(() => saveJournalEntry(entry))
    saveQueues.current.set(entry.date, queuedSave)

    queuedSave
      .catch((error: unknown) => {
        if (entryRevisions.current.get(entry.date) !== revision) return
        if (error instanceof ApiError && error.status === 401) {
          setUser(null)
          return
        }
        setEntryError({ date: entry.date, message: error instanceof Error ? error.message : 'Unable to save your entry.', phase: 'save' })
      })
      .finally(() => {
        if (saveQueues.current.get(entry.date) === queuedSave) saveQueues.current.delete(entry.date)
        setPendingSaveCount((count) => Math.max(0, count - 1))
      })
  }

  async function handleLogout() {
    try {
      await logout()
    } finally {
      setUser(null)
      setJournalEntry(null)
    }
  }

  if (isAuthLoading) {
    return <main className="auth-shell"><p className="auth-status">Restoring your session…</p></main>
  }

  if (user === null) {
    return <AuthScreen initialError={authError} onAuthenticated={setUser} />
  }

  function updateGoalText(index: number, text: string) {
    const existingGoals = journalEntry?.goals ?? []
    const updatedGoals = Array.from(
      { length: Math.max(existingGoals.length, index + 1) },
      (_, goalIndex) => existingGoals[goalIndex] ?? { text: '', completed: false },
    )
    const currentGoal = updatedGoals[index]

    updatedGoals[index] = {
      ...currentGoal,
      text,
      completed: text.trim() === '' ? false : currentGoal.completed,
    }

    const goals = updatedGoals.some((goal) => goal.text.trim() !== '') ? updatedGoals : undefined
    saveEntry({
      ...(journalEntry ?? { date: selectedDateValue }),
      date: selectedDateValue,
      goals,
    })
  }

  function toggleGoalCompleted(index: number) {
    const goals = [...(journalEntry?.goals ?? [])]
    const goal = goals[index]

    if (!goal || goal.text.trim() === '') {
      return
    }

    goals[index] = { ...goal, completed: !goal.completed }
    saveEntry({
      ...(journalEntry ?? { date: selectedDateValue }),
      date: selectedDateValue,
      goals,
    })
  }

  function updateNotes(notes: string) {
    saveEntry({
      ...(journalEntry ?? { date: selectedDateValue }),
      date: selectedDateValue,
      notes: notes === '' ? undefined : notes,
    })
  }

  function updateEveningReview(update: Partial<EveningReview>) {
    const evening = { ...journalEntry?.evening, ...update }
    const hasEveningContent = Object.values(evening).some(
      (value) => value !== undefined && value !== '',
    )

    saveEntry({
      ...(journalEntry ?? { date: selectedDateValue }),
      date: selectedDateValue,
      evening: hasEveningContent ? evening : undefined,
    })
  }

  const morning = journalEntry?.morning
  const goals: DailyGoal[] = journalEntry?.goals ?? []
  const notes = journalEntry?.notes ?? ''
  const notesPreview = notes.trim() === '' ? null : notes.replace(/\s+/g, ' ').trim()
  const evening = journalEntry?.evening
  const reflectionCount = eveningReflectionFields.filter(
    ({ field }) => evening?.[field]?.trim() !== '',
  ).length

  return (
    <main className="journal-shell">
      <header className="journal-header">
        <h1 className="journal-title">Daily Journal</h1>
        <time className="journal-date" dateTime={toDateInputValue(selectedDate)}>
          {formattedDate}
        </time>
        <nav className="date-navigation" aria-label="Date navigation">
          <button
            className="date-navigation-button"
            type="button"
            onClick={() => selectDate(addCalendarDays(selectedDate, -1))}
          >
            Previous
          </button>
          <button
            className="date-navigation-button"
            type="button"
            onClick={() => selectDate(getCurrentLocalDate())}
            disabled={isToday}
          >
            Today
          </button>
          <button
            className="date-navigation-button"
            type="button"
            onClick={() => selectDate(addCalendarDays(selectedDate, 1))}
          >
            Next
          </button>
        </nav>
        <div className="journal-account">
          <span>Signed in as {user.username}</span>
          <button className="journal-logout" onClick={handleLogout} type="button">Sign out</button>
        </div>
        {entryError?.date === selectedDateValue && (
          <p className="journal-sync-status journal-sync-error" role="alert">{entryError.message}</p>
        )}
        {entryError?.date !== selectedDateValue && pendingSaveCount > 0 && (
          <p className="journal-sync-status" aria-live="polite">Saving changes…</p>
        )}
      </header>

      {isEntryLoading ? (
        <p className="journal-loading" aria-live="polite">Loading journal entry…</p>
      ) : entryError?.date === selectedDateValue && entryError.phase === 'load' ? (
        <div className="journal-load-error">
          <p>{entryError.message}</p>
          <button className="date-navigation-button" onClick={() => setReloadNonce((value) => value + 1)} type="button">Retry</button>
        </div>
      ) : (
      <section className="journal-dashboard" aria-label="Journal entry">
        <button
          className="notebook-card"
          type="button"
          onClick={() => setIsNotebookOpen(true)}
          aria-haspopup="dialog"
        >
          <span className="notebook-card-title">Daily Notebook</span>
          <span className="notebook-preview">
            {notesPreview === null
              ? 'Not entered'
              : notesPreview.length > 120
                ? `${notesPreview.slice(0, 120)}…`
                : notesPreview}
          </span>
        </button>

        <section className="goals-card" aria-labelledby="daily-goals-title">
          <div className="goals-card-header">
            <div>
              <p className="goals-card-eyebrow">Today</p>
              <h2 id="daily-goals-title">Daily Goals</h2>
            </div>
          </div>
          <ol className="goals-list">
            {Array.from({ length: 3 }, (_, index) => {
              const goal = goals[index]
              const isPopulated = goal?.text.trim() !== ''
              const position = index + 1

              return (
                <li
                  className={`goal-row ${index === 0 ? 'goal-row-primary' : ''}`}
                  key={position}
                >
                  <label className="goal-text-label">
                    <span>Goal #{position}</span>
                    <input
                      className="goal-text-input"
                      type="text"
                      value={goal?.text ?? ''}
                      onChange={(event) => updateGoalText(index, event.target.value)}
                      placeholder="Add a goal"
                    />
                  </label>
                  <div className="goal-actions">
                    <button
                      className="goal-completion-button"
                      type="button"
                      onClick={() => toggleGoalCompleted(index)}
                      aria-pressed={goal?.completed ?? false}
                      disabled={!isPopulated}
                    >
                      {goal?.completed ? 'Completed' : 'Complete'}
                    </button>
                    {isPopulated && (
                      <button
                        className="goal-clear-button"
                        type="button"
                        onClick={() => updateGoalText(index, '')}
                        aria-label={`Clear Goal #${position}`}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </section>

        <button
          className="morning-card"
          type="button"
          onClick={() => setIsMorningOpen(true)}
          aria-haspopup="dialog"
        >
          <span className="morning-card-title">Morning</span>
          <span className="morning-summary">
            <span className="morning-metric">
              <span className="morning-metric-value">{morning?.energy ?? '—'}</span>
              <span className="morning-metric-label">Energy</span>
            </span>
            <span className="morning-metric">
              <span className="morning-metric-value">{morning?.mood ?? '—'}</span>
              <span className="morning-metric-label">Mood</span>
            </span>
            <span className="morning-metric">
              <span className="morning-metric-value">{morning?.focus ?? '—'}</span>
              <span className="morning-metric-label">Focus</span>
            </span>
          </span>
        </button>

        <button
          className="notebook-card evening-card"
          type="button"
          onClick={() => setIsEveningOpen(true)}
          aria-haspopup="dialog"
        >
          <span className="notebook-card-title">Evening Review</span>
          <span className="evening-summary">
            <span className="evening-rating">
              <span className="evening-rating-value">{evening?.dayRating ?? '—'}</span>
              <span className="evening-rating-label">Day rating</span>
            </span>
            <span className="evening-reflection-status">
              {reflectionCount === 0
                ? 'Not entered'
                : `${reflectionCount} reflection${reflectionCount === 1 ? '' : 's'}`}
            </span>
          </span>
        </button>
      </section>
      )}

      {isMorningOpen && (
        <div className="morning-modal-backdrop">
          <section
            className="morning-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="morning-modal-title"
          >
            <div className="morning-modal-header">
              <div>
                <p className="morning-modal-eyebrow">Morning check-in</p>
                <h2 id="morning-modal-title">How do you feel today?</h2>
              </div>
              <button
                className="morning-modal-close"
                type="button"
                onClick={() => setIsMorningOpen(false)}
                aria-label="Close Morning check-in"
              >
                Close
              </button>
            </div>

            {(['energy', 'mood', 'focus'] as const).map((field) => (
              <fieldset className="rating-control" key={field}>
                <legend>{field[0].toUpperCase() + field.slice(1)}</legend>
                <div className="rating-options">
                  {Array.from({ length: 10 }, (_, index) => {
                    const rating = (index + 1) as Rating10
                    const isSelected = morning?.[field] === rating

                    return (
                      <button
                        className="rating-option"
                        type="button"
                        key={rating}
                        onClick={() => updateMorningRating(field, rating)}
                        aria-pressed={isSelected}
                      >
                        {rating}
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            ))}
          </section>
        </div>
      )}

      {isNotebookOpen && (
        <div className="morning-modal-backdrop">
          <section
            className="morning-modal notebook-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notebook-modal-title"
          >
            <div className="morning-modal-header">
              <div>
                <p className="morning-modal-eyebrow">Daily Notebook</p>
                <h2 id="notebook-modal-title">What is on your mind?</h2>
              </div>
              <div className="notebook-modal-actions">
                {notes !== '' && (
                  <button
                    className="goal-clear-button"
                    type="button"
                    onClick={() => updateNotes('')}
                  >
                    Clear
                  </button>
                )}
                <button
                  className="morning-modal-close"
                  type="button"
                  onClick={() => setIsNotebookOpen(false)}
                  aria-label="Close Daily Notebook"
                >
                  Close
                </button>
              </div>
            </div>
            <label className="notebook-text-label" htmlFor="daily-notes">
              Notes
            </label>
            <textarea
              className="notebook-textarea"
              id="daily-notes"
              value={notes}
              onChange={(event) => updateNotes(event.target.value)}
              placeholder="Write anything you want to remember or work through today."
              rows={10}
            />
          </section>
        </div>
      )}

      {isEveningOpen && (
        <div className="morning-modal-backdrop">
          <section
            className="morning-modal evening-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="evening-modal-title"
          >
            <div className="morning-modal-header">
              <div>
                <p className="morning-modal-eyebrow">Evening Review</p>
                <h2 id="evening-modal-title">Review your day</h2>
              </div>
              <button
                className="morning-modal-close"
                type="button"
                onClick={() => setIsEveningOpen(false)}
                aria-label="Close Evening Review"
              >
                Close
              </button>
            </div>

            <fieldset className="rating-control">
              <legend>Day rating</legend>
              {evening?.dayRating !== undefined && (
                <button
                  className="goal-clear-button"
                  type="button"
                  onClick={() => updateEveningReview({ dayRating: undefined })}
                >
                  Clear
                </button>
              )}
              <div className="rating-options">
                {Array.from({ length: 10 }, (_, index) => {
                  const rating = (index + 1) as Rating10
                  const isSelected = evening?.dayRating === rating

                  return (
                    <button
                      className="rating-option"
                      type="button"
                      key={rating}
                      onClick={() => updateEveningReview({ dayRating: rating })}
                      aria-pressed={isSelected}
                    >
                      {rating}
                    </button>
                  )
                })}
              </div>
            </fieldset>

            {eveningReflectionFields.map(({ field, label }) => (
              <div className="evening-reflection-field" key={field}>
                <label className="notebook-text-label" htmlFor={field}>
                  {label}
                </label>
                <textarea
                  className="notebook-textarea evening-textarea"
                  id={field}
                  value={evening?.[field] ?? ''}
                  onChange={(event) => updateEveningReview({ [field]: event.target.value || undefined })}
                  rows={3}
                />
              </div>
            ))}
          </section>
        </div>
      )}
    </main>
  )
}

export default App
