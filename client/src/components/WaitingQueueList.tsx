import React, { useState, useEffect } from 'react';
import { Token } from '../types';
import { soundEffects } from '../utils/audio';
import {
  ArrowUp,
  ArrowDown,
  UserX,
  Plus,
  Search,
  Clock,
  Star,
  ShieldCheck,
  Users,
} from 'lucide-react';

interface WaitingQueueListProps {
  tokens: Token[];
  onMoveToken: (id: string, direction: 'UP' | 'DOWN') => Promise<void>;
  onOpenCancelModal: (token: Token) => void;
  onOpenAddModal: () => void;
  queueName: string;
}

// Subcomponent for each token's live elapsed wait timer
const LiveWaitBadge: React.FC<{ createdAt: string }> = ({ createdAt }) => {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const update = () => {
      const ms = Date.now() - new Date(createdAt).getTime();
      const totalSecs = Math.max(0, Math.floor(ms / 1000));
      const mins = Math.floor(totalSecs / 60);
      const secs = totalSecs % 60;
      setElapsed(`${mins}m ${String(secs).padStart(2, '0')}s`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  return (
    <span className="inline-flex items-center gap-1 font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
      <Clock className="h-3 w-3 text-slate-400" />
      {elapsed}
    </span>
  );
};

export const WaitingQueueList: React.FC<WaitingQueueListProps> = ({
  tokens,
  onMoveToken,
  onOpenCancelModal,
  onOpenAddModal,
  queueName,
}) => {
  const [search, setSearch] = useState('');
  const [movingId, setMovingId] = useState<string | null>(null);

  const filteredTokens = tokens.filter(
    (t) =>
      t.customerName.toLowerCase().includes(search.toLowerCase()) ||
      t.tokenNumber.toLowerCase().includes(search.toLowerCase()) ||
      (t.customerPhone && t.customerPhone.includes(search))
  );

  const handleMove = async (id: string, direction: 'UP' | 'DOWN') => {
    try {
      setMovingId(id);
      soundEffects.playTick();
      await onMoveToken(id, direction);
    } finally {
      setMovingId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* List Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Waiting Queue: {queueName}
            </h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300 tabular-nums">
              {tokens.length} in line
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time waiting tokens with dynamic priority re-ordering
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search token / name..."
              className="w-44 sm:w-56 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Add Token Button */}
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Person / Token
          </button>
        </div>
      </div>

      {/* Waiting Items */}
      <div className="mt-4 space-y-2.5">
        {filteredTokens.length > 0 ? (
          filteredTokens.map((token, index) => {
            const isTop = index === 0;
            const isBottom = index === filteredTokens.length - 1;
            const isMoving = movingId === token.id;

            return (
              <div
                key={token.id}
                className={`group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border p-3.5 transition-all ${
                  isTop
                    ? 'border-indigo-200 bg-indigo-50/30 dark:border-indigo-900/60 dark:bg-indigo-950/20 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
                } ${isMoving ? 'opacity-60 scale-[0.99]' : ''}`}
              >
                {/* Left: Position Indicator & Token Details */}
                <div className="flex items-center gap-3">
                  {/* Position Badge */}
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold ${
                      isTop
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    #{token.position ?? index + 1}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                        {token.tokenNumber}
                      </span>

                      {/* Priority Tag */}
                      {token.priority === 'VIP' && (
                        <span className="inline-flex items-center gap-1 rounded bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800 dark:bg-purple-950/80 dark:text-purple-300">
                          <Star className="h-2.5 w-2.5 fill-current" />
                          VIP
                        </span>
                      )}
                      {token.priority === 'PRIORITY' && (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                          <ShieldCheck className="h-2.5 w-2.5" />
                          PRIORITY
                        </span>
                      )}

                      {isTop && (
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                          UP NEXT
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {token.customerName}
                      </span>
                      {token.customerPhone && (
                        <span className="text-xs text-slate-400">
                          • {token.customerPhone}
                        </span>
                      )}
                    </div>

                    {token.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                        "{token.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Wait Timer & Operational Controls */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <LiveWaitBadge createdAt={token.createdAt} />

                  {/* Reorder Buttons (Move Up / Move Down) */}
                  <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-800 dark:bg-slate-800/80">
                    <button
                      onClick={() => handleMove(token.id, 'UP')}
                      disabled={isTop || isMoving}
                      title={isTop ? 'Already at the top' : 'Move Token Up in Queue'}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent dark:text-slate-300 dark:hover:bg-slate-700 transition"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleMove(token.id, 'DOWN')}
                      disabled={isBottom || isMoving}
                      title={isBottom ? 'Already at the bottom' : 'Move Token Down in Queue'}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent dark:text-slate-300 dark:hover:bg-slate-700 transition"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Cancel Token Button */}
                  <button
                    onClick={() => onOpenCancelModal(token)}
                    title="Cancel Token from Queue"
                    className="flex h-8 items-center gap-1 rounded-lg border border-rose-200 bg-white px-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-900/60 dark:bg-slate-900 dark:text-rose-400 dark:hover:bg-rose-950/40 transition"
                  >
                    <UserX className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Cancel</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-10 text-center dark:border-slate-800">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
              <Users className="h-6 w-6" />
            </div>
            <h4 className="mt-3 font-semibold text-slate-900 dark:text-white">
              {search ? 'No tokens matching search criteria' : 'Waiting line is clear'}
            </h4>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-xs">
              {search
                ? 'Try a different customer name or token code'
                : 'All waiting visitors have been dispatched or cancelled.'}
            </p>
            {!search && (
              <button
                onClick={onOpenAddModal}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Token
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
