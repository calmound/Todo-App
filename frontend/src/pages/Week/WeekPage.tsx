import { useState, useEffect } from 'react';
import { Title, Stack, Button, Text, Loader, Center } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import type { Task, CreateTaskInput } from '../../types/task';
import { tasksApi } from '../../api/tasks';
import { TaskItem } from '../../components/TaskItem/TaskItem';
import { TaskDetailDrawer } from '../../components/TaskDetail/TaskDetailDrawer';

dayjs.extend(weekOfYear);

export function WeekPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpened, setDrawerOpened] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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

    try {
      const newStatus = task.status === 'done' ? 'pending' : 'done';
      await tasksApi.patchTask(id, { status: newStatus });
      fetchTasks();
    } catch (error) {
      console.error('Failed to toggle task:', error);
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
    setSelectedTask(task);
    setDrawerOpened(true);
  };

  const handleNewTask = () => {
    setSelectedTask(null);
    setDrawerOpened(true);
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title order={2}>本周</Title>
            <Text c="dimmed" size="sm">
              {dayjs(startOfWeek).format('M月D日')} - {dayjs(endOfWeek).format('M月D日 YYYY年')}
            </Text>
          </div>
          <Button leftSection={<IconPlus size={18} />} onClick={handleNewTask}>
            新建任务
          </Button>
        </div>

        {tasks.length === 0 ? (
          <Center h={200}>
            <Text c="dimmed">本周暂无任务</Text>
          </Center>
        ) : (
          <Stack gap="sm">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onClick={handleTaskClick}
              />
            ))}
          </Stack>
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
