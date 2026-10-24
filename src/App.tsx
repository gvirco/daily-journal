import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  DailyGoal,
  DailyJournalEntry,
  EveningReview,
  MorningJournal,
  Rating10,
} from './domain/DailyJournalEntry'
import './App.css'
import { AuthScreen } from './components/AuthScreen'
import { JournalSearch } from './components/JournalSearch'
import { TasksPage } from './components/TasksPage'
import {
  ApiError,
  deleteJournalEntry,
  getCurrentUser,
  getJournalEntriesForDateRange,
  getJournalEntry,
  logout,
  onAuthStateChange,
  saveJournalEntry,
  type AuthenticatedUser,
} from './services/journalApi'
import { getWeatherForDate, type DailyWeather } from './services/weatherApi'

function getCurrentLocalDate() {
  const now = new Date()

  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function addCalendarDays(date: Date, days: number) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)

  return nextDate
}

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addCalendarMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
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

type CalendarEntryStatus = 'empty' | 'partial' | 'complete'

function hasText(value: string | undefined) {
  return value !== undefined && value.trim().length > 0
}

function getCalendarEntryStatus(entry: DailyJournalEntry | undefined): CalendarEntryStatus {
  if (entry === undefined) return 'empty'

  const hasActivity = hasText(entry.notes)
    || entry.goals?.some((goal) => hasText(goal.text)) === true
    || Object.values(entry.morning ?? {}).some((rating) => rating !== undefined)
    || entry.evening?.dayRating !== undefined
    || eveningReflectionFields.some(({ field }) => hasText(entry.evening?.[field]))

  if (!hasActivity) return 'empty'

  const hasCompletedGoals = Array.from({ length: 3 }, (_, index) => {
    const goal = entry.goals?.[index]
    return goal?.completed === true && hasText(goal.text)
  }).every(Boolean)
  const hasMorningRatings = entry.morning?.energy !== undefined
    && entry.morning.mood !== undefined
    && entry.morning.focus !== undefined
  const hasReflections = eveningReflectionFields.every(({ field }) => hasText(entry.evening?.[field]))

  return hasCompletedGoals && hasMorningRatings && entry.evening?.dayRating !== undefined && hasReflections
    ? 'complete'
    : 'partial'
}

type SegmentedIndicatorProps = {
  label: string
  value: number | undefined
  maximum?: number
}

function SegmentedIndicator({ label, value, maximum = 10 }: SegmentedIndicatorProps) {
  return (
    <span className="segmented-indicator">
      <span className="segmented-indicator-value-row">
        <span className="segmented-indicator-value">{value ?? '—'}</span>
        <span className="segmented-indicator-context">/{maximum}</span>
      </span>
      <span className="segmented-indicator-label">{label}</span>
      <span className="segmented-indicator-track" aria-hidden="true">
        {Array.from({ length: maximum }, (_, index) => (
          <span className={value !== undefined && index < value ? 'segmented-indicator-segment is-active' : 'segmented-indicator-segment'} key={index} />
        ))}
      </span>
    </span>
  )
}

type OverviewCalendarProps = {
  entries: DailyJournalEntry[]
  month: Date
  onSelectDate: (date: Date) => void
  selectedDate: string
}

const calendarStatusLabels: Record<CalendarEntryStatus, string> = {
  empty: 'No meaningful content',
  partial: 'Partially completed',
  complete: 'Fully completed',
}

function OverviewCalendar({ entries, month, onSelectDate, selectedDate }: OverviewCalendarProps) {
  const monthStart = getMonthStart(month)
  const firstWeekday = (monthStart.getDay() + 6) % 7
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const entriesByDate = new Map(entries.map((entry) => [entry.date, entry]))
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7
  const calendarCells = Array.from({ length: totalCells }, (_, index) => {
    if (index < firstWeekday || index >= firstWeekday + daysInMonth) return null
    const date = new Date(month.getFullYear(), month.getMonth(), index - firstWeekday + 1)
    const dateValue = toDateInputValue(date)
    const status = getCalendarEntryStatus(entriesByDate.get(dateValue))

    return { date, dateValue, status }
  })

  return (
    <>
      <div className="overview-weekdays" aria-hidden="true">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="overview-calendar" role="group" aria-label={`Journal entries for ${new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(month)}`}>
        {calendarCells.map((cell, index) => cell === null ? (
          <span className="overview-calendar-empty" aria-hidden="true" key={`empty-${index}`} />
        ) : (
          <button
            aria-label={`${new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(cell.date)}: ${calendarStatusLabels[cell.status]}`}
            aria-pressed={cell.dateValue === selectedDate}
            className={`overview-calendar-date overview-calendar-date-${cell.status}`}
            key={cell.dateValue}
            onClick={() => onSelectDate(cell.date)}
            type="button"
          >
            <span>{cell.date.getDate()}</span>
            <span className="overview-status-marker" aria-hidden="true" />
          </button>
        ))}
      </div>
      <div className="overview-legend" aria-label="Calendar status legend">
        {(Object.keys(calendarStatusLabels) as CalendarEntryStatus[]).map((status) => (
          <span className="overview-legend-item" key={status}>
            <span className={`overview-status-marker overview-status-marker-${status}`} aria-hidden="true" />
            {calendarStatusLabels[status]}
          </span>
        ))}
      </div>
    </>
  )
}

type WeatherState = {
  date: string
  weather: DailyWeather | null
}

function WeatherIndicator({ date, weatherState }: { date: string; weatherState: WeatherState | null }) {
  const weather = weatherState?.date === date ? weatherState.weather : undefined

  if (weather === undefined) {
    return <span className="weather-indicator" aria-live="polite">Loading weatherâ€¦</span>
  }
  if (weather === null) {
    return <span className="weather-indicator" aria-live="polite">Weather unavailable</span>
  }

  return (
    <span className="weather-indicator" aria-label={`${weather.conditions} in Vilnius, ${Math.round(weather.high)} degrees high and ${Math.round(weather.low)} degrees low, ${weather.source}`}>
      <span className="weather-icon" aria-hidden="true">{weather.icon}</span>
      <span className="weather-details">
        <span>H {Math.round(weather.high)}&#176; / L {Math.round(weather.low)}&#176;</span>
        <span>{weather.conditions} &middot; Vilnius</span>
      </span>
      <span className="weather-source">{weather.source === 'historical' ? 'Historical' : 'Forecast'}</span>
    </span>
  )
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed'

function App() {
  const [selectedDate, setSelectedDate] = useState(getCurrentLocalDate)
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [journalEntry, setJournalEntry] = useState<DailyJournalEntry | null>(null)
  const [isEntryLoading, setIsEntryLoading] = useState(false)
  const [entryError, setEntryError] = useState<{ date: string; message: string; phase: 'load' | 'save' | 'delete' } | null>(null)
  const [saveStatus, setSaveStatus] = useState<{ date: string; status: SaveStatus }>({ date: '', status: 'idle' })
  const [reloadNonce, setReloadNonce] = useState(0)
  const [isMorningOpen, setIsMorningOpen] = useState(false)
  const [isNotebookOpen, setIsNotebookOpen] = useState(false)
  const [isEveningOpen, setIsEveningOpen] = useState(false)
  const [isOverviewOpen, setIsOverviewOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isTasksOpen, setIsTasksOpen] = useState(false)
  const [overviewMonth, setOverviewMonth] = useState(getMonthStart(selectedDate))
  const [overviewEntries, setOverviewEntries] = useState<DailyJournalEntry[]>([])
  const [overviewStatus, setOverviewStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [overviewReloadNonce, setOverviewReloadNonce] = useState(0)
  const [weatherState, setWeatherState] = useState<WeatherState | null>(null)
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const loadSequence = useRef(0)
  const entryRevisions = useRef(new Map<string, number>())
  const saveQueues = useRef(new Map<string, Promise<void>>())
  const pendingEntries = useRef(new Map<string, { entry: DailyJournalEntry; revision: number }>())
  const saveTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const journalEntryRef = useRef<DailyJournalEntry | null>(null)
  const activeUserId = useRef<string | null>(null)
  const sessionGeneration = useRef(0)
  const isDeletingRef = useRef(false)
  const deleteTriggerRef = useRef<HTMLButtonElement>(null)
  const notebookTriggerRef = useRef<HTMLButtonElement>(null)
  const notebookCloseRef = useRef<HTMLButtonElement>(null)
  const notebookTextareaRef = useRef<HTMLTextAreaElement>(null)
  const overviewTriggerRef = useRef<HTMLButtonElement>(null)
  const searchTriggerRef = useRef<HTMLButtonElement>(null)
  const overviewCloseRef = useRef<HTMLButtonElement>(null)
  const today = getCurrentLocalDate()
  const selectedDateValue = toDateInputValue(selectedDate)
  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(selectedDate)
  const isToday = selectedDateValue === toDateInputValue(today)

  const applyAuthenticatedUser = useCallback((nextUser: AuthenticatedUser | null) => {
    if (activeUserId.current !== nextUser?.id) {
      activeUserId.current = nextUser?.id ?? null
      sessionGeneration.current += 1
      loadSequence.current += 1
      saveTimers.current.forEach(clearTimeout)
      saveTimers.current.clear()
      pendingEntries.current.clear()
      saveQueues.current.clear()
      entryRevisions.current.clear()
      journalEntryRef.current = null
      setJournalEntry(null)
      setIsEntryLoading(false)
      setEntryError(null)
      setSaveStatus({ date: '', status: 'idle' })
      setIsMorningOpen(false)
      setIsNotebookOpen(false)
      setIsEveningOpen(false)
      setIsOverviewOpen(false)
      setIsSearchOpen(false)
      setIsTasksOpen(false)
      setIsDeleteConfirmationOpen(false)
      isDeletingRef.current = false
      setIsDeleting(false)
    }
    setUser(nextUser)
  }, [])

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false)
    requestAnimationFrame(() => searchTriggerRef.current?.focus())
  }, [])
  const expireSearchSession = useCallback(() => applyAuthenticatedUser(null), [applyAuthenticatedUser])

  useEffect(() => {
    let isCurrent = true

    const unsubscribe = onAuthStateChange((nextUser) => {
      if (isCurrent) applyAuthenticatedUser(nextUser)
    })

    getCurrentUser()
      .then((restoredUser) => {
        if (isCurrent) applyAuthenticatedUser(restoredUser)
      })
      .catch((error: unknown) => {
        if (isCurrent) setAuthError(error instanceof Error ? error.message : 'Unable to restore your session.')
      })
      .finally(() => {
        if (isCurrent) setIsAuthLoading(false)
      })

    return () => {
      isCurrent = false
      unsubscribe()
    }
  }, [applyAuthenticatedUser])

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
        if (loadSequence.current === requestId && currentRevision === revisionAtRequestStart) {
          journalEntryRef.current = entry
          setJournalEntry(entry)
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || loadSequence.current !== requestId) return
        if (error instanceof ApiError && error.status === 401) {
          applyAuthenticatedUser(null)
          return
        }
        setEntryError({ date, message: error instanceof Error ? error.message : 'Unable to load this entry.', phase: 'load' })
      })
      .finally(() => {
        if (loadSequence.current === requestId) setIsEntryLoading(false)
      })

    return () => controller.abort()
  }, [applyAuthenticatedUser, reloadNonce, selectedDateValue, user])

  useEffect(() => {
    const controller = new AbortController()

    getWeatherForDate(selectedDateValue, controller.signal)
      .then((weather) => {
        if (!controller.signal.aborted) setWeatherState({ date: selectedDateValue, weather })
      })
      .catch(() => {
        if (!controller.signal.aborted) setWeatherState({ date: selectedDateValue, weather: null })
      })

    return () => controller.abort()
  }, [selectedDateValue])

  useEffect(() => {
    if (!isOverviewOpen || user === null) return

    const controller = new AbortController()
    const monthStart = toDateInputValue(overviewMonth)
    const monthEnd = toDateInputValue(addCalendarMonths(overviewMonth, 1))

    getJournalEntriesForDateRange(monthStart, monthEnd, controller.signal)
      .then((entries) => {
        if (!controller.signal.aborted) {
          setOverviewEntries(entries)
          setOverviewStatus('idle')
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        if (error instanceof ApiError && error.status === 401) {
          applyAuthenticatedUser(null)
          return
        }
        setOverviewStatus('error')
      })

    return () => controller.abort()
  }, [applyAuthenticatedUser, isOverviewOpen, overviewMonth, overviewReloadNonce, user])

  async function selectDate(date: Date) {
    if (isDeletingRef.current) return
    await flushPendingSave(selectedDateValue)
    setIsTasksOpen(false)
    journalEntryRef.current = null
    setSelectedDate(date)
    setJournalEntry(null)
    setIsEntryLoading(true)
    setEntryError(null)
    setSaveStatus({ date: toDateInputValue(date), status: 'idle' })
    setIsMorningOpen(false)
    setIsNotebookOpen(false)
    setIsEveningOpen(false)
    setIsOverviewOpen(false)
    setIsSearchOpen(false)
  }

  function updateMorningRating(field: keyof MorningJournal, rating: Rating10) {
    const currentEntry = journalEntryRef.current
    const updatedEntry: DailyJournalEntry = {
      ...(currentEntry ?? { date: selectedDateValue }),
      date: selectedDateValue,
      morning: {
        ...currentEntry?.morning,
        [field]: rating,
      },
    }

    saveEntry(updatedEntry)
  }

  function queueSave(entry: DailyJournalEntry, revision: number) {
    const saveSessionGeneration = sessionGeneration.current
    const saveUserId = activeUserId.current
    let didFail = false
    const previousSave = saveQueues.current.get(entry.date) ?? Promise.resolve()
    const queuedSave = previousSave
      .catch(() => undefined)
      .then(() => {
        if (saveSessionGeneration !== sessionGeneration.current) return
        return saveJournalEntry(entry, saveUserId ?? undefined)
      })
    saveQueues.current.set(entry.date, queuedSave)

    queuedSave
      .catch((error: unknown) => {
        didFail = true
        if (saveSessionGeneration !== sessionGeneration.current) return
        if (entryRevisions.current.get(entry.date) !== revision) return
        if (error instanceof ApiError && error.status === 401) {
          applyAuthenticatedUser(null)
          return
        }
        setEntryError({ date: entry.date, message: error instanceof Error ? error.message : 'Unable to save your entry.', phase: 'save' })
        setSaveStatus({ date: entry.date, status: 'failed' })
      })
      .finally(() => {
        if (saveSessionGeneration !== sessionGeneration.current) return
        if (saveQueues.current.get(entry.date) !== queuedSave) return
        saveQueues.current.delete(entry.date)
        if (!didFail && entryRevisions.current.get(entry.date) === revision && !pendingEntries.current.has(entry.date) && !isDeletingRef.current) {
          setSaveStatus({ date: entry.date, status: 'saved' })
        }
      })

    return queuedSave.catch(() => undefined)
  }

  function flushPendingSave(date: string) {
    const timer = saveTimers.current.get(date)
    if (timer !== undefined) {
      clearTimeout(timer)
      saveTimers.current.delete(date)
    }

    const pendingSave = pendingEntries.current.get(date)
    if (pendingSave === undefined) return (saveQueues.current.get(date) ?? Promise.resolve()).catch(() => undefined)

    pendingEntries.current.delete(date)
    return queueSave(pendingSave.entry, pendingSave.revision)
  }

  function flushPendingSaves() {
    const dates = new Set([...pendingEntries.current.keys(), ...saveQueues.current.keys()])

    return Promise.all([...dates].map(flushPendingSave)).then(() => undefined)
  }

  function saveEntry(entry: DailyJournalEntry) {
    if (isDeletingRef.current) return
    const revision = (entryRevisions.current.get(entry.date) ?? 0) + 1
    entryRevisions.current.set(entry.date, revision)
    journalEntryRef.current = entry
    setEntryError(null)
    setJournalEntry(entry)
    setSaveStatus({ date: entry.date, status: 'saving' })
    pendingEntries.current.set(entry.date, { entry, revision })

    const existingTimer = saveTimers.current.get(entry.date)
    if (existingTimer !== undefined) clearTimeout(existingTimer)
    saveTimers.current.set(entry.date, setTimeout(() => {
      void flushPendingSave(entry.date)
    }, 700))
  }

  async function handleLogout() {
    if (isDeletingRef.current) return
    try {
      await flushPendingSaves()
      await logout()
    } finally {
      applyAuthenticatedUser(null)
    }
  }

  async function closeNotebook() {
    await flushPendingSave(selectedDateValue)
    setIsNotebookOpen(false)
    requestAnimationFrame(() => notebookTriggerRef.current?.focus())
  }

  function openDeleteConfirmation() {
    setEntryError(null)
    setIsMorningOpen(false)
    setIsNotebookOpen(false)
    setIsEveningOpen(false)
    setIsDeleteConfirmationOpen(true)
  }

  async function openSearch() {
    if (isDeletingRef.current) return
    await flushPendingSave(selectedDateValue)
    setIsSearchOpen(true)
  }

  function openOverview() {
    setOverviewMonth(getMonthStart(selectedDate))
    setOverviewEntries([])
    setOverviewStatus('loading')
    setIsOverviewOpen(true)
  }

  function openTasks() {
    setIsOverviewOpen(false)
    setIsTasksOpen(true)
  }

  function changeOverviewMonth(months: number) {
    setOverviewEntries([])
    setOverviewStatus('loading')
    setOverviewMonth((month) => addCalendarMonths(month, months))
  }

  function retryOverviewLoad() {
    setOverviewEntries([])
    setOverviewStatus('loading')
    setOverviewReloadNonce((value) => value + 1)
  }

  function closeOverview() {
    setIsOverviewOpen(false)
    requestAnimationFrame(() => overviewTriggerRef.current?.focus())
  }

  async function selectOverviewDate(date: Date) {
    setIsOverviewOpen(false)
    await selectDate(date)
  }

  function cancelDeleteConfirmation() {
    if (isDeleting) return
    setIsDeleteConfirmationOpen(false)
    requestAnimationFrame(() => deleteTriggerRef.current?.focus())
  }

  async function confirmDeleteEntry() {
    const date = selectedDateValue
    const userId = activeUserId.current
    if (isDeletingRef.current || journalEntryRef.current === null) return

    isDeletingRef.current = true
    setIsDeleting(true)
    setEntryError(null)
    setIsDeleteConfirmationOpen(false)
    entryRevisions.current.set(date, (entryRevisions.current.get(date) ?? 0) + 1)
    loadSequence.current += 1

    try {
      await flushPendingSave(date)
      await deleteJournalEntry(date, userId ?? undefined)
      pendingEntries.current.delete(date)
      const timer = saveTimers.current.get(date)
      if (timer !== undefined) {
        clearTimeout(timer)
        saveTimers.current.delete(date)
      }
      journalEntryRef.current = null
      setJournalEntry(null)
      setSaveStatus({ date, status: 'idle' })
      setIsMorningOpen(false)
      setIsNotebookOpen(false)
      setIsEveningOpen(false)
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 401) {
        applyAuthenticatedUser(null)
        return
      }
      setEntryError({ date, message: error instanceof Error ? error.message : 'Unable to delete this entry.', phase: 'delete' })
    } finally {
      isDeletingRef.current = false
      setIsDeleting(false)
    }
  }

  useEffect(() => {
    if (!isNotebookOpen) return

    notebookTextareaRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        notebookCloseRef.current?.click()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isNotebookOpen])

  useEffect(() => {
    if (!isOverviewOpen) return

    overviewCloseRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        overviewCloseRef.current?.click()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOverviewOpen])

  if (isAuthLoading) {
    return <main className="auth-shell"><p className="auth-status">Restoring your session…</p></main>
  }

  if (user === null) {
    return <AuthScreen initialError={authError} onAuthenticated={applyAuthenticatedUser} />
  }

  function updateGoalText(index: number, text: string) {
    const currentEntry = journalEntryRef.current
    const existingGoals = currentEntry?.goals ?? []
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
      ...(currentEntry ?? { date: selectedDateValue }),
      date: selectedDateValue,
      goals,
    })
  }

  function toggleGoalCompleted(index: number) {
    const currentEntry = journalEntryRef.current
    const goals = [...(currentEntry?.goals ?? [])]
    const goal = goals[index]

    if (!goal || goal.text.trim() === '') {
      return
    }

    goals[index] = { ...goal, completed: !goal.completed }
    saveEntry({
      ...(currentEntry ?? { date: selectedDateValue }),
      date: selectedDateValue,
      goals,
    })
  }

  function updateTitle(title: string) {
    const currentEntry = journalEntryRef.current
    saveEntry({
      ...(currentEntry ?? { date: selectedDateValue }),
      date: selectedDateValue,
      title: title === '' ? undefined : title,
    })
  }

  function updateNotes(notes: string) {
    const currentEntry = journalEntryRef.current
    saveEntry({
      ...(currentEntry ?? { date: selectedDateValue }),
      date: selectedDateValue,
      notes: notes === '' ? undefined : notes,
    })
  }

  function updateEveningReview(update: Partial<EveningReview>) {
    const currentEntry = journalEntryRef.current
    const evening = { ...currentEntry?.evening, ...update }
    const hasEveningContent = Object.values(evening).some(
      (value) => value !== undefined && value !== '',
    )

    saveEntry({
      ...(currentEntry ?? { date: selectedDateValue }),
      date: selectedDateValue,
      evening: hasEveningContent ? evening : undefined,
    })
  }

  const morning = journalEntry?.morning
  const goals: DailyGoal[] = journalEntry?.goals ?? []
  const notes = journalEntry?.notes ?? ''
  const title = journalEntry?.title ?? ''
  const notesPreview = notes.trim() === '' ? null : notes
  const evening = journalEntry?.evening
  const reflectionCount = eveningReflectionFields.filter(
    ({ field }) => typeof evening?.[field] === 'string' && evening[field].trim().length > 0,
  ).length
  const activeSaveStatus = saveStatus.date === selectedDateValue ? saveStatus.status : 'idle'
  const hasEntry = journalEntry !== null
  const saveStatusLabel = activeSaveStatus === 'saving'
    ? 'Saving'
    : activeSaveStatus === 'saved'
      ? 'Saved'
      : activeSaveStatus === 'failed'
        ? 'Save failed'
        : ''

  return (
    <main className="journal-shell">
      <header className="journal-header">
        <h1 className="journal-title">Daily Journal</h1>
        <time className="journal-date" dateTime={toDateInputValue(selectedDate)}>
          {formattedDate}
        </time>
        <div className="journal-header-toolbar">
          <nav className="date-navigation" aria-label="Date navigation">
            <button
              className="date-navigation-button"
              type="button"
              onClick={() => selectDate(addCalendarDays(selectedDate, -1))}
              disabled={isDeleting}
            >
              <span className="date-navigation-chevron" aria-hidden="true">‹</span>
              Previous
            </button>
            <button
              className="date-navigation-button"
              type="button"
              onClick={() => selectDate(getCurrentLocalDate())}
              disabled={isToday || isDeleting}
            >
              Today
            </button>
            <button
              className="date-navigation-button"
              type="button"
              onClick={() => selectDate(addCalendarDays(selectedDate, 1))}
              disabled={isDeleting}
            >
              Next
              <span className="date-navigation-chevron" aria-hidden="true">›</span>
            </button>
            <button
              className="date-navigation-button"
              type="button"
              onClick={() => void openSearch()}
              disabled={isDeleting}
              ref={searchTriggerRef}
            >
              Search
            </button>
            <button
              className="date-navigation-button"
              type="button"
              onClick={openOverview}
              disabled={isDeleting}
              ref={overviewTriggerRef}
            >
              Overview
            </button>
            <button className="date-navigation-button" type="button" onClick={openTasks} disabled={isDeleting}>
              Tasks
            </button>
            <button
              className="journal-delete-entry"
              type="button"
              onClick={openDeleteConfirmation}
              disabled={!hasEntry || isDeleting}
              ref={deleteTriggerRef}
            >
              Delete entry
            </button>
          </nav>
          <div className="journal-header-meta">
            <WeatherIndicator date={selectedDateValue} weatherState={weatherState} />
            <span className={`journal-save-status journal-save-status-${activeSaveStatus}`} aria-live="polite">
              {saveStatusLabel}
            </span>
            <div className="journal-account">
              <span>Signed in as {user.email}</span>
              <button className="journal-logout" onClick={handleLogout} type="button" disabled={isDeleting}>Sign out</button>
            </div>
          </div>
        </div>
        {entryError?.date === selectedDateValue && (entryError.phase === 'save' || entryError.phase === 'delete') && (
          <p className="journal-sync-error" role="alert">{entryError.message}</p>
        )}
      </header>

      {isTasksOpen ? (
        <TasksPage key={user.id} userId={user.id} onBack={() => setIsTasksOpen(false)} />
      ) : isEntryLoading ? (
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
          disabled={isDeleting}
          aria-haspopup="dialog"
          ref={notebookTriggerRef}
        >
          <span className="notebook-card-title">Daily Notebook</span>
          <span className="notebook-preview">
            {notesPreview === null
              ? 'Not entered'
              : notesPreview}
          </span>
        </button>

        <section className="goals-card" aria-labelledby="daily-goals-title">
          <div className="goals-card-header">
            <h2 className="notebook-card-title" id="daily-goals-title">Top 3 Priorities</h2>
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
                  <label className="goal-completion-label">
                    <input
                      className="goal-completion-checkbox"
                      type="checkbox"
                      checked={goal?.completed ?? false}
                      onChange={() => toggleGoalCompleted(index)}
                      onBlur={() => void flushPendingSave(selectedDateValue)}
                      disabled={!isPopulated || isDeleting}
                      aria-label={`Mark Goal #${position} ${goal?.completed ? 'incomplete' : 'complete'}`}
                    />
                    <span className="goal-completion-indicator" aria-hidden="true">✓</span>
                  </label>
                  <div className="goal-text-label">
                    <input
                      className="goal-text-input"
                      type="text"
                      value={goal?.text ?? ''}
                      onChange={(event) => updateGoalText(index, event.target.value)}
                      onBlur={() => void flushPendingSave(selectedDateValue)}
                      aria-label={`Priority ${position}`}
                      placeholder="Add a goal"
                      disabled={isDeleting}
                    />
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
          disabled={isDeleting}
          aria-haspopup="dialog"
        >
          <span className="morning-card-title">Morning</span>
          <span className="morning-summary">
            <SegmentedIndicator label="Energy" value={morning?.energy} />
            <SegmentedIndicator label="Mood" value={morning?.mood} />
            <SegmentedIndicator label="Focus" value={morning?.focus} />
          </span>
        </button>

        <button
          className="notebook-card evening-card"
          type="button"
          onClick={() => setIsEveningOpen(true)}
          disabled={isDeleting}
          aria-haspopup="dialog"
        >
          <span className="notebook-card-title">Evening Review</span>
          <span className="evening-summary">
            <SegmentedIndicator label="Day rating" value={evening?.dayRating} />
            <SegmentedIndicator label="Reflections" value={reflectionCount} maximum={eveningReflectionFields.length} />
          </span>
        </button>
      </section>
      )}

      {isMorningOpen && !isDeleting && (
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

      {isNotebookOpen && !isDeleting && (
        <div className="morning-modal-backdrop notebook-modal-backdrop">
          <section
            className="morning-modal notebook-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notebook-modal-title"
          >
            <div className="morning-modal-header">
              <div className="notebook-modal-heading">
                <p className="morning-modal-eyebrow">Daily Notebook</p>
                <h2 id="notebook-modal-title">What is on your mind?</h2>
                <time className="notebook-modal-date" dateTime={selectedDateValue}>{formattedDate}</time>
              </div>
              <div className="notebook-modal-actions">
                <button
                  className="morning-modal-close"
                  type="button"
                  onClick={() => void closeNotebook()}
                  aria-label="Close Daily Notebook"
                  ref={notebookCloseRef}
                >
                  Close
                </button>
              </div>
            </div>
            <label className="notebook-text-label journal-title-label" htmlFor="journal-entry-title">Journal title (optional)</label>
            <input
              className="journal-title-input"
              id="journal-entry-title"
              type="text"
              value={title}
              onChange={(event) => updateTitle(event.target.value)}
              onBlur={() => void flushPendingSave(selectedDateValue)}
              placeholder="Give this day a title"
            />
            <div className="notebook-editor-body">
              <textarea
                className="notebook-textarea"
                id="daily-notes"
                ref={notebookTextareaRef}
                value={notes}
                onChange={(event) => updateNotes(event.target.value)}
                onBlur={() => void flushPendingSave(selectedDateValue)}
                aria-label="Daily notebook notes"
                placeholder="Write anything you want to remember or work through today."
              />
            </div>
            <span className="notebook-character-count">{notes.length} characters</span>
            <span className={`notebook-save-status journal-save-status-${activeSaveStatus}`} aria-live="polite">
              {saveStatusLabel}
            </span>
          </section>
        </div>
      )}

      {isEveningOpen && !isDeleting && (
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
                  className="rating-clear-button"
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
                  onBlur={() => void flushPendingSave(selectedDateValue)}
                  rows={3}
                />
              </div>
            ))}
          </section>
        </div>
      )}

      {isDeleteConfirmationOpen && (
        <div className="morning-modal-backdrop">
          <section
            className="morning-modal delete-confirmation-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-confirmation-title"
          >
            <div className="morning-modal-header">
              <div>
                <p className="morning-modal-eyebrow">Delete entry</p>
                <h2 id="delete-confirmation-title">Delete this journal entry?</h2>
              </div>
            </div>
            <p className="delete-confirmation-copy">This permanently deletes the entry for {formattedDate}.</p>
            <div className="delete-confirmation-actions">
              <button className="morning-modal-close" type="button" onClick={cancelDeleteConfirmation}>Cancel</button>
              <button className="delete-confirmation-button" type="button" onClick={() => void confirmDeleteEntry()}>Delete entry</button>
            </div>
          </section>
        </div>
      )}

      {isSearchOpen && !isDeleting && (
        <JournalSearch
          onClose={closeSearch}
          onSelectDate={(date) => { void selectDate(new Date(`${date}T12:00:00`)) }}
          onSessionExpired={expireSearchSession}
        />
      )}

      {isOverviewOpen && (
        <div className="morning-modal-backdrop">
          <section
            className="morning-modal overview-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="overview-modal-title"
          >
            <div className="morning-modal-header">
              <div>
                <p className="morning-modal-eyebrow">Journal overview</p>
                <h2 id="overview-modal-title">{new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(overviewMonth)}</h2>
              </div>
              <button
                className="morning-modal-close"
                type="button"
                onClick={closeOverview}
                aria-label="Close journal overview"
                ref={overviewCloseRef}
              >
                Close
              </button>
            </div>
            <div className="overview-month-navigation" aria-label="Calendar month navigation">
              <button className="date-navigation-button" type="button" onClick={() => changeOverviewMonth(-1)}>
                <span className="date-navigation-chevron" aria-hidden="true">‹</span>
                Previous month
              </button>
              <button className="date-navigation-button" type="button" onClick={() => changeOverviewMonth(1)}>
                Next month
                <span className="date-navigation-chevron" aria-hidden="true">›</span>
              </button>
            </div>
            {overviewStatus === 'loading' ? (
              <p className="overview-status" aria-live="polite">Loading monthâ€¦</p>
            ) : overviewStatus === 'error' ? (
              <div className="overview-status overview-error" role="alert">
                <span>Unable to load this month.</span>
                <button className="date-navigation-button" type="button" onClick={retryOverviewLoad}>Retry</button>
              </div>
            ) : (
              <OverviewCalendar
                entries={overviewEntries}
                month={overviewMonth}
                onSelectDate={selectOverviewDate}
                selectedDate={selectedDateValue}
              />
            )}
          </section>
        </div>
      )}
    </main>
  )
}

export default App
