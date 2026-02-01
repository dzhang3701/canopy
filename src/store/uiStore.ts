import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ViewportState } from '../types';

export type ViewMode = 'linear' | 'graph';

interface UIState {
  viewMode: ViewMode;
  sidebarCollapsed: boolean;
  viewport: ViewportState;
  showArchived: boolean;
  apiKey: string;
  selectedModel: string;

  // Modal states
  createProjectModalOpen: boolean;
  settingsModalOpen: boolean;

  // Actions
  setViewMode: (mode: ViewMode) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setViewport: (viewport: Partial<ViewportState>) => void;
  resetViewport: () => void;
  toggleShowArchived: () => void;
  setApiKey: (key: string) => void;
  setSelectedModel: (model: string) => void;
  setCreateProjectModalOpen: (open: boolean) => void;
  setSettingsModalOpen: (open: boolean) => void;
}

const defaultViewport: ViewportState = {
  x: 0,
  y: 0,
  scale: 1,
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      viewMode: 'linear',
      sidebarCollapsed: false,
      viewport: defaultViewport,
      showArchived: false,
      apiKey: '',
      selectedModel: 'gemini-1.5-flash',
      createProjectModalOpen: false,
      settingsModalOpen: false,

      setViewMode: (mode: ViewMode) => set({ viewMode: mode }),

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (collapsed: boolean) =>
        set({ sidebarCollapsed: collapsed }),

      setViewport: (viewport: Partial<ViewportState>) =>
        set((state) => ({ viewport: { ...state.viewport, ...viewport } })),

      resetViewport: () => set({ viewport: defaultViewport }),

      toggleShowArchived: () =>
        set((state) => ({ showArchived: !state.showArchived })),

      setApiKey: (key: string) => set({ apiKey: key }),

      setSelectedModel: (model: string) => set({ selectedModel: model }),

      setCreateProjectModalOpen: (open: boolean) =>
        set({ createProjectModalOpen: open }),

      setSettingsModalOpen: (open: boolean) => set({ settingsModalOpen: open }),
    }),
    {
      name: 'canopy-ui',
      partialize: (state) => ({
        viewMode: state.viewMode,
        sidebarCollapsed: state.sidebarCollapsed,
        showArchived: state.showArchived,
        apiKey: state.apiKey,
        selectedModel: state.selectedModel,
      }),
    }
  )
);
