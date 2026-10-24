import type { Task, TaskPriority } from '../domain/Task'
import { getSupabaseClient } from './supabase'
import { ApiError, getCurrentUser } from './journalApi'

type TaskInput = Pick<Task, 'title' | 'dueDate' | 'priority'>

function apiError(error: { message: string; status?: number }) { return new ApiError(error.message, error.status) }
async function requireUser(expectedUserId?: string) {
  const user = await getCurrentUser()
  if (user === null) throw new ApiError('You must be signed in to access tasks.', 401)
  if (expectedUserId !== undefined && user.id !== expectedUserId) throw new ApiError('Your session changed before this task could be saved.', 401)
  return user
}
function toTask(row: { id: string; title: string; due_date: string; priority: TaskPriority; completed: boolean }): Task {
  return { id: row.id, title: row.title, dueDate: row.due_date, priority: row.priority, completed: row.completed }
}
export async function getTasks(expectedUserId?: string, signal?: AbortSignal): Promise<Task[]> {
  const user = await requireUser(expectedUserId)
  const { data, error } = await getSupabaseClient().from('tasks').select('id,title,due_date,priority,completed').eq('user_id', user.id).order('completed').order('due_date').abortSignal(signal ?? new AbortController().signal)
  if (error !== null) throw apiError(error)
  return (data ?? []).map(toTask)
}
export async function createTask(input: TaskInput, expectedUserId?: string): Promise<Task> {
  const user = await requireUser(expectedUserId)
  const { data, error } = await getSupabaseClient().from('tasks').insert({ user_id: user.id, title: input.title.trim(), due_date: input.dueDate, priority: input.priority }).select('id,title,due_date,priority,completed').single()
  if (error !== null) throw apiError(error)
  return toTask(data)
}
export async function updateTask(id: string, input: Partial<TaskInput & Pick<Task, 'completed'>>, expectedUserId?: string): Promise<Task> {
  const user = await requireUser(expectedUserId)
  const changes = { ...(input.title === undefined ? {} : { title: input.title.trim() }), ...(input.dueDate === undefined ? {} : { due_date: input.dueDate }), ...(input.priority === undefined ? {} : { priority: input.priority }), ...(input.completed === undefined ? {} : { completed: input.completed }) }
  const { data, error } = await getSupabaseClient().from('tasks').update(changes).eq('id', id).eq('user_id', user.id).select('id,title,due_date,priority,completed').single()
  if (error !== null) throw apiError(error)
  return toTask(data)
}
export async function deleteTask(id: string, expectedUserId?: string): Promise<void> {
  const user = await requireUser(expectedUserId)
  const { error } = await getSupabaseClient().from('tasks').delete().eq('id', id).eq('user_id', user.id)
  if (error !== null) throw apiError(error)
}
