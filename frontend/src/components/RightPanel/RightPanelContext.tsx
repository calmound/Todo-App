import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Task, UpdateTaskInput } from '../../types/task';
import { tasksApi } from '../../api/tasks';

type OpenOptions = {
  onPatched?: (t: Task) => void;
  onDeleted?: (id: number) => void;
  allTasks?: Task[]; // 传入所有任务列表，避免重复请求
};

type RightPanelContextValue = {
  opened: boolean;
  task: Task | null;
  allTasks: Task[] | null;
  openTask: (task: Task, opts?: OpenOptions) => void;
  close: () => void;
  patchTask: (patch: UpdateTaskInput) => Promise<void>;
  deleteTask: () => Promise<void>;
  triggerRefresh: () => void;
  refreshKey: number;
};

const RightPanelContext = createContext<RightPanelContextValue | undefined>(undefined);

export function RightPanelProvider({ children }: { children: React.ReactNode }) {
  const [opened, setOpened] = useState(false);
  const [task, setTask] = useState<Task | null>(null);
  const [allTasks, setAllTasks] = useState<Task[] | null>(null);
  const [callbacks, setCallbacks] = useState<OpenOptions | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  const openTask = useCallback((t: Task, opts?: OpenOptions) => {
    setOpened(true);
    setCallbacks(opts);
    setTask(t);
    setAllTasks(opts?.allTasks || null);
  }, []);

  const close = useCallback(() => {
    setOpened(false);
    setTask(null);
    setAllTasks(null);
    setCallbacks(undefined);
  }, []);

  const patchTask = useCallback(async (patch: UpdateTaskInput) => {
    if (!task) return;
    const updated = await tasksApi.patchTask(task.id, patch);
    setTask(updated);
    if (callbacks?.onPatched) callbacks.onPatched(updated);
  }, [task, callbacks]);

  const deleteTask = useCallback(async () => {
    if (!task) return;
    const id = task.id;
    await tasksApi.deleteTask(id);
    if (callbacks?.onDeleted) callbacks.onDeleted(id);
    close();
  }, [task, callbacks, close]);

  const triggerRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <RightPanelContext.Provider value={{ opened, task, allTasks, openTask, close, patchTask, deleteTask, triggerRefresh, refreshKey }}>
      {children}
    </RightPanelContext.Provider>
  );
}

export function useRightPanel() {
  const ctx = useContext(RightPanelContext);
  if (!ctx) throw new Error('useRightPanel must be used within RightPanelProvider');
  return ctx;
}
