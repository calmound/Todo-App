import { useState, useEffect } from 'react';
import { Title, Stack, Text, Loader, Center, Button, Tabs } from '@mantine/core';
import { modals } from '@mantine/modals';
import dayjs from 'dayjs';
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
} from '@dnd-kit/sortable';
import type { Task } from '../../types/task';
import { tasksApi } from '../../api/tasks';
import { SortableTaskItem } from '../../components/TaskItem/SortableTaskItem';
import { QuickInput } from '../../components/QuickInput/QuickInput';
import { TaskGroup } from '../../components/TaskGroup/TaskGroup';
import { useRightPanel } from '../../components/RightPanel/RightPanelContext';
import { buildTaskTree, flattenTaskTree } from '../../utils/taskTree';

const CATEGORIES = ['未分类', '生活', '工作', '学习', '创作', '健康', '社交', '产品'] as const;

export function CategoriesPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<string>('未分类');
  const rightPanel = useRightPanel();

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

  // 拖拽传感器配置
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 处理拖拽结束
  const handleDragEnd = async (event: DragEndEvent, tasksInGroup: Task[]) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    // 先检查是否在顶层任务组中
    let oldIndex = tasksInGroup.findIndex((t) => t.id === active.id);
    let newIndex = tasksInGroup.findIndex((t) => t.id === over.id);

    let targetTasks = tasksInGroup;

    // 如果不在顶层任务组中，说明是子任务拖拽
    if (oldIndex === -1 || newIndex === -1) {
      // 查找被拖拽的任务
      const draggedTask = tasks.find((t) => t.id === active.id);
      const targetTask = tasks.find((t) => t.id === over.id);

      if (!draggedTask || !targetTask) {
        return;
      }

      // 检查是否是同一个父任务下的子任务
      if (draggedTask.parentId !== targetTask.parentId) {
        return;
      }

      // 获取同一父任务下的所有子任务
      const siblings = tasks.filter((t) => t.parentId === draggedTask.parentId);
      // 按 order 排序
      siblings.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      targetTasks = siblings;
      oldIndex = siblings.findIndex((t) => t.id === active.id);
      newIndex = siblings.findIndex((t) => t.id === over.id);

      if (oldIndex === -1 || newIndex === -1) {
        return;
      }
    }

    // 重新排序任务
    const reorderedTasks = arrayMove(targetTasks, oldIndex, newIndex);

    // 更新所有任务的 order 字段
    const updates = reorderedTasks.map((task, index) => ({
      id: task.id,
      order: index,
    }));

    // 乐观更新本地状态
    setTasks((prevTasks) =>
      prevTasks.map((t) => {
        const update = updates.find((u) => u.id === t.id);
        return update ? { ...t, order: update.order } : t;
      })
    );

    // 批量更新后端
    try {
      await Promise.all(
        updates.map((update) => tasksApi.patchTask(update.id, { order: update.order }))
      );
      // 如果是子任务拖拽，通知详情面板刷新
      if (targetTasks !== tasksInGroup) {
        rightPanel.triggerRefresh();
      }
    } catch (error) {
      console.error('Failed to update task order:', error);
      // 失败时重新获取数据
      fetchTasks();
    }
  };

  const handleToggle = async (id: number) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const newStatus = task.status === 'done' ? 'pending' : 'done';
    const completedAt = newStatus === 'done' ? new Date().toISOString() : null;

    // 乐观更新：立即更新本地状态
    setTasks((prevTasks) =>
      prevTasks.map((t) => (t.id === id ? { ...t, status: newStatus, completedAt } : t))
    );

    try {
      await tasksApi.patchTask(id, { status: newStatus, completedAt });
    } catch (error) {
      console.error('Failed to toggle task:', error);
      // 如果失败，回滚状态
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === id ? { ...t, status: task.status, completedAt: task.completedAt } : t))
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

  const handleToggleExpand = (id: number) => {
    setExpandedTaskIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleAddSubtask = async (parentId: number) => {
    try {
      const parentTask = tasks.find((t) => t.id === parentId);
      const existingSubtasks = tasks.filter((t) => t.parentId === parentId);
      const order = existingSubtasks.length;

      const date = dayjs().format('YYYY-MM-DD');
      const dueAt = dayjs().endOf('day').toISOString();

      const newSubtask = await tasksApi.createTask({
        title: '',
        parentId,
        order,
        status: 'pending',
        quadrant: parentTask?.quadrant || 'IN',
        date,
        dueAt,
        categories: parentTask?.categories || [],
      });

      const updatedTasks = [...tasks, newSubtask];
      setTasks(updatedTasks);

      setExpandedTaskIds((prev) => {
        const newSet = new Set(prev);
        newSet.add(parentId);
        return newSet;
      });

      setSelectedTaskId(newSubtask.id);
      rightPanel.openTask(newSubtask, {
        onPatched: (t) => setTasks((prev) => prev.map((x) => (x.id === t.id ? t : x))),
        onDeleted: (id) => setTasks((prev) => prev.filter((x) => x.id !== id)),
        allTasks: updatedTasks,
      });
    } catch (error) {
      console.error('Failed to add subtask:', error);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTaskId(task.id);
    rightPanel.openTask(task, {
      onPatched: (t) => setTasks((prev) => prev.map((x) => (x.id === t.id ? t : x))),
      onDeleted: (id) => setTasks((prev) => prev.filter((x) => x.id !== id)),
      allTasks: tasks,
    });
  };

  const handleQuickAdd = async (title: string, date: string) => {
    try {
      const dueAt = date ? dayjs(date).endOf('day').toISOString() : undefined;
      const newTask = await tasksApi.createTask({
        title,
        date,
        dueAt,
        categories: activeTab === '未分类' ? [] : [activeTab],
      });
      const updatedTasks = [...tasks, newTask];
      setTasks(updatedTasks);
      setSelectedTaskId(newTask.id);
      rightPanel.openTask(newTask, {
        onPatched: (t) => setTasks((prev) => prev.map((x) => (x.id === t.id ? t : x))),
        onDeleted: (id) => setTasks((prev) => prev.filter((x) => x.id !== id)),
        allTasks: updatedTasks,
      });
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handlePostpone = (overdueTasks: Task[]) => {
    modals.openConfirmModal({
      title: '顺延任务',
      children: (
        <Text size="sm">确定要将 {overdueTasks.length} 个过期任务的日期顺延到今天吗？</Text>
      ),
      labels: { confirm: '确定', cancel: '取消' },
      confirmProps: { color: 'blue' },
      onConfirm: async () => {
        const today = dayjs().format('YYYY-MM-DD');
        try {
          await Promise.all(
            overdueTasks.map((task) => {
              const dueAt = dayjs(today).endOf('day').toISOString();
              return tasksApi.patchTask(task.id, { date: today, dueAt });
            })
          );
          fetchTasks();
        } catch (error) {
          console.error('Failed to postpone tasks:', error);
        }
      },
    });
  };

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
    const aOrder = a.order ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.order ?? Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  };

  // 根据选中的分类筛选任务
  const filteredTasks = tasks.filter((t) => {
    if (t.status === 'abandoned') return false;

    // 如果是"未分类"，显示没有任何分类的任务
    if (activeTab === '未分类') {
      return !t.categories || t.categories.length === 0;
    }

    // 其他分类正常筛选
    return t.categories?.includes(activeTab);
  });

  // 只处理顶层任务（不包括子任务）
  const topLevelTasks = filteredTasks.filter((t) => !t.parentId);

  // 按日期分组
  const overdueTopTasks = topLevelTasks.filter(
    (t) => t.status === 'pending' && t.date && dayjs(t.date).isBefore(today, 'day')
  ).sort(sortTasks);

  const todayTopTasks = topLevelTasks.filter(
    (t) => t.status === 'pending' && t.date && dayjs(t.date).isSame(today, 'day')
  ).sort(sortTasks);

  const futureTopTasks = topLevelTasks.filter(
    (t) => t.status === 'pending' && (!t.date || dayjs(t.date).isAfter(today, 'day'))
  ).sort(sortTasks);

  const completedTopTasks = topLevelTasks.filter((t) => t.status === 'done').sort(sortTasks);

  // 构建树形结构并扁平化
  const buildSortedTree = (sortedTopTasks: Task[]) => {
    const result: Task[] = [];
    sortedTopTasks.forEach(topTask => {
      result.push(topTask);
      const children = filteredTasks.filter(t => t.parentId === topTask.id);
      result.push(...children);
    });
    return buildTaskTree(result);
  };

  const todayTree = buildSortedTree(todayTopTasks);
  const todayFlat = flattenTaskTree(todayTree, expandedTaskIds);

  const overdueTree = buildSortedTree(overdueTopTasks);
  const overdueFlat = flattenTaskTree(overdueTree, expandedTaskIds);

  const futureTree = buildSortedTree(futureTopTasks);
  const futureFlat = flattenTaskTree(futureTree, expandedTaskIds);

  const completedTree = buildSortedTree(completedTopTasks);
  const completedFlat = flattenTaskTree(completedTree, expandedTaskIds);

  if (loading) {
    return (
      <Center h={400}>
        <Loader />
      </Center>
    );
  }

  return (
    <div style={{ paddingRight: 16 }}>
      <Stack gap="md">
        <Title order={2}>分类</Title>

        <Tabs
          value={activeTab}
          onChange={(value) => setActiveTab(value || '未分类')}
          styles={{
            tab: {
              '&:focus': {
                outline: 'none',
              },
              '&:focus-visible': {
                outline: 'none',
              },
            },
          }}
        >
          <Tabs.List>
            {CATEGORIES.map((category) => (
              <Tabs.Tab key={category} value={category}>
                {category}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs>

        <QuickInput
          onAdd={handleQuickAdd}
          placeholder={`添加任务至"${activeTab}"`}
          defaultDate={dayjs().format('YYYY-MM-DD')}
        />

        {topLevelTasks.length === 0 ? (
          <Center h={200}>
            <Text c="dimmed">该分类下暂无任务</Text>
          </Center>
        ) : (
          <Stack gap="md">
            {todayFlat.length > 0 && (
              <TaskGroup title="今天" count={todayTopTasks.length}>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleDragEnd(event, todayTopTasks)}
                >
                  <SortableContext
                    items={todayFlat.map((item) => item.task.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {todayFlat.map(({ task, level, hasChildren, expanded, completedCount, totalCount }) => (
                      <SortableTaskItem
                        key={task.id}
                        task={task}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                        onUpdateQuadrant={handleUpdateQuadrant}
                        onClick={handleTaskClick}
                        onPatched={(t) => setTasks((prev) => prev.map((x) => (x.id === t.id ? t : x)))}
                        showMeta={true}
                        compact={true}
                        selected={selectedTaskId === task.id}
                        level={level}
                        hasChildren={hasChildren}
                        expanded={expanded}
                        onToggleExpand={handleToggleExpand}
                        onAddSubtask={handleAddSubtask}
                        completedCount={completedCount}
                        totalCount={totalCount}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </TaskGroup>
            )}

            {overdueFlat.length > 0 && (
              <TaskGroup
                title="已过期"
                count={overdueTopTasks.length}
                actions={
                  <Button size="xs" variant="subtle" onClick={() => handlePostpone(overdueTopTasks)}>
                    顺延
                  </Button>
                }
              >
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleDragEnd(event, overdueTopTasks)}
                >
                  <SortableContext
                    items={overdueFlat.map((item) => item.task.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {overdueFlat.map(({ task, level, hasChildren, expanded, completedCount, totalCount }) => (
                      <SortableTaskItem
                        key={task.id}
                        task={task}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                        onUpdateQuadrant={handleUpdateQuadrant}
                        onClick={handleTaskClick}
                        onPatched={(t) => setTasks((prev) => prev.map((x) => (x.id === t.id ? t : x)))}
                        showMeta={true}
                        compact={true}
                        selected={selectedTaskId === task.id}
                        level={level}
                        hasChildren={hasChildren}
                        expanded={expanded}
                        onToggleExpand={handleToggleExpand}
                        onAddSubtask={handleAddSubtask}
                        completedCount={completedCount}
                        totalCount={totalCount}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </TaskGroup>
            )}

            {futureFlat.length > 0 && (
              <TaskGroup title="未来" count={futureTopTasks.length}>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleDragEnd(event, futureTopTasks)}
                >
                  <SortableContext
                    items={futureFlat.map((item) => item.task.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {futureFlat.map(({ task, level, hasChildren, expanded, completedCount, totalCount }) => (
                      <SortableTaskItem
                        key={task.id}
                        task={task}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                        onUpdateQuadrant={handleUpdateQuadrant}
                        onClick={handleTaskClick}
                        onPatched={(t) => setTasks((prev) => prev.map((x) => (x.id === t.id ? t : x)))}
                        showMeta={true}
                        compact={true}
                        selected={selectedTaskId === task.id}
                        level={level}
                        hasChildren={hasChildren}
                        expanded={expanded}
                        onToggleExpand={handleToggleExpand}
                        onAddSubtask={handleAddSubtask}
                        completedCount={completedCount}
                        totalCount={totalCount}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </TaskGroup>
            )}

            {completedFlat.length > 0 && (
              <TaskGroup title="已完成" count={completedTopTasks.length} defaultOpened={true}>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleDragEnd(event, completedTopTasks)}
                >
                  <SortableContext
                    items={completedFlat.map((item) => item.task.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {completedFlat.map(({ task, level, hasChildren, expanded, completedCount, totalCount }) => (
                      <SortableTaskItem
                        key={task.id}
                        task={task}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                        onUpdateQuadrant={handleUpdateQuadrant}
                        onClick={handleTaskClick}
                        onPatched={(t) => setTasks((prev) => prev.map((x) => (x.id === t.id ? t : x)))}
                        showMeta={true}
                        compact={true}
                        selected={selectedTaskId === task.id}
                        level={level}
                        hasChildren={hasChildren}
                        expanded={expanded}
                        onToggleExpand={handleToggleExpand}
                        onAddSubtask={handleAddSubtask}
                        completedCount={completedCount}
                        totalCount={totalCount}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </TaskGroup>
            )}
          </Stack>
        )}
      </Stack>
    </div>
  );
}
