import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  title: string;
  message?: string;
  variant: ToastVariant;
}

interface UiState {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  toasts: Toast[];
  selectedSimulationIds: string[];
  graphSearchQuery: string;
  highlightedNodeIds: string[];
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  toggleSimulationSelection: (id: string) => void;
  clearSimulationSelection: () => void;
  setGraphSearchQuery: (query: string) => void;
  setHighlightedNodeIds: (ids: string[]) => void;
}

let toastCounter = 0;

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  toasts: [],
  selectedSimulationIds: [],
  graphSearchQuery: '',
  highlightedNodeIds: [],

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),

  addToast: (toast) =>
    set((s) => ({
      toasts: [...s.toasts, { ...toast, id: `toast-${++toastCounter}` }],
    })),

  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  toggleSimulationSelection: (id) =>
    set((s) => ({
      selectedSimulationIds: s.selectedSimulationIds.includes(id)
        ? s.selectedSimulationIds.filter((x) => x !== id)
        : [...s.selectedSimulationIds, id],
    })),

  clearSimulationSelection: () => set({ selectedSimulationIds: [] }),

  setGraphSearchQuery: (query) => set({ graphSearchQuery: query }),
  setHighlightedNodeIds: (ids) => set({ highlightedNodeIds: ids }),
}));
