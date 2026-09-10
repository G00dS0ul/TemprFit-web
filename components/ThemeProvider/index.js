'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'temprfit-theme'; // 'system' | 'light' | 'dark'
const ThemeContext = createContext(null);

function resolveTheme(preference) {
  if (preference === 'system' || !preference) {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return preference;
}

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState('system');
  const [resolved, setResolved] = useState('dark');

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) || 'system';
    setPreference(stored);
    setResolved(resolveTheme(stored));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolved);
  }, [resolved]);

  useEffect(() => {
    if (preference !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = () => setResolved(resolveTheme('system'));
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [preference]);

  const setTheme = useCallback((next) => {
    setPreference(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    setResolved(resolveTheme(next));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolved === 'dark' ? 'light' : 'dark');
  }, [resolved, setTheme]);

  return (
    <ThemeContext.Provider value={{ preference, theme: resolved, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
