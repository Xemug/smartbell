import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import esMX from './locales/es-MX.json';

export const defaultLanguage = 'es-MX';

void i18n.use(initReactI18next).init({
  resources: { 'es-MX': { translation: esMX }, en: { translation: en } },
  lng: defaultLanguage,
  fallbackLng: defaultLanguage,
  interpolation: { escapeValue: false },
});

export default i18n;
