import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import type { SidebarSection } from '@/constants/sidebar';
import { getSafeStorage } from './utils/safeStorage';

export type MainTab = 'chat' | 'git' | 'diff' | 'terminal';
export type EventStreamStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'paused'
  | 'offline'
  | 'error';

interface UIStore {

  theme: 'light' | 'dark' | 'system';
  isSidebarOpen: boolean;
  sidebarWidth: number;
  hasManuallyResizedLeftSidebar: boolean;
  isSessionSwitcherOpen: boolean;
  activeMainTab: MainTab;
  pendingDiffFile: string | null;
  isMobile: boolean;
  isCommandPaletteOpen: boolean;
  isHelpDialogOpen: boolean;
  isSessionCreateDialogOpen: boolean;
  isSettingsDialogOpen: boolean;
  sidebarSection: SidebarSection;
  eventStreamStatus: EventStreamStatus;
  eventStreamHint: string | null;
  showReasoningTraces: boolean;

  diffLayoutPreference: 'dynamic' | 'inline' | 'side-by-side';
  diffFileLayout: Record<string, 'inline' | 'side-by-side'>;

  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarWidth: (width: number) => void;
  setSessionSwitcherOpen: (open: boolean) => void;
  setActiveMainTab: (tab: MainTab) => void;
  setPendingDiffFile: (filePath: string | null) => void;
  navigateToDiff: (filePath: string) => void;
  consumePendingDiffFile: () => string | null;
  setIsMobile: (isMobile: boolean) => void;
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleHelpDialog: () => void;
  setHelpDialogOpen: (open: boolean) => void;
  setSessionCreateDialogOpen: (open: boolean) => void;
  setSettingsDialogOpen: (open: boolean) => void;
  applyTheme: () => void;
  setSidebarSection: (section: SidebarSection) => void;
  setEventStreamStatus: (status: EventStreamStatus, hint?: string | null) => void;
  setShowReasoningTraces: (value: boolean) => void;
  updateProportionalSidebarWidths: () => void;
  setDiffLayoutPreference: (mode: 'dynamic' | 'inline' | 'side-by-side') => void;
  setDiffFileLayout: (filePath: string, mode: 'inline' | 'side-by-side') => void;
}

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set, get) => ({

        theme: 'system',
        isSidebarOpen: true,
        sidebarWidth: 264,
        hasManuallyResizedLeftSidebar: false,
        isSessionSwitcherOpen: false,
        activeMainTab: 'chat',
        pendingDiffFile: null,
        isMobile: false,
        isCommandPaletteOpen: false,
        isHelpDialogOpen: false,
        isSessionCreateDialogOpen: false,
        isSettingsDialogOpen: false,
        sidebarSection: 'sessions',
        eventStreamStatus: 'idle',
        eventStreamHint: null,
        showReasoningTraces: false,
        diffLayoutPreference: 'dynamic',
        diffFileLayout: {},

        setTheme: (theme) => {
          set({ theme });
          get().applyTheme();
        },

        toggleSidebar: () => {
          set((state) => {
            const newOpen = !state.isSidebarOpen;

            if (newOpen && typeof window !== 'undefined') {
              const proportionalWidth = Math.floor(window.innerWidth * 0.2);
              return {
                isSidebarOpen: newOpen,
                sidebarWidth: proportionalWidth,
                hasManuallyResizedLeftSidebar: false
              };
            }
            return { isSidebarOpen: newOpen };
          });
        },

        setSidebarOpen: (open) => {
          set(() => {

            if (open && typeof window !== 'undefined') {
              const proportionalWidth = Math.floor(window.innerWidth * 0.2);
              return {
                isSidebarOpen: open,
                sidebarWidth: proportionalWidth,
                hasManuallyResizedLeftSidebar: false
              };
            }
            return { isSidebarOpen: open };
          });
        },

        setSidebarWidth: (width) => {
          set({ sidebarWidth: width, hasManuallyResizedLeftSidebar: true });
        },

        setSessionSwitcherOpen: (open) => {
          set({ isSessionSwitcherOpen: open });
        },

        setActiveMainTab: (tab) => {
          set({ activeMainTab: tab });
        },

        setPendingDiffFile: (filePath) => {
          set({ pendingDiffFile: filePath });
        },

        navigateToDiff: (filePath) => {
          set({ pendingDiffFile: filePath, activeMainTab: 'diff' });
        },

        consumePendingDiffFile: () => {
          const { pendingDiffFile } = get();
          if (pendingDiffFile) {
            set({ pendingDiffFile: null });
          }
          return pendingDiffFile;
        },

        setIsMobile: (isMobile) => {
          set({ isMobile });
        },

        toggleCommandPalette: () => {
          set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen }));
        },

        setCommandPaletteOpen: (open) => {
          set({ isCommandPaletteOpen: open });
        },

        toggleHelpDialog: () => {
          set((state) => ({ isHelpDialogOpen: !state.isHelpDialogOpen }));
        },

        setHelpDialogOpen: (open) => {
          set({ isHelpDialogOpen: open });
        },

        setSessionCreateDialogOpen: (open) => {
          set({ isSessionCreateDialogOpen: open });
        },

        setSettingsDialogOpen: (open) => {
          set({ isSettingsDialogOpen: open });
        },

        setSidebarSection: (section) => {
          set({ sidebarSection: section });
        },

        setEventStreamStatus: (status, hint) => {
          set({
            eventStreamStatus: status,
            eventStreamHint: hint ?? null,
          });
        },

        setShowReasoningTraces: (value) => {
          set({ showReasoningTraces: value });
        },

        setDiffLayoutPreference: (mode) => {
          set({ diffLayoutPreference: mode });
        },

        setDiffFileLayout: (filePath, mode) => {
          set((state) => ({
            diffFileLayout: {
              ...state.diffFileLayout,
              [filePath]: mode,
            },
          }));
        },

        updateProportionalSidebarWidths: () => {
          if (typeof window === 'undefined') {
            return;
          }

          set((state) => {
            const updates: Partial<UIStore> = {};

            if (state.isSidebarOpen && !state.hasManuallyResizedLeftSidebar) {
              updates.sidebarWidth = Math.floor(window.innerWidth * 0.2);
            }

            return updates;
          });
        },

        applyTheme: () => {
          const { theme } = get();
          const root = document.documentElement;

          root.classList.remove('light', 'dark');

          if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            root.classList.add(systemTheme);
          } else {
            root.classList.add(theme);
          }
        }
      }),
      {
        name: 'ui-store',
        storage: createJSONStorage(() => getSafeStorage()),
        partialize: (state) => ({
          theme: state.theme,
          isSidebarOpen: state.isSidebarOpen,
          sidebarWidth: state.sidebarWidth,
          isSessionSwitcherOpen: state.isSessionSwitcherOpen,
          activeMainTab: state.activeMainTab,
          sidebarSection: state.sidebarSection,
          isSessionCreateDialogOpen: state.isSessionCreateDialogOpen,
          isSettingsDialogOpen: state.isSettingsDialogOpen,
          showReasoningTraces: state.showReasoningTraces,
          diffLayoutPreference: state.diffLayoutPreference,
        })
      }
    ),
    {
      name: 'ui-store'
    }
  )
);
