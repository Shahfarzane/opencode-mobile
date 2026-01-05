import type { Theme } from './types';

/**
 * Warm Sand Dark Theme
 *
 * Based on the desktop app's index.css OKLCH color definitions.
 * Features a warm, golden-sand color palette that differs from Flexoki's orange primary.
 *
 * Key differences from Flexoki Dark:
 * - Primary: #edb449 (golden sand) vs #EC8B49 (orange)
 * - Background: #151313 vs #100F0F
 * - More consistent warm undertones throughout
 */
export const warmSandDarkTheme: Theme = {
  metadata: {
    id: 'warm-sand-dark',
    name: 'Warm Sand Dark',
    description: 'A warm, golden-sand color scheme - dark variant',
    author: 'OpenChamber',
    version: '1.0.0',
    variant: 'dark',
    tags: ['dark', 'warm', 'sand', 'golden']
  },

  colors: {
    primary: {
      base: '#edb449',      // oklch(0.77 0.17 85) - golden sand
      hover: '#d9a33e',
      active: '#f5c55a',
      foreground: '#151313',
      muted: '#edb44980',
      emphasis: '#f5c55a'
    },

    surface: {
      background: '#151313',      // oklch(0.16 0.01 30)
      foreground: '#cdccc3',      // oklch(0.85 0.02 90)
      muted: '#403E3C',           // oklch(0.33 0.01 40)
      mutedForeground: '#b6b4ab', // oklch(0.75 0.02 80)
      elevated: '#1C1B1A',        // oklch(0.19 0.01 40)
      elevatedForeground: '#cdccc3',
      overlay: '#00000080',
      subtle: '#343331'           // oklch(0.29 0.01 40)
    },

    interactive: {
      border: '#393836',          // oklch(0.31 0.01 35)
      borderHover: '#4a4846',
      borderFocus: '#edb449',
      selection: '#cdccc330',
      selectionForeground: '#cdccc3',
      focus: '#edb449',
      focusRing: '#edb44950',
      cursor: '#cdccc3',
      hover: '#343331',
      active: '#403E3C'
    },

    status: {
      error: '#d98678',           // oklch(0.65 0.15 30) - warm red
      errorForeground: '#151313',
      errorBackground: '#d9867820',
      errorBorder: '#d9867850',

      warning: '#d9a33e',
      warningForeground: '#151313',
      warningBackground: '#d9a33e20',
      warningBorder: '#d9a33e50',

      success: '#81af6c',         // oklch(0.68 0.12 145) - warm green
      successForeground: '#151313',
      successBackground: '#81af6c20',
      successBorder: '#81af6c50',

      info: '#5aa9d9',            // oklch(0.68 0.12 230) - soft blue
      infoForeground: '#151313',
      infoBackground: '#5aa9d920',
      infoBorder: '#5aa9d950'
    },

    syntax: {
      base: {
        background: '#1C1B1A',
        foreground: '#cdccc3',
        comment: '#6b6964',
        keyword: '#5aa9d9',       // Soft blue
        string: '#6cacd6',
        number: '#d39373',
        function: '#d29470',      // Warm orange
        variable: '#cdccc3',
        type: '#c2974d',          // Golden
        operator: '#d98678'       // Warm red
      },

      tokens: {
        commentDoc: '#575653',
        stringEscape: '#cdccc3',
        keywordImport: '#d98678',
        storageModifier: '#5aa9d9',
        functionCall: '#d29470',
        method: '#81af6c',
        variableProperty: '#5aa9d9',
        variableOther: '#81af6c',
        variableGlobal: '#ce5d97',
        variableLocal: '#282726',
        parameter: '#cdccc3',
        constant: '#cdccc3',
        class: '#d29470',
        className: '#d29470',
        interface: '#c2974d',
        struct: '#d29470',
        enum: '#d29470',
        typeParameter: '#d29470',
        namespace: '#c2974d',
        module: '#d98678',
        tag: '#5aa9d9',
        jsxTag: '#ce5d97',
        tagAttribute: '#c2974d',
        tagAttributeValue: '#6cacd6',
        boolean: '#c2974d',
        decorator: '#c2974d',
        label: '#ce5d97',
        punctuation: '#6b6964',
        macro: '#5aa9d9',
        preprocessor: '#ce5d97',
        regex: '#6cacd6',
        url: '#5aa9d9',
        key: '#d29470',
        exception: '#ce5d97'
      },

      highlights: {
        diffAdded: '#81af6c',
        diffAddedBackground: '#81af6c20',
        diffRemoved: '#d98678',
        diffRemovedBackground: '#d9867820',
        diffModified: '#5aa9d9',
        diffModifiedBackground: '#5aa9d920',
        lineNumber: '#403E3C',
        lineNumberActive: '#cdccc3'
      }
    },

    markdown: {
      heading1: '#c2974d',        // Golden
      heading2: '#d29470',        // Warm orange
      heading3: '#5aa9d9',        // Soft blue
      heading4: '#cdccc3',
      link: '#5aa9d9',
      linkHover: '#6cacd6',
      inlineCode: '#81af6c',
      inlineCodeBackground: '#1C1B1A',
      blockquote: '#b6b4ab',
      blockquoteBorder: '#393836',
      listMarker: '#c2974d99'
    },

    chat: {
      userMessage: '#cdccc3',
      userMessageBackground: '#282726',   // oklch(0.24 0.01 40)
      assistantMessage: '#cdccc3',
      assistantMessageBackground: '#151313',
      timestamp: '#6b6964',
      divider: '#393836'
    },

    tools: {
      background: '#1C1B1A50',
      border: '#39383680',
      headerHover: '#39383650',
      icon: '#b6b4ab',
      title: '#cdccc3',
      description: '#b6b4ab',

      edit: {
        added: '#81af6c',
        addedBackground: '#81af6c25',
        removed: '#d98678',
        removedBackground: '#d9867825',
        lineNumber: '#403E3C'
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
