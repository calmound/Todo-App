import { useState } from 'react';
import { Group, Text, Collapse } from '@mantine/core';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';

interface TaskGroupProps {
  title: string;
  count: number;
  children: React.ReactNode;
  defaultOpened?: boolean;
  actions?: React.ReactNode;
}

export function TaskGroup({ title, count, children, defaultOpened = true, actions }: TaskGroupProps) {
  const [opened, setOpened] = useState(defaultOpened);

  return (
    <div>
      <Group
        justify="space-between"
        style={{
          cursor: 'pointer',
          padding: '6px 0',
          userSelect: 'none',
        }}
        onClick={() => setOpened(!opened)}
      >
        <Group gap={6}>
          {opened ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
          <Text fw={600} size="sm">
            {title}
          </Text>
          <Text c="dimmed" size="xs">
            {count}
          </Text>
        </Group>
        {actions && <div onClick={(e) => e.stopPropagation()}>{actions}</div>}
      </Group>
      <Collapse in={opened}>
        <div style={{ marginTop: 4 }}>
          {children}
        </div>
      </Collapse>
    </div>
  );
}
