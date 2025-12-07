import type { Theme } from '@/types/theme';
import { flexokiLightTheme } from './flexoki-light';
import { flexokiDarkTheme } from './flexoki-dark';

export const themes: Theme[] = [
  flexokiLightTheme,
  flexokiDarkTheme,
];

export {
  flexokiLightTheme,
  flexokiDarkTheme,
};

export function getThemeById(id: string): Theme | undefined {
  return themes.find(theme => theme.metadata.id === id);
}

export function getDefaultTheme(prefersDark: boolean): Theme {
  return prefersDark ? flexokiDarkTheme : flexokiLightTheme;
}
