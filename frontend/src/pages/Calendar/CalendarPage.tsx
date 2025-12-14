import { useState, useEffect, useCallback } from 'react';
import { Title, Stack, Button, SegmentedControl, Paper, Group, Loader, Center } from '@mantine/core';
import dayjs from 'dayjs';
import type { Task } from '../../types/task';
import { tasksApi } from '../../api/tasks';

export function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const fetchTasks = useCallback(async () => {
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
  }, [currentMonth, selectedDate, viewMode]);

  useEffect(() => {
    if (viewMode === 'month') fetchTasks();
  }, [currentMonth, fetchTasks, viewMode]);

  useEffect(() => {
    if (viewMode === 'week') fetchTasks();
  }, [fetchTasks, selectedDate, viewMode]);

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
        </div>

        {viewMode === 'month' && (
          <Paper p="md" withBorder>
            <MonthGrid
              currentMonth={currentMonth}
              tasks={tasks}
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
  tasks: Task[];
};

function MonthGrid({ currentMonth, tasks }: MonthGridProps) {
  const start = dayjs(currentMonth).startOf('month').startOf('week');
  const end = dayjs(currentMonth).endOf('month').endOf('week');
  const days: Date[] = [];
  let d = start.clone();
  while (d.isBefore(end) || d.isSame(end, 'day')) {
    days.push(d.toDate());
    d = d.add(1, 'day');
  }

  const inCurrentMonth = (date: Date) => dayjs(date).isSame(currentMonth, 'month');
  const isTopLevelPeriod = (t: Task) => !!(t.rangeStart && t.rangeEnd && !t.parentId);

  const quadColor = (t: Task) => {
    // 优化后的配色：柔和背景 + 深色文字，更现代、舒适
    if (t.status === 'done') {
      return { bg: '#F8F9FA', text: '#ADB5BD', border: '#E9ECEF' }; // 极淡灰
    }
    switch (t.quadrant) {
      case 'IU': // 重要紧急 - 柔和红
        return { bg: '#FFE3E3', text: '#C92A2A', border: 'transparent' };
      case 'IN': // 重要不紧急 - 柔和黄/橙
        return { bg: '#FFF3BF', text: '#D9480F', border: 'transparent' };
      case 'NU': // 不重要紧急 - 柔和青/绿
        return { bg: '#E6FCF5', text: '#087F5B', border: 'transparent' };
      case 'NN': // 不重要不紧急 - 柔和蓝
      default:
        return { bg: '#E7F5FF', text: '#1971C2', border: 'transparent' };
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
    // Then by creation time (newest first) - comparing timestamps
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  };

  const weekHeader = ['周一','周二','周三','周四','周五','周六','周日'];

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
          const dayTasks = tasks
            .filter((t) => isDateInTask(date, t) && !isTopLevelPeriod(t))
            .sort(sortTasks);
          const dim = !inCurrentMonth(date);
          const isToday = dayjs(date).isSame(dayjs(), 'day');
          return (
            <div
              key={date.toISOString()}
              style={{
                border: '1px solid #f1f3f5',
                padding: 6,
                overflow: 'hidden',
                background: 'transparent',
                userSelect: 'none',
                cursor: 'default',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0
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
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: 2 }}>
                {dayTasks.map((t) => {
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
              </div>
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
};

function WeekColumns({ date, tasks }: WeekColumnsProps) {
  const days = Array.from({ length: 7 }).map((_, i) => dayjs(date).startOf('week').add(i, 'day').toDate());

  const quadColor = (t: Task) => {
    if (t.status === 'done') return { bg: '#F8F9FA', text: '#ADB5BD', border: '#E9ECEF' };
    switch (t.quadrant) {
      case 'IU': return { bg: '#FFE3E3', text: '#C92A2A', border: 'transparent' };
      case 'IN': return { bg: '#FFF3BF', text: '#D9480F', border: 'transparent' };
      case 'NU': return { bg: '#E6FCF5', text: '#087F5B', border: 'transparent' };
      default: return { bg: '#E7F5FF', text: '#1971C2', border: 'transparent' };
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
        const isTopLevelPeriod = (t: Task) => !!(t.rangeStart && t.rangeEnd && !t.parentId);
        const allDay = tasks.filter((t) => (t.allDay || isInRange(d, t)) && !isTopLevelPeriod(t));
        const isOnDay = (t: Task) => (t.date === dayStr) || (t.rangeStart && t.rangeEnd && dayStr >= t.rangeStart && dayStr <= t.rangeEnd);
        const timedRaw = tasks.filter((t) => isOnDay(t) && !allDay.includes(t) && !isTopLevelPeriod(t));
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
                    // Then by creation time (newest first) - comparing timestamps
                    return new Date(b.task.createdAt).getTime() - new Date(a.task.createdAt).getTime();
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
