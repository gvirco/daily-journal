import { useEffect, useMemo, useRef, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import type { Task, TaskPriority } from '../domain/Task'
import { createTask, deleteTask, getTasks, updateTask } from '../services/tasksApi'

type Props = { userId: string; onBack: () => void }
const priorities: TaskPriority[] = ['Low', 'Medium', 'High']
const dateFromValue = (value: string) => new Date(`${value}T12:00:00`)
const valueFromDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

function TaskDatePicker({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!isOpen) return
    const closeOnOutsideClick = (event: MouseEvent) => { if (!pickerRef.current?.contains(event.target as Node)) setIsOpen(false) }
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setIsOpen(false); triggerRef.current?.focus() } }
    window.addEventListener('mousedown', closeOnOutsideClick); window.addEventListener('keydown', closeOnEscape)
    return () => { window.removeEventListener('mousedown', closeOnOutsideClick); window.removeEventListener('keydown', closeOnEscape) }
  }, [isOpen])
  return <div className="task-date-picker" ref={pickerRef}><button ref={triggerRef} className="task-date-trigger" type="button" aria-haspopup="dialog" aria-expanded={isOpen} onClick={() => setIsOpen((open) => !open)}>{value || label}<span aria-hidden="true">&#128197;</span></button>{isOpen && <div className="task-calendar-popover" role="dialog" aria-label={`${label} calendar`}><DayPicker mode="single" selected={value ? dateFromValue(value) : undefined} onSelect={(date) => { if (date) onChange(valueFromDate(date)); setIsOpen(false); triggerRef.current?.focus() }} /></div>}</div>
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
  async function submit(event: React.FormEvent) { event.preventDefault(); if (createLock.current || title.trim() === '' || dueDate === '') return; const requestUserId = userId; createLock.current = true; setIsCreating(true); setError(null); setSuccess(null); try { const task = await createTask({ title: title.trim(), dueDate, priority }, requestUserId); if (userRef.current !== requestUserId) return; taskLoadGeneration.current += 1; setLoading(false); setTasks((current) => [...current, task]); setTitle(''); setDueDate(''); setPriority('Medium'); setSuccess('Task added.') } catch (e) { if (userRef.current === requestUserId) setError(e instanceof Error ? e.message : 'Unable to create task.') } finally { createLock.current = false; if (userRef.current === requestUserId) setIsCreating(false) } }
  async function save(task: Task) { if (pendingTaskIdsRef.current.has(task.id) || task.title.trim() === '') return; const requestUserId = userId; pendingTaskIdsRef.current.add(task.id); setPendingTaskIds(new Set(pendingTaskIdsRef.current)); setError(null); setSuccess(null); try { const updated = await updateTask(task.id, task, requestUserId); if (userRef.current !== requestUserId) return; setTasks((current) => current.map((item) => item.id === updated.id ? updated : item)); setEditing(null); setSuccess('Task saved.') } catch (e) { if (userRef.current === requestUserId) setError(e instanceof Error ? e.message : 'Unable to save task.') } finally { pendingTaskIdsRef.current.delete(task.id); if (userRef.current === requestUserId) setPendingTaskIds(new Set(pendingTaskIdsRef.current)) } }
  async function toggle(task: Task) { await save({ ...task, completed: !task.completed }) }
  async function remove() { if (!deleting || pendingTaskIdsRef.current.has(deleting.id)) return; const task = deleting; const requestUserId = userId; pendingTaskIdsRef.current.add(task.id); setPendingTaskIds(new Set(pendingTaskIdsRef.current)); setError(null); setSuccess(null); try { await deleteTask(task.id, requestUserId); if (userRef.current !== requestUserId) return; setTasks((current) => current.filter((item) => item.id !== task.id)); setDeleting(null); setSuccess('Task deleted.') } catch (e) { if (userRef.current === requestUserId) setError(e instanceof Error ? e.message : 'Unable to delete task.') } finally { pendingTaskIdsRef.current.delete(task.id); if (userRef.current === requestUserId) setPendingTaskIds(new Set(pendingTaskIdsRef.current)) } }
  const list = (items: Task[], label: string) => <section className="tasks-section"><h3>{label}</h3>{items.length === 0 ? <p className="tasks-empty">No {label.toLowerCase()}.</p> : <ul className="tasks-list" aria-label={label}>{items.map((task) => { const isPending = pendingTaskIds.has(task.id); return <li className="task-item" key={task.id} aria-busy={isPending}><label><input type="checkbox" checked={task.completed} disabled={isPending} onChange={() => void toggle(task)} aria-label={`${task.completed ? 'Reopen' : 'Complete'} ${task.title}`} /> <span className="task-title">{task.title}</span></label><span>Due {task.dueDate}</span><span className={`task-priority task-priority-${task.priority.toLowerCase()}`}>{task.priority}</span>{isPending && <span className="task-pending" role="status">Saving…</span>}<button type="button" disabled={isPending} onClick={() => setEditing(task)}>Edit</button><button type="button" disabled={isPending} onClick={() => setDeleting(task)}>Delete</button></li> })}</ul>}</section>
  return <section className="tasks-page" aria-labelledby="tasks-title"><div className="tasks-page-header"><div><p className="tasks-page-eyebrow">Plan your work</p><h2 id="tasks-title">Tasks</h2></div><button className="date-navigation-button" type="button" onClick={onBack}>Back to journal</button></div>{error && <p role="alert" className="journal-sync-error">{error}</p>}{success && <p role="status" className="task-success">{success}</p>}<form className="task-form" onSubmit={(event) => void submit(event)}><label className="task-field"><span>Task</span><input value={title} disabled={isCreating} onChange={(event) => setTitle(event.target.value)} required /></label><label className="task-field"><span>Due date</span><TaskDatePicker label="Due date" value={dueDate} onChange={setDueDate} /></label><label className="task-field"><span>Priority</span><select value={priority} disabled={isCreating} onChange={(event) => setPriority(event.target.value as TaskPriority)}>{priorities.map((item) => <option key={item}>{item}</option>)}</select></label><button className="task-submit" type="submit" disabled={!dueDate || isCreating}>{isCreating ? 'Saving…' : 'Add task'}</button></form>{loading ? <p aria-live="polite">Loading tasks…</p> : <>{list(open, 'Open tasks')}{list(completed, 'Completed tasks')}</>}{editing && <div className="morning-modal-backdrop"><section className="morning-modal" role="dialog" aria-modal="true" aria-labelledby="edit-task-title"><h2 id="edit-task-title">Edit task</h2><label>Task<input value={editing.title} disabled={pendingTaskIds.has(editing.id)} onChange={(event) => setEditing({ ...editing, title: event.target.value })} /></label><label>Due date<TaskDatePicker label="Edit due date" value={editing.dueDate} onChange={(dueDate) => setEditing({ ...editing, dueDate })} /></label><label>Priority<select value={editing.priority} disabled={pendingTaskIds.has(editing.id)} onChange={(event) => setEditing({ ...editing, priority: event.target.value as TaskPriority })}>{priorities.map((item) => <option key={item}>{item}</option>)}</select></label><button type="button" disabled={pendingTaskIds.has(editing.id)} onClick={() => void save(editing)}>{pendingTaskIds.has(editing.id) ? 'Saving…' : 'Save task'}</button><button type="button" disabled={pendingTaskIds.has(editing.id)} onClick={() => setEditing(null)}>Cancel</button></section></div>}{deleting && <div className="morning-modal-backdrop"><section className="morning-modal" role="dialog" aria-modal="true" aria-labelledby="delete-task-title"><h2 id="delete-task-title">Delete this task?</h2><p>This permanently deletes {deleting.title}.</p><button type="button" disabled={pendingTaskIds.has(deleting.id)} onClick={() => setDeleting(null)}>Cancel</button><button className="delete-confirmation-button" type="button" disabled={pendingTaskIds.has(deleting.id)} onClick={() => void remove()}>{pendingTaskIds.has(deleting.id) ? 'Deleting…' : 'Delete task'}</button></section></div>}</section>
}

export function TasksPage(props: Props) {
  return <TasksPageContent key={props.userId} {...props} />
}
