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
        <p className="eyebrow">Your daily performance journal</p>
        <h1>Daily Journal</h1>
        <time dateTime={today.toISOString().slice(0, 10)}>{formattedDate}</time>
      </header>
    </main>
  )
}

export default App
