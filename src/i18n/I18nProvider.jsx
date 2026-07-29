import React, { createContext, useContext, useMemo, useState } from 'react';
import { productMessages, PRODUCT_LOCALES } from '@/i18n/productMessages';

const STORAGE_KEY = 'ludots.product-locale';
const I18nContext = createContext(null);

export default function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(() => localStorage.getItem(STORAGE_KEY) || 'zh-CN');
  const setLocale = (next) => {
    if (!PRODUCT_LOCALES.includes(next)) return;
    localStorage.setItem(STORAGE_KEY, next);
    setLocaleState(next);
  };
  const value = useMemo(() => ({
    locale,
    setLocale,
    t: (key, fallback) => productMessages[locale]?.[key] ?? productMessages['zh-CN']?.[key] ?? fallback ?? key,
  }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);