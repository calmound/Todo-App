import { TextInput, Textarea, Group, Select, Stack, SegmentedControl, Button } from '@mantine/core';
import { DatePickerInput, TimeInput } from '@mantine/dates';
import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useRightPanel } from '../RightPanel/RightPanelContext';

function useDebouncedCallback<T extends any[]>(fn: (...args: T) => void, delay = 400) {
  const [t, setT] = useState<number | undefined>();
  useEffect(() => () => { if (t) window.clearTimeout(t); }, [t]);
  return (...args: T) => {
    if (t) window.clearTimeout(t);
    const id = window.setTimeout(() => fn(...args), delay);
    setT(id);
  };
}

export function TaskDetailPanel() {
  const { task, opened, patchTask, deleteTask, close } = useRightPanel();

  const [isRange, setIsRange] = useState(false);

  useEffect(() => {
    if (task) {
      setIsRange(!!(task.rangeStart && task.rangeEnd));
    }
  }, [task]);

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
            <Button variant="subtle" color="gray" onClick={close}>关闭</Button>
            <Button variant="outline" color="red" onClick={deleteTask}>删除</Button>
          </Group>
        </Group>

        <TextInput
          label="标题"
          placeholder="任务标题"
          value={task?.title || ''}
          onChange={(e) => debouncedPatch({ title: e.currentTarget.value })}
        />

        <Textarea
          label="描述"
          placeholder="任务描述"
          minRows={3}
          value={task?.description || ''}
          onChange={(e) => debouncedPatch({ description: e.currentTarget.value })}
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
              patchTask({ date: undefined, rangeStart: d, rangeEnd: d });
            } else {
              const d = task?.rangeStart || dayjs().format('YYYY-MM-DD');
              patchTask({ date: d, rangeStart: undefined, rangeEnd: undefined });
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
              onChange={(date) => patchTask({ rangeStart: date ? dayjs(date).format('YYYY-MM-DD') : undefined })}
            />
            <DatePickerInput
              label="结束日期"
              placeholder="选择结束"
              popoverProps={{ withinPortal: true, zIndex: 20000 }}
              locale="zh-cn"
              value={task?.rangeEnd ? new Date(task.rangeEnd) : null}
              onChange={(date) => patchTask({ rangeEnd: date ? dayjs(date).format('YYYY-MM-DD') : undefined })}
            />
          </Group>
        ) : (
          <DatePickerInput
            label="日期"
            placeholder="选择日期"
            popoverProps={{ withinPortal: true, zIndex: 20000 }}
            locale="zh-cn"
            value={task?.date ? new Date(task.date) : null}
            onChange={(date) => patchTask({ date: date ? dayjs(date).format('YYYY-MM-DD') : undefined })}
          />
        )}

        <Select
          label="类型"
          data={[
            { value: 'timed', label: '定时' },
            { value: 'allDay', label: '全天' },
          ]}
          value={task?.allDay ? 'allDay' : 'timed'}
          comboboxProps={{ zIndex: 20000, withinPortal: true }}
          onChange={(value) => patchTask({ allDay: value === 'allDay' })}
        />

        {!task?.allDay && isRange && (
          <Group grow>
            <TimeInput
              label="开始时间"
              value={task?.startTime || ''}
              onChange={(e) => patchTask({ startTime: e.currentTarget.value })}
            />
            <TimeInput
              label="结束时间"
              value={task?.endTime || ''}
              onChange={(e) => patchTask({ endTime: e.currentTarget.value })}
            />
          </Group>
        )}

        <Select
          label="状态"
          data={[
            { value: 'pending', label: '待办' },
            { value: 'done', label: '已完成' },
          ]}
          value={task?.status || 'pending'}
          comboboxProps={{ zIndex: 20000, withinPortal: true }}
          onChange={(value) => patchTask({ status: (value as 'pending' | 'done') })}
        />

        <Select
          label="四象限"
          data={[
            { value: 'IU', label: '重要且紧急' },
            { value: 'IN', label: '重要不紧急' },
            { value: 'NU', label: '不重要但紧急' },
            { value: 'NN', label: '不重要不紧急' },
          ]}
          value={task?.quadrant || 'IN'}
          comboboxProps={{ zIndex: 20000, withinPortal: true }}
          onChange={(value) => patchTask({ quadrant: value as any })}
        />
        </>
        )}
      </Stack>
    </div>
  );
}
