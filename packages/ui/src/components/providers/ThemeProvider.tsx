import React from 'react';
import { useUIStore } from '@/stores/useUIStore';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { theme, applyTheme, fontSize, applyTypography, padding, applyPadding } = useUIStore();

  React.useEffect(() => {

    applyTheme();
    applyTypography();
    applyPadding();
  }, [theme, applyTheme, fontSize, applyTypography, padding, applyPadding]);

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