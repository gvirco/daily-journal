import { useState } from 'react'
import './App.css'

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
  const today = getCurrentLocalDate()
  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(selectedDate)
  const isToday = toDateInputValue(selectedDate) === toDateInputValue(today)

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
            onClick={() => setSelectedDate((date) => addCalendarDays(date, -1))}
          >
            Previous
          </button>
          <button
            className="date-navigation-button"
            type="button"
            onClick={() => setSelectedDate(getCurrentLocalDate())}
            disabled={isToday}
          >
            Today
          </button>
          <button
            className="date-navigation-button"
            type="button"
            onClick={() => setSelectedDate((date) => addCalendarDays(date, 1))}
          >
            Next
          </button>
        </nav>
      </header>
    </main>
  )
}

export default App
