import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ThemeName = 'rose' | 'ocean' | 'forest' | 'sunset' | 'noir' | 'nuit';

export interface Theme {
  name: ThemeName;
  label: string;
  colors: {
    primary: string;
    primaryHover: string;
    pale: string;
    soft: string;
    medium: string;
    dark: string;
    beige: string;
  };
  emoji: string;
}

export const THEMES: Theme[] = [
  { name: 'rose', label: 'Rose Amour', emoji: '🌹', colors: { primary: '#e11d48', primaryHover: '#be123c', pale: '#FDF2F8', soft: '#FCE7F3', medium: '#FBCFE8', dark: '#78350F', beige: '#FFFDF8' } },
  { name: 'ocean', label: 'Océan Profond', emoji: '🌊', colors: { primary: '#0284c7', primaryHover: '#0369a1', pale: '#f0f9ff', soft: '#e0f2fe', medium: '#bae6fd', dark: '#0c4a6e', beige: '#f8fafc' } },
  { name: 'forest', label: 'Forêt Verdoyante', emoji: '🌿', colors: { primary: '#16a34a', primaryHover: '#15803d', pale: '#f0fdf4', soft: '#dcfce7', medium: '#bbf7d0', dark: '#14532d', beige: '#f7fee7' } },
  { name: 'sunset', label: 'Coucher de Soleil', emoji: '🌅', colors: { primary: '#ea580c', primaryHover: '#c2410c', pale: '#fff7ed', soft: '#ffedd5', medium: '#fed7aa', dark: '#7c2d12', beige: '#fffbeb' } },
  { name: 'noir', label: 'Noir Élégant', emoji: '🖤', colors: { primary: '#1f2937', primaryHover: '#111827', pale: '#f9fafb', soft: '#f3f4f6', medium: '#e5e7eb', dark: '#1f2937', beige: '#ffffff' } },
  { name: 'nuit', label: 'Nuit Sombre', emoji: '🌙', colors: { primary: '#e11d48', primaryHover: '#be123c', pale: '#1a1a2e', soft: '#16213e', medium: '#252540', dark: '#f8fafc', beige: '#0f0f1a' } },
];

interface ThemeContextValue {
  theme: Theme;
  setTheme: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: THEMES[0], setTheme: () => {} });
const STORAGE_KEY = 'memoryline-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeName] = useState<ThemeName>('rose');
  const theme = THEMES.find(t => t.name === themeName) ?? THEMES[0];

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeName | null;
    if (saved && THEMES.find(t => t.name === saved)) setThemeName(saved);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-primary-hover', theme.colors.primaryHover);
    root.style.setProperty('--color-pale', theme.colors.pale);
    root.style.setProperty('--color-soft', theme.colors.soft);
    root.style.setProperty('--color-medium', theme.colors.medium);
    root.style.setProperty('--color-dark', theme.colors.dark);
    root.style.setProperty('--color-beige', theme.colors.beige);
    // Set data-theme on body for dark mode CSS overrides
    document.body.setAttribute('data-theme', themeName);
    localStorage.setItem(STORAGE_KEY, themeName);
  }, [theme, themeName]);

  const setTheme = (name: ThemeName) => setThemeName(name);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() { return useContext(ThemeContext); }
