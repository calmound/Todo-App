// 任务标签（多选）
export type TaskCategory = '生活' | '工作' | '学习' | '创作' | '健康' | '社交' | '产品';

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  date?: string | null; // 'YYYY-MM-DD'
  // 跨日任务：闭区间
  rangeStart?: string | null; // 'YYYY-MM-DD'
  rangeEnd?: string | null;   // 'YYYY-MM-DD'
  allDay: boolean;
  startTime?: string | null; // 'HH:mm'
  endTime?: string | null; // 'HH:mm'
  status: 'pending' | 'done' | 'abandoned';
  quadrant: 'IU' | 'IN' | 'NU' | 'NN';
  // 标签（多选）
  categories?: TaskCategory[] | null;
  // 时间统计
  dueAt?: string | null; // 预计/期望/计划的完成时间（Deadline）
  completedAt?: string | null; // 任务实际完成的时间
  // 子任务支持
  parentId?: number | null; // 父任务ID，null 表示主任务
  order?: number; // 排序字段
  subtasks?: Task[]; // 子任务列表（前端构建）
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  date?: string;
  rangeStart?: string;
  rangeEnd?: string;
  allDay?: boolean;
  startTime?: string;
  endTime?: string;
  status?: 'pending' | 'done' | 'abandoned';
  quadrant?: 'IU' | 'IN' | 'NU' | 'NN';
  categories?: TaskCategory[] | null;
  dueAt?: string | null; // 预计完成时间（由日期推导）
  completedAt?: string | null; // 实际完成时间（勾选完成时写入）
  parentId?: number | null; // 子任务支持
  order?: number; // 排序支持
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {}
