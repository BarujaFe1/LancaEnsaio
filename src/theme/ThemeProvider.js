import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

const KEY = 'maestro_theme_mode'; // 'system' | 'dark' | 'light'

const light = {
  mode: 'light',
  colors: {
    bg: '#f5f7fb',
    card: '#ffffff',
    border: '#e5e7eb',
    text: '#0f172a',
    textMuted: '#475569',
    inputBg: '#ffffff',
    inputText: '#0f172a',
    placeholder: '#6b7280',
    accent: '#1d4ed8',
    danger: '#ef4444',
    chipBg: '#e0e7ff',
    chipText: '#1e3a8a'
  }
};

const dark = {
  mode: 'dark',
  colors: {
    bg: '#0b1220',
    card: '#111827',
    border: '#1f2937',
    text: '#e5e7eb',
    textMuted: '#94a3b8',
    inputBg: '#0f172a',
    inputText: '#e5e7eb',
    placeholder: '#94a3b8',
    accent: '#3b82f6',
    danger: '#f87171',
    chipBg: '#1f2a44',
    chipText: '#c7d2fe'
  }
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const system = useColorScheme(); // 'light' | 'dark'
  const [mode, setMode] = useState('system'); // default

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (v === 'dark' || v === 'light' || v === 'system') setMode(v);
    });
  }, []);

  const theme = useMemo(() => {
    const effective = mode === 'system' ? system : mode;
    return effective === 'dark' ? dark : light;
  }, [mode, system]);

  const value = useMemo(() => ({
    mode,
    setMode: async (m) => {
      setMode(m);
      await AsyncStorage.setItem(KEY, m);
    },
    theme
  }), [mode, theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  return ctx;
}
