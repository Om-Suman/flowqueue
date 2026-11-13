import React, { useState, useEffect } from 'react';
import { Token } from '../types';
import { soundEffects } from '../utils/audio';
import { Bell, CheckCircle2, Volume2, UserCheck, ArrowRight, ShieldCheck, Star } from 'lucide-react';

interface NowServingCardProps {
  inServiceTokens: Token[];
  waitingCount: number;
  onServeNext: (counterName: string) => Promise<void>;
  onCompleteService: (tokenId: string) => Promise<void>;
  isServingNext: boolean;
}

export const NowServingCard: React.FC<NowServingCardProps> = ({
  inServiceTokens,
  waitingCount,
  onServeNext,
  onCompleteService,
  isServingNext,
}) => {
  const [counterName, setCounterName] = useState('Counter 1');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const activeToken = inServiceTokens[0] || null;

  // Live timer for active service
  useEffect(() => {
    if (!activeToken?.servedAt) {
      setElapsedSeconds(0);
      return;
    }

    const servedTime = new Date(activeToken.servedAt).getTime();
    const updateElapsed = () => {
      const now = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((now - servedTime) / 1000)));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeToken]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleServeNextClick = async () => {
    soundEffects.playCallChime();
    await onServeNext(counterName);
  };

  const handleReannounce = () => {
    soundEffects.playCallChime();
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Service Counter & Dispatch
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Single-click assignment for the top-priority waiting token
          </p>
        </div>

        {/* Counter assignment dropdown / label */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Station:
          </label>
          <select
            value={counterName}
            onChange={(e) => setCounterName(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="Counter 1">Counter 1</option>
            <option value="Counter 2">Counter 2</option>
            <option value="Desk A">Desk A</option>
            <option value="Window 3">Window 3</option>
          </select>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Prominent Call Next Button */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-xl bg-slate-900 p-5 text-white dark:bg-indigo-950/60 dark:border dark:border-indigo-900/60">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                Next in Line
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-800/80 px-2.5 py-0.5 font-mono text-xs font-bold text-indigo-200">
                {waitingCount} waiting
              </span>
            </div>
            <h3 className="mt-2 text-xl font-bold tracking-tight">
              Assign Top Token
            </h3>
            <p className="mt-1 text-xs text-slate-300 dark:text-indigo-200">
              Immediately pulls the #1 position visitor from the waiting queue and updates public displays.
            </p>
          </div>

          <div className="mt-6">
            <button
              onClick={handleServeNextClick}
              disabled={isServingNext || waitingCount === 0}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 px-4 font-semibold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <Bell className="h-4 w-4" />
              <span>{isServingNext ? 'Assigning...' : 'Serve Next (Position #1)'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            {waitingCount === 0 && (
              <p className="mt-2 text-center text-[11px] text-slate-400">
                Queue is currently empty. Add tokens to begin service.
              </p>
            )}
          </div>
        </div>

        {/* Right: Active In-Service Display */}
        <div className="lg:col-span-7 rounded-xl border border-emerald-100 bg-emerald-50/40 p-5 dark:border-emerald-950/60 dark:bg-emerald-950/20 flex flex-col justify-between">
          {activeToken ? (
            <>
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                      <UserCheck className="h-3.5 w-3.5" />
                      NOW SERVING
                    </span>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      at {activeToken.counterName || 'Counter 1'}
                    </span>
                  </div>

                  {activeToken.priority === 'VIP' && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-800 dark:bg-purple-950/80 dark:text-purple-300">
                      <Star className="h-3 w-3 fill-current" />
                      VIP
                    </span>
                  )}
                  {activeToken.priority === 'PRIORITY' && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                      <ShieldCheck className="h-3 w-3" />
                      PRIORITY
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <div>
                    <div className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                      {activeToken.tokenNumber}
                    </div>
                    <div className="text-base font-semibold text-slate-800 dark:text-slate-200 mt-1">
                      {activeToken.customerName}
                    </div>
                    {activeToken.customerPhone && (
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {activeToken.customerPhone}
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase">
                      Service Duration
                    </div>
                    <div className="font-mono text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatTimer(elapsedSeconds)}
                    </div>
                  </div>
                </div>

                {activeToken.notes && (
                  <div className="mt-3 rounded-lg bg-white/80 p-2.5 text-xs text-slate-600 dark:bg-slate-800/80 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Notes: </span>
                    {activeToken.notes}
                  </div>
                )}
              </div>

              {/* Action Buttons for active service */}
              <div className="mt-5 flex items-center gap-3 pt-3 border-t border-emerald-100 dark:border-emerald-900/50">
                <button
                  onClick={handleReannounce}
                  title="Re-play chime announcement"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <Volume2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Announce Again
                </button>

                <button
                  onClick={() => onCompleteService(activeToken.id)}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.99] transition"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark Service Completed
                </button>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 mb-3">
                <UserCheck className="h-6 w-6" />
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-white">
                Station Currently Idle
              </h4>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                No visitor is currently being served at this counter. Click <strong>Serve Next</strong> to dispatch the next person in line.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
