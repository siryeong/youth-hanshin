'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type LoadingContextType = {
  isLoading: boolean;
  loadingMessage: string | null;
  setIsLoading: (loading: boolean) => void;
  setLoadingWithMessage: (loading: boolean, message?: string | null) => void;
};

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);

  const setLoadingWithMessage = useCallback((loading: boolean, message: string | null = null) => {
    setIsLoading(loading);
    setLoadingMessage(loading ? message : null);
  }, []);

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        loadingMessage,
        setIsLoading,
        setLoadingWithMessage,
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}
