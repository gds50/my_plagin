import { useMemo, useRef, useState } from 'react';
import type { Widget } from '@/types';
import { useAppStore, selectActivePage, selectActiveWorkspace } from '@/store/appStore';
import { useUiStore } from '@/store/uiStore';
import { WidgetFrame } from './WidgetFrame';
import { renderWidget } from '@/widgets/_registry';
import { cn } from '@/lib/cn';

const COLS = 12;
const ROW_HEIGHT = 60; // px per row unit
const GAP = 12;

interface DragState {
  widgetId: string;
  mode: 'move' | 'resize';
  startMouse: { x: number; y: number };
  startPos: Widget['position'];
  containerRect: DOMRect;
}

export function Grid() {
  const ws = useAppStore(selectActiveWorkspace);
  const page = useAppStore(selectActivePage);
  const editMode = useUiStore((s) => s.editMode);
  const moveWidget = useAppStore((s) => s.moveWidget);
  const containerRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [previewPos, setPreviewPos] = useState<Widget['position'] | null>(null);

  const widgets = page?.widgets ?? [];

  const maxRow = useMemo(() => {
    let m = 0;
    for (const w of widgets) m = Math.max(m, w.position.y + w.position.h);
    return Math.max(m, 12);
  }, [widgets]);

  if (!ws || !page) return null;

  const onPointerDown = (
    e: React.PointerEvent,
    widget: Widget,
    mode: 'move' | 'resize',
  ) => {
    if (!editMode) return;
    if (!containerRef.current) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setDrag({
      widgetId: widget.id,
      mode,
      startMouse: { x: e.clientX, y: e.clientY },
      startPos: { ...widget.position },
      containerRect: containerRef.current.getBoundingClientRect(),
    });
    setPreviewPos({ ...widget.position });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const colWidth = (drag.containerRect.width - GAP * (COLS - 1)) / COLS;
    const dx = e.clientX - drag.startMouse.x;
    const dy = e.clientY - drag.startMouse.y;
    const dCol = Math.round(dx / (colWidth + GAP));
    const dRow = Math.round(dy / (ROW_HEIGHT + GAP));

    let { x, y, w, h } = drag.startPos;
    if (drag.mode === 'move') {
      x = clamp(x + dCol, 0, COLS - w);
      y = Math.max(0, y + dRow);
    } else {
      w = clamp(w + dCol, 1, COLS - x);
      h = Math.max(1, h + dRow);
    }
    setPreviewPos({ x, y, w, h });
  };

  const onPointerUp = async () => {
    if (drag && previewPos) {
      await moveWidget(ws.id, page.id, drag.widgetId, previewPos);
    }
    setDrag(null);
    setPreviewPos(null);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full',
        editMode && 'grid-bg rounded-xl p-2',
      )}
      style={{
        minHeight: maxRow * (ROW_HEIGHT + GAP) + GAP,
      }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {widgets.map((widget) => {
        const isDragged = drag?.widgetId === widget.id;
        const pos = isDragged && previewPos ? previewPos : widget.position;
        const colWidth = `calc((100% - ${GAP * (COLS - 1)}px) / ${COLS})`;
        return (
          <div
            key={widget.id}
            className={cn(
              'absolute transition-[left,top,width,height]',
              isDragged && 'transition-none opacity-90 z-20',
            )}
            style={{
              left: `calc((${colWidth} + ${GAP}px) * ${pos.x})`,
              top: pos.y * (ROW_HEIGHT + GAP),
              width: `calc(${colWidth} * ${pos.w} + ${GAP * (pos.w - 1)}px)`,
              height: pos.h * ROW_HEIGHT + (pos.h - 1) * GAP,
            }}
          >
            <WidgetFrame
              widget={widget}
              wsId={ws.id}
              pageId={page.id}
              onMovePointerDown={(e) => onPointerDown(e, widget, 'move')}
              onResizePointerDown={(e) => onPointerDown(e, widget, 'resize')}
            >
              {renderWidget(widget, ws.id, page.id)}
            </WidgetFrame>
          </div>
        );
      })}
    </div>
  );
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
