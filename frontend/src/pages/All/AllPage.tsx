import { useState, useEffect } from 'react';
import { Title, Stack, Button, Text, Loader, Center, SegmentedControl } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import type { Task, CreateTaskInput } from '../../types/task';
import { tasksApi } from '../../api/tasks';
import { TaskItem } from '../../components/TaskItem/TaskItem';
import { TaskDetailDrawer } from '../../components/TaskDetail/TaskDetailDrawer';

export function AllPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpened, setDrawerOpened] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all');

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

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

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
          <Title order={2}>全部任务</Title>
          <Button leftSection={<IconPlus size={18} />} onClick={handleNewTask}>
            新建任务
          </Button>
        </div>

        <SegmentedControl
          value={filter}
          onChange={(value) => setFilter(value as 'all' | 'pending' | 'done')}
          data={[
            { label: '全部', value: 'all' },
            { label: '待办', value: 'pending' },
            { label: '已完成', value: 'done' },
          ]}
        />

        {filteredTasks.length === 0 ? (
          <Center h={200}>
            <Text c="dimmed">未找到任务</Text>
          </Center>
        ) : (
          <Stack gap="sm">
            {filteredTasks.map((task) => (
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
