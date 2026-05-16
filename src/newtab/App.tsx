import { useEffect, useState } from 'react';
import { bootstrapStore, useAppStore } from '@/store/appStore';
import { useUiStore } from '@/store/uiStore';
import { TopBar } from '@/components/TopBar';
import { Grid } from '@/components/Grid';
import { CommandPalette } from '@/components/CommandPalette';
import { AddWidgetModal } from '@/components/AddWidgetModal';
import { Toast } from '@/components/Toast';
import { ThemeApplier } from '@/components/ThemeApplier';
import { initSyncWatcher, syncPullNow } from '@/lib/sync';

export function App() {
  const loaded = useAppStore((s) => s.loaded);
  const replaceAll = useAppStore((s) => s.replaceAll);
  const openCommand = useUiStore((s) => s.openCommand);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    (async () => {
      await bootstrapStore();
      initSyncWatcher();
      // try pull on first open
      const remote = await syncPullNow();
      if (remote) {
        const local = useAppStore.getState().data;
        if (remote.updatedAt > local.updatedAt) {
          if (confirm('Найдены более свежие данные в облаке (Gist). Применить?')) {
            await replaceAll(remote);
            useUiStore.getState().notify('Данные загружены из Gist', 'success');
          }
        }
      }
    })();
  }, [replaceAll]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openCommand();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openCommand]);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-screen text-fg-muted">Загрузка…</div>
    );
  }

  return (
    <>
      <ThemeApplier />
      <div className="min-h-screen flex flex-col">
        <TopBar onOpenAddWidget={() => setAddOpen(true)} />
        <main className="flex-1 p-4">
          <Grid />
        </main>
      </div>
      <CommandPalette />
      <AddWidgetModal open={addOpen} onClose={() => setAddOpen(false)} />
      <Toast />
    </>
  );
}
