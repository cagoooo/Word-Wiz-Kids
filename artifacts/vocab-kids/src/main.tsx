import { createRoot } from 'react-dom/client';

import App from './App';
import { isNewerBuildVersion } from './lib/pwaVersion';

import './index.css';

const APP_VERSION = import.meta.env.VITE_BUILD_VERSION || 'development';
const CHUNK_RECOVERY_FLAG = 'vocab-kids-chunk-reload-attempted';
const UPDATE_REQUESTED_KEY = 'vocab-kids-sw-update-requested';
const CHUNK_ERROR_PATTERN = /Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError/i;
let lastAnnouncedVersion = '';

function getWorkerVersion(worker: ServiceWorker): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const channel = new MessageChannel();
      const timeout = window.setTimeout(() => resolve(null), 1500);
      channel.port1.onmessage = (event) => {
        window.clearTimeout(timeout);
        resolve(typeof event.data?.version === 'string' ? event.data.version : null);
      };
      worker.postMessage({ type: 'GET_VERSION' }, [channel.port2]);
    } catch {
      resolve(null);
    }
  });
}

function announceUpdate(worker: ServiceWorker | null, version: string) {
  if (!isNewerBuildVersion(version, APP_VERSION) || version === lastAnnouncedVersion) return;
  lastAnnouncedVersion = version;
  window.dispatchEvent(
    new CustomEvent('swUpdateAvailable', { detail: { worker, version } })
  );
}

async function announceWaitingWorker(worker: ServiceWorker | null) {
  if (!worker) return;
  const version = await getWorkerVersion(worker);
  if (version) announceUpdate(worker, version);
}

async function recoverFromChunkError(message: string) {
  if (!CHUNK_ERROR_PATTERN.test(message)) return;

  try {
    if (sessionStorage.getItem(CHUNK_RECOVERY_FLAG) === '1') return;
    sessionStorage.setItem(CHUNK_RECOVERY_FLAG, '1');
  } catch {
    // sessionStorage 不可用時仍嘗試一次自我修復。
  }

  window.dispatchEvent(new CustomEvent('chunkRecoveryStarted'));

  try {
    const registrations = await navigator.serviceWorker?.getRegistrations();
    await Promise.all((registrations || []).map((registration) => registration.unregister()));

    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch (error) {
    console.warn('[PWA] 清除舊版快取失敗，改為直接重新載入。', error);
  }

  window.setTimeout(() => window.location.reload(), 1200);
}

window.addEventListener('error', (event) => {
  void recoverFromChunkError(String(event.message || event.error?.message || ''));
}, true);

window.addEventListener('unhandledrejection', (event) => {
  void recoverFromChunkError(String(event.reason?.message || event.reason || ''));
});

if ('serviceWorker' in navigator) {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
  } else {
    let refreshing = false;
    let activeRegistration: ServiceWorkerRegistration | null = null;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SW_ACTIVATED' && typeof event.data.version === 'string') {
        let requestedVersion = '';
        try {
          requestedVersion = sessionStorage.getItem(UPDATE_REQUESTED_KEY) || '';
        } catch {
          // sessionStorage 不可用時仍以版本閘門去重。
        }
        if (requestedVersion !== event.data.version) {
          announceUpdate(null, event.data.version);
        }
      }
    });

    // Self-healing: unregister any legacy root-scoped ServiceWorker pointing to domain root
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        if (reg.scope === `${window.location.origin}/` || reg.scope === 'https://cagoooo.github.io/') {
          console.warn('Unregistering legacy root-scoped ServiceWorker:', reg.scope);
          reg.unregister();
        }
      }
    });

    window.addEventListener('load', () => {
      const swUrl = `${import.meta.env.BASE_URL}sw.js`;
      navigator.serviceWorker.register(swUrl, { updateViaCache: 'none' }).then((registration) => {
        activeRegistration = registration;

        const watchWorker = (worker: ServiceWorker) => {
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              void announceWaitingWorker(worker);
            }
          });
        };

        if (registration.waiting) {
          void announceWaitingWorker(registration.waiting);
        }

        if (registration.installing) watchWorker(registration.installing);
        registration.addEventListener('updatefound', () => {
          if (registration.installing) watchWorker(registration.installing);
        });

        // Actively check for SW updates on load
        registration.update().catch(() => {});
      }).catch((err) => {
        console.log('ServiceWorker registration failed: ', err);
      });
    });

    const checkVersion = async () => {
      try {
        await activeRegistration?.update();
        const versionUrl = `${import.meta.env.BASE_URL}version.json?t=${Date.now()}`;
        const response = await fetch(versionUrl, { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json() as { version?: string };
        if (APP_VERSION !== 'development' && data.version && isNewerBuildVersion(data.version, APP_VERSION)) {
          if (activeRegistration?.waiting) {
            await announceWaitingWorker(activeRegistration.waiting);
          }
        }
      } catch {
        // 離線時靜默略過，下次 focus / online / interval 會再檢查。
      }
    };

    window.setTimeout(checkVersion, 5000);
    window.setInterval(checkVersion, 3 * 60 * 1000);
    window.addEventListener('focus', checkVersion);
    window.addEventListener('online', checkVersion);
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) void checkVersion();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void checkVersion();
    });
  }
}

createRoot(document.getElementById('root')!).render(<App />);
