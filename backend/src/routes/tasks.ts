import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

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

    res.json({
      from: from || null,
      to: to || null,
      tasks,
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

    res.json({ tasks });
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

    res.json(task);
  } catch (error) {
    console.error('获取任务出错:', error);
    res.status(500).json({ error: '获取任务失败' });
  }
});

// Create new task
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, date, rangeStart, rangeEnd, allDay, startTime, endTime, status, quadrant } = req.body;

    if (!title) {
      return res.status(400).json({ error: '标题为必填项' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        date: date || null,
        rangeStart: rangeStart || null,
        rangeEnd: rangeEnd || null,
        allDay: allDay || false,
        startTime: startTime || null,
        endTime: endTime || null,
        status: status || 'pending',
        quadrant: quadrant || 'IN',
      },
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('创建任务出错:', error);
    res.status(500).json({ error: '创建任务失败' });
  }
});

// Update task (full update)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, date, rangeStart, rangeEnd, allDay, startTime, endTime, status, quadrant } = req.body;

    if (!title) {
      return res.status(400).json({ error: '标题为必填项' });
    }

    const task = await prisma.task.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description: description || null,
        date: date || null,
        rangeStart: rangeStart || null,
        rangeEnd: rangeEnd || null,
        allDay: allDay || false,
        startTime: startTime || null,
        endTime: endTime || null,
        status: status || 'pending',
        quadrant: quadrant || 'IN',
      },
    });

    res.json(task);
  } catch (error) {
    console.error('更新任务出错:', error);
    res.status(500).json({ error: '更新任务失败' });
  }
});

// Partial update task
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const task = await prisma.task.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json(task);
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
