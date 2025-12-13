import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

function parseCategories<T extends { categories?: string | null }>(row: T) {
  if (!row) return row as any;
  const c = (row as any).categories;
  if (typeof c === 'string') {
    try {
      (row as any).categories = JSON.parse(c);
    } catch {
      (row as any).categories = null;
    }
  }
  return row as any;
}

function stringifyCategories(data: any) {
  if (data && 'categories' in data) {
    const c = data.categories;
    if (Array.isArray(c)) {
      data.categories = JSON.stringify(c);
    } else if (c === null) {
      data.categories = null;
    }
  }
  return data;
}

// Get all tasks or tasks by date range
router.get('/', async (req: Request, res: Response) => {
  try {
    const { from, to, status } = req.query;

    let whereClause: any = {};

    // 按日期范围过滤
    if (from && to) {
      const fromStr = from as string;
      const toStr = to as string;
      whereClause = {
        AND: [
          status && status !== 'all' ? { status: status as string } : {},
          {
            OR: [
              // 单日任务在范围内
              { date: { gte: fromStr, lte: toStr } },
              // 跨日任务与范围有重叠：rangeStart <= to && rangeEnd >= from
              {
                AND: [
                  { rangeStart: { lte: toStr } },
                  { rangeEnd: { gte: fromStr } },
                ],
              },
            ],
          },
        ],
      };
    } else {
      // 无范围时，仅按状态过滤
      if (status && status !== 'all') {
        whereClause.status = status as string;
      }
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    });

    const mapped = tasks.map(parseCategories);

    res.json({
      from: from || null,
      to: to || null,
      tasks: mapped,
    });
  } catch (error) {
    console.error('获取任务出错:', error);
    res.status(500).json({ error: '获取任务失败' });
  }
});

// Get all tasks (without filters)
router.get('/all', async (req: Request, res: Response) => {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    });

    res.json({ tasks: tasks.map(parseCategories) });
  } catch (error) {
    console.error('获取全部任务出错:', error);
    res.status(500).json({ error: '获取全部任务失败' });
  }
});

// Get single task by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const task = await prisma.task.findUnique({
      where: { id: parseInt(id) },
    });

    if (!task) {
      return res.status(404).json({ error: '未找到该任务' });
    }

    res.json(parseCategories(task));
  } catch (error) {
    console.error('获取任务出错:', error);
    res.status(500).json({ error: '获取任务失败' });
  }
});

// Create new task
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, date, rangeStart, rangeEnd, allDay, startTime, endTime, status, quadrant, parentId, order, categories } = req.body;

    const task = await prisma.task.create({
      data: {
        title: title || '',
        description: description || null,
        date: date || null,
        rangeStart: rangeStart || null,
        rangeEnd: rangeEnd || null,
        allDay: allDay || false,
        startTime: startTime || null,
        endTime: endTime || null,
        status: status || 'pending',
        quadrant: quadrant || 'IN',
        parentId: parentId || null,
        order: order || 0,
        categories: Array.isArray(categories) ? JSON.stringify(categories) : categories ?? null,
      },
    });

    res.status(201).json(parseCategories(task));
  } catch (error) {
    console.error('创建任务出错:', error);
    res.status(500).json({ error: '创建任务失败' });
  }
});

// Update task (full update)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, date, rangeStart, rangeEnd, allDay, startTime, endTime, status, quadrant, parentId, order, categories } = req.body;

    const task = await prisma.task.update({
      where: { id: parseInt(id) },
      data: {
        title: title || '',
        description: description || null,
        date: date || null,
        rangeStart: rangeStart || null,
        rangeEnd: rangeEnd || null,
        allDay: allDay || false,
        startTime: startTime || null,
        endTime: endTime || null,
        status: status || 'pending',
        quadrant: quadrant || 'IN',
        parentId: parentId !== undefined ? parentId : undefined,
        order: order !== undefined ? order : undefined,
        categories: Array.isArray(categories)
          ? JSON.stringify(categories)
          : categories === null
          ? null
          : undefined,
      },
    });

    res.json(parseCategories(task));
  } catch (error) {
    console.error('更新任务出错:', error);
    res.status(500).json({ error: '更新任务失败' });
  }
});

// Partial update task
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = stringifyCategories({ ...req.body });

    const task = await prisma.task.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json(parseCategories(task));
  } catch (error) {
    console.error('部分更新任务出错:', error);
    res.status(500).json({ error: '部分更新任务失败' });
  }
});

// Delete task
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.task.delete({
      where: { id: parseInt(id) },
    });

    res.status(204).send();
  } catch (error) {
    console.error('删除任务出错:', error);
    res.status(500).json({ error: '删除任务失败' });
  }
});

export default router;
