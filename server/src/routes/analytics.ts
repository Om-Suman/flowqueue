import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/analytics - comprehensive analytics for dashboard
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const queueId = req.query.queueId as string | undefined;

    // Filter by queues owned by this manager
    const managerQueues = await prisma.queue.findMany({
      where: { managerId: req.user!.id },
      select: { id: true, name: true, prefix: true },
    });

    const queueIds = queueId ? [queueId] : managerQueues.map((q) => q.id);

    // Fetch all tokens for these queues
    const tokens = await prisma.token.findMany({
      where: { queueId: { in: queueIds } },
      orderBy: { createdAt: 'asc' },
    });

    // 1. Status Breakdown
    const totalTokens = tokens.length;
    const waitingTokens = tokens.filter((t) => t.status === 'WAITING');
    const inServiceTokens = tokens.filter((t) => t.status === 'IN_SERVICE');
    const completedTokens = tokens.filter((t) => t.status === 'COMPLETED');
    const cancelledTokens = tokens.filter((t) => t.status === 'CANCELLED');

    // 2. Wait Times (createdAt -> servedAt) in minutes
    const servedOrCompletedTokens = tokens.filter((t) => t.servedAt && t.createdAt);
    const waitTimes = servedOrCompletedTokens.map((t) => {
      const waitMs = new Date(t.servedAt!).getTime() - new Date(t.createdAt).getTime();
      return Math.max(0, waitMs / 60000); // in minutes
    });

    const avgWaitTimeMinutes = waitTimes.length > 0
      ? Number((waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length).toFixed(1))
      : 0;

    const maxWaitTimeMinutes = waitTimes.length > 0
      ? Number(Math.max(...waitTimes).toFixed(1))
      : 0;

    // 3. Service Times (servedAt -> completedAt) in minutes
    const completedWithDuration = tokens.filter((t) => t.servedAt && t.completedAt);
    const serviceTimes = completedWithDuration.map((t) => {
      const durMs = new Date(t.completedAt!).getTime() - new Date(t.servedAt!).getTime();
      return Math.max(0, durMs / 60000); // in minutes
    });

    const avgServiceTimeMinutes = serviceTimes.length > 0
      ? Number((serviceTimes.reduce((a, b) => a + b, 0) / serviceTimes.length).toFixed(1))
      : 0;

    // 4. Hourly Distribution (Traffic Trends across standard business hours 8 AM - 6 PM)
    const hourlyMap: Record<number, number> = {};
    for (let h = 8; h <= 18; h++) {
      hourlyMap[h] = 0;
    }

    tokens.forEach((t) => {
      const hour = new Date(t.createdAt).getHours();
      if (hour >= 8 && hour <= 18) {
        hourlyMap[hour] = (hourlyMap[hour] || 0) + 1;
      }
    });

    const hourlyTrends = Object.keys(hourlyMap).map((hourStr) => {
      const hour = parseInt(hourStr, 10);
      const label = `${hour.toString().padStart(2, '0')}:00`;
      return {
        hour: label,
        tokens: hourlyMap[hour],
      };
    });

    // 5. Wait Time by Priority
    const priorityStats: Record<string, { count: number; totalWait: number; avgWait: number }> = {
      NORMAL: { count: 0, totalWait: 0, avgWait: 0 },
      PRIORITY: { count: 0, totalWait: 0, avgWait: 0 },
      VIP: { count: 0, totalWait: 0, avgWait: 0 },
    };

    servedOrCompletedTokens.forEach((t) => {
      const prio = t.priority || 'NORMAL';
      const waitMins = Math.max(0, (new Date(t.servedAt!).getTime() - new Date(t.createdAt).getTime()) / 60000);
      if (priorityStats[prio]) {
        priorityStats[prio].count++;
        priorityStats[prio].totalWait += waitMins;
      }
    });

    Object.keys(priorityStats).forEach((k) => {
      const item = priorityStats[k];
      item.avgWait = item.count > 0 ? Number((item.totalWait / item.count).toFixed(1)) : 0;
    });

    // 6. Queue Comparison
    const queueComparison = managerQueues.map((q) => {
      const qTokens = tokens.filter((t) => t.queueId === q.id);
      const qServed = qTokens.filter((t) => t.servedAt && t.createdAt);
      const qWaitTimes = qServed.map((t) => (new Date(t.servedAt!).getTime() - new Date(t.createdAt).getTime()) / 60000);
      const qAvgWait = qWaitTimes.length > 0
        ? Number((qWaitTimes.reduce((a, b) => a + b, 0) / qWaitTimes.length).toFixed(1))
        : 0;

      return {
        id: q.id,
        name: q.name,
        prefix: q.prefix,
        total: qTokens.length,
        waiting: qTokens.filter((t) => t.status === 'WAITING').length,
        inService: qTokens.filter((t) => t.status === 'IN_SERVICE').length,
        completed: qTokens.filter((t) => t.status === 'COMPLETED').length,
        cancelled: qTokens.filter((t) => t.status === 'CANCELLED').length,
        avgWaitTime: qAvgWait,
      };
    });

    return res.json({
      summary: {
        totalTokens,
        waiting: waitingTokens.length,
        inService: inServiceTokens.length,
        completed: completedTokens.length,
        cancelled: cancelledTokens.length,
        completionRate: totalTokens > 0 ? Number(((completedTokens.length / totalTokens) * 100).toFixed(1)) : 0,
        cancellationRate: totalTokens > 0 ? Number(((cancelledTokens.length / totalTokens) * 100).toFixed(1)) : 0,
        avgWaitTimeMinutes,
        maxWaitTimeMinutes,
        avgServiceTimeMinutes,
      },
      hourlyTrends,
      priorityStats,
      queueComparison,
      statusBreakdown: [
        { name: 'Waiting', value: waitingTokens.length, color: '#F59E0B' },
        { name: 'In Service', value: inServiceTokens.length, color: '#10B981' },
        { name: 'Completed', value: completedTokens.length, color: '#3B82F6' },
        { name: 'Cancelled', value: cancelledTokens.length, color: '#EF4444' },
      ],
    });
  } catch (err: any) {
    console.error('Analytics error:', err);
    return res.status(500).json({ error: 'Failed to generate analytics' });
  }
});

export default router;
