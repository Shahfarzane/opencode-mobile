import React from 'react';
import { useUIStore } from '@/stores/useUIStore';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { theme, applyTheme } = useUIStore();

  React.useEffect(() => {

    applyTheme();
  }, [theme, applyTheme]);

  React.useEffect(() => {

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme, applyTheme]);

  return <>{children}</>;
};