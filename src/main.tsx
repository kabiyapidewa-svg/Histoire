
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n.ts'

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
