import { useState, useEffect, useMemo } from 'react';
import { Title, Stack, Button, SegmentedControl, Paper, Text, Group, Badge, Loader, Center } from '@mantine/core';
import { Calendar } from '@mantine/dates';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import type { Task, CreateTaskInput } from '../../types/task';
import { tasksApi } from '../../api/tasks';
import { TaskItem } from '../../components/TaskItem/TaskItem';
import { useRightPanel } from '../../components/RightPanel/RightPanelContext';
import { QuickInput } from '../../components/QuickInput/QuickInput';

dayjs.extend(weekOfYear);

export function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const rightPanel = useRightPanel();
  const [viewMode, setViewMode] = useState<'week' | 'month'>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let from: string;
      let to: string;
      if (viewMode === 'week') {
        const start = dayjs(selectedDate).startOf('week').format('YYYY-MM-DD');
        const end = dayjs(selectedDate).endOf('week').format('YYYY-MM-DD');
        from = start; to = end;
      } else {
        const start = dayjs(currentMonth).startOf('month').subtract(7, 'days').format('YYYY-MM-DD');
        const end = dayjs(currentMonth).endOf('month').add(7, 'days').format('YYYY-MM-DD');
        from = start; to = end;
      }
      const data = await tasksApi.getTasks({ from, to });
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // 数据加载：仅在切换视图模式或月份变化时加载
  useEffect(() => {
    fetchTasks();
  }, [currentMonth, viewMode]);

  const handleToggle = async (id: number) => {
    console.log('[DEBUG] handleToggle called with id:', id);
    const task = tasks.find((t) => t.id === id);
    if (!task) {
      console.log('[DEBUG] Task not found');
      return;
    }

    const newStatus = task.status === 'done' ? 'pending' : 'done';
    console.log('[DEBUG] Toggle status from', task.status, 'to', newStatus);

    // 乐观更新：立即更新本地状态
    setTasks((prevTasks) =>
      prevTasks.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
    console.log('[DEBUG] Local state updated optimistically');

    try {
      console.log('[DEBUG] Sending PATCH request...');
      await tasksApi.patchTask(id, { status: newStatus });
      console.log('[DEBUG] PATCH request successful');
    } catch (error) {
      console.error('Failed to toggle task:', error);
      // 如果失败，回滚状态
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === id ? { ...t, status: task.status } : t))
      );
      console.log('[DEBUG] State rolled back due to error');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await tasksApi.deleteTask(id);
      fetchTasks();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleSave = async (input: CreateTaskInput, taskId?: number) => {
    try {
      if (taskId) {
        await tasksApi.updateTask(taskId, input);
      } else {
        const dateToUse = input.date || dayjs(selectedDate).format('YYYY-MM-DD');
        await tasksApi.createTask({ ...input, date: dateToUse });
      }
      fetchTasks();
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTaskId(task.id);
    rightPanel.openTask(task, {
      onPatched: (t) => setTasks((prev) => prev.map((x) => (x.id === t.id ? t : x))),
      onDeleted: (id) => setTasks((prev) => prev.filter((x) => x.id !== id)),
    });
  };

  const handleNewTask = () => {};

  const handleQuickAdd = async (title: string, date: string) => {
    try {
      const newTask = await tasksApi.createTask({ title, date });
      // 乐观更新：直接添加新任务到列表
      setTasks((prevTasks) => [...prevTasks, newTask]);
      // 自动打开任务详情
      setSelectedTaskId(newTask.id);
      rightPanel.openTask(newTask, {
        onPatched: (t) => setTasks((prev) => prev.map((x) => (x.id === t.id ? t : x))),
        onDeleted: (id) => setTasks((prev) => prev.filter((x) => x.id !== id)),
      });
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const isDateInTask = (date: Date, task: Task) => {
    const d = dayjs(date).format('YYYY-MM-DD');
    if (task.rangeStart && task.rangeEnd) {
      return d >= task.rangeStart && d <= task.rangeEnd;
    }
    return task.date === d;
  };

  const tasksForSelectedDate = tasks.filter((task) => isDateInTask(selectedDate, task));

  const getTasksForDate = (date: Date) => tasks.filter((task) => isDateInTask(date, task));

  const renderDay = (date: Date) => {
    const dayTasks = getTasksForDate(date);
    const isToday = dayjs(date).isSame(dayjs(), 'day');
    const isSelected = dayjs(date).isSame(selectedDate, 'day');

    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          minHeight: 60,
          padding: 4,
          backgroundColor: isSelected ? '#e7f5ff' : isToday ? '#fff3bf' : 'transparent',
          borderRadius: 4,
        }}
      >
        <Text size="sm" fw={isToday ? 700 : 400}>
          {date.getDate()}
        </Text>
        {dayTasks.length > 0 && (
          <div style={{ marginTop: 4 }}>
            {dayTasks.slice(0, 2).map((task) => (
              <Badge key={task.id} size="xs" color={task.status === 'done' ? 'gray' : 'blue'} mb={2}>
                {task.title.length > 15 ? task.title.substring(0, 15) + '...' : task.title}
              </Badge>
            ))}
            {dayTasks.length > 2 && (
              <Text size="xs" c="dimmed">
                +{dayTasks.length - 2} 更多
              </Text>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Center h={400}>
        <Loader />
      </Center>
    );
  }

  return (
    <div>
      <Stack gap="md">
        <div>
          <Group justify="space-between" mb="md">
            <Group>
              <Title order={2}>日历</Title>
              <SegmentedControl
                value={viewMode}
                onChange={(value) => setViewMode(value as 'week' | 'month')}
                data={[
                  { label: '周', value: 'week' },
                  { label: '月', value: 'month' },
                ]}
              />
            </Group>
            <Group>
              <Button variant="light" onClick={() => {
                if (viewMode === 'week') setSelectedDate(dayjs(selectedDate).subtract(1, 'week').toDate());
                else setCurrentMonth(dayjs(currentMonth).subtract(1, 'month').toDate());
              }}>上一{viewMode === 'week' ? '周' : '月'}</Button>
              <Button variant="light" onClick={() => { const now = new Date(); setSelectedDate(now); setCurrentMonth(now); }}>今天</Button>
              <Button variant="light" onClick={() => {
                if (viewMode === 'week') setSelectedDate(dayjs(selectedDate).add(1, 'week').toDate());
                else setCurrentMonth(dayjs(currentMonth).add(1, 'month').toDate());
              }}>下一{viewMode === 'week' ? '周' : '月'}</Button>
            </Group>
          </Group>
          <QuickInput onAdd={handleQuickAdd} placeholder="添加任务至日历" defaultDate={dayjs(selectedDate).format('YYYY-MM-DD')} />
        </div>

        {viewMode === 'month' && (
          <Paper p="md" withBorder>
            <MonthGrid
              currentMonth={currentMonth}
              onSelectDate={(d) => setSelectedDate(d)}
              tasks={tasks}
              onToggle={handleToggle}
              onClickTask={handleTaskClick}
            />
          </Paper>
        )}

        {viewMode === 'week' && (
          <div>
            <Title order={3} mb="md">
              {dayjs(selectedDate).startOf('week').format('YYYY年M月D日')} - {dayjs(selectedDate).endOf('week').format('M月D日')}
            </Title>
            <WeekColumns
              date={selectedDate}
              tasks={tasks}
              onClickTask={handleTaskClick}
              onSelectDate={(d) => setSelectedDate(d)}
            />
          </div>
        )}
      </Stack>

      {/* Right panel is global; no drawer here */}
    </div>
  );
}

type MonthGridProps = {
  currentMonth: Date;
  onSelectDate: (d: Date) => void;
  tasks: Task[];
  onToggle: (id: number) => void;
  onClickTask: (t: Task) => void;
};

function MonthGrid({ currentMonth, onSelectDate, tasks, onToggle, onClickTask }: MonthGridProps) {
  const start = dayjs(currentMonth).startOf('month').startOf('week');
  const end = dayjs(currentMonth).endOf('month').endOf('week');
  const days: Date[] = [];
  let d = start.clone();
  while (d.isBefore(end) || d.isSame(end, 'day')) {
    days.push(d.toDate());
    d = d.add(1, 'day');
  }

  const inCurrentMonth = (date: Date) => dayjs(date).isSame(currentMonth, 'month');

  const quadColor = (t: Task) => {
    // 使用鲜艳的高饱和度配色，让视觉更抢眼
    if (t.status === 'done') return { bg: '#e9ecef', text: '#6c757d', border: '#ced4da' };
    switch (t.quadrant) {
      case 'IU':
        return { bg: '#ff6b6b', text: '#ffffff', border: '#fa5252' }; // 鲜艳红
      case 'IN':
        return { bg: '#ffd43b', text: '#000000', border: '#fcc419' }; // 鲜艳黄
      case 'NU':
        return { bg: '#51cf66', text: '#ffffff', border: '#40c057' }; // 鲜艳绿
      case 'NN':
      default:
        return { bg: '#74c0fc', text: '#ffffff', border: '#4dabf7' }; // 鲜艳蓝
    }
  };

  const isDateInTask = (date: Date, task: Task) => {
    const ds = dayjs(date).format('YYYY-MM-DD');
    if (task.rangeStart && task.rangeEnd) {
      return ds >= task.rangeStart && ds <= task.rangeEnd;
    }
    return task.date === ds;
  };

  const quadWeight = (q?: Task['quadrant']) => {
    switch (q) {
      case 'IU': return 0; case 'IN': return 1; case 'NU': return 2; default: return 3;
    }
  };

  const sortTasks = (a: Task, b: Task) => {
    const aw = a.status === 'done' ? 1 : 0; const bw = b.status === 'done' ? 1 : 0;
    if (aw !== bw) return aw - bw;
    const aq = quadWeight(a.quadrant); const bq = quadWeight(b.quadrant);
    if (aq !== bq) return aq - bq;
    return (a.startTime || '').localeCompare(b.startTime || '');
  };

  const weekHeader = ['周一','周二','周三','周四','周五','周六','周日'];
  const maxLinesPerCell = 6;

  return (
    <div style={{ height: 'calc(100vh - 220px)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0, marginBottom: 6 }}>
        {weekHeader.map((w) => (
          <div key={w} style={{ padding: '4px 6px', color: '#868e96', fontSize: 12 }}>{w}</div>
        ))}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gridAutoRows: '1fr',
          height: 'calc(100% - 24px)'
        }}
      >
        {days.map((date) => {
          const dayTasks = tasks.filter((t) => isDateInTask(date, t)).sort(sortTasks);
          const dim = !inCurrentMonth(date);
          const isToday = dayjs(date).isSame(dayjs(), 'day');
          const visible = dayTasks.slice(0, maxLinesPerCell);
          const hidden = dayTasks.length - visible.length;
          return (
            <div
              key={date.toISOString()}
              style={{
                border: '1px solid #f1f3f5',
                padding: 6,
                overflow: 'hidden',
                background: 'transparent',
                userSelect: 'none',
                cursor: 'default'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: isToday ? '#ffd43b' : 'transparent',
                    fontWeight: isToday ? 700 : 500,
                    fontSize: '0.875rem',
                    color: dim ? '#adb5bd' : undefined,
                  }}
                >
                  {dayjs(date).format('D')}
                </div>
              </div>
              <div style={{ maxHeight: 'calc(100% - 20px)', overflow: 'hidden' }}>
                {visible.map((t) => {
                  const col = quadColor(t);
                  const inRange = !!(t.rangeStart && t.rangeEnd);
                  const before = inRange && dayjs(date).isAfter(dayjs(t.rangeStart));
                  const after = inRange && dayjs(date).isBefore(dayjs(t.rangeEnd));
                  const spanPrefix = inRange ? (before && after ? '⟷ ' : before ? '⟵ ' : after ? '⟶ ' : '') : '';
                  const timeText = (t.allDay || inRange) ? '' : (t.startTime ? `${t.startTime} ` : '');
                  return (
                  <div
                    key={t.id}
                    style={{
                      background: col.bg,
                      color: col.text,
                      border: `1px solid ${col.border}`,
                      fontSize: 12,
                      borderRadius: 4,
                      padding: '2px 6px',
                      marginBottom: 4,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      opacity: t.status === 'done' ? 0.7 : 1,
                      userSelect: 'none',
                      cursor: 'default'
                    }}
                    title={t.title}
                  >
                    {spanPrefix}{timeText}{t.title}
                  </div>
                );})}
                {hidden > 0 && (
                  <Text size="xs" c="dimmed">+{hidden} 更多</Text>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type DayTimelineProps = {
  date: Date;
  tasks: Task[];
  onToggle: (id: number) => void;
  onClickTask: (t: Task) => void;
};

function DayTimeline({ date, tasks, onClickTask }: DayTimelineProps) {
  const hourHeight = 64; // 每小时高度
  const totalHeight = 24 * hourHeight;

  const parseMins = (t?: string | null) => {
    if (!t) return null;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
  };

  const quadColor = (t: Task) => {
    if (t.status === 'done') return { bg: '#e9ecef', text: '#6c757d', border: '#ced4da' };
    switch (t.quadrant) {
      case 'IU': return { bg: '#ff6b6b', text: '#ffffff', border: '#fa5252' };
      case 'IN': return { bg: '#ffd43b', text: '#000000', border: '#fcc419' };
      case 'NU': return { bg: '#51cf66', text: '#ffffff', border: '#40c057' };
      default: return { bg: '#74c0fc', text: '#ffffff', border: '#4dabf7' };
    }
  };

  const isInRange = (t: Task) => {
    if (!(t.rangeStart && t.rangeEnd)) return false;
    const ds = dayjs(date).format('YYYY-MM-DD');
    return ds >= t.rangeStart && ds <= t.rangeEnd;
  };
  const allDay = tasks.filter((t) => t.allDay || isInRange(t));
  const timed = tasks.filter((t) => !allDay.includes(t));

  return (
    <div>
      {allDay.length > 0 && (
        <div style={{ marginBottom: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {allDay.map((t) => {
            const col = quadColor(t);
            return (
              <div key={t.id}
                   onClick={() => onClickTask(t)}
                   style={{
                     background: col.bg,
                     color: col.text,
                     border: `1px solid ${col.border}`,
                     borderRadius: 6,
                     padding: '4px 8px',
                     fontSize: 12,
                     cursor: 'pointer'
                   }}
              >{t.title}</div>
            );
          })}
        </div>
      )}

      <div style={{ position: 'relative', border: '1px solid #f1f3f5', borderRadius: 8, height: totalHeight, background: '#fcfcfd' }}>
        {Array.from({ length: 25 }).map((_, i) => (
          <div key={i}
               style={{ position: 'absolute', top: i * hourHeight, left: 0, right: 0, height: 1, borderTop: '1px solid #f1f3f5' }}
          >
            <div style={{ position: 'absolute', left: 0, top: -8, width: 48, textAlign: 'right', color: '#adb5bd', fontSize: 12 }}>
              {String(i).padStart(2, '0')}:00
            </div>
          </div>
        ))}

        {timed.map((t) => {
          const start = parseMins(t.startTime) ?? 0;
          const end = parseMins(t.endTime) ?? (start + 60);
          const top = (start / 60) * hourHeight;
          const height = Math.max(36, ((end - start) / 60) * hourHeight - 6);
          const col = quadColor(t);
          return (
            <div key={t.id}
                 onClick={() => onClickTask(t)}
                 style={{
                   position: 'absolute', left: 64, right: 8, top, height,
                   background: col.bg, color: col.text, border: `1px solid ${col.border}`,
                   borderRadius: 8, padding: '6px 10px', fontSize: 12, boxShadow: '0 1px 0 rgba(0,0,0,0.02)'
                 }}
            >
              <div style={{ fontWeight: 600, marginBottom: 2 }}>{t.title}</div>
              <div style={{ color: '#868e96' }}>{(t.startTime || '00:00')} - {(t.endTime || '—')}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type WeekColumnsProps = {
  date: Date;
  tasks: Task[];
  onClickTask: (t: Task) => void;
  onSelectDate: (d: Date) => void;
};

function WeekColumns({ date, tasks, onClickTask, onSelectDate }: WeekColumnsProps) {
  const hourHeight = 56;
  const totalHeight = 24 * hourHeight;
  const days = Array.from({ length: 7 }).map((_, i) => dayjs(date).startOf('week').add(i, 'day').toDate());

  const parseMins = (t?: string | null) => {
    if (!t) return null;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
  };

  const quadColor = (t: Task) => {
    if (t.status === 'done') return { bg: '#e9ecef', text: '#6c757d', border: '#ced4da' };
    switch (t.quadrant) {
      case 'IU': return { bg: '#ff6b6b', text: '#ffffff', border: '#fa5252' };
      case 'IN': return { bg: '#ffd43b', text: '#000000', border: '#fcc419' };
      case 'NU': return { bg: '#51cf66', text: '#ffffff', border: '#40c057' };
      default: return { bg: '#74c0fc', text: '#ffffff', border: '#4dabf7' };
    }
  };

  const isInRange = (d: Date, t: Task) => {
    if (!(t.rangeStart && t.rangeEnd)) return false;
    const ds = dayjs(d).format('YYYY-MM-DD');
    return ds >= t.rangeStart && ds <= t.rangeEnd;
  };

  const weekdayCN = ['周一','周二','周三','周四','周五','周六','周日'];
  const isSameDay = (a: Date, b: Date) => dayjs(a).isSame(dayjs(b), 'day');

  return (
    <div>
      {/* 顶部头部：星期 + 日期圆点（无间隙） */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0, marginBottom: 0, borderBottom: '1px solid #f1f3f5' }}>
        {days.map((d, i) => {
          const selected = isSameDay(d, date);
          const isToday = isSameDay(d, new Date());
          return (
            <div key={`hdr-${i}`} style={{ textAlign: 'center', padding: '8px 0', color: '#868e96', borderLeft: i === 0 ? 'none' : '1px solid #f1f3f5', userSelect: 'none' }}>
              <div style={{ fontSize: 12, marginBottom: 6 }}>{weekdayCN[i]}</div>
              <div
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 28, height: 28, borderRadius: 999,
                  background: selected ? '#228be6' : isToday ? '#ffd43b' : 'transparent',
                  color: selected ? '#fff' : isToday ? '#000000' : '#343a40',
                  fontWeight: selected ? 700 : 600,
                  userSelect: 'none',
                  cursor: 'default'
                }}
              >{dayjs(d).date()}</div>
            </div>
          );
        })}
      </div>

      {/* 每日列（无间隙，大气，填满视口） */}
      <div style={{ height: 'calc(100vh - 220px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0, height: '100%' }}>
      {days.map((d, idx) => {
        const dayStr = dayjs(d).format('YYYY-MM-DD');
        const allDay = tasks.filter((t) => t.allDay || isInRange(d, t));
        const isOnDay = (t: Task) => (t.date === dayStr) || (t.rangeStart && t.rangeEnd && dayStr >= t.rangeStart && dayStr <= t.rangeEnd);
        const timedRaw = tasks.filter((t) => isOnDay(t) && !allDay.includes(t));
        // 计算避免重叠的“车道”
        const parseMinsLocal = (t?: string | null) => {
          if (!t) return null;
          const [h, m] = t.split(':').map(Number);
          return h * 60 + (m || 0);
        };
        const items = timedRaw.map((t) => ({
          task: t,
          start: parseMinsLocal(t.startTime) ?? 0,
          end: (parseMinsLocal(t.endTime) ?? ((parseMinsLocal(t.startTime) ?? 0) + 60)),
          lane: 0,
        })).sort((a, b) => a.start - b.start);
        const lanes: number[] = [];
        items.forEach((it) => {
          let idx = lanes.findIndex((end) => end <= it.start);
          if (idx === -1) { idx = lanes.length; lanes.push(it.end); }
          else { lanes[idx] = it.end; }
          it.lane = idx;
        });
        const lanesCount = lanes.length || 1;
        return (
          <div key={d.toISOString()} style={{ borderLeft: idx === 0 ? 'none' : '1px solid #e9ecef', borderTop: '1px solid #e9ecef', background: '#ffffff', height: '100%', display: 'flex', flexDirection: 'column', userSelect: 'none', cursor: 'default' }}>
            {/* 全天/周期区 */}
            <div style={{ padding: 10 }}>
              {allDay.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {allDay.map((t) => {
                    const col = quadColor(t);
                    return (
                      <div key={t.id}
                           style={{ background: col.bg, color: col.text, border: `1px solid ${col.border}`, borderRadius: 6, padding: '4px 8px', fontSize: 12, userSelect: 'none', cursor: 'default' }}
                      >{t.title}</div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 任务列表填充剩余高度 */}
            <div style={{ flex: 1, padding: '0 10px 10px 10px', overflowY: 'auto', userSelect: 'none' }}>
              <Stack gap="xs">
                {items
                  .sort((a, b) => {
                    const sa = a.task.status === 'done' ? 1 : 0;
                    const sb = b.task.status === 'done' ? 1 : 0;
                    if (sa !== sb) return sa - sb;
                    return a.start - b.start;
                  })
                  .map(({ task: t }) => {
                    const col = quadColor(t);
                    return (
                      <div key={t.id}
                           style={{ background: col.bg, color: col.text, border: `1px solid ${col.border}`, borderRadius: 8, padding: '6px 10px', fontSize: 12, userSelect: 'none', cursor: 'default' }}
                      >
                        <div style={{ fontWeight: 600 }}>{t.title}</div>
                        <div style={{ color: '#868e96', fontSize: 12 }}>
                          {(t.startTime ? `${t.startTime}` : (t.allDay || (t.rangeStart && t.rangeEnd)) ? '全天/周期' : '—')}
                          {t.endTime ? ` - ${t.endTime}` : ''}
                        </div>
                      </div>
                    );
                  })}
              </Stack>
            </div>
          </div>
        );
      })}
        </div>
      </div>
    </div>
  );
}
