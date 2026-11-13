import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticate } from '../middleware/auth';

const router = Router();

const QueueCreateSchema = z.object({
  name: z.string().min(2, 'Queue name must have at least 2 characters'),
  description: z.string().optional(),
  prefix: z.string().max(6, 'Prefix should not exceed 6 characters').optional(),
});

// List all queues for the current manager
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const queues = await prisma.queue.findMany({
      where: { managerId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      include: {
        tokens: {
          select: {
            id: true,
            status: true,
            position: true,
          },
        },
      },
    });

    const transformed = queues.map((q) => {
      const waitingCount = q.tokens.filter((t) => t.status === 'WAITING').length;
      const inServiceCount = q.tokens.filter((t) => t.status === 'IN_SERVICE').length;
      const completedCount = q.tokens.filter((t) => t.status === 'COMPLETED').length;
      const cancelledCount = q.tokens.filter((t) => t.status === 'CANCELLED').length;

      return {
        id: q.id,
        name: q.name,
        description: q.description,
        prefix: q.prefix,
        isActive: q.isActive,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
        stats: {
          waiting: waitingCount,
          inService: inServiceCount,
          completed: completedCount,
          cancelled: cancelledCount,
          total: q.tokens.length,
        },
      };
    });

    return res.json({ queues: transformed });
  } catch (err: any) {
    console.error('List queues error:', err);
    return res.status(500).json({ error: 'Failed to fetch queues' });
  }
});

// Get single queue with waiting list, currently served tokens, and recent completed
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const queueId = req.params.id as string;
    const queue = await prisma.queue.findFirst({
      where: { id: queueId, managerId: req.user!.id },
    });

    if (!queue) {
      return res.status(404).json({ error: 'Queue not found or unauthorized' });
    }

    // Fetch waiting tokens ordered strictly by position ASC
    const waitingTokens = await prisma.token.findMany({
      where: { queueId: queue.id, status: 'WAITING' },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });

    // Fetch currently in service token(s)
    const inServiceTokens = await prisma.token.findMany({
      where: { queueId: queue.id, status: 'IN_SERVICE' },
      orderBy: { servedAt: 'desc' },
    });

    // Fetch recent completed / cancelled tokens
    const recentActivity = await prisma.token.findMany({
      where: {
        queueId: queue.id,
        status: { in: ['COMPLETED', 'CANCELLED'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return res.json({
      queue,
      waiting: waitingTokens,
      inService: inServiceTokens,
      recent: recentActivity,
    });
  } catch (err: any) {
    console.error('Get queue details error:', err);
    return res.status(500).json({ error: 'Failed to retrieve queue details' });
  }
});

// Create new queue
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const parseResult = QueueCreateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    const { name, description, prefix } = parseResult.data;

    const queue = await prisma.queue.create({
      data: {
        name,
        description: description || '',
        prefix: (prefix || name.substring(0, 3)).toUpperCase().replace(/[^A-Z0-9]/g, ''),
        managerId: req.user!.id,
      },
    });

    return res.status(201).json({
      message: 'Queue created successfully',
      queue,
    });
  } catch (err: any) {
    console.error('Create queue error:', err);
    return res.status(500).json({ error: 'Failed to create queue' });
  }
});

// Update queue
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const queueId = req.params.id as string;
    const queue = await prisma.queue.findFirst({
      where: { id: queueId, managerId: req.user!.id },
    });

    if (!queue) {
      return res.status(404).json({ error: 'Queue not found' });
    }

    const { name, description, prefix, isActive } = req.body;

    const updated = await prisma.queue.update({
      where: { id: queue.id },
      data: {
        name: name ?? queue.name,
        description: description !== undefined ? description : queue.description,
        prefix: prefix ? prefix.toUpperCase() : queue.prefix,
        isActive: isActive !== undefined ? Boolean(isActive) : queue.isActive,
      },
    });

    return res.json({ message: 'Queue updated successfully', queue: updated });
  } catch (err: any) {
    console.error('Update queue error:', err);
    return res.status(500).json({ error: 'Failed to update queue' });
  }
});

// Delete queue
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const queueId = req.params.id as string;
    const queue = await prisma.queue.findFirst({
      where: { id: queueId, managerId: req.user!.id },
    });

    if (!queue) {
      return res.status(404).json({ error: 'Queue not found' });
    }

    await prisma.queue.delete({ where: { id: queue.id } });
    return res.json({ message: 'Queue deleted successfully' });
  } catch (err: any) {
    console.error('Delete queue error:', err);
    return res.status(500).json({ error: 'Failed to delete queue' });
  }
});

export default router;
