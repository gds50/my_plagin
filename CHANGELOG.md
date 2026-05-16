# Changelog

Все значимые изменения в проекте документируются здесь. Формат основан на
[Keep a Changelog](https://keepachangelog.com/ru/1.1.0/), версионирование —
[Semantic Versioning](https://semver.org/lang/ru/).

> При выпуске релиза также обновите `src/lib/changelog.ts` — он используется
> для внутриприложенческого окна «Что нового».

---

## [0.2.2] — 2026-05-16

### Изменено / Changed

- **«Закладки»** (grid): плитки теперь резиновые. Размер плитки
  зависит от длины подписи: короткая — почти квадрат, длинная —
  расширяется. В ряду помещается 2/3/4… элементов в зависимости от
  ширины виджета. Максимум для одной плитки — половина виджета,
  чтобы одной иконкой не занимался весь блок. Высота плитки стабильна.
  *Bookmarks (grid): responsive tiles. Tile size follows the label —
  short label = near-square, long label = wider. 2/3/4… per row
  depending on widget width. A single tile is capped at half the widget
  to prevent one icon from filling the whole block. Height stays stable.*

---

## [0.2.1] — 2026-05-16

### Добавлено / Added

- Перетаскивание ссылок из виджетов **«Часто посещаемые»** (TopSites) и
  **«Недавние»** (Recent) в виджет **«Закладки»**. Работает в режиме
  полного редактирования. Дубликаты по URL игнорируются.
  *Drag links from **TopSites** and **Recent** widgets into **Bookmarks**.
  Works in full edit mode. URL-based deduplication.*

### Изменено / Changed

- Внутренний рефакторинг: общий контракт DnD вынесен в `src/lib/dnd.ts`
  (типы `BookmarkDragPayload`, `LinkDragPayload`, MIME-константы).
  *Internal: shared DnD contract moved to `src/lib/dnd.ts`.*

---

## [0.2.0] — 2026-05-16

### Добавлено / Added

- **Закладки:** кнопка `✎` на каждом виджете — редактирование содержимого без
  включения глобального режима редактирования.
  *Bookmarks: per-widget `✎` button — edit contents without enabling the
  global edit mode.*
- **Закладки:** автоматическое подтягивание заголовка страницы при вставке
  URL в поле редактирования закладки. Chrome запрашивает разрешение на
  конкретный сайт через `chrome.permissions.request` — никакого «доступа ко
  всем сайтам» по умолчанию.
  *Bookmarks: auto-fetch page `<title>` when pasting a URL. Chrome asks for
  per-site permission on demand; no blanket `<all_urls>` access.*
- **Закладки:** перетаскивание мышью между виджетами в режиме полного
  редактирования.
  *Bookmarks: drag-and-drop between widgets in full edit mode.*
- **Окно «Что нового»** при обновлении расширения с описанием изменений
  относительно ранее установленной версии.
  *"What's new" modal on update, showing changes since the previously
  installed version.*

### Изменено / Changed

- Манифест: добавлен `optional_host_permissions: ['*://*/*']` — для запроса
  доступа к конкретным сайтам по требованию пользователя.
  *Manifest: added `optional_host_permissions: ['*://*/*']` to enable
  per-origin on-demand permissions.*

---

## [0.1.0] — 2026-05-01

Первый публичный релиз. См. [README](README.md) для списка фич.
*First public release. See [README](README.md) for the feature list.*
