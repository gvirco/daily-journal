import { useState, type FormEvent } from 'react'
import type { AuthenticatedUser } from '../services/journalApi'
import { login, register } from '../services/journalApi'

type AuthScreenProps = {
  initialError: string | null
  onAuthenticated: (user: AuthenticatedUser) => void
}

export function AuthScreen({ initialError, onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(initialError)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const user = mode === 'login' ? await login(username, password) : await register(username, password)
      onAuthenticated(user)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to sign in.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="auth-title">
        <p className="auth-eyebrow">Daily Journal</p>
        <h1 id="auth-title">{mode === 'login' ? 'Welcome back' : 'Create your journal'}</h1>
        <p className="auth-copy">{mode === 'login' ? 'Sign in to continue your daily practice.' : 'Start with a username and password.'}</p>

        <form className="auth-form" onSubmit={submit}>
          <label className="auth-label" htmlFor="username">Username</label>
          <input
            autoComplete="username"
            className="auth-input"
            id="username"
            maxLength={32}
            minLength={3}
            onChange={(event) => setUsername(event.target.value)}
            required
            value={username}
          />
          <label className="auth-label" htmlFor="password">Password</label>
          <input
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            className="auth-input"
            id="password"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
          {error !== null && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Please wait' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button
          className="auth-switch"
          onClick={() => { setError(null); setMode(mode === 'login' ? 'register' : 'login') }}
          type="button"
        >
          {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Sign in'}
        </button>
      </section>
    </main>
  )
}
