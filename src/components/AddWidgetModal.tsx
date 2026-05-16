import { Modal } from './Modal';
import { allWidgetTypes, widgetMeta } from '@/widgets/_registry';
import { useAppStore, selectActiveWorkspace, selectActivePage } from '@/store/appStore';

export function AddWidgetModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addWidget = useAppStore((s) => s.addWidget);
  const ws = useAppStore(selectActiveWorkspace);
  const page = useAppStore(selectActivePage);

  const onPick = async (type: (typeof allWidgetTypes)[number]) => {
    if (!ws || !page) return;
    await addWidget(ws.id, page.id, type);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Добавить виджет" size="lg">
      <div className="grid grid-cols-2 gap-2">
        {allWidgetTypes.map((t) => {
          const m = widgetMeta[t];
          return (
            <button
              key={t}
              className="card p-3 text-left hover:bg-bg-soft/50 transition-colors"
              onClick={() => onPick(t)}
            >
              <div className="text-2xl mb-1">{m.icon}</div>
              <div className="font-semibold">{m.label}</div>
              <div className="text-xs text-fg-muted">{m.description}</div>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
