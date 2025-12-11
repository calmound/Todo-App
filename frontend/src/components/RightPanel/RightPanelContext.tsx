import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Task, UpdateTaskInput } from '../../types/task';
import { tasksApi } from '../../api/tasks';

type OpenOptions = {
  onPatched?: (t: Task) => void;
  onDeleted?: (id: number) => void;
};

type RightPanelContextValue = {
  opened: boolean;
  task: Task | null;
  openTask: (task: Task, opts?: OpenOptions) => void;
  close: () => void;
  patchTask: (patch: UpdateTaskInput) => Promise<void>;
  deleteTask: () => Promise<void>;
};

const RightPanelContext = createContext<RightPanelContextValue | undefined>(undefined);

export function RightPanelProvider({ children }: { children: React.ReactNode }) {
  const [opened, setOpened] = useState(false);
  const [task, setTask] = useState<Task | null>(null);
  const [callbacks, setCallbacks] = useState<OpenOptions | undefined>();

  const openTask = useCallback((t: Task, opts?: OpenOptions) => {
    setOpened(true);
    setCallbacks(opts);
    setTask(t);
  }, []);

  const close = useCallback(() => {
    setOpened(false);
    setTask(null);
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

  return (
    <RightPanelContext.Provider value={{ opened, task, openTask, close, patchTask, deleteTask }}>
      {children}
    </RightPanelContext.Provider>
  );
}

export function useRightPanel() {
  const ctx = useContext(RightPanelContext);
  if (!ctx) throw new Error('useRightPanel must be used within RightPanelProvider');
  return ctx;
}
