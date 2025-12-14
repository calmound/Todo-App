import { TextInput, Group, Stack, SegmentedControl, Button, ActionIcon, Text, Chip, Checkbox, Divider } from '@mantine/core';
import { DatePickerInput, TimeInput } from '@mantine/dates';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useRightPanel } from '../RightPanel/RightPanelContext';
import { IconX, IconPlus, IconTrash, IconGripVertical } from '@tabler/icons-react';
import type { Task } from '../../types/task';
import { tasksApi } from '../../api/tasks';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function useDebouncedCallback<T extends any[]>(fn: (...args: T) => void, delay = 400) {
  const [t, setT] = useState<number | undefined>();
  useEffect(() => () => { if (t) window.clearTimeout(t); }, [t]);
  return (...args: T) => {
    if (t) window.clearTimeout(t);
    const id = window.setTimeout(() => fn(...args), delay);
    setT(id);
  };
}

interface SortableSubtaskItemProps {
  subtask: Task;
  onToggle: (subtask: Task) => void;
  onUpdateTitle: (subtask: Task, title: string) => void;
  onDelete: (id: number) => void;
}

function SortableSubtaskItem({ subtask, onToggle, onUpdateTitle, onDelete }: SortableSubtaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subtask.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Group gap={8} wrap="nowrap">
        <div
          {...attributes}
          {...listeners}
          style={{
            cursor: 'grab',
            display: 'flex',
            alignItems: 'center',
            color: '#adb5bd',
          }}
        >
          <IconGripVertical size={16} />
        </div>
        <Checkbox
          checked={subtask.status === 'done'}
          onChange={() => onToggle(subtask)}
          size="sm"
        />
        <TextInput
          value={subtask.title}
          onChange={(e) => onUpdateTitle(subtask, e.currentTarget.value)}
          placeholder="子任务标题"
          size="sm"
          style={{ flex: 1 }}
          styles={{
            input: {
              textDecoration: subtask.status === 'done' ? 'line-through' : 'none',
              color: subtask.status === 'done' ? '#adb5bd' : 'inherit',
            },
          }}
        />
        <ActionIcon
          size="sm"
          variant="subtle"
          color="red"
          onClick={() => onDelete(subtask.id)}
          aria-label="删除子任务"
        >
          <IconTrash size={16} />
        </ActionIcon>
      </Group>
    </div>
  );
}

export function TaskDetailPanel() {
  const { task, opened, patchTask, deleteTask, close, refreshKey, allTasks } = useRightPanel();

  const [isRange, setIsRange] = useState(false);
  const [localTitle, setLocalTitle] = useState('');
  const [subtasks, setSubtasks] = useState<Task[]>([]);

  useEffect(() => {
    if (task) {
      setIsRange(!!(task.rangeStart && task.rangeEnd));
      setLocalTitle(task.title || '');

      // 获取子任务
      fetchSubtasks();
    }
  }, [task]);

  // 监听 refreshKey 变化，重新获取子任务
  useEffect(() => {
    if (task && refreshKey > 0) {
      fetchSubtasks();
    }
  }, [refreshKey]);

  // 监听 allTasks 变化，更新子任务列表
  useEffect(() => {
    if (task && allTasks) {
      updateSubtasksFromAllTasks();
    }
  }, [allTasks]);

  const updateSubtasksFromAllTasks = () => {
    if (!task || !allTasks) return;
    const children = allTasks.filter(t => t.parentId === task.id);
    // 按 order 字段排序（与任务列表保持一致）
    children.sort((a, b) => {
      const aOrder = a.order ?? Number.MAX_SAFE_INTEGER;
      const bOrder = b.order ?? Number.MAX_SAFE_INTEGER;
      if (aOrder !== bOrder) return aOrder - bOrder;
      // 如果 order 相同，按创建时间排序
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    setSubtasks(children);
  };

  const fetchSubtasks = async () => {
    if (!task) return;

    // 优先使用传入的 allTasks，避免重复请求
    if (allTasks) {
      updateSubtasksFromAllTasks();
      return;
    }

    // 只在没有 allTasks 时才调用 API
    try {
      const tasks = await tasksApi.getAllTasks();
      const children = tasks.filter(t => t.parentId === task.id);
      // 按 order 字段排序（与任务列表保持一致）
      children.sort((a, b) => {
        const aOrder = a.order ?? Number.MAX_SAFE_INTEGER;
        const bOrder = b.order ?? Number.MAX_SAFE_INTEGER;
        if (aOrder !== bOrder) return aOrder - bOrder;
        // 如果 order 相同，按创建时间排序
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
      setSubtasks(children);
    } catch (error) {
      console.error('Failed to fetch subtasks:', error);
    }
  };

  const handleToggleSubtask = async (subtask: Task) => {
    const newStatus = subtask.status === 'done' ? 'pending' : 'done';
    const completedAt = newStatus === 'done' ? new Date().toISOString() : null;

    try {
      await tasksApi.patchTask(subtask.id, { status: newStatus, completedAt });
      fetchSubtasks();
    } catch (error) {
      console.error('Failed to toggle subtask:', error);
    }
  };

  const handleDeleteSubtask = async (subtaskId: number) => {
    try {
      await tasksApi.deleteTask(subtaskId);
      fetchSubtasks();
    } catch (error) {
      console.error('Failed to delete subtask:', error);
    }
  };

  const handleAddSubtask = async () => {
    if (!task) return;

    try {
      const date = dayjs().format('YYYY-MM-DD');
      const dueAt = dayjs().endOf('day').toISOString();

      await tasksApi.createTask({
        title: '',
        parentId: task.id,
        status: 'pending',
        quadrant: task.quadrant || 'IN',
        date,
        dueAt,
        categories: task.categories || [],
        order: subtasks.length,
      });

      fetchSubtasks();
    } catch (error) {
      console.error('Failed to add subtask:', error);
    }
  };

  const handleUpdateSubtaskTitle = async (subtask: Task, newTitle: string) => {
    try {
      await tasksApi.patchTask(subtask.id, { title: newTitle });
      fetchSubtasks();
    } catch (error) {
      console.error('Failed to update subtask title:', error);
    }
  };

  // 拖拽传感器配置
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 处理子任务拖拽结束
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = subtasks.findIndex((t) => t.id === active.id);
    const newIndex = subtasks.findIndex((t) => t.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // 重新排序子任务
    const reorderedSubtasks = arrayMove(subtasks, oldIndex, newIndex);

    // 更新所有子任务的 order 字段
    const updates = reorderedSubtasks.map((subtask, index) => ({
      id: subtask.id,
      order: index,
    }));

    // 乐观更新本地状态
    setSubtasks(reorderedSubtasks);

    // 批量更新后端
    try {
      await Promise.all(
        updates.map((update) => tasksApi.patchTask(update.id, { order: update.order }))
      );
    } catch (error) {
      console.error('Failed to update subtask order:', error);
      // 失败时重新获取数据
      fetchSubtasks();
    }
  };

  const debouncedPatch = useDebouncedCallback(patchTask, 500);

  if (!opened) return null;

  return (
    <div style={{
      height: '100%',
      background: '#fff',
      padding: 16,
      overflowY: 'auto',
    }}>
      <Stack gap="md">
        {!task && (
          <div style={{ color: '#868e96' }}>未选择任务</div>
        )}
        {task && (
        <>
        <Group justify="space-between">
          <div style={{ fontWeight: 600 }}>编辑任务</div>
          <Group>
            <ActionIcon aria-label="关闭" variant="subtle" color="gray" radius="xl" onClick={close}>
              <IconX size={18} />
            </ActionIcon>
          </Group>
        </Group>

        <TextInput
          label="标题"
          placeholder="任务标题"
          value={localTitle}
          onChange={(e) => {
            const newValue = e.currentTarget.value;
            setLocalTitle(newValue);
            debouncedPatch({ title: newValue });
          }}
        />

        <SegmentedControl
          data={[
            { label: '单日', value: 'single' },
            { label: '周期', value: 'range' },
          ]}
          value={isRange ? 'range' : 'single'}
          onChange={(v) => {
            const toRange = v === 'range';
            setIsRange(toRange);
            if (toRange) {
              const d = task?.date || dayjs().format('YYYY-MM-DD');
              // 切到周期：清空单日日期（null），设置起止为同一天
              const dueAt = dayjs(d).endOf('day').toISOString();
              patchTask({ date: null, rangeStart: d, rangeEnd: d, dueAt });
            } else {
              const d = task?.rangeStart || dayjs().format('YYYY-MM-DD');
              // 切到单日：设置单日日期，并清空起止（null）
              const dueAt = dayjs(d).endOf('day').toISOString();
              patchTask({ date: d, rangeStart: null, rangeEnd: null, dueAt });
            }
          }}
        />

        {isRange ? (
          <Group grow>
            <DatePickerInput
              label="开始日期"
              placeholder="选择开始"
              popoverProps={{ withinPortal: true, zIndex: 20000 }}
              locale="zh-cn"
              value={task?.rangeStart ? new Date(task.rangeStart) : null}
              onChange={(date) => {
                const d = date ? dayjs(date).format('YYYY-MM-DD') : null;
                // 当修改开始日期时，dueAt 仍以结束日期为准；若无结束日期，则以开始日期为准
                const end = task?.rangeEnd || d;
                const dueAt = end ? dayjs(end).endOf('day').toISOString() : null;
                patchTask({ rangeStart: d, dueAt });
              }}
            />
            <DatePickerInput
              label="结束日期"
              placeholder="选择结束"
              popoverProps={{ withinPortal: true, zIndex: 20000 }}
              locale="zh-cn"
              value={task?.rangeEnd ? new Date(task.rangeEnd) : null}
              onChange={(date) => {
                const d = date ? dayjs(date).format('YYYY-MM-DD') : null;
                const dueAt = d ? dayjs(d).endOf('day').toISOString() : null;
                patchTask({ rangeEnd: d, dueAt });
              }}
            />
          </Group>
        ) : (
          <DatePickerInput
            label="日期"
            placeholder="选择日期"
            popoverProps={{ withinPortal: true, zIndex: 20000 }}
            locale="zh-cn"
            value={task?.date ? new Date(task.date) : null}
            onChange={(date) => {
              const dateStr = date ? dayjs(date).format('YYYY-MM-DD') : null;
              const dueAt = date ? dayjs(date).endOf('day').toISOString() : null;
              patchTask({ date: dateStr, dueAt });
            }}
          />
        )}

        {/* 不显示时间输入，周期任务也不需要开始/结束时间 */}

        {/* 任务状态在列表用复选框操作，详情不显示状态选择 */}

        <div>
          <Text size="sm" fw={500} mb={6}>标签</Text>
          <Chip.Group
            multiple
            value={(task?.categories as any) || []}
            onChange={(values) => patchTask({ categories: values as any })}
          >
            <Group gap="xs">
              {['生活','工作','学习','创作','健康','社交','产品'].map((t) => (
                <Chip key={t} value={t} variant="light" size="sm">
                  {t}
                </Chip>
              ))}
            </Group>
          </Chip.Group>
        </div>

        {/* 子任务列表 */}
        {!task?.parentId && (
          <>
            <Divider />
            <div>
              <Group justify="space-between" mb={8}>
                <Text size="sm" fw={500}>子任务</Text>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="blue"
                  onClick={handleAddSubtask}
                  aria-label="添加子任务"
                >
                  <IconPlus size={16} />
                </ActionIcon>
              </Group>

              {subtasks.length === 0 ? (
                <Text size="sm" c="dimmed">暂无子任务</Text>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={subtasks.map((s) => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <Stack gap={8}>
                      {subtasks.map((subtask) => (
                        <SortableSubtaskItem
                          key={subtask.id}
                          subtask={subtask}
                          onToggle={handleToggleSubtask}
                          onUpdateTitle={handleUpdateSubtaskTitle}
                          onDelete={handleDeleteSubtask}
                        />
                      ))}
                    </Stack>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </>
        )}

        {/* 预期完成时间无需手动配置：
            列表展示基于任务日期推导（单日为当日 23:59:59），
            详情面板不提供单独编辑入口。*/}

        {task?.completedAt && (
          <div>
            <Text size="sm" fw={500} c="dimmed" mb={4}>实际完成时间</Text>
            <Text size="sm" c="dimmed">
              {dayjs(task.completedAt).format('YYYY-MM-DD HH:mm:ss')}
            </Text>
          </div>
        )}

        {/* Danger zone at bottom */}
        <div style={{ position: 'sticky', bottom: 0, background: '#fff', paddingTop: 8, paddingBottom: 8 }}>
          <Button color="red" variant="light" fullWidth onClick={deleteTask}>删除任务</Button>
        </div>
        </>
        )}
      </Stack>
    </div>
  );
}
