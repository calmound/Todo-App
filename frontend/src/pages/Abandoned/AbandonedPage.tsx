import { useEffect, useState } from 'react';
import { Card, Group, Stack, Title, Text, Badge, Button, Loader, Center, Paper } from '@mantine/core';
import dayjs from 'dayjs';
import type { Task } from '../../types/task';
import { tasksApi } from '../../api/tasks';

export default function AbandonedPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const data = await tasksApi.getTasks({ status: 'abandoned' });
      setTasks(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const restore = async (id: number) => {
    await tasksApi.patchTask(id, { status: 'pending', completedAt: null });
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  if (loading) {
    return (
      <Center h={400}>
        <Loader />
      </Center>
    );
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>已放弃的任务</Title>
        <Badge color="red" variant="light">{tasks.length} 项</Badge>
      </Group>

      {tasks.length === 0 ? (
        <Card withBorder>
          <Text c="dimmed">暂无已放弃的任务</Text>
        </Card>
      ) : (
        <Stack>
          {tasks.map((t) => (
            <Paper key={t.id} withBorder p="md">
              <Group justify="space-between" align="flex-start">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Group gap={8}>
                    <Text fw={600} style={{ wordBreak: 'break-word' }}>{t.title || '(未命名)'}</Text>
                    <Badge size="xs" color="red" variant="light">已放弃</Badge>
                  </Group>
                  {t.description && (
                    <Text size="sm" c="dimmed" mt={4} style={{ wordBreak: 'break-word' }}>{t.description}</Text>
                  )}
                  <Group gap={8} mt={6}>
                    {t.date && <Badge size="xs" variant="light">日期 {t.date}</Badge>}
                    {t.rangeStart && t.rangeEnd && (
                      <Badge size="xs" variant="light">{t.rangeStart} - {t.rangeEnd}</Badge>
                    )}
                    {t.dueAt && (
                      <Badge size="xs" variant="light" color="orange">截止 {dayjs(t.dueAt).format('YYYY-MM-DD')}</Badge>
                    )}
                    {Array.isArray(t.categories) && t.categories.length > 0 && (
                      <Group gap={4}>
                        {t.categories.map((c) => (
                          <Badge key={c} size="xs" variant="light" color="gray">{c}</Badge>
                        ))}
                      </Group>
                    )}
                  </Group>
                </div>
                <Group gap={8} wrap="nowrap">
                  <Button variant="light" onClick={() => restore(t.id)}>恢复</Button>
                </Group>
              </Group>
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

