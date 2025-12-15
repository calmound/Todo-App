import type { Task, CreateTaskInput, UpdateTaskInput } from '../types/task';
import { apiUrl, isTauriRuntime } from './baseUrl';

function jsonAsTextBody(input: unknown) {
  return {
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify(input ?? {}),
  } as const;
}

export const tasksApi = {
  // Get tasks by date range
  getTasks: async (params?: { from?: string; to?: string; status?: string }): Promise<Task[]> => {
    const queryParams = new URLSearchParams();
    if (params?.from) queryParams.append('from', params.from);
    if (params?.to) queryParams.append('to', params.to);
    if (params?.status) queryParams.append('status', params.status);

    const response = await fetch(`${apiUrl('/tasks')}?${queryParams.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch tasks');
    const data = await response.json();
    return data.tasks;
  },

  // Get all tasks
  getAllTasks: async (): Promise<Task[]> => {
    const response = await fetch(apiUrl('/tasks/all'));
    if (!response.ok) throw new Error('Failed to fetch all tasks');
    const data = await response.json();
    return data.tasks;
  },

  // Get single task
  getTask: async (id: number): Promise<Task> => {
    const response = await fetch(apiUrl(`/tasks/${id}`));
    if (!response.ok) throw new Error('Failed to fetch task');
    return response.json();
  },

  // Create task
  createTask: async (input: CreateTaskInput): Promise<Task> => {
    const endpoint = isTauriRuntime() ? '/tasks/create' : '/tasks';
    const response = await fetch(apiUrl(endpoint), {
      method: 'POST',
      ...(isTauriRuntime()
        ? jsonAsTextBody(input)
        : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }),
    });
    if (!response.ok) throw new Error('Failed to create task');
    return response.json();
  },

  // Update task (full)
  updateTask: async (id: number, input: CreateTaskInput): Promise<Task> => {
    const endpoint = isTauriRuntime() ? `/tasks/${id}/update` : `/tasks/${id}`;
    const response = await fetch(apiUrl(endpoint), {
      method: isTauriRuntime() ? 'POST' : 'PUT',
      ...(isTauriRuntime()
        ? jsonAsTextBody(input)
        : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }),
    });
    if (!response.ok) throw new Error('Failed to update task');
    return response.json();
  },

  // Patch task (partial)
  patchTask: async (id: number, input: UpdateTaskInput): Promise<Task> => {
    const endpoint = isTauriRuntime() ? `/tasks/${id}/patch` : `/tasks/${id}`;
    const response = await fetch(apiUrl(endpoint), {
      method: isTauriRuntime() ? 'POST' : 'PATCH',
      ...(isTauriRuntime()
        ? jsonAsTextBody(input)
        : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }),
    });
    if (!response.ok) throw new Error('Failed to patch task');
    return response.json();
  },

  // Delete task
  deleteTask: async (id: number): Promise<void> => {
    const endpoint = isTauriRuntime() ? `/tasks/${id}/delete` : `/tasks/${id}`;
    const response = await fetch(apiUrl(endpoint), {
      method: isTauriRuntime() ? 'POST' : 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete task');
  },
};
