// In-app changelog used by the "What's new" modal.
// IMPORTANT: When you ship a release, do ALL of the following:
//   1. Bump "version" in package.json (SemVer: MAJOR.MINOR.PATCH).
//      The Chrome manifest version is generated from package.json automatically.
//   2. Add a new entry at the TOP of the `changelog` array below.
//   3. Mirror the entry in CHANGELOG.md (the human-readable source of truth).
//
// The newtab page compares this list with the user's last-seen version stored
// in chrome.storage.local under key `mystart.meta.lastSeenVersion` and shows
// the modal with all entries newer than that.

export interface ChangelogEntry {
  /** Semver string, e.g. "0.2.0" */
  version: string;
  /** ISO date YYYY-MM-DD */
  date: string;
  /** Russian-language bullet points (primary). */
  ru: string[];
  /** English-language bullet points. */
  en: string[];
}

/**
 * Newest entry first. Never edit historical entries — only append on top.
 */
export const changelog: ChangelogEntry[] = [
  {
    version: '0.4.0',
    date: '2026-05-16',
    ru: [
      'Закладки теперь можно перетаскивать мышью внутри виджета для изменения порядка — включите «✎» или режим редактирования.',
      'Исправлена кодировка при получении заголовка с русскоязычных сайтов (vk.ru и др. на windows-1251): больше нет кракозябр.',
      'Разрешение на доступ к сайтам для подтягивания заголовков теперь спрашивается один раз на все сайты, а не на каждый домен отдельно.',
      'Поисковик по умолчанию из Настроек теперь реально применяется в виджете поиска (раньше игнорировался).',
      'В Настройках выбор поисковика сделан выпадающим списком (как в виджете) вместо ручного ввода key.',
    ],
    en: [
      'Bookmarks can now be reordered by dragging within a widget — enable «✎» or full edit mode.',
      'Fixed encoding for page-title fetch from Russian sites (vk.ru and other windows-1251 pages): no more garbled text.',
      'Site-access permission for title fetching is now asked once for all sites instead of per-domain.',
      'Default search engine from Settings is now actually applied in the search widget (was ignored before).',
      'Search engine picker in Settings is a proper dropdown now (matches the widget), no more typing the key by hand.',
    ],
  },
  {
    version: '0.3.0',
    date: '2026-05-16',
    ru: [
      'Страница теперь вписывается в одно окно без прокрутки вниз и вправо.',
      'Сетка виджетов автоматически подстраивается под размер экрана: позиции синхронизируются, а физический размер строки рассчитывается локально под конкретный монитор.',
      'Переключатель темы (Тёмная / Светлая / Авто) вынесен в меню «⋯» на главной странице — без перехода в настройки.',
      'Кнопка «⌘K» убрана из шапки (вызов командной строки по-прежнему работает клавишами Ctrl/Cmd+K).',
    ],
    en: [
      'Dashboard now fits in a single window — no vertical or horizontal scroll.',
      'Widget grid adapts to the local screen: positions sync via Gist, but row height is computed locally per monitor.',
      'Theme switcher (Dark / Light / Auto) is now in the «⋯» menu on the main page — no need to open Settings.',
      'Removed the «⌘K» button from the top bar (keyboard shortcut Ctrl/Cmd+K still works).',
    ],
  },
  {
    version: '0.2.4',
    date: '2026-05-16',
    ru: [
      'Pull с GitHub Gist теперь работает на новом устройстве: если локальный gistId пуст, существующий Gist находится автоматически по имени файла.',
      'Кнопка «Pull сейчас» активна, как только заданы токен и провайдер «GitHub Gist».',
    ],
    en: [
      'GitHub Gist Pull now works on a new device: if no local gistId, an existing gist is auto-discovered by filename.',
      'The “Pull now” button is enabled as soon as a token is saved and the provider is set to GitHub Gist.',
    ],
  },
  {
    version: '0.2.3',
    date: '2026-05-16',
    ru: [
      '«Закладки» (grid): 5 иконок в ряд, подпись в 2 строки с обрезкой остального.',
    ],
    en: [
      'Bookmarks (grid): 5 tiles per row, label clamped to 2 lines (overflow hidden).',
    ],
  },
  {
    version: '0.2.2',
    date: '2026-05-16',
    ru: [
      'Резиновая сетка в виджете «Закладки» (вариант grid): плитки подстраиваются под ширину виджета и длину подписи, в ряду помещается 2/3/4… элементов.',
      'Короткая подпись → плитка почти квадратная; длинная → расширяется, но не больше половины виджета.',
    ],
    en: [
      'Bookmarks widget (grid layout) is now responsive: tiles adapt to widget width and label length; 2/3/4… per row.',
      'Short label → near-square tile; long label → wider, but capped at ~half the widget.',
    ],
  },
  {
    version: '0.2.1',
    date: '2026-05-16',
    ru: [
      'Перетаскивание ссылок из виджетов «Часто посещаемые» и «Недавние» в виджет «Закладки» (в режиме полного редактирования).',
      'Дубликаты по URL при перетаскивании игнорируются.',
    ],
    en: [
      'Drag links from TopSites and Recent widgets into a Bookmarks widget (in full edit mode).',
      'Drops are deduplicated by URL.',
    ],
  },
  {
    version: '0.2.0',
    date: '2026-05-16',
    ru: [
      'Закладки: новая кнопка ✎ в виджете — редактирование содержимого без включения общего режима.',
      'Закладки: при вставке URL автоматически подтягивается заголовок страницы (с разрешением Chrome на конкретный сайт).',
      'Закладки: перетаскивание мышью между виджетами в режиме полного редактирования.',
      'Новое: окно «Что нового» при обновлении расширения.',
    ],
    en: [
      'Bookmarks: new ✎ button on each widget — edit contents without enabling global edit mode.',
      'Bookmarks: pasting a URL auto-fetches the page title (per-site Chrome permission requested on demand).',
      'Bookmarks: drag-and-drop bookmarks between widgets in full edit mode.',
      'New: "What\'s new" dialog shown after an update.',
    ],
  },
  {
    version: '0.1.0',
    date: '2026-05-01',
    ru: ['Первый публичный релиз.'],
    en: ['First public release.'],
  },
];

/** Current app version, kept in sync with package.json at build time. */
export const APP_VERSION = '0.4.0';

/**
 * Compare two semver-ish strings. Returns >0 if a>b, <0 if a<b, 0 if equal.
 * Treats missing parts as 0. Ignores pre-release suffixes after `-`.
 */
export function compareVersions(a: string, b: string): number {
  const parse = (v: string) =>
    v
      .split('-')[0]
      .split('.')
      .map((n) => Number.parseInt(n, 10) || 0);
  const pa = parse(a);
  const pb = parse(b);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

/** Entries strictly newer than the given version (or all if no version). */
export function entriesSince(lastSeen: string | null | undefined): ChangelogEntry[] {
  if (!lastSeen) return changelog;
  return changelog.filter((e) => compareVersions(e.version, lastSeen) > 0);
}
