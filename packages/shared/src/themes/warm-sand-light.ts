import type { Theme } from './types';

/**
 * Warm Sand Light Theme
 *
 * Based on the desktop app's index.css OKLCH color definitions.
 * Features a warm, sandy paper-like background with orange accents.
 *
 * Key differences from Flexoki Light:
 * - Primary: #d97d2f (warm orange) vs #EC8B49 (brighter orange)
 * - Background: #f8f7f3 (warm sand) vs #FFFCF0 (cream)
 * - More muted, paper-like aesthetic
 */
export const warmSandLightTheme: Theme = {
  metadata: {
    id: 'warm-sand-light',
    name: 'Warm Sand Light',
    description: 'A warm, sandy paper-like color scheme - light variant',
    author: 'OpenChamber',
    version: '1.0.0',
    variant: 'light',
    tags: ['light', 'warm', 'sand', 'paper']
  },

  colors: {
    primary: {
      base: '#d97d2f',      // oklch(0.65 0.2 55) - warm orange
      hover: '#c46c25',
      active: '#e08d3f',
      foreground: '#fdfcf9',
      muted: '#d97d2f80',
      emphasis: '#e08d3f'
    },

    surface: {
      background: '#f8f7f3',      // oklch(0.97 0.02 85) - warm sand
      foreground: '#3d3833',      // oklch(0.25 0.02 40) - dark warm text
      muted: '#e8e5dd',           // oklch(0.92 0.02 80) - light sand
      mutedForeground: '#6d6860', // oklch(0.45 0.02 50) - medium warm
      elevated: '#fdfcf9',        // oklch(0.99 0.01 90) - bright sand
      elevatedForeground: '#3d3833',
      overlay: '#3d383320',
      subtle: '#d4cfc4'           // oklch(0.85 0.02 70)
    },

    interactive: {
      border: '#d4cfc4',          // oklch(0.85 0.02 70) - warm border
      borderHover: '#c5c0b6',
      borderFocus: '#d97d2f',
      selection: '#3d383344',
      selectionForeground: '#3d3833',
      focus: '#d97d2f',
      focusRing: '#d97d2f40',
      cursor: '#3d3833',
      hover: '#e8e5dd',
      active: '#d4cfc4'
    },

    status: {
      error: '#c54a3a',           // oklch(0.55 0.25 25) - warm red
      errorForeground: '#fdfcf9',
      errorBackground: '#c54a3a20',
      errorBorder: '#c54a3a50',

      warning: '#c46c25',
      warningForeground: '#fdfcf9',
      warningBackground: '#c46c2520',
      warningBorder: '#c46c2550',

      success: '#5a8a35',         // Warm green
      successForeground: '#fdfcf9',
      successBackground: '#5a8a3520',
      successBorder: '#5a8a3550',

      info: '#3a7ab8',            // Warm blue
      infoForeground: '#fdfcf9',
      infoBackground: '#3a7ab820',
      infoBorder: '#3a7ab850'
    },

    syntax: {
      base: {
        background: '#e8e5dd',
        foreground: '#3d3833',
        comment: '#8a857c',
        keyword: '#3a7ab8',       // Warm blue
        string: '#2a7a6d',
        number: '#8b6bc0',
        function: '#c46c25',      // Warm orange
        variable: '#3d3833',
        type: '#a88520',          // Golden
        operator: '#c54a3a'       // Warm red
      },

      tokens: {
        commentDoc: '#a5a099',
        stringEscape: '#3d3833',
        keywordImport: '#c54a3a',
        storageModifier: '#3a7ab8',
        functionCall: '#c46c25',
        method: '#5a8a35',
        variableProperty: '#3a7ab8',
        variableOther: '#5a8a35',
        variableGlobal: '#a04a70',
        variableLocal: '#fdfcf9',
        parameter: '#3d3833',
        constant: '#3d3833',
        class: '#c46c25',
        className: '#c46c25',
        interface: '#a88520',
        struct: '#c46c25',
        enum: '#c46c25',
        typeParameter: '#c46c25',
        namespace: '#a88520',
        module: '#c54a3a',
        tag: '#3a7ab8',
        jsxTag: '#a04a70',
        tagAttribute: '#a88520',
        tagAttributeValue: '#2a7a6d',
        boolean: '#a88520',
        decorator: '#a88520',
        label: '#a04a70',
        punctuation: '#8a857c',
        macro: '#3a7ab8',
        preprocessor: '#a04a70',
        regex: '#2a7a6d',
        url: '#3a7ab8',
        key: '#c46c25',
        exception: '#a04a70'
      },

      highlights: {
        diffAdded: '#5a8a35',
        diffAddedBackground: '#5a8a3520',
        diffRemoved: '#c54a3a',
        diffRemovedBackground: '#c54a3a20',
        diffModified: '#3a7ab8',
        diffModifiedBackground: '#3a7ab820',
        lineNumber: '#c5c0b6',
        lineNumberActive: '#3d3833'
      }
    },

    markdown: {
      heading1: '#a88520',        // Golden
      heading2: '#c46c25',        // Warm orange
      heading3: '#3a7ab8',        // Warm blue
      heading4: '#3d3833',
      link: '#3a7ab8',
      linkHover: '#4a8ac8',
      inlineCode: '#2a7a6d',
      inlineCodeBackground: '#e8e5dd',
      blockquote: '#6d6860',
      blockquoteBorder: '#d4cfc4',
      listMarker: '#a8852099'
    },

    chat: {
      userMessage: '#3d3833',
      userMessageBackground: '#e8e5dd',
      assistantMessage: '#3d3833',
      assistantMessageBackground: '#f8f7f3',
      timestamp: '#8a857c',
      divider: '#d4cfc4'
    },

    tools: {
      background: '#e8e5dd50',
      border: '#d4cfc480',
      headerHover: '#d4cfc450',
      icon: '#6d6860',
      title: '#3d3833',
      description: '#6d6860',

      edit: {
        added: '#5a8a35',
        addedBackground: '#5a8a3525',
        removed: '#c54a3a',
        removedBackground: '#c54a3a25',
        lineNumber: '#c5c0b6'
      }
    }
  },

  config: {
    fonts: {
      sans: '"IBM Plex Mono", monospace',
      mono: '"IBM Plex Mono", monospace',
      heading: '"IBM Plex Mono", monospace'
    },

    radius: {
      none: '0',
      sm: '0.125rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      full: '9999px'
    },

    transitions: {
      fast: '150ms ease',
      normal: '250ms ease',
      slow: '350ms ease'
    }
  }
};
