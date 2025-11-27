import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import pt from './pt.json';

const resources = {
  en: { translation: en },
  pt: { translation: pt },
};

// Detect user's preferred language
const getDefaultLanguage = (): string => {
  // 1. Check localStorage for saved preference
  const saved = localStorage.getItem('language');
  if (saved) return saved;

  // 2. Detect from browser/OS language
  const browserLang = navigator.language.split('-')[0]; // e.g., 'en-US' -> 'en'
  if (browserLang === 'pt' || browserLang === 'en') {
    return browserLang;
  }

  // 3. Fall back to English
  return 'en';
};

i18n.use(initReactI18next).init({
  resources,
  lng: getDefaultLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
