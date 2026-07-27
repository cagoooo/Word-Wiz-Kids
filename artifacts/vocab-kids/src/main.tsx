import { createRoot } from 'react-dom/client';

import App from './App';

import './index.css';

if ('serviceWorker' in navigator) {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
  } else {
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    window.addEventListener('load', () => {
      const swUrl = `${import.meta.env.BASE_URL}sw.js`;
      navigator.serviceWorker.register(swUrl).then((registration) => {
        if (registration.waiting) {
          window.dispatchEvent(
            new CustomEvent('swUpdateAvailable', { detail: { worker: registration.waiting } })
          );
        }

        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                window.dispatchEvent(
                  new CustomEvent('swUpdateAvailable', { detail: { worker: installingWorker } })
                );
              }
            };
          }
        };
      }).catch((err) => {
        console.log('ServiceWorker registration failed: ', err);
      });
    });
  }
}

createRoot(document.getElementById('root')!).render(<App />);
