import type { AppData, Workspace, Settings } from '@/types';
import { DATA_VERSION } from '@/types';
import { uid } from './uid';

const STORAGE_KEY = 'mystart.data.v1';

export const defaultSettings = (): Settings => ({
  theme: 'dark',
  background: { type: 'gradient', value: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' },
  defaultSearchEngine: 'google',
  sync: { provider: 'none', autoSync: false },
  autoBackupDays: 7,
});

export const defaultWorkspace = (): Workspace => {
  const pageId = uid('page');
  return {
    id: uid('ws'),
    name: 'Главная',
    icon: '🏠',
    activePageId: pageId,
    pages: [
      {
        id: pageId,
        name: 'Старт',
        widgets: [
          {
            id: uid('w'),
            type: 'clock',
            position: { x: 0, y: 0, w: 6, h: 2 },
            config: { format24: true, showSeconds: false, showDate: true, greeting: '' },
          },
          {
            id: uid('w'),
            type: 'search',
            position: { x: 6, y: 0, w: 6, h: 2 },
            config: { defaultEngine: 'google', openInNewTab: false, showEngineSwitcher: true },
          },
          {
            id: uid('w'),
            type: 'bookmarks',
            position: { x: 0, y: 2, w: 4, h: 4 },
            config: {
              title: 'Закладки',
              items: [
                { id: uid('b'), title: 'GitHub', url: 'https://github.com' },
                { id: uid('b'), title: 'Gmail', url: 'https://mail.google.com' },
                { id: uid('b'), title: 'YouTube', url: 'https://youtube.com' },
              ],
              layout: 'list',
              showIcons: true,
            },
          },
          {
            id: uid('w'),
            type: 'topsites',
            position: { x: 4, y: 2, w: 4, h: 4 },
            config: { title: 'Часто посещаемые', limit: 8, hidden: [] },
          },
          {
            id: uid('w'),
            type: 'recent',
            position: { x: 8, y: 2, w: 4, h: 4 },
            config: { title: 'Недавние', limit: 8 },
          },
          {
            id: uid('w'),
            type: 'todo',
            position: { x: 0, y: 6, w: 6, h: 4 },
            config: { title: 'Задачи', items: [], hideCompleted: false },
          },
        ],
      },
    ],
  };
};

export const defaultAppData = (): AppData => {
  const ws = defaultWorkspace();
  return {
    version: DATA_VERSION,
    workspaces: [ws],
    activeWorkspaceId: ws.id,
    settings: defaultSettings(),
    updatedAt: Date.now(),
  };
};

// Detect whether we're inside a Chrome extension context
const hasChromeStorage =
  typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.storage.local;

async function rawGet<T = unknown>(key: string): Promise<T | undefined> {
  if (hasChromeStorage) {
    const res = await chrome.storage.local.get(key);
    return res[key] as T | undefined;
  }
  const raw = localStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : undefined;
}

async function rawSet(key: string, value: unknown): Promise<void> {
  if (hasChromeStorage) {
    await chrome.storage.local.set({ [key]: value });
    return;
  }
  localStorage.setItem(key, JSON.stringify(value));
}

export async function loadAppData(): Promise<AppData> {
  const data = await rawGet<AppData>(STORAGE_KEY);
  if (!data) {
    const fresh = defaultAppData();
    await rawSet(STORAGE_KEY, fresh);
    return fresh;
  }
  // simple migration hook
  if (!data.version || data.version < DATA_VERSION) {
    data.version = DATA_VERSION;
  }
  return data;
}

export async function saveAppData(data: AppData): Promise<void> {
  data.updatedAt = Date.now();
  await rawSet(STORAGE_KEY, data);
}

export function subscribeAppData(cb: (data: AppData) => void): () => void {
  if (!hasChromeStorage) return () => {};
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    area: chrome.storage.AreaName,
  ) => {
    if (area !== 'local') return;
    const c = changes[STORAGE_KEY];
    if (c?.newValue) cb(c.newValue as AppData);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}

export const STORAGE_KEYS = { app: STORAGE_KEY };
