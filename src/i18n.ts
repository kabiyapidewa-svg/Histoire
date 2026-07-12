
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
const STORAGE_KEY = 'memoryline-lang';
function detectInitialLanguage(): string {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && (saved === 'en' || saved === 'fr')) return saved;
  // Anglais par défaut (l'app est internationale)
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
