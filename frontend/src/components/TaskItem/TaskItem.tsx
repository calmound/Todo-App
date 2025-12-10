import { Checkbox, Paper, Text, Group, Badge, ActionIcon } from '@mantine/core';
import { IconTrash, IconClock } from '@tabler/icons-react';
import type { Task } from '../../types/task';

interface TaskItemProps {
  task: Task;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onClick: (task: Task) => void;
}

export function TaskItem({ task, onToggle, onDelete, onClick }: TaskItemProps) {
  const formatTime = (time?: string | null) => {
    if (!time) return null;
    return time;
  };

  return (
    <Paper
      p="md"
      withBorder
      style={{ cursor: 'pointer' }}
      onClick={() => onClick(task)}
    >
      <Group justify="space-between" wrap="nowrap">
        <Group gap="sm" style={{ flex: 1 }}>
          <Checkbox
            checked={task.status === 'done'}
            onClickCapture={(e) => e.stopPropagation()}
            onChange={(e) => {
              e.stopPropagation();
              onToggle(task.id);
            }}
          />
          <div style={{ flex: 1 }}>
            <Text
              fw={500}
              style={{
                textDecoration: task.status === 'done' ? 'line-through' : 'none',
              }}
            >
              {task.title}
            </Text>
            {task.description && (
              <Text size="sm" c="dimmed" lineClamp={1}>
                {task.description}
              </Text>
            )}
            <Group gap="xs" mt={4}>
              {task.rangeStart && task.rangeEnd ? (
                <Badge size="xs" color="grape">周期</Badge>
              ) : task.allDay ? (
                <Badge size="xs" color="blue">全天</Badge>
              ) : (
                task.startTime && (
                  <Group gap={4}>
                    <IconClock size={14} />
                    <Text size="xs" c="dimmed">
                      {formatTime(task.startTime)}
                      {task.endTime && ` - ${formatTime(task.endTime)}`}
                    </Text>
                  </Group>
                )
              )}
              {/* 四象限标记 */}
              {task.quadrant && (
                <Badge size="xs" variant="light" color="teal">
                  {task.quadrant === 'IU' && '重要紧急'}
                  {task.quadrant === 'IN' && '重要不紧急'}
                  {task.quadrant === 'NU' && '不重要紧急'}
                  {task.quadrant === 'NN' && '不重要不紧急'}
                </Badge>
              )}
            </Group>
          </div>
        </Group>
        <ActionIcon
          color="red"
          variant="subtle"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
        >
          <IconTrash size={18} />
        </ActionIcon>
      </Group>
    </Paper>
  );
}
