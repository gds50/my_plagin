import { useEffect, useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import { Modal } from './Modal';
import { useUiStore } from '@/store/uiStore';
import { useAppStore, selectActiveWorkspace } from '@/store/appStore';
import { getAllBookmarks, openUrl } from '@/lib/chromeApi';
import { DEFAULT_ENGINES, resolveQuery } from '@/lib/search-engines';
import { faviconUrl } from '@/lib/favicon';

interface Item {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  action: () => void;
}

export function CommandPalette() {
  const open = useUiStore((s) => s.commandOpen);
  const close = useUiStore((s) => s.closeCommand);
  const setEdit = useUiStore((s) => s.setEdit);
  const data = useAppStore((s) => s.data);
  const ws = useAppStore(selectActiveWorkspace);
  const setActiveWorkspace = useAppStore((s) => s.setActiveWorkspace);
  const setActivePage = useAppStore((s) => s.setActivePage);
  const [chromeBookmarks, setChromeBookmarks] = useState<{ id: string; title: string; url: string }[]>([]);
  const [q, setQ] = useState('');
  const [hover, setHover] = useState(0);

  useEffect(() => {
    if (!open) return;
    setQ('');
    setHover(0);
    getAllBookmarks().then((all) =>
      setChromeBookmarks(all.map((b) => ({ id: b.id, title: b.title, url: b.url }))),
    );
  }, [open]);

  const items: Item[] = useMemo(() => {
    const out: Item[] = [];

    // own bookmarks
    for (const w of data.workspaces) {
      for (const p of w.pages) {
        for (const widget of p.widgets) {
          if (widget.type === 'bookmarks') {
            const cfg = widget.config as { items: { id: string; title: string; url: string }[] };
            for (const b of cfg.items) {
              out.push({
                id: `bm-${b.id}`,
                title: b.title,
                subtitle: `${w.name} › ${p.name} · ${b.url}`,
                icon: faviconUrl(b.url, 16),
                action: () => openUrl(b.url, false),
              });
            }
          }
        }
      }
    }

    // chrome native bookmarks
    for (const b of chromeBookmarks) {
      out.push({
        id: `cbm-${b.id}`,
        title: b.title,
        subtitle: `Chrome · ${b.url}`,
        icon: faviconUrl(b.url, 16),
        action: () => openUrl(b.url, false),
      });
    }

    // actions
    out.push(
      {
        id: 'act-edit',
        title: 'Режим редактирования',
        subtitle: 'Включить/выключить',
        icon: '✏️',
        action: () => setEdit(true),
      },
      {
        id: 'act-options',
        title: 'Настройки и синхронизация',
        subtitle: 'Открыть страницу настроек',
        icon: '⚙️',
        action: () => {
          const url = chrome?.runtime?.getURL?.('src/options/index.html');
          if (url) openUrl(url, true);
        },
      },
    );
    for (const w of data.workspaces) {
      if (w.id !== data.activeWorkspaceId) {
        out.push({
          id: `ws-${w.id}`,
          title: `Перейти: ${w.name}`,
          subtitle: 'Workspace',
          icon: w.icon,
          action: () => setActiveWorkspace(w.id),
        });
      }
    }
    if (ws) {
      for (const p of ws.pages) {
        if (p.id !== ws.activePageId) {
          out.push({
            id: `pg-${p.id}`,
            title: `Страница: ${p.name}`,
            subtitle: ws.name,
            icon: '📄',
            action: () => setActivePage(ws.id, p.id),
          });
        }
      }
    }

    return out;
  }, [data, ws, chromeBookmarks, setEdit, setActiveWorkspace, setActivePage]);

  const fuse = useMemo(
    () => new Fuse(items, { keys: ['title', 'subtitle'], threshold: 0.4, includeScore: true }),
    [items],
  );

  const queryItem = useMemo(() => {
    const r = resolveQuery(q, DEFAULT_ENGINES, data.settings.defaultSearchEngine);
    if (!r) return null;
    const item: Item = {
      id: 'go',
      title: r.engine.key === 'url' ? `Перейти: ${r.url}` : `${r.engine.name}: ${r.query}`,
      subtitle: r.url,
      icon: '🔍',
      action: () => openUrl(r.url, false),
    };
    return item;
  }, [q, data.settings.defaultSearchEngine]);

  const results: Item[] = useMemo(() => {
    if (!q.trim()) return items.slice(0, 20);
    const found = fuse.search(q, { limit: 20 }).map((r) => r.item);
    return queryItem ? [queryItem, ...found] : found;
  }, [q, items, fuse, queryItem]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHover((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHover((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const it = results[hover];
      if (it) {
        it.action();
        close();
      }
    }
  };

  return (
    <Modal open={open} onClose={close} size="lg">
      <input
        autoFocus
        className="input"
        placeholder="Поиск, действие, или 'g запрос' / URL…"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setHover(0);
        }}
        onKeyDown={onKey}
      />
      <div className="mt-2 max-h-[50vh] overflow-auto">
        {results.length === 0 && <div className="text-fg-muted text-sm py-4 text-center">Ничего не найдено</div>}
        {results.map((it, idx) => (
          <button
            key={it.id}
            className={
              'w-full flex items-center gap-2 px-2 py-2 rounded text-left ' +
              (idx === hover ? 'bg-bg-soft/80' : 'hover:bg-bg-soft/40')
            }
            onMouseEnter={() => setHover(idx)}
            onClick={() => {
              it.action();
              close();
            }}
          >
            {it.icon && /^(https?:|chrome-extension:)/.test(it.icon) ? (
              <img src={it.icon} alt="" className="w-4 h-4" />
            ) : (
              <span className="w-4 text-center">{it.icon}</span>
            )}
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm">{it.title}</div>
              {it.subtitle && <div className="truncate text-xs text-fg-muted">{it.subtitle}</div>}
            </div>
          </button>
        ))}
      </div>
      <div className="mt-2 text-[10px] text-fg-muted text-center">
        ↑↓ — навигация, Enter — выбор, Esc — закрыть
      </div>
    </Modal>
  );
}
