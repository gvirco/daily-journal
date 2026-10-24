import { useEffect, useMemo, useRef, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import type { Task, TaskPriority } from '../domain/Task'
import { createTask, deleteTask, getTasks, updateTask } from '../services/tasksApi'

type Props = { userId: string; onBack: () => void }
const priorities: TaskPriority[] = ['Low', 'Medium', 'High']
const dateFromValue = (value: string) => new Date(`${value}T12:00:00`)
const valueFromDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`


function TaskDatePicker({ label, value, onChange, disabled = false }: {
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }
    window.addEventListener('mousedown', closeOnOutsideClick)
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      window.removeEventListener('mousedown', closeOnOutsideClick)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [isOpen])

  const selected = value ? dateFromValue(value) : undefined
  return (
    <div className="task-date-picker tasks-v2-date-picker" ref={pickerRef}>
      <button
        ref={triggerRef}
        className="task-date-trigger tasks-v2-field-row"
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="tasks-v2-field-icon" aria-hidden="true"><CalendarIcon /></span>
        <span className="tasks-v2-field-name">Due date</span>
        <span className="tasks-v2-field-value">
          {selected ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(selected) : ''}
        </span>
        <span className="tasks-v2-chevron" aria-hidden="true">›</span>
      </button>
      {isOpen && (
        <div className="task-calendar-popover" role="dialog" aria-label={`${label} calendar`}>
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(date) => {
              if (!date) return
              onChange(valueFromDate(date))
              setIsOpen(false)
              triggerRef.current?.focus()
            }}
          />
        </div>
      )}
    </div>
  )
}

function CalendarIcon() {
  return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3.5" y="5" width="17" height="15" rx="2" />
    <path d="M7.5 3v4M16.5 3v4M3.5 9.5h17" />
  </svg>
}

function TrashIcon() {
  return <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v6M14 11v6" />
  </svg>
}

function formatTaskDate(value: string) {
  const today = valueFromDate(new Date())
  if (value === today) return 'Today'
  const formatted = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).format(dateFromValue(value))
  return value < today ? `Overdue · ${formatted}` : formatted
}

function TaskRows({ items, label, pendingTaskIds, actionMenuId, onToggle, onEdit, onDelete, onMenuToggle }: {
  items: Task[]
  label: string
  pendingTaskIds: Set<string>
  actionMenuId: string | null
  onToggle: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onMenuToggle: (id: string) => void
}) {
  return (
    items.length === 0
      ? <p className="tasks-empty tasks-v2-empty">{label === 'Open tasks' ? 'No open tasks. Add one to get started.' : 'No completed tasks yet.'}</p>
      : <ul className="tasks-v2-list" aria-label={label}>
        {items.map((task) => {
          const isPending = pendingTaskIds.has(task.id)
          const isDueNow = !task.completed && task.dueDate <= valueFromDate(new Date())
          return (
            <li className={`tasks-v2-item${task.completed ? ' is-completed' : ''}`} key={task.id} aria-busy={isPending}>
              <input
                className="tasks-v2-checkbox"
                type="checkbox"
                checked={task.completed}
                disabled={isPending}
                onChange={() => onToggle(task)}
                aria-label={`${task.completed ? 'Reopen' : 'Complete'} ${task.title}`}
              />
              <button
                type="button"
                className="tasks-v2-title"
                disabled={isPending}
                onClick={() => onEdit(task)}
                aria-label={`Edit ${task.title}`}
              >{task.title}</button>
              <span className={`tasks-v2-date${isDueNow ? ' is-due' : ''}`}>
                <span className="tasks-v2-meta-icon" aria-hidden="true"><CalendarIcon /></span>
                {formatTaskDate(task.dueDate)}
              </span>
              <span className={`tasks-v2-priority tasks-v2-priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
              <div className="tasks-v2-actions">
                <button
                  type="button"
                  className="tasks-v2-more"
                  aria-label={`Task actions for ${task.title}`}
                  aria-haspopup="menu"
                  aria-expanded={actionMenuId === task.id}
                  disabled={isPending}
                  onClick={() => onMenuToggle(task.id)}
                >···</button>
                {actionMenuId === task.id && (
                  <div className="tasks-v2-menu" role="menu" aria-label={`Actions for ${task.title}`}>
                    <button type="button" role="menuitem" onClick={() => onEdit(task)}>Edit</button>
                    <button type="button" role="menuitem" className="is-danger" onClick={() => onDelete(task)}>Delete</button>
                  </div>
                )}
              </div>
              {isPending && <span className="tasks-v2-pending" role="status">Saving…</span>}
            </li>
          )
        })}
      </ul>
  )
}

function TasksPageContent({ userId, onBack }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]); const [title, setTitle] = useState(''); const [dueDate, setDueDate] = useState(''); const [priority, setPriority] = useState<TaskPriority>('Medium')
  const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null); const [success, setSuccess] = useState<string | null>(null); const [editing, setEditing] = useState<Task | null>(null); const [deleting, setDeleting] = useState<Task | null>(null); const [pendingTaskIds, setPendingTaskIds] = useState<Set<string>>(new Set()); const [isCreating, setIsCreating] = useState(false); const userRef = useRef(userId); const createLock = useRef(false); const pendingTaskIdsRef = useRef(new Set<string>()); const taskLoadGeneration = useRef(0)
  useEffect(() => {
    userRef.current = userId
    let active = true
    const requestGeneration = taskLoadGeneration.current + 1
    taskLoadGeneration.current = requestGeneration
    const controller = new AbortController()
    void getTasks(userId, controller.signal)
      .then((loadedTasks) => { if (active && taskLoadGeneration.current === requestGeneration) setTasks(loadedTasks) })
      .catch((reason: unknown) => { if (active && taskLoadGeneration.current === requestGeneration) setError(reason instanceof Error ? reason.message : 'Unable to load tasks.') })
      .finally(() => { if (active && taskLoadGeneration.current === requestGeneration) setLoading(false) })
    return () => { active = false; controller.abort() }
  }, [userId])
  useEffect(() => {
    if (success === null) return
    const timeout = window.setTimeout(() => setSuccess(null), 3000)
    return () => window.clearTimeout(timeout)
  }, [success])
  const open = useMemo(() => tasks.filter((task) => !task.completed).sort((a, b) => a.dueDate.localeCompare(b.dueDate)), [tasks])
  const completed = useMemo(() => tasks.filter((task) => task.completed), [tasks])
  const [isAdding, setIsAdding] = useState(false)
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(false)
  const [actionMenuId, setActionMenuId] = useState<string | null>(null)

  useEffect(() => {
    if (!actionMenuId) return
    const dismiss = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest('.tasks-v2-actions')) setActionMenuId(null)
    }
    const onEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setActionMenuId(null) }
    document.addEventListener('mousedown', dismiss)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', dismiss)
      document.removeEventListener('keydown', onEscape)
    }
  }, [actionMenuId])

  async function submit(event: React.FormEvent) { event.preventDefault(); if (createLock.current || title.trim() === '' || dueDate === '') return; const requestUserId = userId; createLock.current = true; setIsCreating(true); setError(null); setSuccess(null); try { const task = await createTask({ title: title.trim(), dueDate, priority }, requestUserId); if (userRef.current !== requestUserId) return; taskLoadGeneration.current += 1; setLoading(false); setTasks((current) => [...current, task]); setTitle(''); setDueDate(''); setPriority('Medium'); setSuccess('Task added.'); setIsAdding(false) } catch (e) { if (userRef.current === requestUserId) setError(e instanceof Error ? e.message : 'Unable to create task.') } finally { createLock.current = false; if (userRef.current === requestUserId) setIsCreating(false) } }
  async function save(task: Task) { if (pendingTaskIdsRef.current.has(task.id) || task.title.trim() === '') return; const requestUserId = userId; pendingTaskIdsRef.current.add(task.id); setPendingTaskIds(new Set(pendingTaskIdsRef.current)); setError(null); setSuccess(null); try { const updated = await updateTask(task.id, task, requestUserId); if (userRef.current !== requestUserId) return; setTasks((current) => current.map((item) => item.id === updated.id ? updated : item)); setEditing(null); setSuccess('Task saved.') } catch (e) { if (userRef.current === requestUserId) setError(e instanceof Error ? e.message : 'Unable to save task.') } finally { pendingTaskIdsRef.current.delete(task.id); if (userRef.current === requestUserId) setPendingTaskIds(new Set(pendingTaskIdsRef.current)) } }
  async function toggle(task: Task) { await save({ ...task, completed: !task.completed }) }
  async function remove() { if (!deleting || pendingTaskIdsRef.current.has(deleting.id)) return; const task = deleting; const requestUserId = userId; pendingTaskIdsRef.current.add(task.id); setPendingTaskIds(new Set(pendingTaskIdsRef.current)); setError(null); setSuccess(null); try { await deleteTask(task.id, requestUserId); if (userRef.current !== requestUserId) return; setTasks((current) => current.filter((item) => item.id !== task.id)); setDeleting(null); setSuccess('Task deleted.') } catch (e) { if (userRef.current === requestUserId) setError(e instanceof Error ? e.message : 'Unable to delete task.') } finally { pendingTaskIdsRef.current.delete(task.id); if (userRef.current === requestUserId) setPendingTaskIds(new Set(pendingTaskIdsRef.current)) } }

  const priorityField = (value: TaskPriority, onChange: (value: TaskPriority) => void, disabled = false) => (
    <label className="tasks-v2-field-row tasks-v2-priority-row">
      <span className="tasks-v2-field-icon tasks-v2-flag" aria-hidden="true">⚑</span>
      <span className="tasks-v2-field-name">Priority</span>
      <select
        aria-label="Priority"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as TaskPriority)}
      >
        {priorities.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
      <span className="tasks-v2-chevron" aria-hidden="true">›</span>
    </label>
  )

  return (
    <section className="tasks-page tasks-v2" aria-labelledby="tasks-title">
      <div className="tasks-page-header tasks-v2-header">
        <div>
          <p className="tasks-page-eyebrow">Plan your work</p>
          <h2 id="tasks-title">Tasks</h2>
        </div>
        <button className="date-navigation-button" type="button" onClick={onBack}>Back to journal</button>
      </div>

      {error && <p role="alert" className="journal-sync-error">{error}</p>}
      {success && <p role="status" className="task-success">{success}</p>}

      {!isAdding && (
        <button type="button" className="tasks-v2-quick-add" onClick={() => setIsAdding(true)} aria-label="Add a task">
          <span className="tasks-v2-add-symbol" aria-hidden="true">+</span>
          <span>Add a task...</span>
          <span className="tasks-v2-quick-chevron" aria-hidden="true">⌄</span>
        </button>
      )}
      {isAdding && (
        <div className="tasks-v2-create-backdrop">
          <section className="tasks-v2-panel tasks-v2-create-panel" role="dialog" aria-labelledby="task-add-heading">
            <div className="tasks-v2-panel-heading">
              <h3 id="task-add-heading">Add a new task</h3>
              <button type="button" className="tasks-v2-close" onClick={() => setIsAdding(false)} disabled={isCreating} aria-label="Close add form">×</button>
            </div>
            <form onSubmit={(event) => void submit(event)}>
              <input
                className="tasks-v2-text-input"
                aria-label="Task"
                placeholder="What needs to be done?"
                value={title}
                required
                maxLength={500}
                disabled={isCreating}
                onChange={(event) => setTitle(event.target.value)}
              />
              <div className="tasks-v2-field-stack">
                <TaskDatePicker label="Due date" value={dueDate} onChange={setDueDate} disabled={isCreating} />
                {priorityField(priority, setPriority, isCreating)}
              </div>
              <div className="tasks-v2-form-actions">
                <button className="tasks-v2-primary" type="submit" disabled={isCreating || !dueDate || !title.trim()}>{isCreating ? 'Saving…' : 'Add task'}</button>
                <button className="tasks-v2-secondary" type="button" disabled={isCreating} onClick={() => setIsAdding(false)}>Cancel</button>
              </div>
            </form>
          </section>
        </div>
      )}

      <section className="tasks-v2-section">
        <h3>Open tasks ({open.length})</h3>
        {loading ? <p className="tasks-v2-loading" role="status">Loading tasks…</p> : <TaskRows items={open} label="Open tasks" pendingTaskIds={pendingTaskIds} actionMenuId={actionMenuId} onToggle={(task) => void toggle(task)} onEdit={(task) => { setActionMenuId(null); setEditing(task) }} onDelete={(task) => { setActionMenuId(null); setDeleting(task) }} onMenuToggle={(id) => setActionMenuId((current) => current === id ? null : id)} />}
      </section>

      <section className="tasks-v2-section tasks-v2-completed-section">
        <button
          className="tasks-v2-completed-toggle"
          type="button"
          aria-expanded={isCompletedExpanded}
          onClick={() => setIsCompletedExpanded((expanded) => !expanded)}
        >
          <span>Completed tasks ({completed.length})</span>
          <span className="tasks-v2-chevron" aria-hidden="true">{isCompletedExpanded ? '⌃' : '⌄'}</span>
        </button>
        {isCompletedExpanded && <TaskRows items={completed} label="Completed tasks" pendingTaskIds={pendingTaskIds} actionMenuId={actionMenuId} onToggle={(task) => void toggle(task)} onEdit={(task) => { setActionMenuId(null); setEditing(task) }} onDelete={(task) => { setActionMenuId(null); setDeleting(task) }} onMenuToggle={(id) => setActionMenuId((current) => current === id ? null : id)} />}
      </section>

      {editing && (
        <div className="tasks-v2-modal-scrim">
          <section className="tasks-v2-panel" role="dialog" aria-modal="true" aria-labelledby="edit-task-title">
            <div className="tasks-v2-panel-heading">
              <h2 id="edit-task-title">Edit task</h2>
              <button type="button" className="tasks-v2-close" aria-label="Close edit task" disabled={pendingTaskIds.has(editing.id)} onClick={() => setEditing(null)}>×</button>
            </div>
            <form onSubmit={(event) => { event.preventDefault(); void save(editing) }}>
              <input
                className="tasks-v2-text-input"
                aria-label="Task"
                value={editing.title}
                maxLength={500}
                required
                disabled={pendingTaskIds.has(editing.id)}
                onChange={(event) => setEditing({ ...editing, title: event.target.value })}
              />
              <div className="tasks-v2-field-stack">
                <TaskDatePicker label="Edit due date" value={editing.dueDate} disabled={pendingTaskIds.has(editing.id)} onChange={(next) => setEditing({ ...editing, dueDate: next })} />
                {priorityField(editing.priority, (next) => setEditing({ ...editing, priority: next }), pendingTaskIds.has(editing.id))}
              </div>
              <div className="tasks-v2-form-actions">
                <button className="tasks-v2-primary" type="submit" disabled={pendingTaskIds.has(editing.id) || !editing.title.trim()}>{pendingTaskIds.has(editing.id) ? 'Saving…' : 'Save changes'}</button>
                <button className="tasks-v2-secondary" type="button" disabled={pendingTaskIds.has(editing.id)} onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {deleting && (
        <div className="tasks-v2-modal-scrim">
          <section className="tasks-v2-panel tasks-v2-delete-panel" role="dialog" aria-modal="true" aria-labelledby="delete-task-title">
            <div className="tasks-v2-panel-heading">
              <h2 id="delete-task-title">Delete task</h2>
              <button type="button" className="tasks-v2-close" aria-label="Close delete task" disabled={pendingTaskIds.has(deleting.id)} onClick={() => setDeleting(null)}>×</button>
            </div>
            <div className="tasks-v2-delete-icon" aria-hidden="true"><TrashIcon /></div>
            <p className="tasks-v2-delete-question">Are you sure you want to delete this task?</p>
            <p className="tasks-v2-delete-note">This action cannot be undone.</p>
            <div className="tasks-v2-form-actions">
              <button className="tasks-v2-secondary" type="button" disabled={pendingTaskIds.has(deleting.id)} onClick={() => setDeleting(null)}>Cancel</button>
              <button className="tasks-v2-danger" type="button" disabled={pendingTaskIds.has(deleting.id)} onClick={() => void remove()}>{pendingTaskIds.has(deleting.id) ? 'Deleting…' : 'Delete task'}</button>
            </div>
          </section>
        </div>
      )}
    </section>
  )

}

export function TasksPage(props: Props) {
  return <TasksPageContent key={props.userId} {...props} />
}
