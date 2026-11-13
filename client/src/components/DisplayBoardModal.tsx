import React, { useState, useEffect } from 'react';
import { Token, Queue } from '../types';
import { X, Maximize2, Minimize2, Tv, Volume2 } from 'lucide-react';
import { soundEffects } from '../utils/audio';

interface DisplayBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  queue: Queue | null;
  waitingTokens: Token[];
  inServiceTokens: Token[];
}

export const DisplayBoardModal: React.FC<DisplayBoardModalProps> = ({
  isOpen,
  onClose,
  queue,
  waitingTokens,
  inServiceTokens,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!isOpen || !queue) return null;

  const activeToken = inServiceTokens[0] || null;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white p-6 sm:p-10 overflow-y-auto">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white">
            <Tv className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {queue.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Live Visitor Announcement Board • {queue.prefix} Series
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="font-mono text-xl sm:text-2xl font-bold tabular-nums text-slate-200">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-xs text-slate-400">
              {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>

          <button
            onClick={() => soundEffects.playCallChime()}
            title="Test announcement chime"
            className="rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <Volume2 className="h-5 w-5" />
          </button>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Kiosk Mode'}
            className="rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </button>

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Kiosk Content */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        {/* Left: Huge NOW SERVING Hero */}
        <div className="lg:col-span-7 flex flex-col justify-between rounded-3xl border border-emerald-900/50 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 p-8 sm:p-12 shadow-2xl">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-1 text-sm font-bold text-emerald-400 ring-1 ring-emerald-500/30">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              NOW SERVING
            </div>

            {activeToken ? (
              <div className="mt-8 space-y-4">
                <div className="font-mono text-6xl sm:text-8xl lg:text-9xl font-black tracking-tight text-white drop-shadow-md">
                  {activeToken.tokenNumber}
                </div>
                <div className="text-2xl sm:text-4xl font-bold text-slate-200">
                  {activeToken.customerName}
                </div>
                <div className="text-lg text-emerald-400 font-semibold">
                  Please proceed to {activeToken.counterName || 'Counter 1'}
                </div>
              </div>
            ) : (
              <div className="mt-12 text-slate-500">
                <div className="font-mono text-4xl sm:text-6xl font-bold">---</div>
                <div className="text-lg mt-2">Station Ready. Next token calling shortly.</div>
              </div>
            )}
          </div>

          <div className="pt-8 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Keep your token ready</span>
            <span>Counter 1 Active</span>
          </div>
        </div>

        {/* Right: UP NEXT Queue Table */}
        <div className="lg:col-span-5 flex flex-col rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h3 className="text-lg font-bold text-slate-200 uppercase tracking-wider">
              Waiting In Line
            </h3>
            <span className="font-mono text-sm font-semibold text-indigo-400 tabular-nums">
              {waitingTokens.length} Guests Waiting
            </span>
          </div>

          <div className="mt-4 flex-1 space-y-3 overflow-y-auto max-h-[60vh] pr-1">
            {waitingTokens.slice(0, 8).map((token, index) => (
              <div
                key={token.id}
                className={`flex items-center justify-between rounded-2xl p-4 border transition ${
                  index === 0
                    ? 'border-indigo-500/60 bg-indigo-950/40 text-white'
                    : 'border-slate-800 bg-slate-950/60 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-xl font-mono text-xs font-bold ${
                      index === 0 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    #{token.position ?? index + 1}
                  </span>
                  <div>
                    <div className="font-mono text-lg font-bold">{token.tokenNumber}</div>
                    <div className="text-xs text-slate-400 font-medium">{token.customerName}</div>
                  </div>
                </div>

                <div className="text-right">
                  {index === 0 ? (
                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 font-mono text-xs font-bold text-emerald-300 ring-1 ring-emerald-500/30">
                      NEXT
                    </span>
                  ) : (
                    <span className="font-mono text-xs text-slate-500">Wait: #{token.position}</span>
                  )}
                </div>
              </div>
            ))}

            {waitingTokens.length === 0 && (
              <div className="py-12 text-center text-slate-500">
                <p className="text-sm">No customers currently waiting.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
