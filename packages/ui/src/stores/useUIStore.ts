import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import type { SidebarSection } from '@/constants/sidebar';
import { getSafeStorage } from './utils/safeStorage';
import { getTypographyVariable, type SemanticTypographyKey } from '@/lib/typography';

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

  toolCallExpansion: 'collapsed' | 'activity' | 'detailed';
  fontSize: number;
  padding: number;

  favoriteModels: Array<{ providerID: string; modelID: string }>;
  recentModels: Array<{ providerID: string; modelID: string }>;

  diffLayoutPreference: 'dynamic' | 'inline' | 'side-by-side';
  diffFileLayout: Record<string, 'inline' | 'side-by-side'>;
  diffWrapLines: boolean;

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
  setToolCallExpansion: (value: 'collapsed' | 'activity' | 'detailed') => void;
  setFontSize: (size: number) => void;
  setPadding: (size: number) => void;
  applyTypography: () => void;
  applyPadding: () => void;
  updateProportionalSidebarWidths: () => void;
  toggleFavoriteModel: (providerID: string, modelID: string) => void;
  isFavoriteModel: (providerID: string, modelID: string) => boolean;
  addRecentModel: (providerID: string, modelID: string) => void;
  setDiffLayoutPreference: (mode: 'dynamic' | 'inline' | 'side-by-side') => void;
  setDiffFileLayout: (filePath: string, mode: 'inline' | 'side-by-side') => void;
  setDiffWrapLines: (wrap: boolean) => void;
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
        toolCallExpansion: 'collapsed',
        fontSize: 100,
        padding: 100,
        favoriteModels: [],
        recentModels: [],
        diffLayoutPreference: 'dynamic',
        diffFileLayout: {},
        diffWrapLines: false,

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

        setToolCallExpansion: (value) => {
          set({ toolCallExpansion: value });
        },

        setFontSize: (size) => {
          // Clamp between 50% and 200%
          const clampedSize = Math.max(50, Math.min(200, size));
          set({ fontSize: clampedSize });
          get().applyTypography();
        },

        setPadding: (size) => {
          // Clamp between 50% and 200%
          const clampedSize = Math.max(50, Math.min(200, size));
          set({ padding: clampedSize });
          get().applyPadding();
        },

        applyTypography: () => {
          const { fontSize } = get();
          const root = document.documentElement;
          
          // Apply font size as a percentage scale
          // 100 = default (1.0x), 50 = half size (0.5x), 200 = double (2.0x)
          const scale = fontSize / 100;
          
          // Store scale for reference
          root.style.setProperty('--font-scale', scale.toString());
          
          // Read base values from SEMANTIC_TYPOGRAPHY or use defaults
          const baseValues: Record<string, string> = {
            markdown: '0.9375rem',
            code: '0.9063rem',
            uiHeader: '0.9375rem',
            uiLabel: '0.875rem',
            meta: '0.875rem',
            micro: '0.875rem',
          };
          
          // Apply scaled values to each typography variable
          Object.entries(baseValues).forEach(([key, baseValue]) => {
            const cssVar = getTypographyVariable(key as SemanticTypographyKey);
            const numericValue = parseFloat(baseValue);
            if (!isNaN(numericValue)) {
              root.style.setProperty(cssVar, `${numericValue * scale}rem`);
            }
          });
        },

        applyPadding: () => {
          const { padding } = get();
          const root = document.documentElement;
          
          // Apply padding as a percentage scale with non-linear scaling
          // Use square root for more natural scaling at extremes
          const scale = padding / 100;
          const adjustedScale = Math.sqrt(scale);
          
          // Set the CSS custom property that all spacing tokens reference
          root.style.setProperty('--padding-scale', adjustedScale.toString());
          
          // Apply line height scaling - use much smaller scale factor
          // Line height should remain relatively constant even when font size changes
          // Use a dampened scale: 50% font = 0.9x line-height, 200% font = 1.1x line-height
          const lineHeightScale = 1 + (scale - 1) * 0.15; // Reduces impact: 50% -> 0.925, 200% -> 1.15
          
          root.style.setProperty('--line-height-tight', (1.25 * lineHeightScale).toFixed(3));
          root.style.setProperty('--line-height-normal', (1.5 * lineHeightScale).toFixed(3));
          root.style.setProperty('--line-height-relaxed', (1.625 * lineHeightScale).toFixed(3));
          root.style.setProperty('--line-height-loose', (2 * lineHeightScale).toFixed(3));
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

        setDiffWrapLines: (wrap) => {
          set({ diffWrapLines: wrap });
        },

        toggleFavoriteModel: (providerID, modelID) => {
          set((state) => {
            const exists = state.favoriteModels.some(
              (fav) => fav.providerID === providerID && fav.modelID === modelID
            );
            
            if (exists) {
              // Remove from favorites
              return {
                favoriteModels: state.favoriteModels.filter(
                  (fav) => !(fav.providerID === providerID && fav.modelID === modelID)
                ),
              };
            } else {
              // Add to favorites (newest first)
              return {
                favoriteModels: [{ providerID, modelID }, ...state.favoriteModels],
              };
            }
          });
        },

        isFavoriteModel: (providerID, modelID) => {
          const { favoriteModels } = get();
          return favoriteModels.some(
            (fav) => fav.providerID === providerID && fav.modelID === modelID
          );
        },

        addRecentModel: (providerID, modelID) => {
          set((state) => {
            // Remove existing instance if any
            const filtered = state.recentModels.filter(
              (m) => !(m.providerID === providerID && m.modelID === modelID)
            );
            // Add to front, limit to 5
            return {
              recentModels: [{ providerID, modelID }, ...filtered].slice(0, 5),
            };
          });
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
          toolCallExpansion: state.toolCallExpansion,
          fontSize: state.fontSize,
          padding: state.padding,
          favoriteModels: state.favoriteModels,
          recentModels: state.recentModels,
          diffLayoutPreference: state.diffLayoutPreference,
          diffWrapLines: state.diffWrapLines,
        })
      }
    ),
    {
      name: 'ui-store'
    }
  )
);
