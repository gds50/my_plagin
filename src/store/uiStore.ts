import { create } from 'zustand';

interface UiStore {
  editMode: boolean;
  commandOpen: boolean;
  toggleEdit: () => void;
  setEdit: (v: boolean) => void;
  openCommand: () => void;
  closeCommand: () => void;
  toast: { id: number; text: string; kind: 'info' | 'error' | 'success' } | null;
  notify: (text: string, kind?: 'info' | 'error' | 'success') => void;
  clearToast: () => void;
}

export const useUiStore = create<UiStore>((set) => ({
  editMode: false,
  commandOpen: false,
  toggleEdit: () => set((s) => ({ editMode: !s.editMode })),
  setEdit: (v) => set({ editMode: v }),
  openCommand: () => set({ commandOpen: true }),
  closeCommand: () => set({ commandOpen: false }),
  toast: null,
  notify: (text, kind = 'info') => {
    const id = Date.now();
    set({ toast: { id, text, kind } });
    setTimeout(() => {
      set((s) => (s.toast?.id === id ? { toast: null } : {}));
    }, 3500);
  },
  clearToast: () => set({ toast: null }),
}));
