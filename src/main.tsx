
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import App from './App.tsx'
import './index.css'
import './i18n.ts'

// Sentry — monitoring d'erreurs en production
// La clé DSN est optionnelle : si VITE_SENTRY_DSN n'est pas définie, Sentry est désactivé.
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 0.1,  // 10% des transactions tracées (pour économiser le quota gratuit)
    environment: import.meta.env.PROD ? 'production' : 'development',
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  // StrictMode retiré : il double-appelle les effets en dev, ce qui causait
  // l'envoi en double des messages chat. En production l'impact est nul.
  <App />,
)

// Enregistrement du Service Worker pour PWA + push notifications + mode hors-ligne
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[SW] registration failed:', err);
    });
  });
}
