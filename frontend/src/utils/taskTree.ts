import type { Task } from '../types/task';

/**
 * 从扁平的任务列表构建树形结构
 * @param tasks 扁平的任务列表
 * @returns 只包含顶层任务的列表（子任务在subtasks字段中）
 */
export function buildTaskTree(tasks: Task[]): Task[] {
  // 创建任务映射以便快速查找
  const taskMap = new Map<number, Task>();
  const rootTasks: Task[] = [];

  // 第一遍：创建所有任务的副本并建立映射
  tasks.forEach((task) => {
    taskMap.set(task.id, { ...task, subtasks: [] });
  });

  // 第二遍：建立父子关系
  tasks.forEach((task) => {
    const currentTask = taskMap.get(task.id)!;

    if (task.parentId) {
      // 这是一个子任务，添加到父任务的subtasks中
      const parent = taskMap.get(task.parentId);
      if (parent) {
        parent.subtasks = parent.subtasks || [];
        parent.subtasks.push(currentTask);
      } else {
        // 父任务不存在，视为顶层任务
        rootTasks.push(currentTask);
      }
    } else {
      // 顶层任务
      rootTasks.push(currentTask);
    }
  });

  // 按 order 字段排序子任务
  const sortSubtasks = (task: Task) => {
    if (task.subtasks && task.subtasks.length > 0) {
      task.subtasks.sort((a, b) => (a.order || 0) - (b.order || 0));
      task.subtasks.forEach(sortSubtasks);
    }
  };

  rootTasks.forEach(sortSubtasks);

  return rootTasks;
}

/**
 * 计算任务的完成进度
 * @param task 任务对象
 * @returns { completed: number, total: number }
 */
export function calculateTaskProgress(task: Task): { completed: number; total: number } {
  if (!task.subtasks || task.subtasks.length === 0) {
    return { completed: 0, total: 0 };
  }

  const completed = task.subtasks.filter((subtask) => subtask.status === 'done').length;
  const total = task.subtasks.length;

  return { completed, total };
}

/**
 * 扁平化任务树为数组（用于渲染）
 * @param tasks 树形任务列表
 * @param expandedTaskIds 已展开的任务ID集合
 * @param level 当前层级
 * @returns 扁平化的任务列表，每个任务包含额外的渲染信息
 */
export function flattenTaskTree(
  tasks: Task[],
  expandedTaskIds: Set<number>,
  level: number = 0
): Array<{
  task: Task;
  level: number;
  hasChildren: boolean;
  expanded: boolean;
  completedCount: number;
  totalCount: number;
}> {
  const result: Array<{
    task: Task;
    level: number;
    hasChildren: boolean;
    expanded: boolean;
    completedCount: number;
    totalCount: number;
  }> = [];

  tasks.forEach((task) => {
    const hasChildren = task.subtasks && task.subtasks.length > 0;
    const expanded = expandedTaskIds.has(task.id);
    const { completed, total } = calculateTaskProgress(task);

    result.push({
      task,
      level,
      hasChildren: !!hasChildren,
      expanded,
      completedCount: completed,
      totalCount: total,
    });

    // 如果任务已展开且有子任务，递归添加子任务
    if (expanded && hasChildren) {
      const childrenFlat = flattenTaskTree(task.subtasks!, expandedTaskIds, level + 1);
      result.push(...childrenFlat);
    }
  });

  return result;
}
