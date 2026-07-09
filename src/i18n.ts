
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationEN from './locales/en.json';
import translationFR from './locales/fr.json';

const resources = {
  en: { translation: translationEN },
  fr: { translation: translationFR },
};

// Détection de la langue :
//   1. localStorage (choix explicite de l'utilisateur)
//   2. navigator.language (langue navigateur)
//   3. fallback 'en'
const STORAGE_KEY = 'histoire-lang';
function detectInitialLanguage(): string {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && (saved === 'en' || saved === 'fr')) return saved;
  const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
  if (nav === 'fr') return 'fr';
  return 'en';
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: detectInitialLanguage(),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

// Persistance : à chaque changement de langue, on l'écrit dans localStorage
i18n.on('languageChanged', (lng) => {
  try { localStorage.setItem(STORAGE_KEY, lng); } catch { /* ignore */ }
});

export default i18n;
