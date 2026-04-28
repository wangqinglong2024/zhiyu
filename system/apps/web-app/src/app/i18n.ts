import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { RESOURCES } from '@zhiyu/shared-i18n';
import { DEFAULT_LOCALE, LOCALES, type Locale } from '@zhiyu/shared-config';

function detect(): Locale {
  try {
    const saved = localStorage.getItem('zhiyu-locale') as Locale | null;
    if (saved && LOCALES.includes(saved)) return saved;
  } catch { /* noop */ }
  const nav = (navigator.language || '').toLowerCase();
  if (nav.startsWith('zh')) return 'zh';
  if (nav.startsWith('vi')) return 'vi';
  if (nav.startsWith('th')) return 'th';
  if (nav.startsWith('id')) return 'id';
  if (nav.startsWith('en')) return 'en';
  return DEFAULT_LOCALE;
}

void i18n.use(initReactI18next).init({
  resources: Object.fromEntries(LOCALES.map((l) => [l, { translation: RESOURCES[l] }])),
  lng: detect(),
  fallbackLng: 'zh',
  interpolation: { escapeValue: false },
});

export function setLocale(l: Locale) {
  void i18n.changeLanguage(l);
  try { localStorage.setItem('zhiyu-locale', l); } catch { /* noop */ }
}
export default i18n;
