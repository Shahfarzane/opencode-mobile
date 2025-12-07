import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { DiffEditor, type DiffEditorProps, type MonacoDiffEditor } from '@monaco-editor/react';

import { useThemeSystem } from '@/contexts/useThemeSystem';
import { ensureMonacoThemeRegistered, getMonacoThemeIdForTheme } from '@/lib/theme/monacoThemeGenerator';

interface MonacoDiffViewerProps {
  original: string;
  modified: string;
  language: string;
  renderSideBySide: boolean;

  allowResponsive?: boolean;
  readOnly?: boolean;
  showLineNumbers?: boolean;
}

export const MonacoDiffViewer: React.FC<MonacoDiffViewerProps> = ({
  original,
  modified,
  language,
  renderSideBySide,
  allowResponsive = false,
  readOnly = true,
  showLineNumbers = true,
}) => {
  const { currentTheme } = useThemeSystem();
  const diffEditorRef = useRef<MonacoDiffEditor | null>(null);

  const themeId = useMemo(
    () => getMonacoThemeIdForTheme(currentTheme),
    [currentTheme],
  );

  const handleBeforeMount = useCallback<NonNullable<DiffEditorProps['beforeMount']>>(
    (monacoInstance) => {
      ensureMonacoThemeRegistered(
        currentTheme,
        monacoInstance as Parameters<typeof ensureMonacoThemeRegistered>[1],
      );
    },
    [currentTheme],
  );

  const options = useMemo(
    (): DiffEditorProps['options'] => ({
      readOnly,
      renderSideBySide,
      automaticLayout: true,
      minimap: { enabled: false },
      wordWrap: 'off',
      lineNumbers: showLineNumbers ? 'on' : 'off',
      renderIndicators: false,
      scrollBeyondLastLine: false,
      renderLineHighlight: 'none',
      selectionHighlight: false,
      occurrencesHighlight: 'off',
      roundedSelection: false,
      contextmenu: false,
      folding: false,
      glyphMargin: false,
      renderMarginRevertIcon: false,
      scrollbar: {
        vertical: 'visible',
        horizontal: 'visible',
        verticalScrollbarSize: 6,
        horizontalScrollbarSize: 6,
        useShadows: false,
      },
      hover: {
        enabled: false,
      },
      overviewRulerLanes: 1,

      useInlineViewWhenSpaceIsLimited: allowResponsive,
    }),
    [allowResponsive, readOnly, renderSideBySide, showLineNumbers],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const monaco = (window as typeof window & { monaco?: { editor: { setTheme: (id: string) => void } } }).monaco;
    if (!monaco?.editor?.setTheme) return;

    ensureMonacoThemeRegistered(currentTheme);
    monaco.editor.setTheme(themeId);
  }, [currentTheme, themeId]);

  useEffect(() => {
    const diffEditor = diffEditorRef.current;
    if (!diffEditor) return;

    const originalEditor = diffEditor.getOriginalEditor();
    const modifiedEditor = diffEditor.getModifiedEditor();

    const disablePopups = {
      hover: { enabled: false },
      quickSuggestions: false,
      parameterHints: { enabled: false },
      suggestOnTriggerCharacters: false,
    } as const;

    originalEditor.updateOptions(disablePopups);
    modifiedEditor.updateOptions(disablePopups);
  }, [themeId, readOnly, renderSideBySide]);

  useEffect(() => {
    return () => {
      const diffEditor = diffEditorRef.current;
      if (diffEditor) {
        try {
          diffEditor.dispose?.();
        } catch (error) {
          console.warn('Error disposing DiffEditor:', error);
        }
      }
      diffEditorRef.current = null;
    };
  }, []);

  if (typeof window === 'undefined') {
    return null;
  }

  return (
    <DiffEditor
      original={original}
      modified={modified}
      originalLanguage={language}
      modifiedLanguage={language}
      theme={themeId}
      options={options}
      beforeMount={handleBeforeMount}
      onMount={(diffEditor: MonacoDiffEditor) => {
        diffEditorRef.current = diffEditor;
        const original = diffEditor.getOriginalEditor();
        const modified = diffEditor.getModifiedEditor();
        const disablePopups = {
          hover: { enabled: false },
          quickSuggestions: false,
          parameterHints: { enabled: false },
          suggestOnTriggerCharacters: false,
        } as const;
        original.updateOptions(disablePopups);
        modified.updateOptions(disablePopups);
      }}
      loading={null}
      className="monaco-diff-wrapper"
    />
  );
};
