import { useState, useEffect } from 'react';
import { Title, Stack, Text, Loader, Center, Button } from '@mantine/core';
import { modals } from '@mantine/modals';
import dayjs from 'dayjs';
import type { Task, CreateTaskInput } from '../../types/task';
import { tasksApi } from '../../api/tasks';
import { TaskItem } from '../../components/TaskItem/TaskItem';
// Removed drawer usage; use right panel instead
import { QuickInput } from '../../components/QuickInput/QuickInput';
import { TaskGroup } from '../../components/TaskGroup/TaskGroup';
import { useRightPanel } from '../../components/RightPanel/RightPanelContext';

export function AllPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const rightPanel = useRightPanel();

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await tasksApi.getAllTasks();
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleToggle = async (id: number) => {
    console.log('[AllPage DEBUG] handleToggle called with id:', id);
    const task = tasks.find((t) => t.id === id);
    if (!task) {
      console.log('[AllPage DEBUG] Task not found');
      return;
    }

    const newStatus = task.status === 'done' ? 'pending' : 'done';
    console.log('[AllPage DEBUG] Toggle status from', task.status, 'to', newStatus);

    // 乐观更新：立即更新本地状态
    setTasks((prevTasks) =>
      prevTasks.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
    console.log('[AllPage DEBUG] Local state updated optimistically');

    try {
      console.log('[AllPage DEBUG] Sending PATCH request...');
      await tasksApi.patchTask(id, { status: newStatus });
      console.log('[AllPage DEBUG] PATCH request successful');
    } catch (error) {
      console.error('Failed to toggle task:', error);
      // 如果失败，回滚状态
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === id ? { ...t, status: task.status } : t))
      );
      console.log('[AllPage DEBUG] State rolled back due to error');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await tasksApi.deleteTask(id);
      fetchTasks();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleSave = async (input: CreateTaskInput, taskId?: number) => {
    try {
      if (taskId) {
        await tasksApi.updateTask(taskId, input);
      } else {
        await tasksApi.createTask(input);
      }
      fetchTasks();
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const handleTaskClick = (task: Task) => {
    rightPanel.openTask(task, {
      onPatched: (t) => setTasks((prev) => prev.map((x) => (x.id === t.id ? t : x))),
      onDeleted: (id) => setTasks((prev) => prev.filter((x) => x.id !== id)),
    });
  };

  // New task handled via QuickInput; no separate drawer/panel for creation

  const handleQuickAdd = async (title: string, date: string) => {
    try {
      await tasksApi.createTask({ title, date });
      fetchTasks();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handlePostpone = (overdueTasks: Task[]) => {
    modals.openConfirmModal({
      title: '顺延任务',
      children: (
        <Text size="sm">确定要将 {overdueTasks.length} 个过期任务的日期顺延到今天吗？</Text>
      ),
      labels: { confirm: '确定', cancel: '取消' },
      confirmProps: { color: 'blue' },
      onConfirm: async () => {
        const today = dayjs().format('YYYY-MM-DD');
        try {
          await Promise.all(
            overdueTasks.map((task) => tasksApi.patchTask(task.id, { date: today }))
          );
          fetchTasks();
        } catch (error) {
          console.error('Failed to postpone tasks:', error);
        }
      },
    });
  };

  const today = dayjs().startOf('day');
  const sevenDaysAgo = dayjs().subtract(7, 'day').startOf('day');

  const quadWeight = (q?: Task['quadrant']) => {
    switch (q) {
      case 'IU': return 0;
      case 'IN': return 1;
      case 'NU': return 2;
      default: return 3;
    }
  };

  const sortTasks = (a: Task, b: Task) => {
    const aw = a.status === 'done' ? 1 : 0;
    const bw = b.status === 'done' ? 1 : 0;
    if (aw !== bw) return aw - bw;
    const aq = quadWeight(a.quadrant);
    const bq = quadWeight(b.quadrant);
    if (aq !== bq) return aq - bq;
    const ad = a.date || a.rangeStart || '';
    const bd = b.date || b.rangeStart || '';
    if (ad !== bd) return ad.localeCompare(bd);
    const at = a.startTime || '';
    const bt = b.startTime || '';
    return at.localeCompare(bt);
  };

  // 按日期分组（只显示待处理的任务）
  const overdueTasks = tasks.filter(
    (t) => t.status === 'pending' && t.date && dayjs(t.date).isBefore(today, 'day')
  ).sort(sortTasks);

  const todayTasks = tasks.filter(
    (t) => t.status === 'pending' && t.date && dayjs(t.date).isSame(today, 'day')
  ).sort(sortTasks);

  const futureTasks = tasks.filter(
    (t) => t.status === 'pending' && (!t.date || dayjs(t.date).isAfter(today, 'day'))
  ).sort(sortTasks);

  const completedTasks = tasks.filter((t) => t.status === 'done').sort(sortTasks);

  if (loading) {
    return (
      <Center h={400}>
        <Loader />
      </Center>
    );
  }

  return (
    <div style={{ paddingRight: 16 }}>
      <Stack gap="md">
        <div>
          <Title order={2} mb="md">任务</Title>
          <QuickInput onAdd={handleQuickAdd} placeholder='添加任务至"任务"' defaultDate={dayjs().format('YYYY-MM-DD')} />
        </div>

        {tasks.length === 0 ? (
          <Center h={200}>
            <Text c="dimmed">未找到任务</Text>
          </Center>
        ) : (
          <Stack gap="md">
            {todayTasks.length > 0 && (
              <TaskGroup
                title="今天"
                count={todayTasks.length}
              >
                {todayTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onClick={handleTaskClick}
                    showMeta={true}
                    compact={true}
                  />
                ))}
              </TaskGroup>
            )}

            {overdueTasks.length > 0 && (
              <TaskGroup
                title="已过期"
                count={overdueTasks.length}
                actions={
                  <Button size="xs" variant="subtle" onClick={() => handlePostpone(overdueTasks)}>
                    顺延
                  </Button>
                }
              >
                {overdueTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onClick={handleTaskClick}
                    showMeta={true}
                    compact={true}
                  />
                ))}
              </TaskGroup>
            )}

            {futureTasks.length > 0 && (
              <TaskGroup
                title="未来"
                count={futureTasks.length}
              >
                {futureTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onClick={handleTaskClick}
                    showMeta={true}
                    compact={true}
                  />
                ))}
              </TaskGroup>
            )}

            {completedTasks.length > 0 && (
              <TaskGroup
                title="已完成"
                count={completedTasks.length}
                defaultOpened={true}
              >
                {completedTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onClick={handleTaskClick}
                    showMeta={true}
                    compact={true}
                  />
                ))}
              </TaskGroup>
            )}
          </Stack>
        )}
      </Stack>

      {/* Right panel is global; no drawer here */}
    </div>
  );
}
