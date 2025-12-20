import { useUIStore } from '@/stores/useUIStore';
import { updateDesktopSettings } from '@/lib/persistence';
import type { DesktopSettings } from '@/lib/desktop';

type AppearanceSlice = {
  showReasoningTraces: boolean;
  autoDeleteEnabled: boolean;
  autoDeleteAfterDays: number;
};

let initialized = false;

export const startAppearanceAutoSave = (): void => {
  if (initialized || typeof window === 'undefined') {
    return;
  }

  initialized = true;

  let previous: AppearanceSlice = {
    showReasoningTraces: useUIStore.getState().showReasoningTraces,
    autoDeleteEnabled: useUIStore.getState().autoDeleteEnabled,
    autoDeleteAfterDays: useUIStore.getState().autoDeleteAfterDays,
  };

  let pending: Partial<DesktopSettings> | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    const payload = pending;
    pending = null;
    timer = null;
    if (payload && Object.keys(payload).length > 0) {
      void updateDesktopSettings(payload);
    }
  };

  const schedule = (changes: Partial<DesktopSettings>) => {
    pending = { ...(pending ?? {}), ...changes };
    if (timer) {
      return;
    }
    timer = setTimeout(flush, 150);
  };

  useUIStore.subscribe((state) => {
    const current: AppearanceSlice = {
      showReasoningTraces: state.showReasoningTraces,
      autoDeleteEnabled: state.autoDeleteEnabled,
      autoDeleteAfterDays: state.autoDeleteAfterDays,
    };

    const diff: Partial<DesktopSettings> = {};

    if (current.showReasoningTraces !== previous.showReasoningTraces) {
      diff.showReasoningTraces = current.showReasoningTraces;
    }
    if (current.autoDeleteEnabled !== previous.autoDeleteEnabled) {
      diff.autoDeleteEnabled = current.autoDeleteEnabled;
    }
    if (current.autoDeleteAfterDays !== previous.autoDeleteAfterDays) {
      diff.autoDeleteAfterDays = current.autoDeleteAfterDays;
    }

    previous = current;

    if (Object.keys(diff).length > 0) {
      schedule(diff);
    }
  });
};
