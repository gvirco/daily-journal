export type TaskPriority = 'Low' | 'Medium' | 'High'

export type Task = {
  id: string
  title: string
  dueDate: string
  priority: TaskPriority
  completed: boolean
}
