import { useState, type ReactNode } from 'react';
import type { Widget } from '@/types';
import { useUiStore } from '@/store/uiStore';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/cn';
import { widgetMeta } from '@/widgets/_registry';

interface Props {
  widget: Widget;
  wsId: string;
  pageId: string;
  children: ReactNode;
  onMovePointerDown: (e: React.PointerEvent) => void;
  onResizePointerDown: (e: React.PointerEvent) => void;
}

export function WidgetFrame({
  widget,
  wsId,
  pageId,
  children,
  onMovePointerDown,
  onResizePointerDown,
}: Props) {
  const editMode = useUiStore((s) => s.editMode);
  const removeWidget = useAppStore((s) => s.removeWidget);
  const [menuOpen, setMenuOpen] = useState(false);

  const meta = widgetMeta[widget.type];

  return (
    <div className={cn('card widget-card relative h-full flex flex-col overflow-hidden', editMode && 'ring-1 ring-accent/40')}>
      {editMode && (
        <div
          className="widget-handle absolute inset-x-0 top-0 h-6 z-10 flex items-center justify-between px-2 text-[10px] uppercase tracking-wide text-fg-muted bg-bg-soft/40"
          onPointerDown={onMovePointerDown}
        >
          <span>⋮⋮ {meta?.label ?? widget.type}</span>
          <div className="flex items-center gap-1">
            <button
              className="text-fg-muted hover:text-fg"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              ⚙
            </button>
            <button
              className="text-red-400 hover:text-red-300"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Удалить виджет «${meta?.label ?? widget.type}»?`)) {
                  void removeWidget(wsId, pageId, widget.id);
                }
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              ✕
            </button>
          </div>
        </div>
      )}
      <div className={cn('flex-1 overflow-auto', editMode && 'pt-6')}>{children}</div>
      {editMode && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-accent/60 rounded-tl"
          onPointerDown={onResizePointerDown}
          title="Изменить размер"
        />
      )}
      {menuOpen && <SettingsPopover wsId={wsId} pageId={pageId} widget={widget} onClose={() => setMenuOpen(false)} />}
    </div>
  );
}

function SettingsPopover({
  widget,
  wsId,
  pageId,
  onClose,
}: {
  widget: Widget;
  wsId: string;
  pageId: string;
  onClose: () => void;
}) {
  const SettingsCmp = widgetMeta[widget.type]?.Settings;
  return (
    <div
      className="absolute right-2 top-7 z-30 card w-64 p-3 shadow-widget"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Настройки</h3>
        <button className="btn btn-ghost text-xs" onClick={onClose}>✕</button>
      </div>
      {SettingsCmp ? (
        <SettingsCmp widget={widget} wsId={wsId} pageId={pageId} />
      ) : (
        <p className="text-xs text-fg-muted">Нет настроек.</p>
      )}
    </div>
  );
}


