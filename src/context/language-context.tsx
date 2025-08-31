
"use client";

import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import en from '@/locales/en.json';
import my from '@/locales/my.json';

type Translations = { [key: string]: string | Translations };

const translations: { [key: string]: Translations } = {
  en,
  my,
};

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
  t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    const storedLanguage = localStorage.getItem('language');
    if (storedLanguage && translations[storedLanguage]) {
      setLanguageState(storedLanguage);
    }
  }, []);

  const setLanguage = (lang: string) => {
    if (translations[lang]) {
      setLanguageState(lang);
      localStorage.setItem('language', lang);
    }
  };

  const t = useCallback((key: string): string => {
    const keys = key.split('.');
    let result: string | Translations | undefined = translations[language];
    
    for (const k of keys) {
      if (typeof result === 'object' && result !== null && k in result) {
        result = result[k];
      } else {
        // Fallback to English if key not found in current language
        result = translations['en'];
         for (const k_en of keys) {
            if (typeof result === 'object' && result !== null && k_en in result) {
                result = result[k_en];
            } else {
                return key; // Return the key itself if not found in English either
            }
         }
         break;
      }
    }
    
    return typeof result === 'string' ? result : key;
  }, [language]);


  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useTranslation must be used within a LanguageProvider');
    }
    return context;
};
