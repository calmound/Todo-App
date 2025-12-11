import { Checkbox, Paper, Text, Group, Badge, ActionIcon } from '@mantine/core';
import { IconTrash, IconClock } from '@tabler/icons-react';
import dayjs from 'dayjs';
import type { Task } from '../../types/task';

interface TaskItemProps {
  task: Task;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onClick: (task: Task) => void;
  showMeta?: boolean; // 是否显示右侧元信息（列表名和日期）
  compact?: boolean; // 紧凑模式，信息在一行显示
}

export function TaskItem({ task, onToggle, onDelete, onClick, showMeta = false, compact = false }: TaskItemProps) {
  const checkboxColor = () => {
    if (task.status === 'done') return 'gray';
    switch (task.quadrant) {
      case 'IU':
        return 'red';
      case 'IN':
        return 'yellow';
      case 'NU':
        return 'cyan';
      case 'NN':
      default:
        return 'gray';
    }
  };

  const checkboxBorderColor = () => {
    if (task.status === 'done') return '#ced4da';
    switch (task.quadrant) {
      case 'IU':
        return '#ff6b6b'; // 鲜艳红
      case 'IN':
        return '#ffd43b'; // 鲜艳黄
      case 'NU':
        return '#51cf66'; // 鲜艳绿
      case 'NN':
      default:
        return '#74c0fc'; // 鲜艳蓝
    }
  };
  const formatTime = (time?: string | null) => {
    if (!time) return null;
    return time;
  };

  const formatDateMeta = () => {
    if (!task.date) return '';
    const today = dayjs().startOf('day');
    const yesterday = dayjs().subtract(1, 'day').startOf('day');
    const taskDate = dayjs(task.date).startOf('day');

    if (taskDate.isSame(today, 'day')) {
      return '今天';
    } else if (taskDate.isSame(yesterday, 'day')) {
      return '昨天';
    } else if (taskDate.isBefore(today, 'day')) {
      const daysAgo = today.diff(taskDate, 'day');
      if (daysAgo <= 7) {
        return `${daysAgo}天前`;
      } else {
        return taskDate.format('M月D日');
      }
    } else {
      return taskDate.format('M月D日');
    }
  };

  const isOverdue = () => {
    if (!task.date || task.status === 'done') return false;
    const today = dayjs().startOf('day');
    const taskDate = dayjs(task.date).startOf('day');
    return taskDate.isBefore(today, 'day');
  };

  if (compact) {
    // 紧凑模式：一行显示所有信息
    return (
      <div
        style={{
          cursor: 'pointer',
          padding: '6px 12px',
          borderBottom: '1px solid #f1f3f5',
          backgroundColor: task.status === 'done' ? '#f9fafb' : '#fff',
        }}
        onClick={() => onClick(task)}
      >
        <Group justify="space-between" wrap="nowrap" gap={8}>
          <Group gap={8} style={{ flex: 1, minWidth: 0 }}>
            <div onClick={(e) => e.stopPropagation()}>
              <Checkbox
                size="xs"
                color={checkboxColor()}
                checked={task.status === 'done'}
                onChange={(e) => {
                  onToggle(task.id);
                }}
                styles={{
                  input: {
                    borderColor: checkboxBorderColor(),
                    borderWidth: '2px',
                    '&:not(:checked)': {
                      borderColor: checkboxBorderColor(),
                    },
                  },
                }}
              />
            </div>
            <Group gap={6} style={{ flex: 1, minWidth: 0 }} wrap="nowrap">
              <Text
                size="sm"
                fw={task.status === 'done' ? 400 : 500}
                c={task.status === 'done' ? 'dimmed' : undefined}
                style={{
                  textDecoration: task.status === 'done' ? 'line-through' : 'none',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {task.title}
              </Text>
              {task.rangeStart && task.rangeEnd && (
                <Badge size="xs" color="grape" variant="light">周期</Badge>
              )}
            </Group>
          </Group>
          <Group gap={6} wrap="nowrap">
            {showMeta && (
              <>
                <Text size="xs" c={task.status === 'done' ? 'dimmed' : isOverdue() ? 'red.6' : 'blue.6'} fw={500} style={{ minWidth: '50px', textAlign: 'right' }}>
                  {formatDateMeta()}
                </Text>
              </>
            )}
          </Group>
        </Group>
      </div>
    );
  }

  // 默认模式：多行显示
  return (
    <Paper
      p="md"
      withBorder
      style={{ cursor: 'pointer' }}
      onClick={() => onClick(task)}
    >
      <Group justify="space-between" wrap="nowrap">
        <Group gap="sm" style={{ flex: 1 }}>
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              color={checkboxColor()}
              checked={task.status === 'done'}
              onChange={(e) => {
                console.log('[TaskItem DEBUG] onChange triggered for task:', task.id);
                console.log('[TaskItem DEBUG] Calling onToggle...');
                onToggle(task.id);
                console.log('[TaskItem DEBUG] onToggle called');
              }}
              styles={{
                input: {
                  borderColor: checkboxBorderColor(),
                  borderWidth: '2px',
                  '&:not(:checked)': {
                    borderColor: checkboxBorderColor(),
                  },
                },
              }}
            />
          </div>
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
        <Group gap="md">
          {showMeta && (
            <Group gap={8}>
              <Text size="xs" c={task.status === 'done' ? 'dimmed' : isOverdue() ? 'red.6' : 'blue.6'}>
                {formatDateMeta()}
              </Text>
            </Group>
          )}
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
      </Group>
    </Paper>
  );
}
