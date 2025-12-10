import { useState, useEffect } from 'react';
import { Title, Stack, Button, SegmentedControl, Paper, Text, Group, Badge, Loader, Center } from '@mantine/core';
import { Calendar } from '@mantine/dates';
import { IconPlus } from '@tabler/icons-react';
import dayjs from 'dayjs';
import type { Task, CreateTaskInput } from '../../types/task';
import { tasksApi } from '../../api/tasks';
import { TaskItem } from '../../components/TaskItem/TaskItem';
import { TaskDetailDrawer } from '../../components/TaskDetail/TaskDetailDrawer';

export function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpened, setDrawerOpened] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const startOfMonth = dayjs(currentMonth).startOf('month').subtract(7, 'days').format('YYYY-MM-DD');
      const endOfMonth = dayjs(currentMonth).endOf('month').add(7, 'days').format('YYYY-MM-DD');
      const data = await tasksApi.getTasks({ from: startOfMonth, to: endOfMonth });
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [currentMonth]);

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
        const dateToUse = input.date || dayjs(selectedDate).format('YYYY-MM-DD');
        await tasksApi.createTask({ ...input, date: dateToUse });
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

  const isDateInTask = (date: Date, task: Task) => {
    const d = dayjs(date).format('YYYY-MM-DD');
    if (task.rangeStart && task.rangeEnd) {
      return d >= task.rangeStart && d <= task.rangeEnd;
    }
    return task.date === d;
  };

  const tasksForSelectedDate = tasks.filter((task) => isDateInTask(selectedDate, task));

  const getTasksForDate = (date: Date) => tasks.filter((task) => isDateInTask(date, task));

  const renderDay = (date: Date) => {
    const dayTasks = getTasksForDate(date);
    const isToday = dayjs(date).isSame(dayjs(), 'day');
    const isSelected = dayjs(date).isSame(selectedDate, 'day');

    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          minHeight: 60,
          padding: 4,
          backgroundColor: isSelected ? '#e7f5ff' : isToday ? '#fff3bf' : 'transparent',
          borderRadius: 4,
        }}
      >
        <Text size="sm" fw={isToday ? 700 : 400}>
          {date.getDate()}
        </Text>
        {dayTasks.length > 0 && (
          <div style={{ marginTop: 4 }}>
            {dayTasks.slice(0, 2).map((task) => (
              <Badge key={task.id} size="xs" color={task.status === 'done' ? 'gray' : 'blue'} mb={2}>
                {task.title.length > 15 ? task.title.substring(0, 15) + '...' : task.title}
              </Badge>
            ))}
            {dayTasks.length > 2 && (
              <Text size="xs" c="dimmed">
                +{dayTasks.length - 2} 更多
              </Text>
            )}
          </div>
        )}
      </div>
    );
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
        <Group justify="space-between">
          <Title order={2}>日历</Title>
          <Group>
            <SegmentedControl
              value={viewMode}
              onChange={(value) => setViewMode(value as 'month' | 'week')}
              data={[
                { label: '月', value: 'month' },
                { label: '周', value: 'week' },
              ]}
            />
            <Button leftSection={<IconPlus size={18} />} onClick={handleNewTask}>
              新建任务
            </Button>
          </Group>
        </Group>

        <Paper p="md" withBorder>
          <Calendar
            value={selectedDate}
            onChange={(date) => date && setSelectedDate(date)}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            size="xl"
            renderDay={renderDay}
            style={{ width: '100%' }}
          />
        </Paper>

        <div>
          <Title order={3} mb="md">
            {dayjs(selectedDate).format('YYYY年M月D日')}
          </Title>
          {tasksForSelectedDate.length === 0 ? (
            <Center h={150}>
              <Text c="dimmed">这一天没有任务</Text>
            </Center>
          ) : (
            <Stack gap="sm">
              {tasksForSelectedDate.map((task) => (
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
        </div>
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
