import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Lang, Strings } from './translations';
import { translations } from './translations';

const LS_KEY = 'routine-series-lang';

function detectLang(): Lang {
  const stored = localStorage.getItem(LS_KEY) as Lang | null;
  if (stored === 'en' || stored === 'ru') return stored;
  // Detect from browser
  const nav = navigator.language || (navigator as { userLanguage?: string }).userLanguage || '';
  return nav.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

interface LocaleContextValue {
  lang: Lang;
  t: Strings;
  setLang: (lang: Lang) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(LS_KEY, l);
  }, []);

  const t = translations[lang];

  return (
    <LocaleContext.Provider value={{ lang, t, setLang }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
