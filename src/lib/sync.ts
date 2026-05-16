// Sync service: handles GitHub Gist pull/push with debounce.
// Stays out of UI; called from App and Options.

import type { AppData } from '@/types';
import { useAppStore } from '@/store/appStore';
import { useUiStore } from '@/store/uiStore';
import { createGist, pullGist, pushGist, hasToken, findExistingGist } from '@/lib/gist';

let pushTimer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 30_000;
let initialized = false;

async function doPush(): Promise<void> {
  const state = useAppStore.getState();
  const data = state.data;
  if (data.settings.sync.provider !== 'gist') return;
  if (!(await hasToken())) return;
  try {
    let gistId = data.settings.sync.gistId;
    if (!gistId) {
      gistId = await createGist(data);
      await state.patchSettings({
        sync: { ...data.settings.sync, gistId, lastPushAt: Date.now() },
      });
      useUiStore.getState().notify('Создан приватный Gist для синхронизации', 'success');
    } else {
      await pushGist(gistId, data);
      await state.patchSettings({
        sync: { ...data.settings.sync, lastPushAt: Date.now() },
      });
    }
  } catch (e) {
    useUiStore.getState().notify(`Sync push error: ${(e as Error).message}`, 'error');
  }
}

export function scheduleSyncPush(): void {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(doPush, DEBOUNCE_MS);
}

export async function syncPushNow(): Promise<void> {
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  await doPush();
}

export async function syncPullNow(): Promise<AppData | null> {
  const state = useAppStore.getState();
  const data = state.data;
  if (!(await hasToken())) return null;
  try {
    // If we don't have a gistId yet (e.g. fresh install on a new device),
    // try to discover the existing MyStart gist on this GitHub account.
    let gistId = data.settings.sync.gistId;
    if (!gistId) {
      const found = await findExistingGist();
      if (!found) return null;
      gistId = found;
      await state.patchSettings({
        sync: { ...data.settings.sync, gistId, lastPullAt: Date.now() },
      });
      useUiStore.getState().notify('Найдён существующий Gist для синхронизации', 'success');
    }
    const remote = await pullGist(gistId);
    if (!remote) return null;
    await state.patchSettings({
      sync: { ...useAppStore.getState().data.settings.sync, lastPullAt: Date.now() },
    });
    return remote;
  } catch (e) {
    useUiStore.getState().notify(`Sync pull error: ${(e as Error).message}`, 'error');
    return null;
  }
}

export function initSyncWatcher(): void {
  if (initialized) return;
  initialized = true;
  let prevUpdated = useAppStore.getState().data.updatedAt;
  useAppStore.subscribe((s) => {
    const ts = s.data.updatedAt;
    if (ts !== prevUpdated && s.data.settings.sync.autoSync && s.data.settings.sync.provider === 'gist') {
      prevUpdated = ts;
      scheduleSyncPush();
    } else {
      prevUpdated = ts;
    }
  });
}
