import { AppShell, Burger, Group, NavLink, ActionIcon, Tooltip } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { useMantineTheme } from '@mantine/core';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { IconCalendar, IconListCheck, IconDownload, IconChartBar, IconArchiveOff } from '@tabler/icons-react';
import { RightPanelProvider, useRightPanel } from '../components/RightPanel/RightPanelContext';
import { TaskDetailPanel } from '../components/TaskDetail/TaskDetailPanel';
import { tasksApi } from '../api/tasks';

function LayoutInner() {
  const [opened, { toggle }] = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();
  const rightPanel = useRightPanel();
  const theme = useMantineTheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

  const navItems = [
    { path: '/all', label: '任务', icon: IconListCheck },
    { path: '/calendar', label: '日历', icon: IconCalendar },
    { path: '/analysis', label: '分析', icon: IconChartBar },
    { path: '/abandoned', label: '已放弃', icon: IconArchiveOff },
  ];

  const handleExport = async () => {
    try {
      // 获取所有任务数据
      const tasks = await tasksApi.getAllTasks();

      // 创建导出数据对象
      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        tasks: tasks,
      };

      // 转换为JSON字符串
      const jsonString = JSON.stringify(exportData, null, 2);

      // 创建Blob对象
      const blob = new Blob([jsonString], { type: 'application/json' });

      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tasks-backup-${new Date().toISOString().split('T')[0]}.json`;

      // 触发下载
      document.body.appendChild(link);
      link.click();

      // 清理
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export tasks:', error);
    }
  };

  const panelWidth = 420;
  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 250,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>秒办</div>
          </Group>
          <Tooltip label="导出数据备份">
            <ActionIcon variant="subtle" color="gray" size="lg" onClick={handleExport}>
              <IconDownload size={20} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            label={item.label}
            leftSection={<item.icon size={20} />}
            active={location.pathname === item.path}
            onClick={() => {
              navigate(item.path);
              if (opened) toggle();
            }}
            style={{ marginBottom: 4 }}
          />
        ))}
      </AppShell.Navbar>

      <AppShell.Main
        style={{
          paddingRight: rightPanel.opened && !isMobile ? panelWidth : 0,
          transition: 'padding-right 220ms cubic-bezier(.4,0,.2,1)'
        }}
      >
        <Outlet />
      </AppShell.Main>

      {/* Mobile overlay backdrop when panel open */}
      {isMobile && rightPanel.opened && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 999 }}
        />
      )}

      {/* Fixed right panel container to avoid layout shifts across pages */}
      <div
        style={{
          position: 'fixed',
          top: isMobile ? 0 : 60,
          right: 0,
          bottom: 0,
          width: isMobile ? '100%' : panelWidth,
          transform: rightPanel.opened ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 220ms cubic-bezier(.4,0,.2,1)',
          background: '#fff',
          borderLeft: '1px solid #e9ecef',
          zIndex: 1000,
          overflow: 'hidden'
        }}
      >
        
        <TaskDetailPanel />
      </div>
    </AppShell>
  );
}

export function AppLayout() {
  return (
    <RightPanelProvider>
      <LayoutInner />
    </RightPanelProvider>
  );
}
