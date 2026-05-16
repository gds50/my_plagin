// Core data model for MyStart

export const DATA_VERSION = 1;

export type WidgetType =
  | 'bookmarks'
  | 'search'
  | 'clock'
  | 'todo'
  | 'topsites'
  | 'recent';

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  icon?: string; // optional override
}

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
}

export type WidgetConfig =
  | BookmarksConfig
  | SearchConfig
  | ClockConfig
  | TodoConfig
  | TopSitesConfig
  | RecentConfig;

export interface BookmarksConfig {
  title: string;
  items: Bookmark[];
  layout: 'list' | 'grid';
  showIcons: boolean;
}

export interface SearchConfig {
  defaultEngine: string; // key of search engine
  openInNewTab: boolean;
  showEngineSwitcher: boolean;
}

export interface ClockConfig {
  format24: boolean;
  showSeconds: boolean;
  showDate: boolean;
  greeting: string; // empty -> no greeting
}

export interface TodoConfig {
  title: string;
  items: TodoItem[];
  hideCompleted: boolean;
}

export interface TopSitesConfig {
  title: string;
  limit: number; // max 12
  hidden: string[]; // blacklisted urls
}

export interface RecentConfig {
  title: string;
  limit: number;
}

export interface Widget {
  id: string;
  type: WidgetType;
  position: { x: number; y: number; w: number; h: number };
  config: WidgetConfig;
}

export interface Page {
  id: string;
  name: string;
  widgets: Widget[];
}

export interface Workspace {
  id: string;
  name: string;
  icon: string; // emoji
  pages: Page[];
  activePageId: string;
}

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface BackgroundSetting {
  type: 'color' | 'gradient' | 'image-url';
  value: string;
}

export type SyncProviderId = 'none' | 'gist' | 'gdrive';

export interface SyncState {
  provider: SyncProviderId;
  autoSync: boolean;
  gistId?: string;
  lastPushAt?: number;
  lastPullAt?: number;
}

export interface Settings {
  theme: ThemeMode;
  background: BackgroundSetting;
  defaultSearchEngine: string;
  sync: SyncState;
  autoBackupDays: number; // 0 = off
  lastBackupAt?: number;
}

export interface AppData {
  version: number;
  workspaces: Workspace[];
  activeWorkspaceId: string;
  settings: Settings;
  updatedAt: number;
}

export interface SearchEngine {
  key: string;
  name: string;
  url: string; // contains {q}
  bang?: string; // e.g. "g", "yt"
  icon?: string;
}
