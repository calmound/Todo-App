import { TextInput, Textarea, Group, Select, Stack, SegmentedControl, Button, ActionIcon } from '@mantine/core';
import { DatePickerInput, TimeInput } from '@mantine/dates';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useRightPanel } from '../RightPanel/RightPanelContext';
import { IconX } from '@tabler/icons-react';

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
  const [localTitle, setLocalTitle] = useState('');
  const [localDescription, setLocalDescription] = useState('');

  useEffect(() => {
    if (task) {
      setIsRange(!!(task.rangeStart && task.rangeEnd));
      setLocalTitle(task.title || '');
      setLocalDescription(task.description || '');
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

        <Textarea
          label="描述"
          placeholder="任务描述"
          minRows={3}
          value={localDescription}
          onChange={(e) => {
            const newValue = e.currentTarget.value;
            setLocalDescription(newValue);
            debouncedPatch({ description: newValue });
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
              patchTask({ date: null, rangeStart: d, rangeEnd: d });
            } else {
              const d = task?.rangeStart || dayjs().format('YYYY-MM-DD');
              // 切到单日：设置单日日期，并清空起止（null）
              patchTask({ date: d, rangeStart: null, rangeEnd: null });
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
              onChange={(date) => patchTask({ rangeStart: date ? dayjs(date).format('YYYY-MM-DD') : null })}
            />
            <DatePickerInput
              label="结束日期"
              placeholder="选择结束"
              popoverProps={{ withinPortal: true, zIndex: 20000 }}
              locale="zh-cn"
              value={task?.rangeEnd ? new Date(task.rangeEnd) : null}
              onChange={(date) => patchTask({ rangeEnd: date ? dayjs(date).format('YYYY-MM-DD') : null })}
            />
          </Group>
        ) : (
          <DatePickerInput
            label="日期"
            placeholder="选择日期"
            popoverProps={{ withinPortal: true, zIndex: 20000 }}
            locale="zh-cn"
            value={task?.date ? new Date(task.date) : null}
            onChange={(date) => patchTask({ date: date ? dayjs(date).format('YYYY-MM-DD') : null })}
          />
        )}

        {/* 不显示时间输入，周期任务也不需要开始/结束时间 */}

        {/* 任务状态在列表用复选框操作，详情不显示状态选择 */}

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
