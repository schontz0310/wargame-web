import { useState, useEffect } from 'react';

// Helper functions for safe localStorage access in static builds
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    // Multiple layers of protection
    if (typeof window === 'undefined') {
      return null;
    }
    
    if (typeof window.localStorage === 'undefined') {
      return null;
    }
    
    if (typeof localStorage === 'undefined') {
      return null;
    }
    
    // Check if localStorage.getItem is actually a function
    if (typeof localStorage.getItem !== 'function') {
      return null;
    }
    
    try {
      const result = localStorage.getItem(key);
      return result;
    } catch (error) {
      console.warn('Error reading from localStorage:', error);
      return null;
    }
  },
  
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') {
      return;
    }
    
    if (typeof window.localStorage === 'undefined') {
      return;
    }
    
    if (typeof localStorage === 'undefined') {
      return;
    }
    
    // Check if localStorage.setItem is actually a function
    if (typeof localStorage.setItem !== 'function') {
      return;
    }
    
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('Error writing to localStorage:', error);
    }
  },
  
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') {
      return;
    }
    
    if (typeof window.localStorage === 'undefined') {
      return;
    }
    
    if (typeof localStorage === 'undefined') {
      return;
    }
    
    // Check if localStorage.removeItem is actually a function
    if (typeof localStorage.removeItem !== 'function') {
      return;
    }
    
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Error removing from localStorage:', error);
    }
  }
};

// Hook for client-side only operations
export const useClientOnlyStorage = () => {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  return {
    isClient,
    storage: isClient ? safeLocalStorage : {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    }
  };
};
