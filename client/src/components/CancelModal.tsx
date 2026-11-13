import React, { useState } from 'react';
import { Token } from '../types';
import { X, AlertTriangle } from 'lucide-react';

interface CancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: Token | null;
  onConfirmCancel: (tokenId: string, reason: string) => Promise<void>;
}

const COMMON_REASONS = [
  'Customer no-show / departed',
  'Customer requested cancellation',
  'Duplicate or erroneous token issued',
  'Reassigned to alternative service department',
];

export const CancelModal: React.FC<CancelModalProps> = ({
  isOpen,
  onClose,
  token,
  onConfirmCancel,
}) => {
  const [reason, setReason] = useState(COMMON_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !token) return null;

  const handleConfirm = async () => {
    const finalReason = reason === 'Other' ? customReason.trim() || 'Manager cancelled' : reason;
    setLoading(true);
    try {
      await onConfirmCancel(token.id, finalReason);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-bold text-slate-900 dark:text-white">Cancel Token</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 rounded-xl bg-slate-50 p-3.5 border border-slate-100 dark:bg-slate-800/60 dark:border-slate-800">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-lg font-bold text-slate-900 dark:text-white">
              {token.tokenNumber}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Position #{token.position}
            </span>
          </div>
          <div className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-0.5">
            {token.customerName}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Cancellation Reason
          </label>
          <div className="space-y-1.5">
            {COMMON_REASONS.map((r) => (
              <label
                key={r}
                className="flex items-center gap-2 rounded-lg border border-slate-200 p-2.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <input
                  type="radio"
                  name="cancel_reason"
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="text-rose-600 focus:ring-rose-500"
                />
                <span>{r}</span>
              </label>
            ))}

            <label className="flex items-center gap-2 rounded-lg border border-slate-200 p-2.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800">
              <input
                type="radio"
                name="cancel_reason"
                checked={reason === 'Other'}
                onChange={() => setReason('Other')}
                className="text-rose-600 focus:ring-rose-500"
              />
              <span>Other custom reason</span>
            </label>
          </div>

          {reason === 'Other' && (
            <textarea
              rows={2}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="State reason for records..."
              className="mt-2 w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:border-rose-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          )}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Keep in Queue
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-rose-700 disabled:opacity-50"
          >
            {loading ? 'Cancelling...' : 'Confirm Cancellation'}
          </button>
        </div>
      </div>
    </div>
  );
};
