export interface Task {
  id: number;
  title: string;
  description?: string | null;
  date?: string | null;
  rangeStart?: string | null;
  rangeEnd?: string | null;
  allDay: boolean;
  startTime?: string | null;
  endTime?: string | null;
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
