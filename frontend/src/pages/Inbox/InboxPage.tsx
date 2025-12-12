import { useState, useEffect } from 'react';
import { Title, Stack, Text, Loader, Center, Button } from '@mantine/core';
import { modals } from '@mantine/modals';
import dayjs from 'dayjs';
import type { Task, CreateTaskInput } from '../../types/task';
import { tasksApi } from '../../api/tasks';
import { TaskItem } from '../../components/TaskItem/TaskItem';
// Use right-side panel instead of drawer
import { useRightPanel } from '../../components/RightPanel/RightPanelContext';
import { QuickInput } from '../../components/QuickInput/QuickInput';
import { TaskGroup } from '../../components/TaskGroup/TaskGroup';
import { buildTaskTree, flattenTaskTree } from '../../utils/taskTree';

const quadWeight = (q?: Task['quadrant']) => {
  switch (q) {
    case 'IU':
      return 0; // 最重要最紧急
    case 'IN':
      return 1;
    case 'NU':
      return 2;
    case 'NN':
    default:
      return 3;
  }
};

const sortTasks = (a: Task, b: Task) => {
  const aw = a.status === 'done' ? 1 : 0;
  const bw = b.status === 'done' ? 1 : 0;
  if (aw !== bw) return aw - bw; // pending first
  const aq = quadWeight(a.quadrant);
  const bq = quadWeight(b.quadrant);
  if (aq !== bq) return aq - bq; // quadrant priority
  // Then by date/time if available
  const ad = a.date || a.rangeStart || '';
  const bd = b.date || b.rangeStart || '';
  if (ad !== bd) return ad.localeCompare(bd);
  const at = a.startTime || '';
  const bt = b.startTime || '';
  return at.localeCompare(bt);
};

export function InboxPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<number>>(new Set());
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

  const handleToggle = async (id: number) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const newStatus = task.status === 'done' ? 'pending' : 'done';

    // 乐观更新：立即更新本地状态
    setTasks((prevTasks) =>
      prevTasks.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );

    try {
      await tasksApi.patchTask(id, { status: newStatus });
    } catch (error) {
      console.error('Failed to toggle task:', error);
      // 如果失败，回滚状态
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === id ? { ...t, status: task.status } : t))
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
    console.log('[InboxPage] handleUpdateQuadrant called with id:', id, 'quadrant:', quadrant);
    const task = tasks.find((t) => t.id === id);
    if (!task) {
      console.error('[InboxPage] Task not found in tasks array, id:', id);
      console.log('[InboxPage] Current tasks:', tasks.map(t => ({ id: t.id, title: t.title, parentId: t.parentId })));
      return;
    }

    console.log('[InboxPage] Found task:', task.title, 'current quadrant:', task.quadrant);

    // 乐观更新：立即更新本地状态
    setTasks((prevTasks) =>
      prevTasks.map((t) => (t.id === id ? { ...t, quadrant } : t))
    );

    try {
      console.log('[InboxPage] Calling API to update quadrant...');
      await tasksApi.patchTask(id, { quadrant });
      console.log('[InboxPage] API call successful');
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
      // 获取父任务的现有子任务数量，用于设置 order
      const parentTask = tasks.find((t) => t.id === parentId);
      const existingSubtasks = tasks.filter((t) => t.parentId === parentId);
      const order = existingSubtasks.length;

      // 创建一个新的空子任务
      const newSubtask = await tasksApi.createTask({
        title: '',
        parentId,
        order,
        status: 'pending',
        quadrant: parentTask?.quadrant || 'IN',
        date: dayjs().format('YYYY-MM-DD'), // 默认为今天
      });

      // 添加到任务列表
      setTasks((prevTasks) => [...prevTasks, newSubtask]);

      // 确保父任务展开
      setExpandedTaskIds((prev) => {
        const newSet = new Set(prev);
        newSet.add(parentId);
        return newSet;
      });

      // 自动打开新子任务的详情以便编辑
      setSelectedTaskId(newSubtask.id);
      rightPanel.openTask(newSubtask, {
        onPatched: (t) => setTasks((prev) => prev.map((x) => (x.id === t.id ? t : x))),
        onDeleted: (id) => setTasks((prev) => prev.filter((x) => x.id !== id)),
      });
    } catch (error) {
      console.error('Failed to add subtask:', error);
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
    setSelectedTaskId(task.id);
    rightPanel.openTask(task, {
      onPatched: (t) => setTasks((prev) => prev.map((x) => (x.id === t.id ? t : x))),
      onDeleted: (id) => setTasks((prev) => prev.filter((x) => x.id !== id)),
    });
  };

  const handleNewTask = () => {
    // Creation handled by QuickInput; no drawer needed
  };

  const handleQuickAdd = async (title: string, date: string) => {
    try {
      const newTask = await tasksApi.createTask({ title, date });
      // 乐观更新：直接添加新任务到列表
      setTasks((prevTasks) => [...prevTasks, newTask]);
      // 设置选中状态并自动打开任务详情
      setSelectedTaskId(newTask.id);
      rightPanel.openTask(newTask, {
        onPatched: (t) => setTasks((prev) => prev.map((x) => (x.id === t.id ? t : x))),
        onDeleted: (id) => setTasks((prev) => prev.filter((x) => x.id !== id)),
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
            overdueTasks.map((task) => tasksApi.patchTask(task.id, { date: today }))
          );
          fetchTasks();
        } catch (error) {
          console.error('Failed to postpone tasks:', error);
        }
      },
    });
  };

  if (loading) {
    return (
      <Center h={400}>
        <Loader />
      </Center>
    );
  }

  const today = dayjs().startOf('day');

  // 只处理顶层任务（不包括子任务）
  const topLevelTasks = tasks.filter((t) => !t.parentId);

  // 分组任务
  const overdueTopTasks = topLevelTasks.filter(
    (t) => t.status === 'pending' && t.date && dayjs(t.date).isBefore(today, 'day')
  ).sort(sortTasks);

  const pendingTopTasks = topLevelTasks.filter(
    (t) => t.status === 'pending' && (!t.date || !dayjs(t.date).isBefore(today, 'day'))
  ).sort(sortTasks);

  const completedTopTasks = topLevelTasks.filter((t) => t.status === 'done').sort(sortTasks);

  // 构建树形结构并扁平化（用于渲染）
  const overdueTree = buildTaskTree(tasks.filter((t) =>
    overdueTopTasks.find(top => top.id === t.id) ||
    overdueTopTasks.find(top => t.parentId === top.id)
  ));
  const overdueFlat = flattenTaskTree(overdueTree, expandedTaskIds);

  const pendingTree = buildTaskTree(tasks.filter((t) =>
    pendingTopTasks.find(top => top.id === t.id) ||
    pendingTopTasks.find(top => t.parentId === top.id)
  ));
  const pendingFlat = flattenTaskTree(pendingTree, expandedTaskIds);

  const completedTree = buildTaskTree(tasks.filter((t) =>
    completedTopTasks.find(top => top.id === t.id) ||
    completedTopTasks.find(top => t.parentId === top.id)
  ));
  const completedFlat = flattenTaskTree(completedTree, expandedTaskIds);

  return (
    <div>
      <Stack gap="md">
        <div>
          <QuickInput onAdd={handleQuickAdd} placeholder='添加任务至"收集箱"' defaultDate={dayjs().format('YYYY-MM-DD')} />
        </div>

        {tasks.length === 0 ? (
          <Center h={200}>
            <Text c="dimmed">暂无任务</Text>
          </Center>
        ) : (
          <Stack gap="lg">
            {pendingFlat.length > 0 && (
              <Stack gap="sm">
                {pendingFlat.map(({ task, level, hasChildren, expanded, completedCount, totalCount }) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onUpdateQuadrant={handleUpdateQuadrant}
                    onPatched={(t) => setTasks((prev) => prev.map((x) => (x.id === t.id ? t : x)))}
                    onClick={handleTaskClick}
                    showMeta={true}
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
              </Stack>
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
                {overdueFlat.map(({ task, level, hasChildren, expanded, completedCount, totalCount }) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onUpdateQuadrant={handleUpdateQuadrant}
                    onPatched={(t) => setTasks((prev) => prev.map((x) => (x.id === t.id ? t : x)))}
                    onClick={handleTaskClick}
                    showMeta={true}
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
              </TaskGroup>
            )}

            {completedFlat.length > 0 && (
              <TaskGroup
                title="已完成"
                count={completedTopTasks.length}
                defaultOpened={true}
              >
                {completedFlat.map(({ task, level, hasChildren, expanded, completedCount, totalCount }) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onUpdateQuadrant={handleUpdateQuadrant}
                    onPatched={(t) => setTasks((prev) => prev.map((x) => (x.id === t.id ? t : x)))}
                    onClick={handleTaskClick}
                    showMeta={true}
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
              </TaskGroup>
            )}
          </Stack>
        )}
      </Stack>

      {/* Right panel is global; no drawer here */}
    </div>
  );
}
