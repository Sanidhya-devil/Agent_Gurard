import React, { useState } from 'react';
import { AlertOctagon, AlertTriangle, X, ShieldCheck } from 'lucide-react';

interface KillSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  isEmergencyStopped: boolean;
}

export const KillSwitchModal: React.FC<KillSwitchModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isEmergencyStopped,
}) => {
  const [confirmInput, setConfirmInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setConfirmInput('');
    setError(null);
    onClose();
  };

  const handleExecute = async () => {
    if (!isEmergencyStopped && confirmInput.trim() !== 'KILL') {
      setError('You must type "KILL" exactly to confirm emergency shutdown.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onConfirm();
      handleClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to execute emergency switch action.');
    } finally {
      setLoading(false);
    }
  };

  const isConfirmDisabled = !isEmergencyStopped && confirmInput.trim() !== 'KILL';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kill-switch-modal-title"
    >
      <div className="bg-[#121215] border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative text-zinc-100 font-sans">
        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={loading}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition p-1 rounded-lg hover:bg-zinc-800"
          aria-label="Close confirmation modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex items-start gap-3.5 mb-4">
          <div
            className={`p-3 rounded-xl shrink-0 ${
              isEmergencyStopped
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}
          >
            {isEmergencyStopped ? (
              <ShieldCheck className="w-6 h-6" />
            ) : (
              <AlertOctagon className="w-6 h-6 animate-pulse" />
            )}
          </div>
          <div>
            <h3 id="kill-switch-modal-title" className="text-lg font-bold text-white tracking-tight">
              {isEmergencyStopped
                ? 'Disengage Emergency Stop?'
                : 'Engage Global Emergency Kill Switch?'}
            </h3>
            <span className="text-xs font-mono text-zinc-400">
              {isEmergencyStopped ? 'Restoration Procedure' : 'Destructive Enterprise Action'}
            </span>
          </div>
        </div>

        {/* Impact Explanation */}
        <div className="space-y-3 text-xs text-zinc-300 leading-relaxed mb-5">
          {isEmergencyStopped ? (
            <p>
              Releasing the emergency shutdown will restore normal policy evaluation and allow
              authorized agents with valid permissions and budgets to resume operations.
            </p>
          ) : (
            <>
              <p className="bg-rose-950/40 border border-rose-900/60 rounded-lg p-3 text-rose-200 font-medium">
                ⚠️ <strong>Immediate Impact:</strong> Engaging the Global Emergency Kill Switch will
                instantly halt all autonomous agent operations fleet-wide. All incoming financial
                requests will fail closed (HTTP 403) and no funds can move.
              </p>
              <p className="text-zinc-400">
                To confirm you understand the severity of this action and prevent accidental triggers,
                type <strong className="text-white font-mono bg-zinc-800 px-1.5 py-0.5 rounded">KILL</strong> below:
              </p>
            </>
          )}

          {/* Typing confirmation input */}
          {!isEmergencyStopped && (
            <div className="mt-3">
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => {
                  setConfirmInput(e.target.value);
                  if (error) setError(null);
                }}
                placeholder='Type "KILL" to confirm'
                disabled={loading}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                autoFocus
              />
              {error && <p className="text-rose-400 text-xs mt-1.5">{error}</p>}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleExecute}
            disabled={loading || isConfirmDisabled}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm ${
              isEmergencyStopped
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : isConfirmDisabled
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40'
            }`}
          >
            {loading
              ? 'Processing...'
              : isEmergencyStopped
              ? 'Yes, Resume Fleet Operations'
              : 'Confirm & Kill All Agents'}
          </button>
        </div>
      </div>
    </div>
  );
};
