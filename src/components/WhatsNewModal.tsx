import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { APP_VERSION, entriesSince, type ChangelogEntry } from '@/lib/changelog';
import { getMeta, patchMeta } from '@/lib/storage';

/**
 * Compares the current APP_VERSION with the value stored in meta-storage.
 * If newer, shows a modal with all changelog entries since the last seen
 * version, then persists the new version on dismiss.
 *
 * Renders nothing on first install (no stored version) by default — we don't
 * want to greet brand-new users with a list of changes. Set
 * `showOnFreshInstall` to opt-in.
 */
export function WhatsNewModal({ showOnFreshInstall = false }: { showOnFreshInstall?: boolean }) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const meta = await getMeta();
      const last = meta.lastSeenVersion;
      if (!last) {
        // Fresh install: record current version silently unless explicitly told otherwise.
        if (!showOnFreshInstall) {
          await patchMeta({ lastSeenVersion: APP_VERSION });
          return;
        }
      }
      const list = entriesSince(last ?? null);
      if (cancelled) return;
      if (list.length > 0) {
        setEntries(list);
        setOpen(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showOnFreshInstall]);

  const close = async () => {
    setOpen(false);
    await patchMeta({ lastSeenVersion: APP_VERSION });
  };

  return (
    <Modal open={open} onClose={close} title={`Что нового · MyStart ${APP_VERSION}`} size="lg">
      <div className="space-y-4 max-h-[60vh] overflow-auto pr-1">
        {entries.map((e) => (
          <section key={e.version}>
            <h3 className="font-semibold text-sm">
              v{e.version}{' '}
              <span className="text-fg-muted text-xs font-normal">— {e.date}</span>
            </h3>
            <ul className="mt-1 list-disc list-inside text-sm space-y-1">
              {e.ru.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <div className="flex justify-end pt-3">
        <button className="btn btn-primary" onClick={close}>
          Понятно
        </button>
      </div>
    </Modal>
  );
}
