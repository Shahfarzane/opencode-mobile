import React, { useMemo } from 'react';
import { WorkerPoolContextProvider, useWorkerPool } from '@pierre/diffs/react';
import type { SupportedLanguages } from '@pierre/diffs';

import { useOptionalThemeSystem } from './useThemeSystem';
import { workerFactory } from '@/lib/diff/workerFactory';

// Only preload the most common languages - others load on demand
const PRELOAD_LANGS: SupportedLanguages[] = [
  'typescript',
  'javascript',
  'tsx',
  'json',
];

interface DiffWorkerProviderProps {
  children: React.ReactNode;
}

export const DiffWorkerProvider: React.FC<DiffWorkerProviderProps> = ({ children }) => {
  const themeSystem = useOptionalThemeSystem();
  const isDark = themeSystem?.currentTheme?.metadata?.variant === 'dark';

  const highlighterOptions = useMemo(() => ({
    theme: {
      dark: 'vitesse-dark' as const,
      light: 'vitesse-light' as const,
    },
    themeType: isDark ? ('dark' as const) : ('light' as const),
    langs: PRELOAD_LANGS,
  }), [isDark]);

  return (
    <WorkerPoolContextProvider
      poolOptions={{
        workerFactory,
        poolSize: 4,
        totalASTLRUCacheSize: 200,
      }}
      highlighterOptions={highlighterOptions}
    >
      {children}
    </WorkerPoolContextProvider>
  );
};

export { useWorkerPool };
