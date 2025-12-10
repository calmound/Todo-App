import type { Task, CreateTaskInput, UpdateTaskInput } from '../types/task';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const tasksApi = {
  // Get tasks by date range
  getTasks: async (params?: { from?: string; to?: string; status?: string }): Promise<Task[]> => {
    const queryParams = new URLSearchParams();
    if (params?.from) queryParams.append('from', params.from);
    if (params?.to) queryParams.append('to', params.to);
    if (params?.status) queryParams.append('status', params.status);

    const response = await fetch(`${API_BASE_URL}/tasks?${queryParams.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch tasks');
    const data = await response.json();
    return data.tasks;
  },

  // Get all tasks
  getAllTasks: async (): Promise<Task[]> => {
    const response = await fetch(`${API_BASE_URL}/tasks/all`);
    if (!response.ok) throw new Error('Failed to fetch all tasks');
    const data = await response.json();
    return data.tasks;
  },

  // Get single task
  getTask: async (id: number): Promise<Task> => {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`);
    if (!response.ok) throw new Error('Failed to fetch task');
    return response.json();
  },

  // Create task
  createTask: async (input: CreateTaskInput): Promise<Task> => {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error('Failed to create task');
    return response.json();
  },

  // Update task (full)
  updateTask: async (id: number, input: CreateTaskInput): Promise<Task> => {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error('Failed to update task');
    return response.json();
  },

  // Patch task (partial)
  patchTask: async (id: number, input: UpdateTaskInput): Promise<Task> => {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error('Failed to patch task');
    return response.json();
  },

  // Delete task
  deleteTask: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete task');
  },
};
