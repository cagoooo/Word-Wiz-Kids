import React, { useEffect, useState } from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';

export const SwUpdateBanner: React.FC = () => {
  const [show, setShow] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [updateVersion, setUpdateVersion] = useState('');
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    const handleSwUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ worker: ServiceWorker | null; version: string }>;
      if (customEvent.detail) {
        setWaitingWorker(customEvent.detail.worker || null);
        setUpdateVersion(customEvent.detail.version || '');
        setRecovering(false);
        setShow(true);
      }
    };

    const handleChunkRecovery = () => {
      setWaitingWorker(null);
      setRecovering(true);
      setShow(true);
    };

    window.addEventListener('swUpdateAvailable', handleSwUpdate);
    window.addEventListener('chunkRecoveryStarted', handleChunkRecovery);

    return () => {
      window.removeEventListener('swUpdateAvailable', handleSwUpdate);
      window.removeEventListener('chunkRecoveryStarted', handleChunkRecovery);
    };
  }, []);

  const handleReload = () => {
    setShow(false);
    try {
      if (updateVersion) sessionStorage.setItem('vocab-kids-sw-update-requested', updateVersion);
    } catch {
      // sessionStorage 不可用不影響正常更新。
    }

    // 保留新版 SW 在 install 階段建立的 cache；只要求 waiting worker 接管。
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      // main.tsx 會在 controllerchange 時重新載入；較寬鬆的 fallback 避免行動裝置切換較慢時誤判。
      window.setTimeout(() => window.location.reload(), 8000);
      return;
    }

    // 其他分頁已先啟用新版 SW 時只需重新載入，不註銷 SW、不清除全部 cache。
    window.location.reload();
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
              {recovering ? '正在同步最新版本…' : '發現新版單字小英雄！'}
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {recovering
                ? '偵測到網站檔案已更新，正在清除舊版快取並自動重新載入。'
                : '點一下更新，避免繼續使用舊版畫面或舊資料流程。'}
            </p>

            {!recovering && <div className="mt-3.5 flex items-center gap-2">
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
            </div>}
          </div>
        </div>
      </div>
    </div>
  );
};
