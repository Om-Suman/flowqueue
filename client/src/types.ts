export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface QueueStats {
  waiting: number;
  inService: number;
  completed: number;
  cancelled: number;
  total: number;
}

export interface Queue {
  id: string;
  name: string;
  description?: string | null;
  prefix: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stats?: QueueStats;
}

export type PriorityLevel = 'NORMAL' | 'PRIORITY' | 'VIP';
export type TokenStatus = 'WAITING' | 'IN_SERVICE' | 'COMPLETED' | 'CANCELLED';

export interface Token {
  id: string;
  tokenNumber: string;
  sequenceNum: number;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  priority: PriorityLevel;
  notes?: string | null;
  status: TokenStatus;
  position: number | null;
  counterName?: string | null;
  queueId: string;
  createdAt: string;
  servedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
}

export interface AnalyticsSummary {
  totalTokens: number;
  waiting: number;
  inService: number;
  completed: number;
  cancelled: number;
  completionRate: number;
  cancellationRate: number;
  avgWaitTimeMinutes: number;
  maxWaitTimeMinutes: number;
  avgServiceTimeMinutes: number;
}

export interface HourlyTrend {
  hour: string;
  tokens: number;
}

export interface PriorityStat {
  count: number;
  totalWait: number;
  avgWait: number;
}

export interface QueueComparison {
  id: string;
  name: string;
  prefix: string;
  total: number;
  waiting: number;
  inService: number;
  completed: number;
  cancelled: number;
  avgWaitTime: number;
}

export interface AnalyticsData {
  summary: AnalyticsSummary;
  hourlyTrends: HourlyTrend[];
  priorityStats: Record<string, PriorityStat>;
  queueComparison: QueueComparison[];
  statusBreakdown: { name: string; value: number; color: string }[];
}
