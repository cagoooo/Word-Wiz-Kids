import React, { useEffect, useState } from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';

export const SwUpdateBanner: React.FC = () => {
  const [show, setShow] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    const handleSwUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ worker: ServiceWorker }>;
      if (customEvent.detail && customEvent.detail.worker) {
        setWaitingWorker(customEvent.detail.worker);
        setShow(true);
      }
    };

    window.addEventListener('swUpdateAvailable', handleSwUpdate);

    return () => {
      window.removeEventListener('swUpdateAvailable', handleSwUpdate);
    };
  }, []);

  const handleReload = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full px-4 animate-in slide-in-from-bottom-5 duration-300">
      <div className="relative overflow-hidden rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-purple-500/30 p-5 shadow-2xl shadow-purple-950/50 text-white">
        {/* Glow effect */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-purple-500/30 blur-2xl rounded-full pointer-events-none" />

        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-400 to-purple-600 text-white shadow-lg shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>

          <div className="flex-1 min-w-0 pr-2">
            <h4 className="font-bold text-base text-amber-300 flex items-center gap-1.5">
              發現新版單字小英雄！
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              系統已推出最新學習關卡與體驗優化，點擊下方按鈕即可載入最新版本。
            </p>

            <div className="mt-3.5 flex items-center gap-2">
              <button
                onClick={handleReload}
                className="flex-1 py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                🚀 立即更新載入
              </button>

              <button
                onClick={() => setShow(false)}
                aria-label="Close notification"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
