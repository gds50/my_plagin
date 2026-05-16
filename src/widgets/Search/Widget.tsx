import { useState, useMemo } from 'react';
import type { Widget, SearchConfig } from '@/types';
import { useAppStore } from '@/store/appStore';
import { DEFAULT_ENGINES, resolveQuery } from '@/lib/search-engines';
import { openUrl } from '@/lib/chromeApi';

interface Props {
  widget: Widget;
  wsId: string;
  pageId: string;
}

export function SearchWidget({ widget }: Props) {
  const cfg = widget.config as SearchConfig;
  const [q, setQ] = useState('');
  const [engineKey, setEngineKey] = useState(cfg.defaultEngine);

  const preview = useMemo(() => resolveQuery(q, DEFAULT_ENGINES, engineKey), [q, engineKey]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = resolveQuery(q, DEFAULT_ENGINES, engineKey);
    if (!r) return;
    openUrl(r.url, cfg.openInNewTab);
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col h-full justify-center gap-2 p-4">
      <div className="flex items-center gap-2">
        {cfg.showEngineSwitcher && (
          <select
            className="input !w-auto"
            value={engineKey}
            onChange={(e) => setEngineKey(e.target.value)}
          >
            {DEFAULT_ENGINES.map((e) => (
              <option key={e.key} value={e.key}>
                {e.name}
              </option>
            ))}
          </select>
        )}
        <input
          className="input"
          autoFocus
          placeholder="Поиск или URL — попробуйте 'yt cats', 'gh react'…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">
          →
        </button>
      </div>
      {preview && (
        <div className="text-xs text-fg-muted truncate">
          → {preview.engine.name}: {preview.query}
        </div>
      )}
    </form>
  );
}

export function SearchSettings({ widget, wsId, pageId }: Props) {
  const patch = useAppStore((s) => s.patchWidgetConfig);
  const cfg = widget.config as SearchConfig;
  return (
    <div className="space-y-2 text-sm">
      <label className="block">
        Поисковик по умолчанию
        <select
          className="input mt-1"
          value={cfg.defaultEngine}
          onChange={(e) => patch(wsId, pageId, widget.id, { defaultEngine: e.target.value })}
        >
          {DEFAULT_ENGINES.map((e) => (
            <option key={e.key} value={e.key}>
              {e.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={cfg.openInNewTab}
          onChange={(e) => patch(wsId, pageId, widget.id, { openInNewTab: e.target.checked })}
        />
        Открывать в новой вкладке
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={cfg.showEngineSwitcher}
          onChange={(e) =>
            patch(wsId, pageId, widget.id, { showEngineSwitcher: e.target.checked })
          }
        />
        Показать выбор движка
      </label>
      <div className="text-xs text-fg-muted pt-1">
        Bang-команды: <code>g</code>, <code>yt</code>, <code>gh</code>, <code>w</code>,{' '}
        <code>npm</code>, <code>mdn</code>, <code>y</code>, <code>d</code>, <code>wru</code>.
      </div>
    </div>
  );
}
