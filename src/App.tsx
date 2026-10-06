import { useState } from 'react'
import type { DailyGoal, DailyJournalEntry, MorningJournal, Rating10 } from './domain/DailyJournalEntry'
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

    saveEntry(updatedEntry)
  }

  function saveEntry(entry: DailyJournalEntry) {
    saveJournalEntry(entry)
    setJournalEntry(entry)
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

  const morning = journalEntry?.morning
  const goals: DailyGoal[] = journalEntry?.goals ?? []

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
