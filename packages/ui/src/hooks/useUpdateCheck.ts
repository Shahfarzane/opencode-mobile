import { useEffect, useState, useCallback } from 'react';
import {
  checkForDesktopUpdates,
  downloadDesktopUpdate,
  restartToApplyUpdate,
  isDesktopRuntime,
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
};

export type UseUpdateCheckReturn = UpdateState & {
  checkForUpdates: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  restartToUpdate: () => Promise<void>;
  dismiss: () => void;
};

const MOCK_UPDATE: UpdateState = {
  checking: false,
  available: true,
  downloading: false,
  downloaded: false,
  info: {
    available: true,
    version: '99.0.0-test',
    currentVersion: '0.0.0',
    body: 'Test update for UI development',
  },
  progress: null,
  error: null,
};

// Set window.__OPENCHAMBER_MOCK_UPDATE__ = true in console to test UI
declare global {
  interface Window {
    __OPENCHAMBER_MOCK_UPDATE__?: boolean;
  }
}

const shouldMockUpdate = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.__OPENCHAMBER_MOCK_UPDATE__ === true;
};

export const useUpdateCheck = (checkOnMount = true): UseUpdateCheckReturn => {
  const [state, setState] = useState<UpdateState>({
    checking: false,
    available: false,
    downloading: false,
    downloaded: false,
    info: null,
    progress: null,
    error: null,
  });

  const [mockMode, setMockMode] = useState(shouldMockUpdate);
  const [mockState, setMockState] = useState<UpdateState>(MOCK_UPDATE);

  // Check for mock mode changes (for console toggling)
  useEffect(() => {
    const interval = setInterval(() => {
      const shouldMock = shouldMockUpdate();
      if (shouldMock !== mockMode) {
        setMockMode(shouldMock);
        if (shouldMock) {
          setMockState(MOCK_UPDATE);
        }
      }
    }, 500);
    return () => clearInterval(interval);
  }, [mockMode]);

  const checkForUpdates = useCallback(async () => {
    if (mockMode) {
      setMockState(MOCK_UPDATE);
      return;
    }
    if (!isDesktopRuntime()) {
      return;
    }

    setState((prev) => ({ ...prev, checking: true, error: null }));

    try {
      const info = await checkForDesktopUpdates();
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
      setMockState((prev) => ({ ...prev, downloading: true }));
      // Simulate download progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 20;
        setMockState((prev) => ({
          ...prev,
          progress: { downloaded: progress * 1000, total: 100000 }
        }));
        if (progress >= 100) {
          clearInterval(interval);
          setMockState((prev) => ({
            ...prev,
            downloading: false,
            downloaded: true,
            progress: null,
          }));
        }
      }, 500);
      return;
    }

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
      setMockState(MOCK_UPDATE);
      return;
    }
    setState((prev) => ({ ...prev, available: false, downloaded: false, info: null }));
  }, [mockMode]);

  useEffect(() => {
    if (checkOnMount && (isDesktopRuntime() || mockMode)) {
      const timer = setTimeout(() => {
        checkForUpdates();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [checkOnMount, checkForUpdates, mockMode]);

  const currentState = mockMode ? mockState : state;

  return {
    ...currentState,
    checkForUpdates,
    downloadUpdate,
    restartToUpdate,
    dismiss,
  };
};
