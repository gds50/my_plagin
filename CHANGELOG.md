# Changelog

Все значимые изменения в проекте документируются здесь. Формат основан на
[Keep a Changelog](https://keepachangelog.com/ru/1.1.0/), версионирование —
[Semantic Versioning](https://semver.org/lang/ru/).

> При выпуске релиза также обновите `src/lib/changelog.ts` — он используется
> для внутриприложенческого окна «Что нового».

---

## [0.3.0] — 2026-05-16

### Добавлено / Added

- **Без прокрутки**: страница теперь вписывается ровно в одно окно браузера.
  Прокрутка вниз и вправо полностью отсутствует.
  *No scroll: the dashboard now fits exactly in one browser window — no vertical or horizontal scroll.*

- **Адаптивная сетка под экран**: высота строки сетки рассчитывается локально
  исходя из реального размера окна (через ResizeObserver). Позиции виджетов
  (в сеточных единицах) синхронизируются через Gist, а физический размер строки
  в пикселях подбирается индивидуально под каждый монитор. Большой монитор дома
  — строка выше; ноутбук в офисе — строка ниже. Ничего не "уезжает".
  *Adaptive grid per screen: row height is computed locally from the actual window size.
  Widget positions (grid units) sync via Gist; pixel row height adapts per monitor.
  Big monitor at home → taller rows; laptop → shorter rows. Nothing shifts.*

- **Тема в главном меню**: переключатель «Тёмная / Светлая / Авто» теперь
  доступен прямо из меню «⋯» на главной вкладке — без перехода в Настройки.
  *Theme in main menu: Dark / Light / Auto switcher is now in the «⋯» menu on
  the dashboard, no need to open the Settings page.*

### Изменено / Changed

- Кнопка «⌘K» убрана из шапки (клавиши Ctrl/Cmd+K продолжают открывать
  командную строку).
  *The «⌘K» button is removed from the top bar (Ctrl/Cmd+K keyboard shortcut still works).*

---

## [0.2.4] — 2026-05-16

### Исправлено / Fixed

- Кнопка **«Pull сейчас»** была неактивна на новом устройстве, даже при
  рабочем токене, потому что `gistId` хранится локально на той машине,
  где выполнялся первый push. Теперь если локальный `gistId` пуст —
  приложение ищет существующий Gist на вашем GitHub-аккаунте по имени
  файла `mystart-config.json`, сохраняет его ID и выполняет pull.
  *The “Pull now” button was disabled on a new device even with a valid
  token, because `gistId` is stored locally on the machine that did the
  first push. Now, if `gistId` is empty, the app auto-discovers the
  existing gist on your GitHub account by filename, saves the ID and
  performs the pull.*

---

## [0.2.3] — 2026-05-16

### Изменено / Changed

- **«Закладки»** (grid): фиксированные 5 колонок (чуть уже, чем в TopSites),
  подпись ограничена двумя строками (line-clamp-2), всё сверх обрезается.
  *Bookmarks (grid): fixed 5-column layout (narrower than TopSites),
  label clamped to 2 lines, the rest is hidden.*

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
