
"use client";

import { createContext, useState, useEffect, ReactNode, useContext } from 'react';

export const OfflineContext = createContext<boolean>(false);

export const OfflineProvider = ({ children }: { children: ReactNode }) => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check initial status
    if (typeof navigator !== 'undefined') {
      setIsOffline(!navigator.onLine);
    }
    
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return (
    <OfflineContext.Provider value={isOffline}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
    return useContext(OfflineContext);
}
