import { useState } from 'react'
import type { DailyJournalEntry, MorningJournal, Rating10 } from './domain/DailyJournalEntry'
import './App.css'
import { getJournalEntry, saveJournalEntry } from './services/journalStorage'

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

function App() {
  const [selectedDate, setSelectedDate] = useState(getCurrentLocalDate)
  const [journalEntry, setJournalEntry] = useState<DailyJournalEntry | null>(() =>
    getJournalEntry(toDateInputValue(getCurrentLocalDate())),
  )
  const [isMorningOpen, setIsMorningOpen] = useState(false)
  const today = getCurrentLocalDate()
  const selectedDateValue = toDateInputValue(selectedDate)
  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(selectedDate)
  const isToday = selectedDateValue === toDateInputValue(today)

  function selectDate(date: Date) {
    setSelectedDate(date)
    setJournalEntry(getJournalEntry(toDateInputValue(date)))
    setIsMorningOpen(false)
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

    saveJournalEntry(updatedEntry)
    setJournalEntry(updatedEntry)
  }

  const morning = journalEntry?.morning

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
      </header>

      <section className="journal-dashboard" aria-label="Journal entry">
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
      </section>

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
    </main>
  )
}

export default App
