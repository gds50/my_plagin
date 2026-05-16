/// <reference types="chrome" />
// MyStart background service worker.
// Responsibilities:
//   - schedule auto-backup via chrome.alarms
//   - schedule periodic sync push (best effort)

const BACKUP_ALARM = 'mystart-auto-backup';
const SYNC_ALARM = 'mystart-sync';
const STORAGE_KEY = 'mystart.data.v1';

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(BACKUP_ALARM, { periodInMinutes: 60 });
  chrome.alarms.create(SYNC_ALARM, { periodInMinutes: 30 });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === BACKUP_ALARM) {
    await maybeAutoBackup();
  } else if (alarm.name === SYNC_ALARM) {
    await maybeSyncPush();
  }
});

async function maybeAutoBackup(): Promise<void> {
  const res = await chrome.storage.local.get(STORAGE_KEY);
  const data = res[STORAGE_KEY] as
    | { settings?: { autoBackupDays?: number; lastBackupAt?: number } }
    | undefined;
  if (!data?.settings) return;
  const days = data.settings.autoBackupDays ?? 0;
  if (days <= 0) return;
  const last = data.settings.lastBackupAt ?? 0;
  const now = Date.now();
  if (now - last < days * 24 * 3600 * 1000) return;

  const filename = backupFilename();
  const json = JSON.stringify(data, null, 2);
  const url = `data:application/json;base64,${btoa(unescape(encodeURIComponent(json)))}`;
  try {
    await chrome.downloads.download({ url, filename, saveAs: false });
    const next = {
      ...data,
      settings: { ...data.settings, lastBackupAt: now },
    };
    await chrome.storage.local.set({ [STORAGE_KEY]: next });
  } catch (e) {
    console.warn('[MyStart] auto-backup failed', e);
  }
}

async function maybeSyncPush(): Promise<void> {
  const [res, tokenRes] = await Promise.all([
    chrome.storage.local.get(STORAGE_KEY),
    chrome.storage.local.get('mystart.gist.token'),
  ]);
  const data = res[STORAGE_KEY] as
    | {
        settings?: {
          sync?: {
            provider?: string;
            autoSync?: boolean;
            gistId?: string;
            lastPushAt?: number;
          };
        };
        updatedAt?: number;
      }
    | undefined;
  const token = tokenRes['mystart.gist.token'] as string | undefined;
  if (!data?.settings?.sync) return;
  const { provider, autoSync, gistId, lastPushAt } = data.settings.sync;
  if (!autoSync || provider !== 'gist' || !token) return;
  // skip if no changes since last push
  if (lastPushAt && data.updatedAt && data.updatedAt <= lastPushAt) return;

  const body = JSON.stringify({
    files: { 'mystart-config.json': { content: JSON.stringify(data, null, 2) } },
  });
  try {
    if (!gistId) {
      const createRes = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: ghHeaders(token),
        body: JSON.stringify({
          description: 'MyStart config (auto-managed). Do not edit manually.',
          public: false,
          files: { 'mystart-config.json': { content: JSON.stringify(data, null, 2) } },
        }),
      });
      if (!createRes.ok) throw new Error(`HTTP ${createRes.status}`);
      const created = (await createRes.json()) as { id: string };
      const next = {
        ...data,
        settings: {
          ...data.settings,
          sync: { ...data.settings.sync, gistId: created.id, lastPushAt: Date.now() },
        },
      };
      await chrome.storage.local.set({ [STORAGE_KEY]: next });
    } else {
      const r = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'PATCH',
        headers: ghHeaders(token),
        body,
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const next = {
        ...data,
        settings: {
          ...data.settings,
          sync: { ...data.settings.sync, lastPushAt: Date.now() },
        },
      };
      await chrome.storage.local.set({ [STORAGE_KEY]: next });
    }
  } catch (e) {
    console.warn('[MyStart] background sync push failed', e);
  }
}

function ghHeaders(token: string): Record<string, string> {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}

function backupFilename(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `mystart-backups/mystart-backup-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.json`;
}

export {}; // keep this module-typed
