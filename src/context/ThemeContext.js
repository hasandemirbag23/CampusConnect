import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { THEMES, STORAGE_KEYS } from '../constants';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTheme() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.APP_THEME);
        if (stored === 'dark' || stored === 'light') {
          setTheme(stored);
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadTheme();
  }, []);

  const toggleTheme = useCallback(async () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    await AsyncStorage.setItem(STORAGE_KEYS.APP_THEME, next);
  }, [theme]);

  const resetTheme = useCallback(async () => {
    setTheme('light');
    await AsyncStorage.removeItem(STORAGE_KEYS.APP_THEME);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      colors: THEMES[theme],
      isDark: theme === 'dark',
      isLoading,
      toggleTheme,
      resetTheme,
    }),
    [theme, isLoading, toggleTheme, resetTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme ThemeProvider icinde kullanilmali');
  }
  return context;
}
