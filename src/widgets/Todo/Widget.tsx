import { useState } from 'react';
import type { Widget, TodoConfig, TodoItem } from '@/types';
import { useAppStore } from '@/store/appStore';
import { uid } from '@/lib/uid';
import { cn } from '@/lib/cn';

interface Props {
  widget: Widget;
  wsId: string;
  pageId: string;
}

export function TodoWidget({ widget, wsId, pageId }: Props) {
  const cfg = widget.config as TodoConfig;
  const patch = useAppStore((s) => s.patchWidgetConfig);
  const [text, setText] = useState('');

  const items = cfg.hideCompleted ? cfg.items.filter((i) => !i.done) : cfg.items;

  const onAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const newItem: TodoItem = { id: uid('t'), text: text.trim(), done: false, createdAt: Date.now() };
    void patch(wsId, pageId, widget.id, { items: [...cfg.items, newItem] });
    setText('');
  };

  const onToggle = (id: string) => {
    void patch(wsId, pageId, widget.id, {
      items: cfg.items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)),
    });
  };

  const onDelete = (id: string) => {
    void patch(wsId, pageId, widget.id, { items: cfg.items.filter((i) => i.id !== id) });
  };

  return (
    <div className="p-3 h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold truncate">{cfg.title}</h3>
        <span className="text-xs text-fg-muted">
          {cfg.items.filter((i) => !i.done).length} / {cfg.items.length}
        </span>
      </div>
      <form onSubmit={onAdd} className="mb-2">
        <input
          className="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Новая задача… (Enter)"
        />
      </form>
      <div className="flex-1 overflow-auto space-y-1">
        {items.length === 0 ? (
          <div className="text-xs text-fg-muted text-center py-4">Нет задач</div>
        ) : (
          items.map((i) => (
            <div
              key={i.id}
              className="group flex items-center gap-2 px-2 py-1 rounded hover:bg-bg-soft/40"
            >
              <input
                type="checkbox"
                checked={i.done}
                onChange={() => onToggle(i.id)}
                className="shrink-0"
              />
              <span className={cn('flex-1 text-sm', i.done && 'line-through text-fg-muted')}>
                {i.text}
              </span>
              <button
                className="opacity-0 group-hover:opacity-100 text-red-400 text-xs px-1"
                onClick={() => onDelete(i.id)}
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function TodoSettings({ widget, wsId, pageId }: Props) {
  const cfg = widget.config as TodoConfig;
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
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={cfg.hideCompleted}
          onChange={(e) => patch(wsId, pageId, widget.id, { hideCompleted: e.target.checked })}
        />
        Скрывать выполненные
      </label>
      <button
        className="btn w-full"
        onClick={() => {
          if (confirm('Удалить все выполненные задачи?')) {
            void patch(wsId, pageId, widget.id, { items: cfg.items.filter((i) => !i.done) });
          }
        }}
      >
        Очистить выполненные
      </button>
    </div>
  );
}
