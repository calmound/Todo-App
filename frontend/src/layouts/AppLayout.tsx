import { AppShell, Burger, Group, NavLink } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { IconCalendar, IconListCheck } from '@tabler/icons-react';
import { RightPanelProvider, useRightPanel } from '../components/RightPanel/RightPanelContext';
import { TaskDetailPanel } from '../components/TaskDetail/TaskDetailPanel';

function LayoutInner() {
  const [opened, { toggle }] = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();
  const rightPanel = useRightPanel();

  const navItems = [
    { path: '/all', label: '任务', icon: IconListCheck },
    { path: '/calendar', label: '日历', icon: IconCalendar },
  ];

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
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>任务管理器</div>
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
          paddingRight: rightPanel.opened ? panelWidth : 0,
          transition: 'padding-right 220ms cubic-bezier(.4,0,.2,1)'
        }}
      >
        <Outlet />
      </AppShell.Main>

      {/* Fixed right panel container to avoid layout shifts across pages */}
      <div
        style={{
          position: 'fixed',
          top: 60,
          right: 0,
          bottom: 0,
          width: panelWidth,
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
