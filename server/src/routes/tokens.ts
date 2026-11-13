import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticate } from '../middleware/auth';

const router = Router();

const CreateTokenSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  priority: z.enum(['NORMAL', 'PRIORITY', 'VIP']).default('NORMAL'),
  notes: z.string().optional(),
});

// Helper: Ensure compact sequential positions 1..N for waiting tokens in a queue
async function compactQueuePositions(queueId: string) {
  const waitingTokens = await prisma.token.findMany({
    where: { queueId, status: 'WAITING' },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
  });

  const updates = waitingTokens.map((token, index) => {
    const newPos = index + 1;
    if (token.position !== newPos) {
      return prisma.token.update({
        where: { id: token.id },
        data: { position: newPos },
      });
    }
    return null;
  }).filter(Boolean);

  if (updates.length > 0) {
    await prisma.$transaction(updates as any);
  }
}

// 3. Add new person / token into queue
router.post('/queue/:queueId', authenticate, async (req: Request, res: Response) => {
  try {
    const queueId = req.params.queueId as string;
    const queue = await prisma.queue.findFirst({
      where: { id: queueId, managerId: req.user!.id },
    });

    if (!queue) {
      return res.status(404).json({ error: 'Queue not found or unauthorized' });
    }

    const parseResult = CreateTokenSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    const { customerName, customerPhone, customerEmail, priority, notes } = parseResult.data;

    // Increment token sequence in transaction
    const result = await prisma.$transaction(async (tx) => {
      const updatedQueue = await tx.queue.update({
        where: { id: queue.id },
        data: { tokenSeq: { increment: 1 } },
      });

      const nextSequence = updatedQueue.tokenSeq;
      const formattedSeq = String(nextSequence).padStart(3, '0');
      const tokenNumber = `${queue.prefix}-${formattedSeq}`;

      // Calculate new position (append at end of waiting list)
      const lastWaiting = await tx.token.findFirst({
        where: { queueId: queue.id, status: 'WAITING' },
        orderBy: { position: 'desc' },
        select: { position: true },
      });

      const newPosition = (lastWaiting?.position ?? 0) + 1;

      const token = await tx.token.create({
        data: {
          tokenNumber,
          sequenceNum: nextSequence,
          customerName,
          customerPhone: customerPhone || null,
          customerEmail: customerEmail || null,
          priority,
          notes: notes || null,
          status: 'WAITING',
          position: newPosition,
          queueId: queue.id,
        },
      });

      return token;
    });

    return res.status(201).json({
      message: 'Token created successfully',
      token: result,
    });
  } catch (err: any) {
    console.error('Create token error:', err);
    return res.status(500).json({ error: 'Failed to create token' });
  }
});

// 4. Get list of tokens waiting in a queue
router.get('/queue/:queueId/waiting', authenticate, async (req: Request, res: Response) => {
  try {
    const queueId = req.params.queueId as string;
    const queue = await prisma.queue.findFirst({
      where: { id: queueId, managerId: req.user!.id },
    });

    if (!queue) {
      return res.status(404).json({ error: 'Queue not found' });
    }

    const tokens = await prisma.token.findMany({
      where: { queueId: queue.id, status: 'WAITING' },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });

    return res.json({ tokens });
  } catch (err: any) {
    console.error('Get waiting tokens error:', err);
    return res.status(500).json({ error: 'Failed to fetch waiting tokens' });
  }
});

// 5. Move token UP or DOWN in queue
router.patch('/:id/move', authenticate, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { direction } = req.body; // 'UP' | 'DOWN'

    if (direction !== 'UP' && direction !== 'DOWN') {
      return res.status(400).json({ error: 'Direction must be either UP or DOWN' });
    }

    const targetToken = await prisma.token.findUnique({
      where: { id },
      include: { queue: true },
    });

    if (!targetToken || targetToken.queue.managerId !== req.user!.id) {
      return res.status(404).json({ error: 'Token not found or unauthorized' });
    }

    if (targetToken.status !== 'WAITING' || targetToken.position === null) {
      return res.status(400).json({ error: 'Only WAITING tokens can be moved in the queue' });
    }

    const currentPos = targetToken.position;
    const targetPos = direction === 'UP' ? currentPos - 1 : currentPos + 1;

    if (targetPos < 1) {
      return res.status(400).json({ error: 'Token is already at the top of the queue' });
    }

    // Find the neighbor token at targetPos
    const neighborToken = await prisma.token.findFirst({
      where: {
        queueId: targetToken.queueId,
        status: 'WAITING',
        position: targetPos,
      },
    });

    if (!neighborToken) {
      if (direction === 'DOWN') {
        return res.status(400).json({ error: 'Token is already at the bottom of the queue' });
      }
      // If no direct neighbor found due to gap, normalize queue
      await compactQueuePositions(targetToken.queueId);
      return res.json({ message: 'Queue positions normalized. Please retry move.' });
    }

    // Swap positions atomically in transaction
    await prisma.$transaction([
      prisma.token.update({
        where: { id: targetToken.id },
        data: { position: targetPos },
      }),
      prisma.token.update({
        where: { id: neighborToken.id },
        data: { position: currentPos },
      }),
    ]);

    // Return the refreshed waiting list
    const updatedWaiting = await prisma.token.findMany({
      where: { queueId: targetToken.queueId, status: 'WAITING' },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });

    return res.json({
      message: `Token moved ${direction.toLowerCase()} successfully`,
      tokens: updatedWaiting,
    });
  } catch (err: any) {
    console.error('Move token error:', err);
    return res.status(500).json({ error: 'Failed to reorder token' });
  }
});

// 6. Assign the token at the top of the queue for service (Single Button Click)
router.post('/queue/:queueId/serve-next', authenticate, async (req: Request, res: Response) => {
  try {
    const queueId = req.params.queueId as string;
    const counterName = req.body.counterName || 'Counter 1';

    const queue = await prisma.queue.findFirst({
      where: { id: queueId, managerId: req.user!.id },
    });

    if (!queue) {
      return res.status(404).json({ error: 'Queue not found or unauthorized' });
    }

    // Find token at the top of the waiting queue (position = 1 or minimum position)
    const topToken = await prisma.token.findFirst({
      where: { queueId: queue.id, status: 'WAITING' },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });

    if (!topToken) {
      return res.status(400).json({ error: 'No tokens are currently waiting in this queue' });
    }

    // Perform transaction: transition top token to IN_SERVICE, remove its position, and shift remaining tokens
    const servedToken = await prisma.$transaction(async (tx) => {
      const updated = await tx.token.update({
        where: { id: topToken.id },
        data: {
          status: 'IN_SERVICE',
          position: null,
          servedAt: new Date(),
          counterName,
        },
      });

      // Shift all remaining waiting tokens up by 1
      const remainingTokens = await tx.token.findMany({
        where: { queueId: queue.id, status: 'WAITING' },
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      });

      for (let i = 0; i < remainingTokens.length; i++) {
        await tx.token.update({
          where: { id: remainingTokens[i].id },
          data: { position: i + 1 },
        });
      }

      return updated;
    });

    return res.json({
      message: `Token ${servedToken.tokenNumber} is now assigned for service`,
      servedToken,
    });
  } catch (err: any) {
    console.error('Serve next token error:', err);
    return res.status(500).json({ error: 'Failed to assign next token for service' });
  }
});

// Mark an in-service token as COMPLETED
router.post('/:id/complete', authenticate, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const token = await prisma.token.findUnique({
      where: { id },
      include: { queue: true },
    });

    if (!token || token.queue.managerId !== req.user!.id) {
      return res.status(404).json({ error: 'Token not found or unauthorized' });
    }

    const updated = await prisma.token.update({
      where: { id: token.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        position: null,
      },
    });

    return res.json({
      message: `Token ${token.tokenNumber} marked as completed`,
      token: updated,
    });
  } catch (err: any) {
    console.error('Complete token error:', err);
    return res.status(500).json({ error: 'Failed to complete token service' });
  }
});

// 7. Cancel a token from the queue
router.post('/:id/cancel', authenticate, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { reason } = req.body;

    const token = await prisma.token.findUnique({
      where: { id },
      include: { queue: true },
    });

    if (!token || token.queue.managerId !== req.user!.id) {
      return res.status(404).json({ error: 'Token not found or unauthorized' });
    }

    const cancelledToken = await prisma.$transaction(async (tx) => {
      const updated = await tx.token.update({
        where: { id: token.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: reason || 'Cancelled by Queue Manager',
          position: null,
        },
      });

      // Recalibrate waiting positions if token was in waiting state
      if (token.status === 'WAITING') {
        const remainingWaiting = await tx.token.findMany({
          where: { queueId: token.queueId, status: 'WAITING' },
          orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
        });

        for (let i = 0; i < remainingWaiting.length; i++) {
          await tx.token.update({
            where: { id: remainingWaiting[i].id },
            data: { position: i + 1 },
          });
        }
      }

      return updated;
    });

    return res.json({
      message: `Token ${token.tokenNumber} has been cancelled`,
      token: cancelledToken,
    });
  } catch (err: any) {
    console.error('Cancel token error:', err);
    return res.status(500).json({ error: 'Failed to cancel token' });
  }
});

export default router;
