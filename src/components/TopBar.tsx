import { useState } from 'react';
import { useAppStore, selectActiveWorkspace } from '@/store/appStore';
import { useUiStore } from '@/store/uiStore';
import { Modal } from './Modal';
import { exportAppData, importAppDataFromFile } from '@/lib/backup';
import { cn } from '@/lib/cn';

export function TopBar({ onOpenAddWidget }: { onOpenAddWidget: () => void }) {
  const data = useAppStore((s) => s.data);
  const ws = useAppStore(selectActiveWorkspace);
  const setActiveWorkspace = useAppStore((s) => s.setActiveWorkspace);
  const setActivePage = useAppStore((s) => s.setActivePage);
  const addPage = useAppStore((s) => s.addPage);
  const addWorkspace = useAppStore((s) => s.addWorkspace);
  const replaceAll = useAppStore((s) => s.replaceAll);

  const editMode = useUiStore((s) => s.editMode);
  const toggleEdit = useUiStore((s) => s.toggleEdit);
  const openCommand = useUiStore((s) => s.openCommand);
  const notify = useUiStore((s) => s.notify);

  const [menuOpen, setMenuOpen] = useState(false);

  const onImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const next = await importAppDataFromFile(file);
        if (!confirm('Заменить ВСЕ текущие данные импортированными?')) return;
        await replaceAll(next);
        notify('Импорт выполнен', 'success');
      } catch (e) {
        notify(`Ошибка: ${(e as Error).message}`, 'error');
      }
    };
    input.click();
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-border/40 bg-bg/30 backdrop-blur">
      {/* Workspaces tabs */}
      <div className="flex items-center gap-1">
        {data.workspaces.map((w) => (
          <button
            key={w.id}
            className={cn(
              'btn btn-ghost text-sm',
              w.id === data.activeWorkspaceId && 'bg-bg-soft/80',
            )}
            onClick={() => setActiveWorkspace(w.id)}
          >
            <span>{w.icon}</span>
            <span>{w.name}</span>
          </button>
        ))}
        <button
          className="btn btn-ghost text-fg-muted text-sm"
          onClick={async () => {
            const name = prompt('Название Workspace:', 'Новый');
            if (name) await addWorkspace(name);
          }}
          title="Новый workspace"
        >
          +
        </button>
      </div>

      <div className="w-px h-6 bg-border/40" />

      {/* Pages tabs */}
      {ws && (
        <div className="flex items-center gap-1">
          {ws.pages.map((p) => (
            <button
              key={p.id}
              className={cn(
                'btn btn-ghost text-xs',
                p.id === ws.activePageId && 'bg-bg-soft/60',
              )}
              onClick={() => setActivePage(ws.id, p.id)}
            >
              {p.name}
            </button>
          ))}
          <button
            className="btn btn-ghost text-fg-muted text-xs"
            onClick={async () => {
              const name = prompt('Название страницы:', 'Новая страница');
              if (name) await addPage(ws.id, name);
            }}
            title="Новая страница"
          >
            +
          </button>
        </div>
      )}

      <div className="flex-1" />

      <button className="btn btn-ghost text-sm" onClick={openCommand} title="Cmd/Ctrl+K">
        ⌘K
      </button>
      {editMode && (
        <button className="btn btn-primary text-sm" onClick={onOpenAddWidget}>
          + Виджет
        </button>
      )}
      <button
        className={cn('btn text-sm', editMode && 'btn-primary')}
        onClick={toggleEdit}
      >
        {editMode ? 'Готово' : 'Редактировать'}
      </button>
      <button className="btn btn-ghost" onClick={() => setMenuOpen(true)}>
        ⋯
      </button>

      <Modal open={menuOpen} onClose={() => setMenuOpen(false)} title="Меню">
        <div className="space-y-2">
          <button className="btn w-full" onClick={() => { setMenuOpen(false); exportAppData(data); }}>
            ⬇ Экспорт в JSON
          </button>
          <button className="btn w-full" onClick={() => { setMenuOpen(false); onImport(); }}>
            ⬆ Импорт из JSON
          </button>
          <a className="btn w-full" href={chrome?.runtime?.getURL?.('src/options/index.html') ?? '#'} target="_blank" rel="noreferrer">
            ⚙ Настройки и синхронизация
          </a>
        </div>
      </Modal>
    </div>
  );
}
