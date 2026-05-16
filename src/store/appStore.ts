import { create } from 'zustand';
import type {
  AppData,
  Bookmark,
  BookmarksConfig,
  Page,
  Settings,
  Widget,
  WidgetConfig,
  WidgetType,
  Workspace,
} from '@/types';
import { loadAppData, saveAppData, subscribeAppData, defaultAppData } from '@/lib/storage';
import { uid } from '@/lib/uid';

interface Store {
  data: AppData;
  loaded: boolean;
  /** Replace the entire app data (e.g. after import or sync pull) */
  replaceAll: (next: AppData) => Promise<void>;
  /** Patch settings */
  patchSettings: (patch: Partial<Settings>) => Promise<void>;

  // workspaces
  addWorkspace: (name: string, icon?: string) => Promise<string>;
  renameWorkspace: (id: string, name: string, icon?: string) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  setActiveWorkspace: (id: string) => Promise<void>;

  // pages
  addPage: (wsId: string, name: string) => Promise<string>;
  renamePage: (wsId: string, pageId: string, name: string) => Promise<void>;
  deletePage: (wsId: string, pageId: string) => Promise<void>;
  setActivePage: (wsId: string, pageId: string) => Promise<void>;

  // widgets
  addWidget: (wsId: string, pageId: string, type: WidgetType) => Promise<string>;
  updateWidget: (wsId: string, pageId: string, widgetId: string, patch: Partial<Widget>) => Promise<void>;
  patchWidgetConfig: (
    wsId: string,
    pageId: string,
    widgetId: string,
    patch: Partial<WidgetConfig>,
  ) => Promise<void>;
  removeWidget: (wsId: string, pageId: string, widgetId: string) => Promise<void>;
  moveWidget: (
    wsId: string,
    pageId: string,
    widgetId: string,
    position: Widget['position'],
  ) => Promise<void>;

  /**
   * Move a bookmark from one bookmarks-widget to another (possibly across
   * workspaces / pages). No-op if either widget is missing or not of type
   * 'bookmarks', or if src === dst.
   */
  moveBookmark: (
    src: { wsId: string; pageId: string; widgetId: string; bookmarkId: string },
    dst: { wsId: string; pageId: string; widgetId: string },
  ) => Promise<void>;
}

function findWs(data: AppData, id: string): Workspace | undefined {
  return data.workspaces.find((w) => w.id === id);
}
function findPage(ws: Workspace, id: string): Page | undefined {
  return ws.pages.find((p) => p.id === id);
}

function defaultWidgetConfig(type: WidgetType): WidgetConfig {
  switch (type) {
    case 'bookmarks':
      return { title: 'Закладки', items: [], layout: 'list', showIcons: true };
    case 'search':
      return { defaultEngine: 'google', openInNewTab: false, showEngineSwitcher: true };
    case 'clock':
      return { format24: true, showSeconds: false, showDate: true, greeting: '' };
    case 'todo':
      return { title: 'Задачи', items: [], hideCompleted: false };
    case 'topsites':
      return { title: 'Часто посещаемые', limit: 8, hidden: [] };
    case 'recent':
      return { title: 'Недавние', limit: 8 };
  }
}

function defaultWidgetSize(type: WidgetType): Widget['position'] {
  switch (type) {
    case 'clock':
      return { x: 0, y: 0, w: 6, h: 2 };
    case 'search':
      return { x: 0, y: 0, w: 6, h: 2 };
    default:
      return { x: 0, y: 0, w: 4, h: 4 };
  }
}

async function persist(data: AppData) {
  await saveAppData(data);
}

export const useAppStore = create<Store>((set, get) => ({
  data: defaultAppData(),
  loaded: false,

  replaceAll: async (next) => {
    set({ data: next });
    await persist(next);
  },

  patchSettings: async (patch) => {
    const data = { ...get().data, settings: { ...get().data.settings, ...patch } };
    set({ data });
    await persist(data);
  },

  addWorkspace: async (name, icon = '🗂️') => {
    const pageId = uid('page');
    const ws: Workspace = {
      id: uid('ws'),
      name,
      icon,
      activePageId: pageId,
      pages: [{ id: pageId, name: 'Страница 1', widgets: [] }],
    };
    const data = { ...get().data, workspaces: [...get().data.workspaces, ws] };
    set({ data });
    await persist(data);
    return ws.id;
  },

  renameWorkspace: async (id, name, icon) => {
    const data = {
      ...get().data,
      workspaces: get().data.workspaces.map((w) =>
        w.id === id ? { ...w, name, icon: icon ?? w.icon } : w,
      ),
    };
    set({ data });
    await persist(data);
  },

  deleteWorkspace: async (id) => {
    const cur = get().data;
    if (cur.workspaces.length <= 1) return;
    const list = cur.workspaces.filter((w) => w.id !== id);
    const data = {
      ...cur,
      workspaces: list,
      activeWorkspaceId: cur.activeWorkspaceId === id ? list[0].id : cur.activeWorkspaceId,
    };
    set({ data });
    await persist(data);
  },

  setActiveWorkspace: async (id) => {
    const data = { ...get().data, activeWorkspaceId: id };
    set({ data });
    await persist(data);
  },

  addPage: async (wsId, name) => {
    const pageId = uid('page');
    const data = {
      ...get().data,
      workspaces: get().data.workspaces.map((w) =>
        w.id === wsId
          ? { ...w, pages: [...w.pages, { id: pageId, name, widgets: [] }], activePageId: pageId }
          : w,
      ),
    };
    set({ data });
    await persist(data);
    return pageId;
  },

  renamePage: async (wsId, pageId, name) => {
    const data = {
      ...get().data,
      workspaces: get().data.workspaces.map((w) =>
        w.id === wsId
          ? { ...w, pages: w.pages.map((p) => (p.id === pageId ? { ...p, name } : p)) }
          : w,
      ),
    };
    set({ data });
    await persist(data);
  },

  deletePage: async (wsId, pageId) => {
    const cur = get().data;
    const ws = findWs(cur, wsId);
    if (!ws || ws.pages.length <= 1) return;
    const pages = ws.pages.filter((p) => p.id !== pageId);
    const data = {
      ...cur,
      workspaces: cur.workspaces.map((w) =>
        w.id === wsId
          ? {
              ...w,
              pages,
              activePageId: w.activePageId === pageId ? pages[0].id : w.activePageId,
            }
          : w,
      ),
    };
    set({ data });
    await persist(data);
  },

  setActivePage: async (wsId, pageId) => {
    const data = {
      ...get().data,
      workspaces: get().data.workspaces.map((w) =>
        w.id === wsId ? { ...w, activePageId: pageId } : w,
      ),
    };
    set({ data });
    await persist(data);
  },

  addWidget: async (wsId, pageId, type) => {
    const widget: Widget = {
      id: uid('w'),
      type,
      position: defaultWidgetSize(type),
      config: defaultWidgetConfig(type),
    };
    const data = {
      ...get().data,
      workspaces: get().data.workspaces.map((w) =>
        w.id === wsId
          ? {
              ...w,
              pages: w.pages.map((p) =>
                p.id === pageId ? { ...p, widgets: [...p.widgets, widget] } : p,
              ),
            }
          : w,
      ),
    };
    set({ data });
    await persist(data);
    return widget.id;
  },

  updateWidget: async (wsId, pageId, widgetId, patch) => {
    const data = {
      ...get().data,
      workspaces: get().data.workspaces.map((w) =>
        w.id === wsId
          ? {
              ...w,
              pages: w.pages.map((p) =>
                p.id === pageId
                  ? {
                      ...p,
                      widgets: p.widgets.map((wd) =>
                        wd.id === widgetId ? { ...wd, ...patch } : wd,
                      ),
                    }
                  : p,
              ),
            }
          : w,
      ),
    };
    set({ data });
    await persist(data);
  },

  patchWidgetConfig: async (wsId, pageId, widgetId, patch) => {
    const data = {
      ...get().data,
      workspaces: get().data.workspaces.map((w) =>
        w.id === wsId
          ? {
              ...w,
              pages: w.pages.map((p) =>
                p.id === pageId
                  ? {
                      ...p,
                      widgets: p.widgets.map((wd) =>
                        wd.id === widgetId
                          ? ({ ...wd, config: { ...wd.config, ...patch } } as Widget)
                          : wd,
                      ),
                    }
                  : p,
              ),
            }
          : w,
      ),
    };
    set({ data });
    await persist(data);
  },

  removeWidget: async (wsId, pageId, widgetId) => {
    const data = {
      ...get().data,
      workspaces: get().data.workspaces.map((w) =>
        w.id === wsId
          ? {
              ...w,
              pages: w.pages.map((p) =>
                p.id === pageId
                  ? { ...p, widgets: p.widgets.filter((wd) => wd.id !== widgetId) }
                  : p,
              ),
            }
          : w,
      ),
    };
    set({ data });
    await persist(data);
  },

  moveWidget: async (wsId, pageId, widgetId, position) => {
    await get().updateWidget(wsId, pageId, widgetId, { position });
  },

  moveBookmark: async (src, dst) => {
    if (src.widgetId === dst.widgetId) return;
    const cur = get().data;

    // Locate source widget and bookmark
    let bookmark: Bookmark | undefined;
    const findBookmarks = (wsId: string, pageId: string, widgetId: string) => {
      const ws = cur.workspaces.find((w) => w.id === wsId);
      const page = ws?.pages.find((p) => p.id === pageId);
      const widget = page?.widgets.find((w) => w.id === widgetId);
      if (!widget || widget.type !== 'bookmarks') return null;
      return widget.config as BookmarksConfig;
    };

    const srcCfg = findBookmarks(src.wsId, src.pageId, src.widgetId);
    const dstCfg = findBookmarks(dst.wsId, dst.pageId, dst.widgetId);
    if (!srcCfg || !dstCfg) return;
    bookmark = srcCfg.items.find((i) => i.id === src.bookmarkId);
    if (!bookmark) return;
    // Avoid duplicates if the bookmark id already exists in the destination
    if (dstCfg.items.some((i) => i.id === bookmark!.id)) return;

    const data: AppData = {
      ...cur,
      workspaces: cur.workspaces.map((w) => ({
        ...w,
        pages: w.pages.map((p) => ({
          ...p,
          widgets: p.widgets.map((wd) => {
            if (wd.type !== 'bookmarks') return wd;
            if (wd.id === src.widgetId) {
              const cfg = wd.config as BookmarksConfig;
              return {
                ...wd,
                config: {
                  ...cfg,
                  items: cfg.items.filter((i) => i.id !== src.bookmarkId),
                },
              } as Widget;
            }
            if (wd.id === dst.widgetId) {
              const cfg = wd.config as BookmarksConfig;
              return {
                ...wd,
                config: { ...cfg, items: [...cfg.items, bookmark!] },
              } as Widget;
            }
            return wd;
          }),
        })),
      })),
    };
    set({ data });
    await persist(data);
  },
}));

// Bootstrap: load from storage and subscribe to external changes (cross-tab/sync).
export async function bootstrapStore(): Promise<void> {
  const data = await loadAppData();
  useAppStore.setState({ data, loaded: true });
  subscribeAppData((next) => {
    if (next.updatedAt !== useAppStore.getState().data.updatedAt) {
      useAppStore.setState({ data: next });
    }
  });
}

// Convenience selectors
export function selectActiveWorkspace(s: Store): Workspace | undefined {
  return findWs(s.data, s.data.activeWorkspaceId);
}

export function selectActivePage(s: Store): Page | undefined {
  const ws = selectActiveWorkspace(s);
  if (!ws) return undefined;
  return findPage(ws, ws.activePageId);
}

export { findWs, findPage };
