import { Checkbox, Paper, Text, Group, Badge, ActionIcon, Menu } from '@mantine/core';
import { IconTrash, IconClock, IconFlag } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useState, useEffect } from 'react';
import type { Task } from '../../types/task';

interface TaskItemProps {
  task: Task;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onClick: (task: Task) => void;
  onUpdateQuadrant?: (id: number, quadrant: Task['quadrant']) => void;
  showMeta?: boolean; // 是否显示右侧元信息（列表名和日期）
  compact?: boolean; // 紧凑模式，信息在一行显示
  selected?: boolean; // 是否被选中（高亮显示）
}

export function TaskItem({ task, onToggle, onDelete, onClick, onUpdateQuadrant, showMeta = false, compact = false, selected = false }: TaskItemProps) {
  const [contextMenuOpened, setContextMenuOpened] = useState(false);
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
        return '#adb5bd'; // 灰色（不重要不紧急）
      default:
        return '#adb5bd';
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
    // 监听全局点击/滚动以关闭右键菜单（受控模式）
    useEffect(() => {
      if (!contextMenuOpened) return;
      const close = () => setContextMenuOpened(false);
      window.addEventListener('click', close, { capture: true });
      window.addEventListener('scroll', close, true);
      window.addEventListener('contextmenu', close);
      return () => {
        window.removeEventListener('click', close, { capture: true } as any);
        window.removeEventListener('scroll', close, true);
        window.removeEventListener('contextmenu', close);
      };
    }, [contextMenuOpened]);
    return (
      <Menu opened={contextMenuOpened} withinPortal>
        <Menu.Target>
          <div
            style={{
              cursor: 'pointer',
              padding: '6px 12px',
              borderBottom: '1px solid #f1f3f5',
              backgroundColor: selected ? '#e7f5ff' : task.status === 'done' ? '#f9fafb' : '#fff',
              borderLeft: selected ? '3px solid #228be6' : '3px solid transparent',
              transition: 'all 0.15s ease',
            }}
            onClick={(e) => {
              onClick(task);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setContextMenuOpened(true);
            }}
            onMouseDown={(e) => {
              // 左键仅打开详情，不打开菜单
              if (e.button === 0) e.stopPropagation();
            }}
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
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>优先级</Menu.Label>
          <div style={{ padding: '4px 12px' }}>
            <Group gap="xs" justify="center">
              <ActionIcon
                variant="subtle"
                size="lg"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateQuadrant?.(task.id, 'IU');
                }}
                style={{ cursor: 'pointer' }}
              >
                <IconFlag size={20} style={{ color: '#ff6b6b' }} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                size="lg"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateQuadrant?.(task.id, 'IN');
                }}
                style={{ cursor: 'pointer' }}
              >
                <IconFlag size={20} style={{ color: '#ffd43b' }} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                size="lg"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateQuadrant?.(task.id, 'NU');
                }}
                style={{ cursor: 'pointer' }}
              >
                <IconFlag size={20} style={{ color: '#51cf66' }} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                size="lg"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateQuadrant?.(task.id, 'NN');
                }}
                style={{ cursor: 'pointer' }}
              >
                <IconFlag size={20} style={{ color: '#adb5bd' }} />
              </ActionIcon>
            </Group>
          </div>
          <Menu.Divider />
          <Menu.Item
            color="red"
            leftSection={<IconTrash size={14} />}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
          >
            删除任务
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    );
  }

  // 默认模式：多行显示
  return (
    <Menu
      opened={contextMenuOpened}
      onChange={setContextMenuOpened}
      withinPortal
      closeOnClickOutside
      closeOnEscape
    >
      <Menu.Target>
        <Paper
          p="md"
          withBorder
          style={{
            cursor: 'pointer',
            backgroundColor: selected ? '#e7f5ff' : undefined,
            borderColor: selected ? '#228be6' : undefined,
            borderWidth: selected ? '2px' : undefined,
            transition: 'all 0.15s ease',
          }}
          onClick={(e) => {
            onClick(task);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setContextMenuOpened(true);
          }}
          onMouseDown={(e) => {
            // 阻止 Menu.Target 的默认点击行为
            if (e.button === 0) {
              e.stopPropagation();
            }
          }}
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
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>优先级</Menu.Label>
        <div style={{ padding: '4px 12px' }}>
          <Group gap="xs" justify="center">
            <ActionIcon
              variant="subtle"
              size="lg"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateQuadrant?.(task.id, 'IU');
              }}
              style={{ cursor: 'pointer' }}
            >
              <IconFlag size={20} style={{ color: '#ff6b6b' }} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              size="lg"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateQuadrant?.(task.id, 'IN');
              }}
              style={{ cursor: 'pointer' }}
            >
              <IconFlag size={20} style={{ color: '#ffd43b' }} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              size="lg"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateQuadrant?.(task.id, 'NU');
              }}
              style={{ cursor: 'pointer' }}
            >
              <IconFlag size={20} style={{ color: '#51cf66' }} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              size="lg"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateQuadrant?.(task.id, 'NN');
              }}
              style={{ cursor: 'pointer' }}
            >
              <IconFlag size={20} style={{ color: '#adb5bd' }} />
            </ActionIcon>
          </Group>
        </div>
        <Menu.Divider />
        <Menu.Item
          color="red"
          leftSection={<IconTrash size={14} />}
          onClick={(e) => {
            e.stopPropagation();
            setContextMenuOpened(false);
            onDelete(task.id);
          }}
        >
          删除任务
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
