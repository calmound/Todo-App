import { Drawer, TextInput, Textarea, Group, Button, Select, Stack, SegmentedControl, Badge } from '@mantine/core';
import { DatePickerInput, TimeInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import type { Task, CreateTaskInput } from '../../types/task';
import { useEffect } from 'react';
import dayjs from 'dayjs';

interface TaskDetailDrawerProps {
  opened: boolean;
  onClose: () => void;
  task?: Task | null;
  onSave: (input: CreateTaskInput, taskId?: number) => void;
  onDelete?: (taskId: number) => void;
}

export function TaskDetailDrawer({ opened, onClose, task, onSave, onDelete }: TaskDetailDrawerProps) {
  const form = useForm<CreateTaskInput & { isRange: boolean }>({
    initialValues: {
      title: '',
      description: '',
      date: dayjs().format('YYYY-MM-DD'),
      rangeStart: '',
      rangeEnd: '',
      allDay: false,
      startTime: '',
      endTime: '',
      status: 'pending',
      quadrant: 'IN',
      isRange: false,
    },
  });

  useEffect(() => {
    if (task) {
      form.setValues({
        title: task.title,
        description: task.description || '',
        date: task.date || '',
        rangeStart: task.rangeStart || '',
        rangeEnd: task.rangeEnd || '',
        allDay: task.allDay,
        startTime: task.startTime || '',
        endTime: task.endTime || '',
        status: task.status,
        quadrant: task.quadrant || 'IN',
        isRange: !!(task.rangeStart && task.rangeEnd),
      });
    } else {
      form.reset();
      form.setFieldValue('date', dayjs().format('YYYY-MM-DD'));
    }
  }, [task, opened]);

  const handleSubmit = (values: CreateTaskInput & { isRange: boolean }) => {
    const payload: CreateTaskInput = values.isRange
      ? {
          title: values.title,
          description: values.description,
          rangeStart: values.rangeStart,
          rangeEnd: values.rangeEnd,
          allDay: values.allDay,
          startTime: values.startTime,
          endTime: values.endTime,
          status: values.status,
          quadrant: values.quadrant,
        }
      : {
          title: values.title,
          description: values.description,
          date: values.date,
          allDay: values.allDay,
          startTime: values.startTime,
          endTime: values.endTime,
          status: values.status,
          quadrant: values.quadrant,
        };

    onSave(payload, task?.id);
    onClose();
    form.reset();
    form.setFieldValue('date', dayjs().format('YYYY-MM-DD'));
  };

  const handleDelete = () => {
    if (task && onDelete) {
      onDelete(task.id);
      onClose();
    }
  };

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={task ? '编辑任务' : '新建任务'}
      position="right"
      size={480}
      zIndex={10000}
      withCloseButton
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="标题"
            placeholder="任务标题"
            required
            {...form.getInputProps('title')}
          />

          <Textarea
            label="描述"
            placeholder="任务描述"
            minRows={3}
            {...form.getInputProps('description')}
          />

          <SegmentedControl
            data={[
              { label: '单日', value: 'single' },
              { label: '周期', value: 'range' },
            ]}
            value={form.values.isRange ? 'range' : 'single'}
            onChange={(v) => form.setFieldValue('isRange', v === 'range')}
          />

          {form.values.isRange ? (
            <Group grow>
              <DatePickerInput
                label="开始日期"
                placeholder="选择开始"
                popoverProps={{ withinPortal: true, zIndex: 20000 }}
                value={form.values.rangeStart ? new Date(form.values.rangeStart) : null}
                onChange={(date) => {
                  form.setFieldValue('rangeStart', date ? dayjs(date).format('YYYY-MM-DD') : '');
                }}
              />
              <DatePickerInput
                label="结束日期"
                placeholder="选择结束"
                popoverProps={{ withinPortal: true, zIndex: 20000 }}
                value={form.values.rangeEnd ? new Date(form.values.rangeEnd) : null}
                onChange={(date) => {
                  form.setFieldValue('rangeEnd', date ? dayjs(date).format('YYYY-MM-DD') : '');
                }}
              />
            </Group>
          ) : (
            <DatePickerInput
              label="日期"
              placeholder="选择日期"
              popoverProps={{ withinPortal: true, zIndex: 20000 }}
              value={form.values.date ? new Date(form.values.date) : null}
              onChange={(date) => {
                form.setFieldValue('date', date ? dayjs(date).format('YYYY-MM-DD') : '');
              }}
            />
          )}

          <Select
            label="类型"
            data={[
              { value: 'timed', label: '定时' },
              { value: 'allDay', label: '全天' },
            ]}
            value={form.values.allDay ? 'allDay' : 'timed'}
            comboboxProps={{ zIndex: 20000, withinPortal: true }}
            onChange={(value) => {
              form.setFieldValue('allDay', value === 'allDay');
            }}
          />

          {!form.values.allDay && !form.values.isRange && (
            <Group grow>
              <TimeInput
                label="开始时间"
                {...form.getInputProps('startTime')}
              />
              <TimeInput
                label="结束时间"
                {...form.getInputProps('endTime')}
              />
            </Group>
          )}

          <Select
            label="状态"
            data={[
              { value: 'pending', label: '待办' },
              { value: 'done', label: '已完成' },
            ]}
            comboboxProps={{ zIndex: 20000, withinPortal: true }}
            {...form.getInputProps('status')}
          />

          <Select
            label="四象限"
            data={[
              { value: 'IU', label: '重要且紧急' },
              { value: 'IN', label: '重要不紧急' },
              { value: 'NU', label: '不重要但紧急' },
              { value: 'NN', label: '不重要不紧急' },
            ]}
            comboboxProps={{ zIndex: 20000, withinPortal: true }}
            {...form.getInputProps('quadrant')}
          />

          <Group justify="space-between" mt="md">
            <Group>
              {task && onDelete && (
                <Button color="red" variant="outline" onClick={handleDelete}>
                  删除
                </Button>
              )}
            </Group>
            <Group>
              <Button variant="subtle" onClick={onClose}>
                取消
              </Button>
              <Button type="submit">保存</Button>
            </Group>
          </Group>
        </Stack>
      </form>
    </Drawer>
  );
}
