import { useEffect, useMemo, useState } from 'react';
import { Card, Group, Stack, Text, Title, Badge, Progress, Table, Grid, Tooltip, SimpleGrid, Paper, ThemeIcon, Box } from '@mantine/core';
import { AreaChart, BarChart, DonutChart } from '@mantine/charts';
import { IconCheck, IconAlertCircle, IconClock, IconList } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { tasksApi } from '../../api/tasks';
import type { Task } from '../../types/task';

type SeriesPoint = { date: string; value: number };

function buildDateRange(days = 30): string[] {
  const arr: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    arr.push(dayjs().subtract(i, 'day').format('YYYY-MM-DD'));
  }
  return arr;
}

function toDay(dateIso: string | null | undefined): string | null {
  if (!dateIso) return null;
  return dayjs(dateIso).format('YYYY-MM-DD');
}

export function AnalysisPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await tasksApi.getAllTasks();
        setTasks(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const lastNDays = 30;
  const days = useMemo(() => buildDateRange(lastNDays), [lastNDays]);

  // Summary Stats
  const summary = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'done').length;
    const pending = total - done;
    const overdue = tasks.filter(t => t.status !== 'done' && t.dueAt && dayjs(t.dueAt).isBefore(dayjs())).length;
    const completionRate = total ? Math.round((done / total) * 100) : 0;
    return { total, done, pending, overdue, completionRate };
  }, [tasks]);

  // Time Trends - Completion Rate
  // 口径：以 dueAt 当天为主，若缺少 dueAt 则回退到任务的 date（任务日期）；
  // “按时完成”定义：
  //   - 有 dueAt：completedAt <= dueAt
  //   - 无 dueAt：status === 'done'（视为当日按时完成）
  const timeTrends = useMemo(() => {
    const totalByDay: Record<string, number> = Object.fromEntries(days.map(d => [d, 0]));
    const onTimeByDay: Record<string, number> = Object.fromEntries(days.map(d => [d, 0]));

    for (const t of tasks) {
      const bucketDay = toDay(t.dueAt || (t.date ? `${t.date}T00:00:00.000Z` : null));
      if (!bucketDay || !(bucketDay in totalByDay)) continue;
      totalByDay[bucketDay] += 1;

      if (t.dueAt) {
        if (t.status === 'done' && t.completedAt && !dayjs(t.completedAt).isAfter(dayjs(t.dueAt))) {
          onTimeByDay[bucketDay] += 1;
        }
      } else {
        if (t.status === 'done') onTimeByDay[bucketDay] += 1;
      }
    }

    const combined = days.map((d) => {
      const due = totalByDay[d];
      const onTime = onTimeByDay[d];
      const completionRate = due > 0 ? Math.round((onTime / due) * 100) : 0;
      return {
        date: dayjs(d).format('M/D'),
        到期任务: due,
        按时完成: onTime,
        完成率: completionRate,
      };
    });

    return { combined };
  }, [tasks, days]);

  // Quadrant Stats (Keep existing logic)
  const quadrantStats = useMemo(() => {
    type Q = 'IU' | 'IN' | 'NU' | 'NN';
    const qs: Q[] = ['IU', 'IN', 'NU', 'NN'];
    const map = Object.fromEntries(qs.map(q => [q, { total: 0, done: 0, procrastinated: 0, withDue: 0 }]));
    for (const t of tasks) {
      const q = (t.quadrant || 'IN') as Q;
      map[q].total += 1;
      if (t.status === 'done') map[q].done += 1;
      if (t.dueAt) {
        map[q].withDue += 1;
        const nowLate = t.status !== 'done' && dayjs(t.dueAt).isBefore(dayjs());
        const finishedLate = t.completedAt && dayjs(t.completedAt).isAfter(dayjs(t.dueAt));
        if (nowLate || finishedLate) map[q].procrastinated += 1;
      }
    }
    return map as Record<Q, { total: number; done: number; procrastinated: number; withDue: number }>;
  }, [tasks]);

  // Category Stats
  const categoryStats = useMemo(() => {
    const stat: Record<string, { total: number; pending: number; done: number; abandoned: number; overdue: number }> = {};
    const mark = (name: string, t: Task) => {
      if (!stat[name]) stat[name] = { total: 0, pending: 0, done: 0, abandoned: 0, overdue: 0 };
      stat[name].total += 1;

      if (t.status === 'done') {
        stat[name].done += 1;
      } else if (t.status === 'abandoned') {
        stat[name].abandoned += 1;
      } else if (t.status === 'pending') {
        stat[name].pending += 1;
        // 检查是否逾期（待办状态且超过截止时间）
        const isOverdueNow = t.dueAt ? dayjs(t.dueAt).isBefore(dayjs()) : false;
        if (isOverdueNow) {
          stat[name].overdue += 1;
        }
      }
    };

    for (const t of tasks) {
      const cats = Array.isArray(t.categories) ? t.categories : [];
      if (cats.length === 0) mark('未分类', t);
      for (const c of cats) mark(c, t);
    }

    const rows = Object.entries(stat)
      .map(([name, v]) => ({
        name,
        total: v.total,
        pending: v.pending,
        done: v.done,
        abandoned: v.abandoned,
        overdue: v.overdue,
        doneRate: v.total ? Math.round((v.done / v.total) * 100) : 0,
        pendingRate: v.total ? Math.round((v.pending / v.total) * 100) : 0,
        abandonedRate: v.total ? Math.round((v.abandoned / v.total) * 100) : 0,
        overdueRate: v.total ? Math.round((v.overdue / v.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
    return rows;
  }, [tasks]);

  // Urgency Stats
  const urgencyStats = useMemo(() => {
    const now = dayjs();
    const upcoming = { '24h': 0, '3d': 0, '7d': 0, 'Future': 0 };
    const overdue = { '24h': 0, '3d': 0, '7d': 0, 'Long': 0 };

    for (const t of tasks) {
      if (!t.dueAt || t.status === 'done') continue;
      const due = dayjs(t.dueAt);
      
      if (due.isBefore(now)) {
        const d = now.diff(due, 'day', true);
        if (d <= 1) overdue['24h'] += 1;
        else if (d <= 3) overdue['3d'] += 1;
        else if (d <= 7) overdue['7d'] += 1;
        else overdue['Long'] += 1;
      } else {
        const d = due.diff(now, 'day', true);
        if (d <= 1) upcoming['24h'] += 1;
        else if (d <= 3) upcoming['3d'] += 1;
        else if (d <= 7) upcoming['7d'] += 1;
        else upcoming['Future'] += 1;
      }
    }
    return { upcoming, overdue };
  }, [tasks]);

  const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <Paper withBorder p="md" radius="md">
      <Group justify="space-between">
        <div>
          <Text c="dimmed" tt="uppercase" fw={700} size="xs">{title}</Text>
          <Text fw={700} size="xl">{value}</Text>
        </div>
        <ThemeIcon color={color} variant="light" size={38} radius="md">
          <Icon size={24} stroke={1.5} />
        </ThemeIcon>
      </Group>
      {subtext && <Text c="dimmed" size="xs" mt="sm">{subtext}</Text>}
    </Paper>
  );

  return (
    <Stack gap="lg" pb="xl" style={{ userSelect: 'none', cursor: 'default' }}>
      <Group justify="space-between">
        <Title order={2}>数据分析</Title>
        {loading && <Badge color="gray">加载中...</Badge>}
      </Group>

      {/* Summary Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
        <StatCard title="总任务" value={summary.total} icon={IconList} color="blue" subtext="所有记录的任务" />
        <StatCard title="完成率" value={`${summary.completionRate}%`} icon={IconCheck} color="teal" subtext={`已完成 ${summary.done} 项`} />
        <StatCard title="待办中" value={summary.pending} icon={IconClock} color="orange" subtext="当前未完成任务" />
        <StatCard title="已逾期" value={summary.overdue} icon={IconAlertCircle} color="red" subtext="需要立即处理" />
      </SimpleGrid>

      <Grid>
        {/* Time Trend */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card withBorder radius="md" h="100%">
            <Stack gap="xs">
              <Group justify="space-between">
                <Title order={4}>近30天完成率趋势</Title>
                <Badge color="blue" variant="light">
                  平均完成率: {Math.round(
                    timeTrends.combined.reduce((sum, d) => sum + (d.完成率 || 0), 0) /
                    timeTrends.combined.filter(d => d.到期任务 > 0).length || 0
                  )}%
                </Badge>
              </Group>
              <Text size="xs" c="dimmed">
                完成率 = 按时完成任务 ÷ 到期任务 × 100%
              </Text>
            </Stack>
            <AreaChart
              h={280}
              data={timeTrends.combined}
              dataKey="date"
              series={[
                { name: '完成率', color: 'teal.6', dataKey: '完成率' },
              ]}
              curveType="monotone"
              gridAxis="xy"
              withLegend
              yAxisProps={{ domain: [0, 100] }}
              valueFormatter={(v) => `${v}%`}
              tooltipProps={{ cursor: false }}
            />
            <Text size="xs" c="dimmed" mt="xs" ta="center">
              绿色区域 = 当天到期任务的按时完成百分比
            </Text>
          </Card>
        </Grid.Col>

        {/* Urgency Distribution */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder radius="md" h="100%">
            <Title order={4} mb="md">紧急度分布</Title>
            <Stack>
              <Box>
                <Text size="sm" fw={500} mb="xs">即将到期 (Pending)</Text>
                <DonutChart
                  size={160}
                  thickness={20}
                  withLabels
                  data={[
                    { name: '24h内', value: urgencyStats.upcoming['24h'], color: 'red.6' },
                    { name: '3天内', value: urgencyStats.upcoming['3d'], color: 'orange.6' },
                    { name: '7天内', value: urgencyStats.upcoming['7d'], color: 'yellow.6' },
                    { name: '未来', value: urgencyStats.upcoming['Future'], color: 'blue.6' },
                  ]}
                />
              </Box>
              <Box>
                <Text size="sm" fw={500} mb="xs">已逾期</Text>
                <Group grow>
                  <Badge color="red" variant="light">严重 (&gt;7天): {urgencyStats.overdue['Long']}</Badge>
                  <Badge color="orange" variant="light">近期 (≤7天): {urgencyStats.overdue['7d'] + urgencyStats.overdue['3d'] + urgencyStats.overdue['24h']}</Badge>
                </Group>
              </Box>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      <Grid>
        {/* Quadrant Matrix */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder radius="md" h="100%">
            <Title order={4} mb="md">四象限分布</Title>
            <SimpleGrid cols={2} spacing="xs">
              {[
                { q: 'IU', label: '重要且紧急', color: 'red', bg: 'red.0' },
                { q: 'IN', label: '重要不紧急', color: 'blue', bg: 'blue.0' },
                { q: 'NU', label: '不重要紧急', color: 'orange', bg: 'orange.0' },
                { q: 'NN', label: '不重要不紧急', color: 'gray', bg: 'gray.0' },
              ].map((item) => {
                const s = quadrantStats[item.q as any];
                return (
                  <Paper key={item.q} withBorder p="sm" bg={item.bg}>
                    <Text fw={700} c={item.color}>{item.label}</Text>
                    <Group align="flex-end" gap="xs" mt="xs">
                      <Text size="xl" fw={700}>{s.total}</Text>
                      <Text size="sm" c="dimmed" mb={4}>项</Text>
                    </Group>
                    <Group mt="xs" gap="xs">
                      <Badge size="sm" variant="white" color="teal">完成 {Math.round(s.total ? s.done/s.total*100 : 0)}%</Badge>
                      <Badge size="sm" variant="white" color="orange">拖延 {Math.round(s.withDue ? s.procrastinated/s.withDue*100 : 0)}%</Badge>
                    </Group>
                  </Paper>
                );
              })}
            </SimpleGrid>
          </Card>
        </Grid.Col>

        {/* Category Analysis */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder radius="md" h="100%">
            <Title order={4} mb="md">分类对比</Title>
            <BarChart
              h={250}
              data={categoryStats.slice(0, 5)}
              dataKey="name"
              series={[
                { name: 'doneRate', label: '完成率', color: 'teal.6' },
                { name: 'pendingRate', label: '待办率', color: 'blue.6' },
                { name: 'overdueRate', label: '逾期率', color: 'orange.6' },
                { name: 'abandonedRate', label: '放弃率', color: 'red.6' },
              ]}
              tickLine="y"
              gridAxis="y"
              valueFormatter={(v) => `${v}%`}
            />
          </Card>
        </Grid.Col>
      </Grid>

      {/* Individual Category Stats */}
      <Card withBorder radius="md">
        <Title order={4} mb="md">分类详细统计</Title>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }}>
          {categoryStats.map((cat) => {
            const categoryColor = cat.name === '未分类' ? 'gray' :
                                 cat.name === '工作' ? 'blue' :
                                 cat.name === '学习' ? 'violet' :
                                 cat.name === '生活' ? 'green' :
                                 cat.name === '创作' ? 'pink' :
                                 cat.name === '健康' ? 'red' :
                                 cat.name === '社交' ? 'orange' : 'cyan';

            return (
              <Paper key={cat.name} withBorder p="md" radius="md" bg={`${categoryColor}.0`}>
                <Group justify="space-between" mb="xs">
                  <Text fw={700} c={categoryColor}>{cat.name}</Text>
                  <Badge color={categoryColor} variant="light">{cat.total}项</Badge>
                </Group>

                <Stack gap="xs">
                  <div>
                    <Group justify="space-between" mb={4}>
                      <Text size="xs" c="dimmed">已完成</Text>
                      <Text size="xs" fw={600} c="teal">{cat.done}项 ({cat.doneRate}%)</Text>
                    </Group>
                    <Progress value={cat.doneRate} color="teal" size="sm" />
                  </div>

                  <div>
                    <Group justify="space-between" mb={4}>
                      <Text size="xs" c="dimmed">待办中</Text>
                      <Text size="xs" fw={600} c="blue">{cat.pending}项 ({cat.pendingRate}%)</Text>
                    </Group>
                    <Progress value={cat.pendingRate} color="blue" size="sm" />
                  </div>

                  <div>
                    <Group justify="space-between" mb={4}>
                      <Text size="xs" c="dimmed">已逾期</Text>
                      <Text size="xs" fw={600} c="orange">{cat.overdue}项 ({cat.overdueRate}%)</Text>
                    </Group>
                    <Progress value={cat.overdueRate} color="orange" size="sm" />
                  </div>

                  <div>
                    <Group justify="space-between" mb={4}>
                      <Text size="xs" c="dimmed">已放弃</Text>
                      <Text size="xs" fw={600} c="red">{cat.abandoned}项 ({cat.abandonedRate}%)</Text>
                    </Group>
                    <Progress value={cat.abandonedRate} color="red" size="sm" />
                  </div>

                  <DonutChart
                    size={140}
                    thickness={18}
                    data={[
                      { name: '已完成', value: cat.done, color: 'teal.6' },
                      { name: '待办中', value: cat.pending - cat.overdue, color: 'blue.6' },
                      { name: '已逾期', value: cat.overdue, color: 'orange.6' },
                      { name: '已放弃', value: cat.abandoned, color: 'red.6' },
                    ]}
                    withLabels
                    withLabelsLine={false}
                    chartLabel={`${cat.total}项`}
                  />
                </Stack>
              </Paper>
            );
          })}
        </SimpleGrid>
      </Card>
    </Stack>
  );
}

export default AnalysisPage;
