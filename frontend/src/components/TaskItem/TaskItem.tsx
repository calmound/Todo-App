import { Checkbox, Paper, Text, Group, Badge, ActionIcon, Menu, TextInput } from '@mantine/core';
import { IconTrash, IconClock, IconFlag, IconCalendar, IconChevronRight, IconChevronDown, IconPlus, IconRepeat } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useState, useEffect } from 'react';
import type { Task } from '../../types/task';
import { tasksApi } from '../../api/tasks';

interface TaskItemProps {
  task: Task;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onClick: (task: Task) => void;
  onUpdateQuadrant?: (id: number, quadrant: Task['quadrant']) => void;
  onPatched?: (t: Task) => void;
  showMeta?: boolean; // 是否显示右侧元信息（列表名和日期）
  compact?: boolean; // 紧凑模式，信息在一行显示
  selected?: boolean; // 是否被选中（高亮显示）
  level?: number; // 子任务层级，0表示主任务，1表示子任务
  hasChildren?: boolean; // 是否有子任务
  expanded?: boolean; // 是否展开子任务
  onToggleExpand?: (id: number) => void; // 展开/折叠子任务
  onAddSubtask?: (parentId: number) => void; // 添加子任务
  completedCount?: number; // 已完成子任务数
  totalCount?: number; // 子任务总数
}

const CLOSE_MENUS_EVENT = 'task-item-close-menus';

export function TaskItem({
  task,
  onToggle,
  onDelete,
  onClick,
  onUpdateQuadrant,
  onPatched,
  showMeta = false,
  compact = false,
  selected = false,
  level = 0,
  hasChildren = false,
  expanded = false,
  onToggleExpand,
  onAddSubtask,
  completedCount = 0,
  totalCount = 0
}: TaskItemProps) {
  const [contextMenuOpened, setContextMenuOpened] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [editing, setEditing] = useState(task.title === '');
  const [title, setTitle] = useState(task.title);
  useEffect(() => { setTitle(task.title); }, [task.title]);
  useEffect(() => {
    const handler = () => setContextMenuOpened(false);
    window.addEventListener(CLOSE_MENUS_EVENT, handler);
    return () => window.removeEventListener(CLOSE_MENUS_EVENT, handler);
  }, []);
  // 自动进入编辑状态：如果标题为空
  useEffect(() => {
    if (task.title === '' && selected) {
      setEditing(true);
    }
  }, [task.title, selected]);
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
      // 不在全局捕获 contextmenu，避免与打开逻辑冲突
      return () => {
        window.removeEventListener('click', close, { capture: true } as any);
        window.removeEventListener('scroll', close, true);
        //
      };
    }, [contextMenuOpened]);
    return (
      <Menu opened={contextMenuOpened} withinPortal dropdownProps={{ style: { position: 'fixed', left: menuPos.x, top: menuPos.y } }}>
        <Menu.Target>
          <div
            style={{
              padding: '6px 12px',
              paddingLeft: `${12 + level * 32}px`, // 子任务缩进
              borderBottom: '1px solid #f1f3f5',
              backgroundColor: selected ? '#e7f5ff' : task.status === 'done' ? '#f9fafb' : '#fff',
              borderLeft: selected ? '3px solid #228be6' : '3px solid transparent',
              transition: 'all 0.15s ease',
              userSelect: 'none',
            }}
          onClick={(e) => {
            onClick(task);
          }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.dispatchEvent(new Event(CLOSE_MENUS_EVENT));
              setContextMenuOpened(true);
              setMenuPos({ x: e.clientX, y: e.clientY });
            }}
            onMouseDown={(e) => {
              // 左键仅打开详情，不打开菜单
              if (e.button === 0) e.stopPropagation();
            }}
          >
        <Group justify="space-between" wrap="nowrap" gap={8}>
          <Group gap={8} style={{ flex: 1, minWidth: 0, alignItems: 'center' }}>
            {/* 展开/折叠按钮 */}
            {hasChildren && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand?.(task.id);
                }}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                {expanded ? (
                  <IconChevronDown size={16} color="#868e96" />
                ) : (
                  <IconChevronRight size={16} color="#868e96" />
                )}
              </div>
            )}
            <div onClick={(e) => e.stopPropagation()}>
              <Checkbox
                size="sm"
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
            <TextInput
              variant="unstyled"
              size="xs"
              value={title}
              readOnly={!editing}
              autoFocus={editing}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditing(true);
              }}
              onFocus={() => setEditing(true)}
              onChange={(e) => setTitle(e.currentTarget.value)}
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const newTitle = title.trim() || task.title;
                  setTitle(newTitle);
                  setEditing(false);
                  if (newTitle !== task.title) {
                    const updated = await tasksApi.patchTask(task.id, { title: newTitle });
                    onPatched?.(updated);
                  }
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  setTitle(task.title);
                  setEditing(false);
                }
              }}
              onBlur={async () => {
                const newTitle = title.trim() || task.title;
                setTitle(newTitle);
                setEditing(false);
                if (newTitle !== task.title) {
                  const updated = await tasksApi.patchTask(task.id, { title: newTitle });
                  onPatched?.(updated);
                }
              }}
              styles={{
                input: {
                  padding: 0,
                  height: 20,
                  lineHeight: '20px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  caretColor: editing ? undefined : 'transparent',
                },
              }}
              style={{ flex: 1, minWidth: 0 }}
            />
          </Group>
          {/* 右侧紧凑元素组：周期图标、进度、日期 */}
          <Group gap={8} wrap="nowrap" style={{ alignItems: 'center', userSelect: 'none' }}>
            {task.rangeStart && task.rangeEnd && (
              <IconRepeat size={14} color="#ae3ec9" style={{ opacity: 0.9 }} />
            )}
            {totalCount > 0 && level === 0 && (
              <Text size="xs" c="dimmed" fw={500}>
                {completedCount}/{totalCount}
              </Text>
            )}
            {showMeta && (
              <Text size="xs" c={task.status === 'done' ? 'dimmed' : isOverdue() ? 'red.6' : 'blue.6'} fw={500}>
                {formatDateMeta()}
              </Text>
            )}
          </Group>
        </Group>
        </div>
        </Menu.Target>
        <Menu.Dropdown
          style={{
            position: 'fixed',
            top: menuPos.y,
            left: menuPos.x,
          }}
        >
          <Menu.Label>优先级</Menu.Label>
          <div style={{ padding: '4px 12px' }}>
            <Group gap="xs" justify="center">
              <ActionIcon
                variant="subtle"
                size="lg"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateQuadrant?.(task.id, 'IU');
                  setContextMenuOpened(false);
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
                  setContextMenuOpened(false);
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
                  setContextMenuOpened(false);
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
                  setContextMenuOpened(false);
                }}
                style={{ cursor: 'pointer' }}
              >
                <IconFlag size={20} style={{ color: '#adb5bd' }} />
              </ActionIcon>
            </Group>
          </div>
          <Menu.Divider />
          {level === 0 && onAddSubtask && (
            <>
              <Menu.Item
                leftSection={<IconPlus size={14} />}
                onClick={(e) => {
                  e.stopPropagation();
                  setContextMenuOpened(false);
                  onAddSubtask(task.id);
                }}
              >
                添加子任务
              </Menu.Item>
              <Menu.Divider />
            </>
          )}
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

  // 默认模式：多行显示
  return (
    <Menu
      opened={contextMenuOpened}
      onChange={setContextMenuOpened}
      withinPortal
      closeOnClickOutside
      closeOnEscape
      dropdownProps={{ style: { position: 'fixed', left: menuPos.x, top: menuPos.y } }}
    >
      <Menu.Target>
        <Paper
          p="md"
          pl={`${16 + level * 32}px`}
          withBorder
          style={{
            backgroundColor: selected ? '#e7f5ff' : undefined,
            borderColor: selected ? '#228be6' : undefined,
            borderWidth: selected ? '2px' : undefined,
            transition: 'all 0.15s ease',
            userSelect: 'none',
          }}
          onClick={(e) => {
            onClick(task);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setContextMenuOpened(true);
            setMenuPos({ x: e.clientX, y: e.clientY });
          }}
          onMouseDown={(e) => {
            // 阻止 Menu.Target 的默认点击行为
            if (e.button === 0) {
              e.stopPropagation();
            }
          }}
        >
      <Group justify="space-between" wrap="nowrap">
        <Group gap="sm" style={{ flex: 1, alignItems: 'center' }}>
          {/* 展开/折叠按钮 */}
          {hasChildren && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand?.(task.id);
              }}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              {expanded ? (
                <IconChevronDown size={18} color="#868e96" />
              ) : (
                <IconChevronRight size={18} color="#868e96" />
              )}
            </div>
          )}
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              size="sm"
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
          <Group gap={6} style={{ flex: 1, minWidth: 0, alignItems: 'center' }} wrap="nowrap">
            <TextInput
              variant="unstyled"
              value={title}
              readOnly={!editing}
              autoFocus={editing}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditing(true);
              }}
              onFocus={() => setEditing(true)}
              onChange={(e) => setTitle(e.currentTarget.value)}
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const newTitle = title.trim() || task.title;
                  setTitle(newTitle);
                  setEditing(false);
                  if (newTitle !== task.title) {
                    const updated = await tasksApi.patchTask(task.id, { title: newTitle });
                    onPatched?.(updated);
                  }
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  setTitle(task.title);
                  setEditing(false);
                }
              }}
              onBlur={async () => {
                const newTitle = title.trim() || task.title;
                setTitle(newTitle);
                setEditing(false);
                if (newTitle !== task.title) {
                  const updated = await tasksApi.patchTask(task.id, { title: newTitle });
                  onPatched?.(updated);
                }
              }}
              styles={{
                root: { height: 24 },
                input: {
                  padding: 0,
                  height: 24,
                  lineHeight: '24px',
                  fontWeight: 500,
                  fontSize: '1rem',
                  caretColor: editing ? undefined : 'transparent',
                },
              }}
              style={{ flex: 1, minWidth: 0 }}
            />
            {/* 子任务进度显示 */}
            {totalCount > 0 && level === 0 && (
              <Text size="sm" c="dimmed" fw={500}>
                {completedCount} / {totalCount}
              </Text>
            )}
            {task.rangeStart && task.rangeEnd && (
              <IconRepeat size={16} color="#ae3ec9" style={{ opacity: 0.9 }} />
            )}
          </Group>
          {task.description && (
            <Text size="sm" c="dimmed" lineClamp={1}>
              {task.description}
            </Text>
          )}
            <Group gap="xs" mt={4}>
              {task.rangeStart && task.rangeEnd ? (
                <></>
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
      <Menu.Dropdown
        style={{
          position: 'fixed',
          top: menuPos.y,
          left: menuPos.x,
        }}
      >
        <Menu.Label>优先级</Menu.Label>
        <div style={{ padding: '4px 12px' }}>
          <Group gap="xs" justify="center">
            <ActionIcon
              variant="subtle"
              size="lg"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateQuadrant?.(task.id, 'IU');
                setContextMenuOpened(false);
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
                setContextMenuOpened(false);
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
                setContextMenuOpened(false);
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
                setContextMenuOpened(false);
              }}
              style={{ cursor: 'pointer' }}
            >
              <IconFlag size={20} style={{ color: '#adb5bd' }} />
            </ActionIcon>
          </Group>
        </div>
        <Menu.Divider />
        {level === 0 && onAddSubtask && (
          <>
            <Menu.Item
              leftSection={<IconPlus size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                setContextMenuOpened(false);
                onAddSubtask(task.id);
              }}
            >
              添加子任务
            </Menu.Item>
            <Menu.Divider />
          </>
        )}
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
