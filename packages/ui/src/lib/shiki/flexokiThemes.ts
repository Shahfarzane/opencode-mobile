import flexokiDarkRawJson from './themes/flexoki-dark.json';
import flexokiLightRawJson from './themes/flexoki-light.json';

export const FLEXOKI_SHIKI_DARK_THEME_NAME = 'flexoki-dark';
export const FLEXOKI_SHIKI_LIGHT_THEME_NAME = 'flexoki-light';

type VSCodeTokenColorRule = {
  name?: string;
  scope?: string | string[];
  settings: Record<string, string | undefined>;
};

type VSCodeTextMateTheme = {
  name: string;
  type: 'dark' | 'light';
  colors?: Record<string, string>;
  tokenColors?: VSCodeTokenColorRule[];
  semanticHighlighting?: boolean;
  semanticTokenColors?: Record<string, string>;
};

type ShikiThemeRegistrationResolvedLike = VSCodeTextMateTheme & {
  settings: VSCodeTokenColorRule[];
  fg: string;
  bg: string;
};

const flexokiDarkRaw = flexokiDarkRawJson as VSCodeTextMateTheme;
const flexokiLightRaw = flexokiLightRawJson as VSCodeTextMateTheme;

function withStableStringId<T extends object>(value: T, id: string): T {
  Object.defineProperty(value, 'toString', {
    value: () => id,
    enumerable: false,
    configurable: true,
  });

  Object.defineProperty(value, Symbol.toPrimitive, {
    value: () => id,
    enumerable: false,
    configurable: true,
  });

  return value;
}

function toResolvedTheme(
  raw: VSCodeTextMateTheme,
  name: string,
  type: VSCodeTextMateTheme['type']
): ShikiThemeRegistrationResolvedLike {
  const bg = raw.colors?.['editor.background'];
  const fg = raw.colors?.['editor.foreground'];

  if (!bg || !fg) {
    throw new Error(
      `Flexoki Shiki theme "${name}" is missing editor.background/editor.foreground`
    );
  }

  const settings = raw.tokenColors ?? [];

  return {
    ...raw,
    name,
    type,
    fg,
    bg,
    settings,
  };
}

export const flexokiDarkTheme = toResolvedTheme(
  flexokiDarkRaw,
  FLEXOKI_SHIKI_DARK_THEME_NAME,
  'dark'
);

export const flexokiLightTheme = toResolvedTheme(
  flexokiLightRaw,
  FLEXOKI_SHIKI_LIGHT_THEME_NAME,
  'light'
);

withStableStringId(flexokiDarkTheme, FLEXOKI_SHIKI_DARK_THEME_NAME);
withStableStringId(flexokiLightTheme, FLEXOKI_SHIKI_LIGHT_THEME_NAME);

export const flexokiThemeNames = {
  dark: FLEXOKI_SHIKI_DARK_THEME_NAME,
  light: FLEXOKI_SHIKI_LIGHT_THEME_NAME,
} as const;

export const flexokiStreamdownThemes = [
  flexokiLightTheme,
  flexokiDarkTheme,
] as const;
