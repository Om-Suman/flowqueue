import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { Queue, Token } from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { QueueSelector } from './components/QueueSelector';
import { NowServingCard } from './components/NowServingCard';
import { WaitingQueueList } from './components/WaitingQueueList';
import { AddTokenModal } from './components/AddTokenModal';
import { CancelModal } from './components/CancelModal';
import { DisplayBoardModal } from './components/DisplayBoardModal';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import {
  Sparkles,
  Zap,
  Layers,
  ArrowRight,
  Shield,
  Activity,
} from 'lucide-react';

export const App: React.FC = () => {
  const { user, demoLogin } = useAuth();
  const [activeTab, setActiveTab] = useState<'queue' | 'analytics'>('queue');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('flowqueue_theme') === 'dark';
  });

  // Queues & Tokens State
  const [queues, setQueues] = useState<Queue[]>([]);
  const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null);
  const [waitingTokens, setWaitingTokens] = useState<Token[]>([]);
  const [inServiceTokens, setInServiceTokens] = useState<Token[]>([]);
  const [isServingNext, setIsServingNext] = useState<boolean>(false);

  // Modals
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCreateQueueModalOpen, setIsCreateQueueModalOpen] = useState(false);
  const [isAddTokenModalOpen, setIsAddTokenModalOpen] = useState(false);
  const [isDisplayBoardOpen, setIsDisplayBoardOpen] = useState(false);
  const [tokenToCancel, setTokenToCancel] = useState<Token | null>(null);

  // Sync theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('flowqueue_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('flowqueue_theme', 'light');
    }
  }, [darkMode]);

  // Fetch all queues
  const fetchQueues = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.getQueues();
      setQueues(res.queues);
      if (res.queues.length > 0 && !selectedQueueId) {
        setSelectedQueueId(res.queues[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch queues:', err);
    }
  }, [user, selectedQueueId]);

  // Fetch selected queue's active tokens
  const fetchQueueData = useCallback(async (qId: string) => {
    try {
      const res = await api.getQueueDetails(qId);
      setWaitingTokens(res.waiting);
      setInServiceTokens(res.inService);
    } catch (err) {
      console.error('Failed to fetch queue details:', err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchQueues();
    }
  }, [user, fetchQueues]);

  useEffect(() => {
    if (selectedQueueId) {
      fetchQueueData(selectedQueueId);
      // Auto-poll every 5 seconds for live multi-operator sync
      const interval = setInterval(() => {
        fetchQueueData(selectedQueueId);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedQueueId, fetchQueueData]);

  // Move Token Up / Down in Queue (Optimistic Update)
  const handleMoveToken = async (tokenId: string, direction: 'UP' | 'DOWN') => {
    const prevTokens = [...waitingTokens];
    const currentIndex = waitingTokens.findIndex((t) => t.id === tokenId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'UP' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= waitingTokens.length) return;

    // Optimistically swap
    const nextTokens = [...waitingTokens];
    const temp = nextTokens[currentIndex];
    nextTokens[currentIndex] = nextTokens[targetIndex];
    nextTokens[targetIndex] = temp;

    // Recalculate local position index
    nextTokens.forEach((t, idx) => {
      t.position = idx + 1;
    });

    setWaitingTokens(nextTokens);

    try {
      const res = await api.moveToken(tokenId, direction);
      setWaitingTokens(res.tokens);
    } catch (err) {
      console.error('Reorder failed, reverting optimistic update:', err);
      setWaitingTokens(prevTokens);
    }
  };

  // Serve Next Token (Calls Position #1)
  const handleServeNext = async (counterName: string) => {
    if (!selectedQueueId) return;
    setIsServingNext(true);
    try {
      await api.serveNext(selectedQueueId, counterName);
      await fetchQueueData(selectedQueueId);
      fetchQueues(); // update waiting badges
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch next token');
    } finally {
      setIsServingNext(false);
    }
  };

  // Complete Service for Active Token
  const handleCompleteService = async (tokenId: string) => {
    try {
      await api.completeToken(tokenId);
      if (selectedQueueId) {
        await fetchQueueData(selectedQueueId);
        fetchQueues();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to complete token service');
    }
  };

  // Cancel Token
  const handleConfirmCancel = async (tokenId: string, reason: string) => {
    try {
      await api.cancelToken(tokenId, reason);
      if (selectedQueueId) {
        await fetchQueueData(selectedQueueId);
        fetchQueues();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to cancel token');
    }
  };

  const selectedQueue = queues.find((q) => q.id === selectedQueueId) || null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0B0F19] dark:text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDisplayBoard={() => setIsDisplayBoardOpen(true)}
        onOpenCreateQueue={() => setIsCreateQueueModalOpen(true)}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      {/* Main Surface */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {user ? (
          <div className="space-y-6">
            {/* Tab 1: Live Queue Manager */}
            {activeTab === 'queue' && (
              <div className="space-y-6">
                {/* Queue Cards Bar */}
                <QueueSelector
                  queues={queues}
                  selectedQueueId={selectedQueueId}
                  onSelectQueue={(id) => setSelectedQueueId(id)}
                  onRefreshQueues={fetchQueues}
                  isCreateModalOpen={isCreateQueueModalOpen}
                  setIsCreateModalOpen={setIsCreateQueueModalOpen}
                />

                {selectedQueue && (
                  <>
                    {/* Now Serving & Next Dispatch Card */}
                    <NowServingCard
                      inServiceTokens={inServiceTokens}
                      waitingCount={waitingTokens.length}
                      onServeNext={handleServeNext}
                      onCompleteService={handleCompleteService}
                      isServingNext={isServingNext}
                    />

                    {/* Waiting List View with Re-ordering Controls */}
                    <WaitingQueueList
                      tokens={waitingTokens}
                      onMoveToken={handleMoveToken}
                      onOpenCancelModal={(tok) => setTokenToCancel(tok)}
                      onOpenAddModal={() => setIsAddTokenModalOpen(true)}
                      queueName={selectedQueue.name}
                    />
                  </>
                )}
              </div>
            )}

            {/* Tab 2: Analytics Dashboard */}
            {activeTab === 'analytics' && (
              <AnalyticsDashboard
                queues={queues}
                selectedQueueId={selectedQueueId}
              />
            )}
          </div>
        ) : (
          /* Guest / Evaluator Landing Screen */
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/70 px-4 py-1.5 text-xs font-semibold text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300">
              <Sparkles className="h-4 w-4" />
              Full Stack Queue Management Platform
            </div>

            <h1 className="mt-6 text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white max-w-2xl">
              Precision Queue Operations with Live Analytics
            </h1>

            <p className="mt-4 text-base text-slate-600 dark:text-slate-400 max-w-xl">
              Organize multi-desk queues, generate smart sequence tokens, reorder waiting lines with instant priority shifting, and monitor throughput with interactive charts.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={async () => {
                  await demoLogin();
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 active:scale-[0.99] transition"
              >
                <Zap className="h-4 w-4" />
                Launch Instant Demo (Pre-Seeded)
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
              >
                Manager Login / Register
              </button>
            </div>

            {/* Feature Highlights Grid */}
            <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl text-left">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 mb-4">
                  <Layers className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Dynamic Priority Reordering
                </h3>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Move tokens UP and DOWN in the waiting queue with immediate UI feedback and database atomicity.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 mb-4">
                  <Activity className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  One-Click "Serve Next"
                </h3>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Assign the top token in line for service with Web Audio chime announcements and live duration tracking.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 mb-4">
                  <Shield className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Full Analytics Suite
                </h3>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Wait time averages, peak hourly arrival distribution curves, and queue health metrics.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      <AddTokenModal
        isOpen={isAddTokenModalOpen}
        onClose={() => setIsAddTokenModalOpen(false)}
        queue={selectedQueue}
        onTokenAdded={() => {
          if (selectedQueueId) {
            fetchQueueData(selectedQueueId);
            fetchQueues();
          }
        }}
      />

      <CancelModal
        isOpen={!!tokenToCancel}
        onClose={() => setTokenToCancel(null)}
        token={tokenToCancel}
        onConfirmCancel={handleConfirmCancel}
      />

      <DisplayBoardModal
        isOpen={isDisplayBoardOpen}
        onClose={() => setIsDisplayBoardOpen(false)}
        queue={selectedQueue}
        waitingTokens={waitingTokens}
        inServiceTokens={inServiceTokens}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        FlowQueue Management System • Built for Rugas Evaluation
      </footer>
    </div>
  );
};
