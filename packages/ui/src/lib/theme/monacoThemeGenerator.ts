import type { Theme } from '@/types/theme';

interface MonacoTokenRule {
  token: string;
  foreground?: string;
  fontStyle?: string;
}

interface MonacoThemeData {
  base: 'vs' | 'vs-dark';
  inherit: boolean;
  rules: MonacoTokenRule[];
  colors: Record<string, string>;
}

type Monaco = {
  editor: {
    defineTheme: (themeName: string, themeData: MonacoThemeData) => void;
  };
};

const MONACO_LIGHT_THEME_ID = 'openchamber-flexoki-light';
const MONACO_DARK_THEME_ID = 'openchamber-flexoki-dark';

let lastRegisteredThemeId: string | null = null;

const getMonacoFromGlobal = (): Monaco | null => {
  if (typeof window === 'undefined') return null;
  const anyWindow = window as typeof window & { monaco?: Monaco };
  if (anyWindow.monaco?.editor?.defineTheme) return anyWindow.monaco;
  return null;
};

const flexokiDarkTheme: MonacoThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [

    { token: '', foreground: 'CECDC3' },
    { token: 'source', foreground: 'CECDC3' },

    { token: 'comment', foreground: '878580' },
    { token: 'comment.block', foreground: '878580' },
    { token: 'comment.line', foreground: '878580' },
    { token: 'comment.block.documentation', foreground: '575653' },

    { token: 'string', foreground: '3AA99F' },
    { token: 'string.quoted', foreground: '3AA99F' },
    { token: 'string.template', foreground: '3AA99F' },
    { token: 'string.regexp', foreground: '3AA99F' },

    { token: 'string.escape', foreground: 'CECDC3' },
    { token: 'constant.character.escape', foreground: 'CECDC3' },

    { token: 'number', foreground: '8B7EC8' },
    { token: 'number.hex', foreground: '8B7EC8' },
    { token: 'number.float', foreground: '8B7EC8' },
    { token: 'constant.numeric', foreground: '8B7EC8' },

    { token: 'constant.language', foreground: 'D0A215' },
    { token: 'constant.language.boolean', foreground: 'D0A215' },
    { token: 'constant.language.null', foreground: 'D0A215' },

    { token: 'keyword', foreground: '4385BE' },
    { token: 'keyword.control', foreground: '4385BE' },
    { token: 'keyword.other', foreground: '4385BE' },

    { token: 'keyword.control.import', foreground: 'D14D41' },
    { token: 'keyword.control.from', foreground: 'D14D41' },
    { token: 'keyword.control.export', foreground: 'D14D41' },

    { token: 'keyword.control.exception', foreground: 'CE5D97' },
    { token: 'keyword.control.trycatch', foreground: 'CE5D97' },

    { token: 'keyword.operator', foreground: 'D14D41' },
    { token: 'operator', foreground: 'D14D41' },

    { token: 'storage', foreground: '4385BE' },
    { token: 'storage.type', foreground: '4385BE' },
    { token: 'storage.modifier', foreground: '4385BE' },

    { token: 'entity.name.function', foreground: 'DA702C', fontStyle: 'bold' },
    { token: 'support.function', foreground: 'DA702C', fontStyle: 'bold' },
    { token: 'meta.function-call', foreground: 'DA702C' },

    { token: 'entity.name.function.method', foreground: '879A39' },

    { token: 'entity.name.class', foreground: 'DA702C' },
    { token: 'entity.name.type.class', foreground: 'DA702C' },
    { token: 'support.class', foreground: 'DA702C' },

    { token: 'entity.name.type', foreground: 'D0A215' },
    { token: 'entity.name.type.interface', foreground: 'D0A215' },
    { token: 'support.type', foreground: 'D0A215' },

    { token: 'entity.name.type.struct', foreground: 'DA702C' },
    { token: 'entity.name.type.enum', foreground: 'DA702C' },

    { token: 'entity.name.type.parameter', foreground: 'DA702C' },

    { token: 'variable', foreground: 'CECDC3' },
    { token: 'variable.other', foreground: 'CECDC3' },
    { token: 'variable.parameter', foreground: 'CECDC3' },

    { token: 'variable.other.object', foreground: '879A39' },
    { token: 'variable.other.readwrite.alias', foreground: '879A39' },

    { token: 'variable.language', foreground: 'CE5D97' },
    { token: 'variable.language.this', foreground: 'CE5D97' },
    { token: 'variable.language.super', foreground: 'CE5D97' },

    { token: 'variable.other.property', foreground: '4385BE' },
    { token: 'support.variable.property', foreground: '4385BE' },

    { token: 'variable.other.constant', foreground: 'CECDC3' },

    { token: 'meta.object-literal.key', foreground: 'DA702C' },
    { token: 'support.type.property-name', foreground: 'DA702C' },

    { token: 'entity.name.tag', foreground: '4385BE' },
    { token: 'tag', foreground: '4385BE' },

    { token: 'support.class.component', foreground: 'CE5D97' },

    { token: 'entity.other.attribute-name', foreground: 'D0A215' },

    { token: 'entity.name.namespace', foreground: 'D0A215' },

    { token: 'entity.name.module', foreground: 'D14D41' },

    { token: 'meta.decorator', foreground: 'D0A215' },
    { token: 'entity.name.function.decorator', foreground: 'D0A215' },

    { token: 'entity.name.label', foreground: 'CE5D97' },

    { token: 'meta.preprocessor', foreground: 'CE5D97' },
    { token: 'entity.name.function.preprocessor', foreground: '4385BE' },

    { token: 'punctuation', foreground: '878580' },
    { token: 'delimiter', foreground: '878580' },
    { token: 'delimiter.bracket', foreground: '878580' },

    { token: 'markup.heading', foreground: 'D0A215' },
    { token: 'markup.bold', foreground: 'D0A215', fontStyle: 'bold' },
    { token: 'markup.italic', foreground: '3AA99F', fontStyle: 'italic' },
    { token: 'markup.underline.link', foreground: '4385BE' },
    { token: 'markup.inline.raw', foreground: '3AA99F' },

    { token: 'invalid', foreground: 'D14D41' },
    { token: 'invalid.illegal', foreground: 'D14D41' },

    { token: 'string.key.json', foreground: 'DA702C' },
    { token: 'string.value.json', foreground: '3AA99F' },

    { token: 'support.type.property-name.css', foreground: 'CECDC3' },
    { token: 'support.constant.property-value.css', foreground: '3AA99F' },

    { token: 'type', foreground: 'D0A215' },
    { token: 'type.identifier', foreground: 'D0A215' },
    { token: 'identifier', foreground: 'CECDC3' },
  ],
  colors: {

    'editor.background': '#100F0F',
    'editor.foreground': '#CECDC3',
    'editor.lineHighlightBackground': '#1C1B1A',
    'editor.selectionBackground': '#CECDC333',
    'editor.selectionHighlightBackground': '#CECDC333',
    'editor.inactiveSelectionBackground': '#282726',
    'editor.findMatchBackground': '#AD8301',
    'editor.findMatchHighlightBackground': '#AD8301cc',
    'editor.hoverHighlightBackground': '#343331',
    'editor.rangeHighlightBackground': '#403E3C',
    'editorCursor.foreground': '#CECDC3',

    'editorLineNumber.foreground': '#403E3C',
    'editorLineNumber.activeForeground': '#CECDC3',

    'editorGutter.background': '#100F0F',
    'editorGutter.modifiedBackground': '#3AA99F',
    'editorGutter.addedBackground': '#879A39',
    'editorGutter.deletedBackground': '#D14D41',

    'diffEditor.insertedTextBackground': '#66800B25',
    'diffEditor.removedTextBackground': '#AF302925',
    'diffEditor.insertedLineBackground': '#66800B15',
    'diffEditor.removedLineBackground': '#AF302915',
    'diffEditor.insertedTextBorder': '#00000000',
    'diffEditor.removedTextBorder': '#00000000',

    'editorBracketMatch.background': '#282726',
    'editorBracketMatch.border': '#343331',

    'editorWhitespace.foreground': '#403E3C',
    'editorIndentGuide.background1': '#343331',
    'editorIndentGuide.activeBackground1': '#575653',

    'editorWidget.background': '#1C1B1A',
    'editorWidget.border': '#343331',
    'editorSuggestWidget.background': '#100F0F',
    'editorSuggestWidget.border': '#343331',
    'editorSuggestWidget.foreground': '#CECDC3',
    'editorSuggestWidget.selectedBackground': '#343331',
    'editorHoverWidget.background': '#282726',
    'editorHoverWidget.border': '#343331',

    'editorInlayHint.foreground': '#878580',
    'editorInlayHint.background': '#343331',

    'editorError.foreground': '#D14D41',
    'editorWarning.foreground': '#DA702C',
    'editorInfo.foreground': '#4385BE',

    'input.background': '#1C1B1A',
    'input.foreground': '#CECDC3',
    'input.border': '#343331',
    'input.placeholderForeground': '#878580',

    'dropdown.background': '#1C1B1A',
    'dropdown.foreground': '#CECDC3',
    'dropdown.border': '#343331',
    'dropdown.listBackground': '#100F0F',

    'focusBorder': '#343331',

    'scrollbarSlider.background': '#34333180',
    'scrollbarSlider.hoverBackground': '#403E3C',
    'scrollbarSlider.activeBackground': '#575653',
  },
};

const flexokiLightTheme: MonacoThemeData = {
  base: 'vs',
  inherit: true,
  rules: [

    { token: '', foreground: '100F0F' },
    { token: 'source', foreground: '100F0F' },

    { token: 'comment', foreground: '6F6E69' },
    { token: 'comment.block', foreground: '6F6E69' },
    { token: 'comment.line', foreground: '6F6E69' },
    { token: 'comment.block.documentation', foreground: 'B7B5AC' },

    { token: 'string', foreground: '24837B' },
    { token: 'string.quoted', foreground: '24837B' },
    { token: 'string.template', foreground: '24837B' },
    { token: 'string.regexp', foreground: '24837B' },

    { token: 'string.escape', foreground: '100F0F' },
    { token: 'constant.character.escape', foreground: '100F0F' },

    { token: 'number', foreground: '5E409D' },
    { token: 'number.hex', foreground: '5E409D' },
    { token: 'number.float', foreground: '5E409D' },
    { token: 'constant.numeric', foreground: '5E409D' },

    { token: 'constant.language', foreground: 'AD8301' },
    { token: 'constant.language.boolean', foreground: 'AD8301' },
    { token: 'constant.language.null', foreground: 'AD8301' },

    { token: 'keyword', foreground: '205EA6' },
    { token: 'keyword.control', foreground: '205EA6' },
    { token: 'keyword.other', foreground: '205EA6' },

    { token: 'keyword.control.import', foreground: 'AF3029' },
    { token: 'keyword.control.from', foreground: 'AF3029' },
    { token: 'keyword.control.export', foreground: 'AF3029' },

    { token: 'keyword.control.exception', foreground: 'A02F6F' },
    { token: 'keyword.control.trycatch', foreground: 'A02F6F' },

    { token: 'keyword.operator', foreground: 'AF3029' },
    { token: 'operator', foreground: 'AF3029' },

    { token: 'storage', foreground: '205EA6' },
    { token: 'storage.type', foreground: '205EA6' },
    { token: 'storage.modifier', foreground: '205EA6' },

    { token: 'entity.name.function', foreground: 'BC5215', fontStyle: 'bold' },
    { token: 'support.function', foreground: 'BC5215', fontStyle: 'bold' },
    { token: 'meta.function-call', foreground: 'BC5215' },

    { token: 'entity.name.function.method', foreground: '66800B' },

    { token: 'entity.name.class', foreground: 'BC5215' },
    { token: 'entity.name.type.class', foreground: 'BC5215' },
    { token: 'support.class', foreground: 'BC5215' },

    { token: 'entity.name.type', foreground: 'AD8301' },
    { token: 'entity.name.type.interface', foreground: 'AD8301' },
    { token: 'support.type', foreground: 'AD8301' },

    { token: 'entity.name.type.struct', foreground: 'BC5215' },
    { token: 'entity.name.type.enum', foreground: 'BC5215' },

    { token: 'entity.name.type.parameter', foreground: 'BC5215' },

    { token: 'variable', foreground: '100F0F' },
    { token: 'variable.other', foreground: '100F0F' },
    { token: 'variable.parameter', foreground: '100F0F' },

    { token: 'variable.other.object', foreground: '66800B' },
    { token: 'variable.other.readwrite.alias', foreground: '66800B' },

    { token: 'variable.language', foreground: 'A02F6F' },
    { token: 'variable.language.this', foreground: 'A02F6F' },
    { token: 'variable.language.super', foreground: 'A02F6F' },

    { token: 'variable.other.property', foreground: '205EA6' },
    { token: 'support.variable.property', foreground: '205EA6' },

    { token: 'variable.other.constant', foreground: '100F0F' },

    { token: 'meta.object-literal.key', foreground: 'BC5215' },
    { token: 'support.type.property-name', foreground: 'BC5215' },

    { token: 'entity.name.tag', foreground: '205EA6' },
    { token: 'tag', foreground: '205EA6' },

    { token: 'support.class.component', foreground: 'A02F6F' },

    { token: 'entity.other.attribute-name', foreground: 'AD8301' },

    { token: 'entity.name.namespace', foreground: 'AD8301' },

    { token: 'entity.name.module', foreground: 'AF3029' },

    { token: 'meta.decorator', foreground: 'AD8301' },
    { token: 'entity.name.function.decorator', foreground: 'AD8301' },

    { token: 'entity.name.label', foreground: 'A02F6F' },

    { token: 'meta.preprocessor', foreground: 'A02F6F' },
    { token: 'entity.name.function.preprocessor', foreground: '205EA6' },

    { token: 'punctuation', foreground: '6F6E69' },
    { token: 'delimiter', foreground: '6F6E69' },
    { token: 'delimiter.bracket', foreground: '6F6E69' },

    { token: 'markup.heading', foreground: 'AD8301' },
    { token: 'markup.bold', foreground: 'AD8301', fontStyle: 'bold' },
    { token: 'markup.italic', foreground: '24837B', fontStyle: 'italic' },
    { token: 'markup.underline.link', foreground: '205EA6' },
    { token: 'markup.inline.raw', foreground: '24837B' },

    { token: 'invalid', foreground: 'AF3029' },
    { token: 'invalid.illegal', foreground: 'AF3029' },

    { token: 'string.key.json', foreground: 'BC5215' },
    { token: 'string.value.json', foreground: '24837B' },

    { token: 'support.type.property-name.css', foreground: '100F0F' },
    { token: 'support.constant.property-value.css', foreground: '24837B' },

    { token: 'type', foreground: 'AD8301' },
    { token: 'type.identifier', foreground: 'AD8301' },
    { token: 'identifier', foreground: '100F0F' },
  ],
  colors: {

    'editor.background': '#FFFCF0',
    'editor.foreground': '#100F0F',
    'editor.lineHighlightBackground': '#F2F0E5',
    'editor.selectionBackground': '#100F0F44',
    'editor.selectionHighlightBackground': '#100F0F44',
    'editor.inactiveSelectionBackground': '#E6E4D9',
    'editor.findMatchBackground': '#D0A215',
    'editor.findMatchHighlightBackground': '#D0A215cc',
    'editor.hoverHighlightBackground': '#DAD8CE',
    'editor.rangeHighlightBackground': '#CECDC3',
    'editorCursor.foreground': '#100F0F',

    'editorLineNumber.foreground': '#CECDC3',
    'editorLineNumber.activeForeground': '#100F0F',

    'editorGutter.background': '#FFFCF0',
    'editorGutter.modifiedBackground': '#24837B',
    'editorGutter.addedBackground': '#66800B',
    'editorGutter.deletedBackground': '#AF3029',

    'diffEditor.insertedTextBackground': '#66800B25',
    'diffEditor.removedTextBackground': '#AF302925',
    'diffEditor.insertedLineBackground': '#66800B15',
    'diffEditor.removedLineBackground': '#AF302915',
    'diffEditor.insertedTextBorder': '#00000000',
    'diffEditor.removedTextBorder': '#00000000',

    'editorBracketMatch.background': '#E6E4D9',
    'editorBracketMatch.border': '#DAD8CE',

    'editorWhitespace.foreground': '#CECDC3',
    'editorIndentGuide.background1': '#DAD8CE',
    'editorIndentGuide.activeBackground1': '#B7B5AC',

    'editorWidget.background': '#F2F0E5',
    'editorWidget.border': '#DAD8CE',
    'editorSuggestWidget.background': '#FFFCF0',
    'editorSuggestWidget.border': '#DAD8CE',
    'editorSuggestWidget.foreground': '#100F0F',
    'editorSuggestWidget.selectedBackground': '#DAD8CE',
    'editorHoverWidget.background': '#E6E4D9',
    'editorHoverWidget.border': '#DAD8CE',

    'editorInlayHint.foreground': '#6F6E69',
    'editorInlayHint.background': '#DAD8CE',

    'editorError.foreground': '#AF3029',
    'editorWarning.foreground': '#BC5215',
    'editorInfo.foreground': '#205EA6',

    'input.background': '#F2F0E5',
    'input.foreground': '#100F0F',
    'input.border': '#DAD8CE',
    'input.placeholderForeground': '#6F6E69',

    'dropdown.background': '#F2F0E5',
    'dropdown.foreground': '#100F0F',
    'dropdown.border': '#DAD8CE',
    'dropdown.listBackground': '#FFFCF0',

    'focusBorder': '#DAD8CE',

    'scrollbarSlider.background': '#DAD8CE80',
    'scrollbarSlider.hoverBackground': '#CECDC3',
    'scrollbarSlider.activeBackground': '#B7B5AC',
  },
};

export const getMonacoThemeIdForTheme = (theme: Theme): string => {
  return theme.metadata.variant === 'dark' ? MONACO_DARK_THEME_ID : MONACO_LIGHT_THEME_ID;
};

export const ensureMonacoThemeRegistered = (theme: Theme, monacoOverride?: Monaco): void => {
  const monaco = monacoOverride ?? getMonacoFromGlobal();
  if (!monaco) return;

  const themeId = getMonacoThemeIdForTheme(theme);
  if (lastRegisteredThemeId === themeId) return;

  const themeData = theme.metadata.variant === 'dark' ? flexokiDarkTheme : flexokiLightTheme;
  monaco.editor.defineTheme(themeId, themeData);

  lastRegisteredThemeId = themeId;
};
