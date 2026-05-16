import type { ComponentType } from 'react';
import type { Widget, WidgetType } from '@/types';
import { BookmarksWidget, BookmarksSettings } from './BookmarksGroup/Widget';
import { SearchWidget, SearchSettings } from './Search/Widget';
import { ClockWidget, ClockSettings } from './Clock/Widget';
import { TodoWidget, TodoSettings } from './Todo/Widget';
import { TopSitesWidget, TopSitesSettings } from './TopSites/Widget';
import { RecentWidget, RecentSettings } from './Recent/Widget';

export interface WidgetMeta {
  label: string;
  description: string;
  icon: string;
  Settings?: ComponentType<{ widget: Widget; wsId: string; pageId: string }>;
}

export const widgetMeta: Record<WidgetType, WidgetMeta> = {
  bookmarks: {
    label: 'Закладки',
    description: 'Группа ссылок с иконками сайтов',
    icon: '🔖',
    Settings: BookmarksSettings,
  },
  search: {
    label: 'Поиск',
    description: 'Строка поиска с bang-командами',
    icon: '🔍',
    Settings: SearchSettings,
  },
  clock: {
    label: 'Часы',
    description: 'Время и дата',
    icon: '🕐',
    Settings: ClockSettings,
  },
  todo: {
    label: 'Задачи',
    description: 'Простой to-do список',
    icon: '✅',
    Settings: TodoSettings,
  },
  topsites: {
    label: 'Часто посещаемые',
    description: 'Топ сайтов из Chrome',
    icon: '⭐',
    Settings: TopSitesSettings,
  },
  recent: {
    label: 'Недавние',
    description: 'Недавно закрытые вкладки',
    icon: '🕘',
    Settings: RecentSettings,
  },
};

export function renderWidget(widget: Widget, wsId: string, pageId: string) {
  switch (widget.type) {
    case 'bookmarks':
      return <BookmarksWidget widget={widget} wsId={wsId} pageId={pageId} />;
    case 'search':
      return <SearchWidget widget={widget} wsId={wsId} pageId={pageId} />;
    case 'clock':
      return <ClockWidget widget={widget} wsId={wsId} pageId={pageId} />;
    case 'todo':
      return <TodoWidget widget={widget} wsId={wsId} pageId={pageId} />;
    case 'topsites':
      return <TopSitesWidget widget={widget} wsId={wsId} pageId={pageId} />;
    case 'recent':
      return <RecentWidget widget={widget} wsId={wsId} pageId={pageId} />;
  }
}

export const allWidgetTypes: WidgetType[] = [
  'bookmarks',
  'search',
  'clock',
  'todo',
  'topsites',
  'recent',
];
