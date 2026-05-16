# Changelog

Все значимые изменения в проекте документируются здесь. Формат основан на
[Keep a Changelog](https://keepachangelog.com/ru/1.1.0/), версионирование —
[Semantic Versioning](https://semver.org/lang/ru/).

> При выпуске релиза также обновите `src/lib/changelog.ts` — он используется
> для внутриприложенческого окна «Что нового».

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
