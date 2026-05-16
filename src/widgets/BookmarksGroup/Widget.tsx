import { useEffect, useRef, useState } from 'react';
import type { Widget, BookmarksConfig, Bookmark } from '@/types';
import { useAppStore } from '@/store/appStore';
import { useUiStore } from '@/store/uiStore';
import { faviconUrl } from '@/lib/favicon';
import { getAllBookmarks } from '@/lib/chromeApi';
import { uid } from '@/lib/uid';
import { Modal } from '@/components/Modal';
import { cn } from '@/lib/cn';
import { fetchPageTitle } from '@/lib/pageTitle';
import {
  BOOKMARK_DND,
  LINK_DND,
  setBookmarkDrag,
  type BookmarkDragPayload,
  type LinkDragPayload,
} from '@/lib/dnd';

interface Props {
  widget: Widget;
  wsId: string;
  pageId: string;
}

export function BookmarksWidget({ widget, wsId, pageId }: Props) {
  const cfg = widget.config as BookmarksConfig;
  const editMode = useUiStore((s) => s.editMode);
  const patch = useAppStore((s) => s.patchWidgetConfig);
  const moveBookmark = useAppStore((s) => s.moveBookmark);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Bookmark | null>(null);
  // Per-widget edit mode — independent of the global edit mode.
  const [localEdit, setLocalEdit] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Effective edit-mode for THIS widget's items: any of the two flags.
  const isEditing = editMode || localEdit;

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

  // Cross-widget DnD is only enabled in the global full edit mode.
  const dropEnabled = editMode;

  const acceptsBookmark = (types: readonly string[]) => types.includes(BOOKMARK_DND);
  const acceptsLink = (types: readonly string[]) => types.includes(LINK_DND);

  const onDragOver = (e: React.DragEvent) => {
    if (!dropEnabled) return;
    const types = e.dataTransfer.types;
    if (!acceptsBookmark(types) && !acceptsLink(types)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = acceptsBookmark(types) ? 'move' : 'copy';
    if (!dragOver) setDragOver(true);
  };
  const onDragLeave = () => setDragOver(false);
  const onDrop = (e: React.DragEvent) => {
    setDragOver(false);
    if (!dropEnabled) return;

    // 1) Internal bookmark-move first (richer payload).
    const rawBookmark = e.dataTransfer.getData(BOOKMARK_DND);
    if (rawBookmark) {
      e.preventDefault();
      try {
        const src = JSON.parse(rawBookmark) as BookmarkDragPayload;
        if (src.widgetId === widget.id) return;
        void moveBookmark(src, { wsId, pageId, widgetId: widget.id });
      } catch {
        /* ignore */
      }
      return;
    }

    // 2) Arbitrary link (TopSites / Recent / external).
    const rawLink = e.dataTransfer.getData(LINK_DND);
    if (rawLink) {
      e.preventDefault();
      try {
        const link = JSON.parse(rawLink) as LinkDragPayload;
        if (!link.url) return;
        // Skip duplicates (same URL already in the list).
        if (cfg.items.some((i) => i.url === link.url)) return;
        const next: Bookmark = {
          id: uid('b'),
          title: link.title || link.url,
          url: link.url,
        };
        void patch(wsId, pageId, widget.id, { items: [...cfg.items, next] });
      } catch {
        /* ignore */
      }
    }
  };

  return (
    <div
      className={cn(
        'p-3 h-full flex flex-col group/widget',
        dragOver && 'ring-2 ring-accent rounded-lg',
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="flex items-center justify-between mb-2 gap-1">
        <h3 className="font-semibold truncate">{cfg.title}</h3>
        <div className="flex items-center gap-1 shrink-0">
          {isEditing && (
            <button className="btn btn-ghost text-xs" onClick={onAdd} title="Добавить закладку">
              + Добавить
            </button>
          )}
          {/* Always-available per-widget edit toggle. Hidden until hover when
              not active, to keep the widget clean in normal browsing. */}
          {!editMode && (
            <button
              className={cn(
                'text-xs px-1.5 py-0.5 rounded transition-opacity',
                localEdit
                  ? 'bg-accent/20 text-accent opacity-100'
                  : 'text-fg-muted opacity-0 group-hover/widget:opacity-100 hover:bg-bg-soft/60',
              )}
              onClick={() => setLocalEdit((v) => !v)}
              title={localEdit ? 'Готово' : 'Редактировать содержимое'}
            >
              {localEdit ? '✓' : '✎'}
            </button>
          )}
        </div>
      </div>
      {cfg.items.length === 0 ? (
        <div className="text-xs text-fg-muted py-4 text-center">
          Пока пусто. {isEditing ? 'Нажмите «Добавить».' : 'Нажмите ✎ чтобы добавить.'}
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
              isEditing={isEditing}
              draggable={editMode}
              wsId={wsId}
              pageId={pageId}
              widgetId={widget.id}
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
  isEditing,
  draggable,
  wsId,
  pageId,
  widgetId,
  onEdit,
  onDelete,
}: {
  bookmark: Bookmark;
  layout: 'list' | 'grid';
  showIcons: boolean;
  isEditing: boolean;
  draggable: boolean;
  wsId: string;
  pageId: string;
  widgetId: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const onDragStart = (e: React.DragEvent) => {
    if (!draggable) return;
    setBookmarkDrag(e.dataTransfer, {
      wsId,
      pageId,
      widgetId,
      bookmarkId: bookmark.id,
      url: bookmark.url,
      title: bookmark.title,
    });
  };

  return (
    <div className="group relative">
      <a
        href={bookmark.url}
        draggable={draggable}
        onDragStart={onDragStart}
        className={cn(
          'block rounded-lg hover:bg-bg-soft/60 transition-colors',
          draggable && 'cursor-grab active:cursor-grabbing',
          layout === 'grid'
            ? 'flex flex-col items-center gap-1 p-2 text-center'
            : 'flex items-center gap-2 px-2 py-1.5',
        )}
        onClick={(e) => {
          if (isEditing) {
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
            draggable={false}
          />
        )}
        <span className={cn('truncate', layout === 'grid' && 'text-xs')}>{bookmark.title}</span>
      </a>
      {isEditing && (
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
  const notify = useUiStore((s) => s.notify);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [url, setUrl] = useState(initial?.url ?? '');
  const [fetching, setFetching] = useState(false);
  // Whether the user has typed in the title field manually. We only auto-fill
  // when the title is still empty / equals a previous auto-fill, so we never
  // overwrite the user's edits.
  const userEditedTitleRef = useRef(false);
  const autoFetchedFor = useRef<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? '');
      setUrl(initial?.url ?? '');
      setFetching(false);
      userEditedTitleRef.current = !!initial?.title;
      autoFetchedFor.current = null;
    }
  }, [open, initial]);

  const tryAutoFetch = async (rawUrl: string) => {
    const trimmed = rawUrl.trim();
    if (!trimmed) return;
    if (autoFetchedFor.current === trimmed) return;
    if (userEditedTitleRef.current && title.trim().length > 0) return;
    autoFetchedFor.current = trimmed;
    setFetching(true);
    try {
      const fetched = await fetchPageTitle(trimmed);
      if (fetched && !userEditedTitleRef.current) {
        setTitle(fetched);
      }
    } finally {
      setFetching(false);
    }
  };

  const onManualFetch = async () => {
    if (!url.trim()) {
      notify('Сначала введите URL', 'info');
      return;
    }
    setFetching(true);
    try {
      const fetched = await fetchPageTitle(url.trim());
      if (fetched) {
        setTitle(fetched);
        userEditedTitleRef.current = false;
        notify('Заголовок подтянут', 'success');
      } else {
        notify('Не удалось получить заголовок (нет разрешения или CORS)', 'error');
      }
    } finally {
      setFetching(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Изменить закладку' : 'Новая закладка'}>
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="https://example.com"
            value={url}
            autoFocus={!initial}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={(e) => void tryAutoFetch(e.target.value)}
            onPaste={(e) => {
              const pasted = e.clipboardData.getData('text');
              if (pasted) setTimeout(() => void tryAutoFetch(pasted), 0);
            }}
          />
          <button
            className="btn"
            onClick={onManualFetch}
            disabled={fetching || !url.trim()}
            title="Подтянуть заголовок со страницы"
          >
            {fetching ? '…' : '⤓ Title'}
          </button>
        </div>
        <input
          autoFocus={!!initial}
          className="input"
          placeholder="Название (подтянется автоматически)"
          value={title}
          onChange={(e) => {
            userEditedTitleRef.current = true;
            setTitle(e.target.value);
          }}
        />
        <p className="text-[11px] text-fg-muted">
          Заголовок подтягивается автоматически при вставке URL. Если нужно — правьте вручную.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn" onClick={onClose}>
            Отмена
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (!url) return;
              const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
              const finalTitle = title.trim() || normalizedUrl;
              onSave({
                id: initial?.id ?? uid('b'),
                title: finalTitle,
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
