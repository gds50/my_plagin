import { useEffect, useState, useCallback } from 'react';
import type { Widget, RecentConfig } from '@/types';
import { useAppStore } from '@/store/appStore';
import { getRecentlyClosed, restoreSession, type RecentItem } from '@/lib/chromeApi';
import { faviconUrl } from '@/lib/favicon';

interface Props {
  widget: Widget;
  wsId: string;
  pageId: string;
}

export function RecentWidget({ widget }: Props) {
  const cfg = widget.config as RecentConfig;
  const [items, setItems] = useState<RecentItem[]>([]);

  const load = useCallback(() => {
    getRecentlyClosed(cfg.limit).then(setItems);
  }, [cfg.limit]);

  useEffect(() => {
    load();
    // refresh when window gets focus (likely tabs were closed)
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  return (
    <div className="p-3 h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold truncate">{cfg.title}</h3>
        <button className="btn btn-ghost text-xs" onClick={load} title="Обновить">
          ↻
        </button>
      </div>
      {items.length === 0 ? (
        <div className="text-xs text-fg-muted text-center py-4">Нет недавно закрытых вкладок</div>
      ) : (
        <div className="flex-1 overflow-auto flex flex-col gap-1">
          {items.map((it) => (
            <button
              key={it.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-bg-soft/60 text-left"
              onClick={() => {
                if (it.sessionId) {
                  void restoreSession(it.sessionId);
                } else {
                  window.location.href = it.url;
                }
              }}
            >
              <img src={faviconUrl(it.url, 16)} alt="" className="w-4 h-4 shrink-0" loading="lazy" />
              <span className="text-sm truncate">{it.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function RecentSettings({ widget, wsId, pageId }: Props) {
  const cfg = widget.config as RecentConfig;
  const patch = useAppStore((s) => s.patchWidgetConfig);
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
        Лимит ({cfg.limit})
        <input
          type="range"
          min={3}
          max={20}
          step={1}
          value={cfg.limit}
          onChange={(e) => patch(wsId, pageId, widget.id, { limit: Number(e.target.value) })}
          className="w-full"
        />
      </label>
    </div>
  );
}
