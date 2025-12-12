import { useState, useEffect } from 'react';
import { Title, Stack, Text, Loader, Center, Button } from '@mantine/core';
import { modals } from '@mantine/modals';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import type { Task, CreateTaskInput } from '../../types/task';
import { tasksApi } from '../../api/tasks';
import { TaskItem } from '../../components/TaskItem/TaskItem';
import { TaskDetailDrawer } from '../../components/TaskDetail/TaskDetailDrawer';
import { QuickInput } from '../../components/QuickInput/QuickInput';
import { TaskGroup } from '../../components/TaskGroup/TaskGroup';

dayjs.extend(weekOfYear);

export function WeekPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpened, setDrawerOpened] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const startOfWeek = dayjs().startOf('week').format('YYYY-MM-DD');
  const endOfWeek = dayjs().endOf('week').format('YYYY-MM-DD');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await tasksApi.getTasks({ from: startOfWeek, to: endOfWeek });
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

  const handleUpdateQuadrant = async (id: number, quadrant: Task['quadrant']) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    // 乐观更新：立即更新本地状态
    setTasks((prevTasks) =>
      prevTasks.map((t) => (t.id === id ? { ...t, quadrant } : t))
    );

    try {
      await tasksApi.patchTask(id, { quadrant });
    } catch (error) {
      console.error('Failed to update quadrant:', error);
      // 如果失败，回滚状态
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === id ? { ...t, quadrant: task.quadrant } : t))
      );
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
    setSelectedTaskId(task.id);
    setSelectedTask(task);
    setDrawerOpened(true);
  };

  const handleNewTask = () => {
    setSelectedTask(null);
    setDrawerOpened(true);
  };

  const handleQuickAdd = async (title: string, date: string) => {
    try {
      const newTask = await tasksApi.createTask({ title, date });
      // 乐观更新：直接添加新任务到列表
      setTasks((prevTasks) => [...prevTasks, newTask]);
      // 自动打开任务详情
      setSelectedTaskId(newTask.id);
      setSelectedTask(newTask);
      setDrawerOpened(true);
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
          <Title order={2} mb="xs">本周</Title>
          <Text c="dimmed" size="sm" mb="md">
            {dayjs(startOfWeek).format('M月D日')} - {dayjs(endOfWeek).format('M月D日 YYYY年')}
          </Text>
          <QuickInput onAdd={handleQuickAdd} placeholder='添加任务至"本周"' defaultDate={dayjs().format('YYYY-MM-DD')} />
        </div>

        {tasks.length === 0 ? (
          <Center h={200}>
            <Text c="dimmed">本周暂无任务</Text>
          </Center>
        ) : (
          (() => {
            const today = dayjs().startOf('day');
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
              const ad = a.date || '';
              const bd = b.date || '';
              if (ad !== bd) return ad.localeCompare(bd);
              return (a.startTime || '').localeCompare(b.startTime || '');
            };

            const overdueTasks = tasks.filter(
              (t) => t.status === 'pending' && t.date && dayjs(t.date).isBefore(today, 'day')
            ).sort(sortTasks);

            const pendingTasks = tasks.filter(
              (t) => t.status === 'pending' && (!t.date || !dayjs(t.date).isBefore(today, 'day'))
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
                        onUpdateQuadrant={handleUpdateQuadrant}
                        showMeta={true}
                        selected={selectedTaskId === task.id}
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
                        onUpdateQuadrant={handleUpdateQuadrant}
                        showMeta={true}
                        selected={selectedTaskId === task.id}
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
                        onUpdateQuadrant={handleUpdateQuadrant}
                        showMeta={true}
                        selected={selectedTaskId === task.id}
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
