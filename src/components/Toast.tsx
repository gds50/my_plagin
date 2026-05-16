import { useUiStore } from '@/store/uiStore';
import { cn } from '@/lib/cn';

export function Toast() {
  const toast = useUiStore((s) => s.toast);
  if (!toast) return null;
  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-lg shadow-lg text-sm',
        toast.kind === 'error' && 'bg-red-600 text-white',
        toast.kind === 'success' && 'bg-emerald-600 text-white',
        toast.kind === 'info' && 'bg-slate-700 text-white',
      )}
    >
      {toast.text}
    </div>
  );
}
