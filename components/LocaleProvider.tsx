'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Locale, setActiveLocale, t } from '@/lib/utils/localize';

const STORAGE_KEY = 'siteLocale';

type LocaleContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: string, fallback?: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  children,
  initialLocale = 'en',
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    setActiveLocale(locale);
  }, [locale]);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(STORAGE_KEY, next);
    document.cookie = `siteLocale=${next}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    setActiveLocale(next);
  };

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: (key: string, fallback?: string) => t(key, locale, fallback),
    }),
    [locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return ctx;
}
