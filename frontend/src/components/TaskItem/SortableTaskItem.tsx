import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskItem } from './TaskItem';
import type { Task } from '../../types/task';
import { IconGripVertical } from '@tabler/icons-react';

interface SortableTaskItemProps {
  task: Task;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onClick: (task: Task) => void;
  onUpdateQuadrant?: (id: number, quadrant: Task['quadrant']) => void;
  onPatched?: (t: Task) => void;
  showMeta?: boolean;
  compact?: boolean;
  selected?: boolean;
  level?: number;
  hasChildren?: boolean;
  expanded?: boolean;
  onToggleExpand?: (id: number) => void;
  onAddSubtask?: (parentId: number) => void;
  completedCount?: number;
  totalCount?: number;
}

export function SortableTaskItem(props: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div
          {...attributes}
          {...listeners}
          style={{
            cursor: 'grab',
            display: 'flex',
            alignItems: 'center',
            padding: '0 4px',
            color: '#adb5bd',
          }}
        >
          <IconGripVertical size={16} />
        </div>
        <div style={{ flex: 1 }}>
          <TaskItem {...props} />
        </div>
      </div>
    </div>
  );
}
