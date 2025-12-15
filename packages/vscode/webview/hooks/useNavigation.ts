import { create } from 'zustand';

export type ViewType = 'sessions' | 'chat' | 'settings';

interface NavigationState {
  currentView: ViewType;
  navigateTo: (view: ViewType) => void;
  goToChat: () => void;
  goToSessions: () => void;
  goToSettings: () => void;
}

export const useNavigation = create<NavigationState>((set) => ({
  currentView: 'sessions',
  navigateTo: (view) => set({ currentView: view }),
  goToChat: () => set({ currentView: 'chat' }),
  goToSessions: () => set({ currentView: 'sessions' }),
  goToSettings: () => set({ currentView: 'settings' }),
}));
