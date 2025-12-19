import { useEffect, useState, useCallback } from 'react';
import {
  checkForDesktopUpdates,
  downloadDesktopUpdate,
  restartToApplyUpdate,
  isDesktopRuntime,
  isWebRuntime,
  type UpdateInfo,
  type UpdateProgress,
} from '@/lib/desktop';

export type UpdateState = {
  checking: boolean;
  available: boolean;
  downloading: boolean;
  downloaded: boolean;
  info: UpdateInfo | null;
  progress: UpdateProgress | null;
  error: string | null;
  /** Runtime type for conditional UI rendering */
  runtimeType: 'desktop' | 'web' | 'vscode' | null;
};

export type UseUpdateCheckReturn = UpdateState & {
  checkForUpdates: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  restartToUpdate: () => Promise<void>;
  dismiss: () => void;
};

interface MockUpdateConfig {
  currentVersion?: string;
  newVersion?: string;
}

// Set window.__OPENCHAMBER_MOCK_UPDATE__ = { currentVersion: '1.0.3', newVersion: '1.0.8' } to test with real changelog
declare global {
  interface Window {
    __OPENCHAMBER_MOCK_UPDATE__?: boolean | MockUpdateConfig;
  }
}

const getMockConfig = (): MockUpdateConfig | null => {
  if (typeof window === 'undefined') return null;
  const mock = window.__OPENCHAMBER_MOCK_UPDATE__;
  if (!mock) return null;
  if (mock === true) return { currentVersion: '1.0.3', newVersion: '1.0.8' };
  return mock;
};

const createMockUpdate = (config: MockUpdateConfig): UpdateState => ({
  checking: false,
  available: true,
  downloading: false,
  downloaded: false,
  info: {
    available: true,
    version: config.newVersion ?? '99.0.0-test',
    currentVersion: config.currentVersion ?? '0.0.0',
    body: undefined,
  },
  progress: null,
  error: null,
  runtimeType: 'desktop',
});

const shouldMockUpdate = (): boolean => {
  return getMockConfig() !== null;
};

/**
 * Check for web updates via server API
 */
async function checkForWebUpdates(): Promise<UpdateInfo | null> {
  try {
    const response = await fetch('/api/openchamber/update-check', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    return {
      available: data.available ?? false,
      version: data.version,
      currentVersion: data.currentVersion ?? 'unknown',
      body: data.body,
      packageManager: data.packageManager,
      updateCommand: data.updateCommand,
    };
  } catch (error) {
    console.warn('Failed to check for web updates:', error);
    return null;
  }
}

function detectRuntimeType(): 'desktop' | 'web' | 'vscode' | null {
  if (isDesktopRuntime()) return 'desktop';
  if (isWebRuntime()) return 'web';
  // VSCode doesn't support updates through this mechanism
  return null;
}

export const useUpdateCheck = (checkOnMount = true): UseUpdateCheckReturn => {
  const [state, setState] = useState<UpdateState>({
    checking: false,
    available: false,
    downloading: false,
    downloaded: false,
    info: null,
    progress: null,
    error: null,
    runtimeType: null,
  });

  // Only check mock mode once at startup - no polling
  const [mockMode] = useState(shouldMockUpdate);
  const [mockState, setMockState] = useState<UpdateState | null>(() => {
    if (shouldMockUpdate()) {
      const config = getMockConfig();
      return config ? createMockUpdate(config) : null;
    }
    return null;
  });

  // Detect runtime type on mount
  useEffect(() => {
    const runtime = detectRuntimeType();
    setState((prev) => ({ ...prev, runtimeType: runtime }));
  }, []);

  const checkForUpdates = useCallback(async () => {
    if (mockMode) {
      const config = getMockConfig();
      if (config) {
        const mockUpdate = createMockUpdate(config);
        mockUpdate.info = {
          ...mockUpdate.info!,
          body: `## [${config.newVersion}] - 2025-01-01\n- Mock update for UI testing`,
        };
        setMockState(mockUpdate);
      }
      return;
    }

    const runtime = detectRuntimeType();
    if (!runtime) {
      return;
    }

    setState((prev) => ({ ...prev, checking: true, error: null, runtimeType: runtime }));

    try {
      let info: UpdateInfo | null = null;

      if (runtime === 'desktop') {
        info = await checkForDesktopUpdates();
      } else if (runtime === 'web') {
        info = await checkForWebUpdates();
      }

      setState((prev) => ({
        ...prev,
        checking: false,
        available: info?.available ?? false,
        info,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        checking: false,
        error: error instanceof Error ? error.message : 'Failed to check for updates',
      }));
    }
  }, [mockMode]);

  const downloadUpdate = useCallback(async () => {
    if (mockMode) {
      setMockState((prev) => prev ? { ...prev, downloading: true } : prev);
      let progress = 0;
      const interval = setInterval(() => {
        progress += 20;
        setMockState((prev) => prev ? {
          ...prev,
          progress: { downloaded: progress * 1000, total: 100000 }
        } : prev);
        if (progress >= 100) {
          clearInterval(interval);
          setMockState((prev) => prev ? {
            ...prev,
            downloading: false,
            downloaded: true,
            progress: null,
          } : prev);
        }
      }, 500);
      return;
    }

    // For web runtime, there's no download - user runs CLI command
    // This is only applicable to desktop
    if (!isDesktopRuntime() || !state.available) {
      return;
    }

    setState((prev) => ({ ...prev, downloading: true, error: null, progress: null }));

    try {
      await downloadDesktopUpdate((progress) => {
        setState((prev) => ({ ...prev, progress }));
      });
      setState((prev) => ({ ...prev, downloading: false, downloaded: true }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        downloading: false,
        error: error instanceof Error ? error.message : 'Failed to download update',
      }));
    }
  }, [mockMode, state.available]);

  const restartToUpdate = useCallback(async () => {
    if (mockMode) {
      return;
    }

    // Only applicable to desktop
    if (!isDesktopRuntime() || !state.downloaded) {
      return;
    }

    try {
      await restartToApplyUpdate();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to restart',
      }));
    }
  }, [mockMode, state.downloaded]);

  const dismiss = useCallback(() => {
    if (mockMode) {
      setMockState(null);
      return;
    }
    setState((prev) => ({ ...prev, available: false, downloaded: false, info: null }));
  }, [mockMode]);

  useEffect(() => {
    const runtime = detectRuntimeType();
    if (checkOnMount && (runtime === 'desktop' || runtime === 'web' || mockMode)) {
      const timer = setTimeout(() => {
        checkForUpdates();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [checkOnMount, checkForUpdates, mockMode]);

  const currentState = (mockMode && mockState) ? mockState : state;

  return {
    ...currentState,
    checkForUpdates,
    downloadUpdate,
    restartToUpdate,
    dismiss,
  };
};
