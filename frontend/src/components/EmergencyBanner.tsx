import React, { useState } from 'react';
import { AlertOctagon, ShieldCheck, Power, AlertTriangle, X } from 'lucide-react';

interface EmergencyBannerProps {
  isEmergencyStopped: boolean;
  onTriggerStop: () => Promise<void>;
  onReleaseStop: () => Promise<void>;
}

export const EmergencyBanner: React.FC<EmergencyBannerProps> = ({
  isEmergencyStopped,
  onTriggerStop,
  onReleaseStop,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      if (isEmergencyStopped) {
        await onReleaseStop();
      } else {
        await onTriggerStop();
      }
      setShowModal(false);
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className={`w-full transition-all duration-300 border-b ${
          isEmergencyStopped
            ? 'bg-red-950/90 border-red-800 text-red-200'
            : 'bg-slate-900/60 border-slate-800 text-slate-300'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {isEmergencyStopped ? (
              <div className="p-1.5 bg-red-600 rounded-lg text-white animate-pulse">
                <AlertOctagon className="w-5 h-5" />
              </div>
            ) : (
              <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wide">
                  {isEmergencyStopped
                    ? 'GLOBAL EMERGENCY KILL SWITCH ACTIVATED'
                    : 'GLOBAL FLEET SAFEGUARD ACTIVE'}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold ${
                    isEmergencyStopped
                      ? 'bg-red-600 text-white animate-bounce'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                  }`}
                >
                  {isEmergencyStopped ? 'FAIL-CLOSED STOPPED' : 'NORMAL (100% FAIL-CLOSED PROTECTED)'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isEmergencyStopped
                  ? 'All autonomous financial actions are blocked immediately across all agents.'
                  : 'Autonomous financial operations are continuously evaluated across 7 fail-closed stages.'}
              </p>
            </div>
          </div>

          <div>
            <button
              onClick={() => setShowModal(true)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all shadow-md ${
                isEmergencyStopped
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40'
                  : 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/40'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{isEmergencyStopped ? 'DISENGAGE EMERGENCY STOP' : 'TRIGGER EMERGENCY STOP'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div
                className={`p-3 rounded-xl ${
                  isEmergencyStopped ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                }`}
              >
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {isEmergencyStopped ? 'Disengage Emergency Stop?' : 'Activate Global Emergency Stop?'}
                </h3>
                <p className="text-xs text-slate-400 font-mono">Fail-Closed Control Plane Action</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              {isEmergencyStopped
                ? 'Releasing emergency shutdown will resume normal policy enforcement and allow autonomous agents with valid permissions and budgets to resume operations.'
                : 'Activating Emergency Stop will immediately block ALL autonomous agent actions fleet-wide. All pending and incoming financial requests will be denied fail-closed.'}
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className={`px-4 py-2 rounded-lg text-sm font-bold text-white transition ${
                  isEmergencyStopped
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                {loading
                  ? 'Processing...'
                  : isEmergencyStopped
                  ? 'Yes, Resume Fleet Operations'
                  : 'Yes, Kill All Agent Operations'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
