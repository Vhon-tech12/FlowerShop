'use client';

import { useState } from 'react';
import { X, AlertTriangle, Loader2, Ban } from 'lucide-react';

const CANCEL_REASONS = [
  'Changed my mind',
  'Wrong delivery address',
  'Wrong order or quantity',
  'Found a cheaper option',
  'No longer needed',
  'Ordered by mistake',
  'Other (please specify below)',
];

interface CancelOrderModalProps {
  isOpen: boolean;
  orderId: string;
  onClose: () => void;
  onConfirm: (reason: string, note: string) => Promise<void>;
}

export function CancelOrderModal({
  isOpen,
  orderId,
  onClose,
  onConfirm,
}: CancelOrderModalProps) {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!reason) return;
    setLoading(true);
    try {
      const finalReason =
        reason === 'Other (please specify below)' && note.trim()
          ? `${reason}: ${note.trim()}`
          : reason;
      await onConfirm(finalReason, note.trim());
      // Reset
      setReason('');
      setNote('');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setReason('');
    setNote('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative border-b border-gray-100 p-6">
          <button
            onClick={handleClose}
            disabled={loading}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h2 className="font-serif text-xl text-gray-900">
                Cancel this order?
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Order #{orderId.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="mb-4 text-sm text-gray-600">
            Please tell us why you want to cancel. This helps us improve our
            service.{' '}
            <span className="font-medium text-gray-900">
              This cannot be undone.
            </span>
          </p>

          <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-gray-500">
            Reason *
          </label>
          <div className="mb-4 space-y-2">
            {CANCEL_REASONS.map((r) => (
              <label
                key={r}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-all ${
                  reason === r
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="cancelReason"
                  value={r}
                  checked={reason === r}
                  onChange={(e) => setReason(e.target.value)}
                  className="h-4 w-4 accent-gray-900"
                />
                <span className="text-gray-700">{r}</span>
              </label>
            ))}
          </div>

          {reason === 'Other (please specify below)' && (
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Please specify your reason..."
              className="mb-4 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-gray-900 placeholder:text-gray-400"
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-gray-100 bg-gray-50 p-4">
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-xs font-medium uppercase tracking-widest text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50"
          >
            Keep Order
          </button>
          <button
            onClick={handleConfirm}
            disabled={!reason || loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-xs font-medium uppercase tracking-widest text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Cancelling...
              </>
            ) : (
              <>
                <Ban className="h-3.5 w-3.5" />
                Confirm Cancel
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
