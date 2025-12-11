import { useState, useEffect } from 'react';
import { Title, Stack, Text, Loader, Center, Button } from '@mantine/core';
import { modals } from '@mantine/modals';
import dayjs from 'dayjs';
import type { Task, CreateTaskInput } from '../../types/task';
import { tasksApi } from '../../api/tasks';
import { TaskItem } from '../../components/TaskItem/TaskItem';
import { TaskDetailDrawer } from '../../components/TaskDetail/TaskDetailDrawer';
import { QuickInput } from '../../components/QuickInput/QuickInput';
import { TaskGroup } from '../../components/TaskGroup/TaskGroup';

export function TodayPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpened, setDrawerOpened] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const today = dayjs().format('YYYY-MM-DD');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await tasksApi.getTasks({ from: today, to: today });
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
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const newStatus = task.status === 'done' ? 'pending' : 'done';

    // 乐观更新：立即更新本地状态
    setTasks((prevTasks) =>
      prevTasks.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );

    try {
      await tasksApi.patchTask(id, { status: newStatus });
    } catch (error) {
      console.error('Failed to toggle task:', error);
      // 如果失败，回滚状态
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === id ? { ...t, status: task.status } : t))
      );
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
        await tasksApi.createTask({ ...input, date: today });
      }
      fetchTasks();
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setDrawerOpened(true);
  };

  const handleNewTask = () => {
    setSelectedTask(null);
    setDrawerOpened(true);
  };

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
        <Text size="sm">
          确定要将 {overdueTasks.length} 个过期任务的日期顺延到今天吗？
        </Text>
      ),
      labels: { confirm: '确定', cancel: '取消' },
      onConfirm: async () => {
        const today = dayjs().format('YYYY-MM-DD');
        try {
          await Promise.all(
            overdueTasks.map((task) =>
              tasksApi.updateTask(task.id, { date: today })
            )
          );
          fetchTasks();
        } catch (error) {
          console.error('Failed to postpone tasks:', error);
        }
      },
    });
  };

  if (loading) {
    return (
      <Center h={400}>
        <Loader />
      </Center>
    );
  }

  return (
    <div>
      <Stack gap="md">
        <div>
          <Title order={2} mb="xs">今日</Title>
          <Text c="dimmed" size="sm" mb="md">
            {dayjs().format('YYYY年M月D日')}
          </Text>
          <QuickInput onAdd={handleQuickAdd} placeholder='添加任务至"今日"' defaultDate={today} />
        </div>

        {tasks.length === 0 ? (
          <Center h={200}>
            <Text c="dimmed">今天没有任务</Text>
          </Center>
        ) : (
          (() => {
            const todayStart = dayjs().startOf('day');
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
              return (a.startTime || '').localeCompare(b.startTime || '');
            };

            const overdueTasks = tasks.filter(
              (t) => t.status === 'pending' && t.date && dayjs(t.date).isBefore(todayStart, 'day')
            ).sort(sortTasks);

            const pendingTasks = tasks.filter(
              (t) => t.status === 'pending' && (!t.date || !dayjs(t.date).isBefore(todayStart, 'day'))
            ).sort(sortTasks);

            const completedTasks = tasks.filter((t) => t.status === 'done').sort(sortTasks);

            return (
              <Stack gap="lg">
                {pendingTasks.length > 0 && (
                  <Stack gap="sm">
                    {pendingTasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                        onClick={handleTaskClick}
                        showMeta={true}
                      />
                    ))}
                  </Stack>
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
                      />
                    ))}
                  </TaskGroup>
                )}
              </Stack>
            );
          })()
        )}
      </Stack>

      <TaskDetailDrawer
        opened={drawerOpened}
        onClose={() => setDrawerOpened(false)}
        task={selectedTask}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
