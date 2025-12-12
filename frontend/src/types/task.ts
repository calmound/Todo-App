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
  status: 'pending' | 'done';
  quadrant: 'IU' | 'IN' | 'NU' | 'NN';
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
  status?: 'pending' | 'done';
  quadrant?: 'IU' | 'IN' | 'NU' | 'NN';
  parentId?: number | null; // 子任务支持
  order?: number; // 排序支持
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {}
