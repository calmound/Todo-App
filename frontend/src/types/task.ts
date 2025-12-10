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
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {}
