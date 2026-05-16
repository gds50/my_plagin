import { useEffect, useState } from 'react';
import type { Widget, TopSitesConfig } from '@/types';
import { useAppStore } from '@/store/appStore';
import { getTopSites } from '@/lib/chromeApi';
import { faviconUrl } from '@/lib/favicon';
import { useUiStore } from '@/store/uiStore';
import { setLinkDrag } from '@/lib/dnd';

interface Props {
  widget: Widget;
  wsId: string;
  pageId: string;
}

interface Site {
  title: string;
  url: string;
}

export function TopSitesWidget({ widget, wsId, pageId }: Props) {
  const cfg = widget.config as TopSitesConfig;
  const editMode = useUiStore((s) => s.editMode);
  const patch = useAppStore((s) => s.patchWidgetConfig);
  const [sites, setSites] = useState<Site[]>([]);

  useEffect(() => {
    getTopSites().then((s) => setSites(s as Site[]));
  }, []);

  const filtered = sites.filter((s) => !cfg.hidden.includes(s.url)).slice(0, cfg.limit);

  const onHide = (url: string) => {
    void patch(wsId, pageId, widget.id, { hidden: [...cfg.hidden, url] });
  };

  return (
    <div className="p-3 h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold truncate">{cfg.title}</h3>
        <span className="text-xs text-fg-muted">{filtered.length}</span>
      </div>
      {filtered.length === 0 ? (
        <div className="text-xs text-fg-muted text-center py-4">
          Chrome ещё не накопил данные. Поработайте в браузере — список появится.
        </div>
      ) : (
        <div className="flex-1 overflow-auto grid grid-cols-4 gap-2">
          {filtered.map((s) => (
            <div key={s.url} className="group relative">
              <a
                href={s.url}
                draggable={editMode}
                onDragStart={(e) => {
                  if (!editMode) return;
                  setLinkDrag(e.dataTransfer, { url: s.url, title: s.title || s.url });
                }}
                className={
                  'flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-bg-soft/60 text-center' +
                  (editMode ? ' cursor-grab active:cursor-grabbing' : '')
                }
              >
                <img src={faviconUrl(s.url, 32)} alt="" className="w-8 h-8" loading="lazy" draggable={false} />
                <span className="text-[10px] truncate w-full">{s.title || s.url}</span>
              </a>
              {editMode && (
                <button
                  className="absolute top-0 right-0 text-red-400 opacity-0 group-hover:opacity-100 text-xs px-1"
                  title="Скрыть из списка"
                  onClick={(e) => {
                    e.preventDefault();
                    onHide(s.url);
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TopSitesSettings({ widget, wsId, pageId }: Props) {
  const cfg = widget.config as TopSitesConfig;
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
          min={4}
          max={12}
          step={1}
          value={cfg.limit}
          onChange={(e) => patch(wsId, pageId, widget.id, { limit: Number(e.target.value) })}
          className="w-full"
        />
      </label>
      {cfg.hidden.length > 0 && (
        <button
          className="btn w-full"
          onClick={() => patch(wsId, pageId, widget.id, { hidden: [] })}
        >
          Сбросить скрытые ({cfg.hidden.length})
        </button>
      )}
    </div>
  );
}
