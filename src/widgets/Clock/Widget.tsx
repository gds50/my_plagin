import { useEffect, useState } from 'react';
import type { Widget, ClockConfig } from '@/types';
import { useAppStore } from '@/store/appStore';

interface Props {
  widget: Widget;
  wsId: string;
  pageId: string;
}

export function ClockWidget({ widget }: Props) {
  const cfg = widget.config as ClockConfig;
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = cfg.showSeconds ? 1000 : 30_000;
    const id = setInterval(() => setNow(new Date()), interval);
    return () => clearInterval(id);
  }, [cfg.showSeconds]);

  const pad = (n: number) => String(n).padStart(2, '0');
  let h = now.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (!cfg.format24) h = h % 12 || 12;
  const time =
    `${pad(h)}:${pad(now.getMinutes())}` +
    (cfg.showSeconds ? `:${pad(now.getSeconds())}` : '') +
    (!cfg.format24 ? ` ${ampm}` : '');

  const date = now.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
      {cfg.greeting && <div className="text-fg-muted text-sm mb-1">{cfg.greeting}</div>}
      <div className="text-5xl font-light tabular-nums tracking-tight">{time}</div>
      {cfg.showDate && <div className="text-fg-muted text-sm mt-2 capitalize">{date}</div>}
    </div>
  );
}

export function ClockSettings({ widget, wsId, pageId }: Props) {
  const patch = useAppStore((s) => s.patchWidgetConfig);
  const cfg = widget.config as ClockConfig;
  return (
    <div className="space-y-2 text-sm">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={cfg.format24}
          onChange={(e) => patch(wsId, pageId, widget.id, { format24: e.target.checked })}
        />
        24-часовой формат
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={cfg.showSeconds}
          onChange={(e) => patch(wsId, pageId, widget.id, { showSeconds: e.target.checked })}
        />
        Показывать секунды
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={cfg.showDate}
          onChange={(e) => patch(wsId, pageId, widget.id, { showDate: e.target.checked })}
        />
        Показывать дату
      </label>
      <label className="block">
        Приветствие
        <input
          className="input mt-1"
          value={cfg.greeting}
          onChange={(e) => patch(wsId, pageId, widget.id, { greeting: e.target.value })}
          placeholder="напр. Привет!"
        />
      </label>
    </div>
  );
}
