import { useState } from 'react';
import { TextInput, Group, ActionIcon, Popover } from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { IconPlus, IconCalendar } from '@tabler/icons-react';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

interface QuickInputProps {
  onAdd: (title: string, date: string) => void;
  placeholder?: string;
  defaultDate?: string;
}

export function QuickInput({ onAdd, placeholder = '添加任务', defaultDate }: QuickInputProps) {
  const [value, setValue] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(
    defaultDate ? dayjs(defaultDate).toDate() : new Date()
  );
  const [datePickerOpened, setDatePickerOpened] = useState(false);
  const [isComposing, setIsComposing] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim() && !isComposing) {
      const dateStr = dayjs(selectedDate).format('YYYY-MM-DD');
      onAdd(value.trim(), dateStr);
      setValue('');
    }
  };

  const formatDateLabel = (date: Date) => {
    const today = dayjs().startOf('day');
    const tomorrow = dayjs().add(1, 'day').startOf('day');
    const selected = dayjs(date).startOf('day');

    if (selected.isSame(today, 'day')) {
      return '今天';
    } else if (selected.isSame(tomorrow, 'day')) {
      return '明天';
    } else {
      return selected.format('M月D日');
    }
  };

  return (
    <Group
      gap={0}
      style={{
        border: '1px solid #228be6',
        borderRadius: 8,
        padding: '8px 12px',
        backgroundColor: '#fff',
      }}
    >
      <IconPlus size={20} color="#adb5bd" style={{ marginRight: 8 }} />
      <TextInput
        value={value}
        onChange={(e) => setValue(e.currentTarget.value)}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        placeholder={placeholder}
        variant="unstyled"
        style={{ flex: 1 }}
        styles={{
          input: {
            padding: 0,
            minHeight: 'auto',
            height: 'auto',
          },
        }}
      />
      <Popover
        opened={datePickerOpened}
        onChange={setDatePickerOpened}
        position="bottom-end"
        withArrow
        shadow="md"
      >
        <Popover.Target>
          <Group
            gap={4}
            style={{
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 6,
              color: '#228be6',
              fontSize: 14,
            }}
            onClick={() => setDatePickerOpened((o) => !o)}
          >
            <IconCalendar size={16} />
            <span>{formatDateLabel(selectedDate)}</span>
            <span style={{ fontSize: 12 }}>▼</span>
          </Group>
        </Popover.Target>
        <Popover.Dropdown>
          <DatePicker
            value={selectedDate}
            onChange={(date) => {
              if (date) {
                setSelectedDate(date);
                setDatePickerOpened(false);
              }
            }}
            locale="zh-cn"
            firstDayOfWeek={1}
          />
        </Popover.Dropdown>
      </Popover>
    </Group>
  );
}
