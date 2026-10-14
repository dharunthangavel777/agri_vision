import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type UIActiveTab =
  | 'home'
  | 'advisor'
  | 'fertilizer'
  | 'disease'
  | 'weather'
  | 'profile';

const validTabs: UIActiveTab[] = ['home', 'advisor', 'fertilizer', 'disease', 'weather', 'profile'];

interface UIStore {
  showHistory: boolean;
  activeTab: UIActiveTab;
  setShowHistory: (value: boolean) => void;
  setActiveTab: (value: UIActiveTab) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      showHistory: false,
      activeTab: 'home',
      setShowHistory: (value) => set({ showHistory: value }),
      setActiveTab: (value) => {
        const target = validTabs.includes(value) ? value : 'home';
        set({ activeTab: target });
      },
    }),
    {
      name: 'agri-ui-state',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        showHistory: state.showHistory,
        activeTab: validTabs.includes(state.activeTab) ? state.activeTab : 'home',
      }),
      onRehydrateStorage: () => (state) => {
        if (state && !validTabs.includes(state.activeTab)) {
          state.activeTab = 'home';
        }
      },
    }
  )
);
