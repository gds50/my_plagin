import { useEffect, useState } from 'react';
import type { Widget, BookmarksConfig, Bookmark } from '@/types';
import { useAppStore } from '@/store/appStore';
import { useUiStore } from '@/store/uiStore';
import { faviconUrl } from '@/lib/favicon';
import { getAllBookmarks } from '@/lib/chromeApi';
import { uid } from '@/lib/uid';
import { Modal } from '@/components/Modal';
import { cn } from '@/lib/cn';

interface Props {
  widget: Widget;
  wsId: string;
  pageId: string;
}

export function BookmarksWidget({ widget, wsId, pageId }: Props) {
  const cfg = widget.config as BookmarksConfig;
  const editMode = useUiStore((s) => s.editMode);
  const patch = useAppStore((s) => s.patchWidgetConfig);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Bookmark | null>(null);

  const onAdd = () => {
    setEditItem(null);
    setModalOpen(true);
  };

  const onEdit = (b: Bookmark) => {
    setEditItem(b);
    setModalOpen(true);
  };

  const onSave = (b: Bookmark) => {
    const exists = cfg.items.find((i) => i.id === b.id);
    const items = exists
      ? cfg.items.map((i) => (i.id === b.id ? b : i))
      : [...cfg.items, b];
    void patch(wsId, pageId, widget.id, { items });
    setModalOpen(false);
  };

  const onDelete = (id: string) => {
    void patch(wsId, pageId, widget.id, { items: cfg.items.filter((i) => i.id !== id) });
  };

  return (
    <div className="p-3 h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold truncate">{cfg.title}</h3>
        {editMode && (
          <button className="btn btn-ghost text-xs" onClick={onAdd}>
            + Добавить
          </button>
        )}
      </div>
      {cfg.items.length === 0 ? (
        <div className="text-xs text-fg-muted py-4 text-center">
          Пока пусто. {editMode && 'Нажмите «Добавить».'}
        </div>
      ) : (
        <div
          className={cn(
            'flex-1 overflow-auto',
            cfg.layout === 'grid' ? 'grid grid-cols-3 gap-2' : 'flex flex-col gap-1',
          )}
        >
          {cfg.items.map((b) => (
            <BookmarkItem
              key={b.id}
              bookmark={b}
              layout={cfg.layout}
              showIcons={cfg.showIcons}
              editMode={editMode}
              onEdit={() => onEdit(b)}
              onDelete={() => onDelete(b.id)}
            />
          ))}
        </div>
      )}
      <BookmarkEditorModal
        open={modalOpen}
        initial={editItem}
        onClose={() => setModalOpen(false)}
        onSave={onSave}
      />
    </div>
  );
}

function BookmarkItem({
  bookmark,
  layout,
  showIcons,
  editMode,
  onEdit,
  onDelete,
}: {
  bookmark: Bookmark;
  layout: 'list' | 'grid';
  showIcons: boolean;
  editMode: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group relative">
      <a
        href={bookmark.url}
        className={cn(
          'block rounded-lg hover:bg-bg-soft/60 transition-colors',
          layout === 'grid'
            ? 'flex flex-col items-center gap-1 p-2 text-center'
            : 'flex items-center gap-2 px-2 py-1.5',
        )}
        onClick={(e) => {
          if (editMode) {
            e.preventDefault();
            onEdit();
          }
        }}
      >
        {showIcons && (
          <img
            src={faviconUrl(bookmark.url, 32)}
            alt=""
            className={cn(layout === 'grid' ? 'w-8 h-8' : 'w-4 h-4')}
            loading="lazy"
          />
        )}
        <span className={cn('truncate', layout === 'grid' && 'text-xs')}>{bookmark.title}</span>
      </a>
      {editMode && (
        <button
          className="absolute top-0 right-0 text-red-400 opacity-0 group-hover:opacity-100 text-xs px-1"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (confirm('Удалить закладку?')) onDelete();
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

function BookmarkEditorModal({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: Bookmark | null;
  onClose: () => void;
  onSave: (b: Bookmark) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [url, setUrl] = useState(initial?.url ?? '');

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? '');
      setUrl(initial?.url ?? '');
    }
  }, [open, initial]);

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Изменить закладку' : 'Новая закладка'}>
      <div className="space-y-2">
        <input
          autoFocus
          className="input"
          placeholder="Название"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="input"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn" onClick={onClose}>
            Отмена
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (!title || !url) return;
              const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
              onSave({
                id: initial?.id ?? uid('b'),
                title,
                url: normalizedUrl,
              });
            }}
          >
            Сохранить
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function BookmarksSettings({ widget, wsId, pageId }: Props) {
  const patch = useAppStore((s) => s.patchWidgetConfig);
  const cfg = widget.config as BookmarksConfig;
  const [importing, setImporting] = useState(false);
  const notify = useUiStore((s) => s.notify);

  const onImport = async () => {
    setImporting(true);
    try {
      const all = await getAllBookmarks();
      if (all.length === 0) {
        notify('Закладок не найдено', 'info');
        return;
      }
      const folders = Array.from(new Set(all.map((b) => b.folder).filter(Boolean)));
      const folder =
        folders.length > 0
          ? prompt(
              `Введите имя папки для импорта (или Enter для всех):\n\nДоступные: ${folders.join(', ')}`,
              '',
            )
          : '';
      const filtered = folder ? all.filter((b) => b.folder === folder) : all;
      const items: Bookmark[] = filtered.slice(0, 100).map((b) => ({
        id: uid('b'),
        title: b.title,
        url: b.url,
      }));
      await patch(wsId, pageId, widget.id, { items: [...cfg.items, ...items] });
      notify(`Импортировано: ${items.length}`, 'success');
    } catch (e) {
      notify(`Ошибка импорта: ${(e as Error).message}`, 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-2 text-sm">
      <label className="block">
        Заголовок
        <input
          className="input mt-1"
          value={cfg.title}
          onChange={(e) => patch(wsId, pageId, widget.id, { title: e.target.value })}
        />
      </label>
      <label className="block">
        Вид
        <select
          className="input mt-1"
          value={cfg.layout}
          onChange={(e) => patch(wsId, pageId, widget.id, { layout: e.target.value as 'list' | 'grid' })}
        >
          <option value="list">Список</option>
          <option value="grid">Сетка</option>
        </select>
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={cfg.showIcons}
          onChange={(e) => patch(wsId, pageId, widget.id, { showIcons: e.target.checked })}
        />
        Показывать иконки сайтов
      </label>
      <button className="btn w-full" disabled={importing} onClick={onImport}>
        {importing ? 'Импорт…' : 'Импорт закладок Chrome'}
      </button>
    </div>
  );
}
