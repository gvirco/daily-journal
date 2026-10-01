import './App.css'

function App() {
  const today = new Date()
  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(today)

  return (
    <main className="journal-shell">
      <header className="journal-header">
        <h1 className="journal-title">Daily Journal</h1>
        <time className="journal-date" dateTime={today.toISOString().slice(0, 10)}>
          {formattedDate}
        </time>
      </header>
    </main>
  )
}

export default App
