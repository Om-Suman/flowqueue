import React, { useState, useEffect } from 'react';
import { AnalyticsData, Queue } from '../types';
import { api } from '../services/api';
import {
  Clock,
  CheckCircle2,
  Users,
  Timer,
  AlertCircle,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

interface AnalyticsDashboardProps {
  queues: Queue[];
  selectedQueueId: string | null;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  queues,
  selectedQueueId,
}) => {
  const [filterQueueId, setFilterQueueId] = useState<string>(selectedQueueId || '');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async (qId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAnalytics(qId || undefined);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(filterQueueId);
  }, [filterQueueId]);

  if (loading && !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
          Calculating queue metrics and trends...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900/60 dark:bg-rose-950/20">
        <AlertCircle className="mx-auto h-8 w-8 text-rose-600 dark:text-rose-400" />
        <h3 className="mt-2 text-sm font-bold text-rose-800 dark:text-rose-200">
          Analytics Error
        </h3>
        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>
        <button
          onClick={() => fetchAnalytics(filterQueueId)}
          className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-rose-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const { summary, hourlyTrends, priorityStats, queueComparison, statusBreakdown } = data;

  const priorityChartData = [
    { priority: 'Normal', avgWait: priorityStats.NORMAL?.avgWait || 0, count: priorityStats.NORMAL?.count || 0 },
    { priority: 'Priority', avgWait: priorityStats.PRIORITY?.avgWait || 0, count: priorityStats.PRIORITY?.count || 0 },
    { priority: 'VIP', avgWait: priorityStats.VIP?.avgWait || 0, count: priorityStats.VIP?.count || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Operational Analytics & Trends
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time intelligence on customer wait times, queue lengths, and desk throughput
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterQueueId}
            onChange={(e) => setFilterQueueId(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm focus:border-indigo-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="">All Managed Queues</option>
            {queues.map((q) => (
              <option key={q.id} value={q.id}>
                {q.name} ({q.prefix})
              </option>
            ))}
          </select>

          <button
            onClick={() => fetchAnalytics(filterQueueId)}
            title="Refresh analytics data"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Avg Wait Time */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Avg Wait Time
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <div className="font-mono text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {summary.avgWaitTimeMinutes}
            </div>
            <span className="text-xs font-medium text-slate-500">minutes</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Peak wait today: <strong className="tabular-nums font-mono">{summary.maxWaitTimeMinutes}m</strong>
          </div>
        </div>

        {/* Avg Service Time */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Avg Service Time
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Timer className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <div className="font-mono text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {summary.avgServiceTimeMinutes}
            </div>
            <span className="text-xs font-medium text-slate-500">minutes / token</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            From assignment to completion
          </div>
        </div>

        {/* Total Tokens Handled */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Volume
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <div className="font-mono text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {summary.totalTokens}
            </div>
            <span className="text-xs font-medium text-slate-500">issued tokens</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span className="text-amber-600 font-semibold">{summary.waiting} waiting</span>
            <span>•</span>
            <span className="text-emerald-600 font-semibold">{summary.inService} serving</span>
          </div>
        </div>

        {/* Completion Success Rate */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Success Rate
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <div className="font-mono text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {summary.completionRate}%
            </div>
            <span className="text-xs font-medium text-slate-500">completed</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Cancellation rate: <strong className="tabular-nums font-mono">{summary.cancellationRate}%</strong>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Hourly Queue Volume & Arrivals Trend */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
                Hourly Queue Traffic & Arrival Trend
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Token generation volume over business operating hours
              </p>
            </div>
          </div>

          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                <XAxis dataKey="hour" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="tokens"
                  name="Tokens Issued"
                  stroke="#4F46E5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#tokenGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Token Status Distribution Donut */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Token Status Distribution
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Breakdown across workflow states
            </p>
          </div>

          <div className="h-60 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Row: Wait Time by Priority & Queue Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Wait Time by Priority */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Wait Times by Priority Tier
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Average wait time (minutes) for VIP vs Priority vs Normal
            </p>
          </div>

          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                <XAxis dataKey="priority" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <Tooltip
                  formatter={(val: any) => [`${val} mins`, 'Avg Wait']}
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="avgWait" fill="#6366F1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Multi-Queue Benchmarking Table */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Queue Throughput Comparison
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live efficiency benchmarks across your active queues
            </p>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider dark:border-slate-800">
                  <th className="pb-3 font-semibold">Queue</th>
                  <th className="pb-3 font-semibold text-center">Waiting</th>
                  <th className="pb-3 font-semibold text-center">Served</th>
                  <th className="pb-3 font-semibold text-center">Cancelled</th>
                  <th className="pb-3 font-semibold text-right">Avg Wait</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {queueComparison.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 font-semibold text-slate-900 dark:text-white">
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 mr-1.5">
                        [{q.prefix}]
                      </span>
                      {q.name}
                    </td>
                    <td className="py-3 text-center font-mono tabular-nums text-amber-600 font-bold">
                      {q.waiting}
                    </td>
                    <td className="py-3 text-center font-mono tabular-nums text-emerald-600 font-bold">
                      {q.completed}
                    </td>
                    <td className="py-3 text-center font-mono tabular-nums text-rose-500">
                      {q.cancelled}
                    </td>
                    <td className="py-3 text-right font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-300">
                      {q.avgWaitTime}m
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
