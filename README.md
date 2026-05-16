# MyStart

**Персональный дашборд новой вкладки для Chrome.** Локальный  — без серверов, без рекламы, без слежки. Все данные у вас, опциональная синхронизация через ваш приватный GitHub Gist.

---

## 🇷🇺 Документация на русском

### Возможности

- 🔖 **Закладки** с иконками сайтов, импорт из нативных закладок Chrome
- 🔍 **Поиск** с bang-командами (`g react`, `yt cats`, `gh react-query`, `mdn fetch`, …)
- 🕐 **Часы** с опциональным приветствием
- ✅ **Задачи** (to-do список)
- ⭐ **TopSites** — часто посещаемые сайты из Chrome
- 🕘 **Недавние** — недавно закрытые вкладки с восстановлением в один клик
- 🗂️ **Workspaces и страницы** — раздельные дашборды «Работа / Личное / Учёба»
- ⌘K **Command Palette** — фаззи-поиск по всем вашим закладкам, закладкам Chrome и действиям
- ☁️ **Синхронизация через GitHub Gist** — ваши данные, ваш приватный Gist, ваш контроль
- 💾 **Экспорт / импорт JSON** + автоматический бэкап в `Downloads`
- 🎨 **Темы и фоны** — тёмная по умолчанию, светлая, авто; цвет / градиент / картинка
- 🔒 **100% локально** — работает офлайн, никакой телеметрии, никаких сторонних серверов (кроме Gist, если включите)

### Установка (без публикации в Chrome Web Store)

```bash
git clone git@github.com:gds50/my_plagin.git
cd my_plagin
npm install
npm run build
```

Затем в Chrome:
1. Откройте `chrome://extensions`
2. Включите тумблер **«Режим разработчика»** в правом верхнем углу
3. Нажмите **«Загрузить распакованное расширение»**
4. Выберите папку `dist/`
5. Откройте новую вкладку — готово.

> **Не нужен** аккаунт разработчика Google, не нужна оплата $5, не нужна модерация.

### Обновление установленного расширения

MyStart — это распакованное расширение, поэтому Chrome **не обновляет его сам**.
Обновление = пересборка `dist/` и перезагрузка в `chrome://extensions`.

**macOS / Linux:**
```bash
cd my_plagin
git pull
npm install        # на случай новых зависимостей
npm run build
```

**Windows (PowerShell или Git Bash):**
```powershell
cd C:\path\to\my_plagin
git pull
npm install
npm run build
```

> Если на Windows ещё не установлены Node.js и Git — поставьте
> [Node.js LTS](https://nodejs.org/) и [Git for Windows](https://git-scm.com/download/win)
> (обычным инсталлятором, всё по умолчанию).

После сборки **в Chrome:**
1. Откройте `chrome://extensions`.
2. Найдите карточку **MyStart**.
3. Нажмите круглую стрелку **«Обновить»** (значок 🔄) на карточке расширения —
   либо переключите тумблер расширения выкл/вкл.
4. Откройте новую вкладку — появится окно **«Что нового»** со списком изменений.

> ⚠️ Если вы клонировали репозиторий не через `git clone`, а скачали как ZIP,
> просто перетащите содержимое нового ZIP поверх старой папки, затем выполните
> `npm install && npm run build` и обновите расширение в Chrome.

### Версионирование и «Что нового»

- Версия проекта живёт в [`package.json`](package.json) и автоматически попадает в манифест расширения.
- При каждом обновлении список изменений показывается в окне «Что нового» —
  по нажатию «Понятно» текущая версия запоминается, чтобы не показывать список повторно.
- Полная история изменений: [`CHANGELOG.md`](CHANGELOG.md).
- Свежие установки видят окно «Что нового» только **после первого обновления**,
  чтобы не пугать новых пользователей историей.

### Разработка с hot-reload

```bash
npm run dev
```

Vite + `@crxjs/vite-plugin` автоматически пересобирают расширение при изменениях. Загрузите `dist/` в Chrome один раз — дальше оно само обновляется, пока запущен `npm run dev`.

### Предупреждение `npm audit` — это нормально

После `npm install` вы увидите примерно такое сообщение:

```
4 vulnerabilities (2 moderate, 2 high)
To address all issues (including breaking changes), run:
  npm audit fix --force
```

**Это нормально, ничего делать не нужно.** Уязвимости находятся в `esbuild` и `rollup` — это инструменты, которыми проект собирается у вас на компьютере. В готовую папку `dist/`, которая загружается в Chrome, они **не попадают**, поэтому для конечного расширения риск равен нулю.

⚠️ **Никогда не запускайте `npm audit fix --force`** в этом проекте. Эта команда понизит `@crxjs/vite-plugin` с версии 2 до версии 1 и сломает сборку (у нас манифест написан под v2 API). Если случайно запустили — откатите изменения: `git checkout -- package.json package-lock.json && npm install`.

Если запущен `npm run dev`, желательно не открывать в это же время недоверенные сайты в браузере — это единственная реальная митигация для dev-уязвимости esbuild.

### Использование

**Режим редактирования:** в верхней панели нажмите «Редактировать» → можно таскать виджеты, менять размер (правый нижний угол) и удалять. Кнопка «+ Виджет» добавляет новый.

**Command Palette:** `Cmd+K` (macOS) или `Ctrl+K` (Windows/Linux):
- введите часть названия закладки — откроется
- введите `yt cats` — поиск на YouTube
- введите `gh react` — поиск на GitHub
- введите `https://example.com` — прямой переход
- перемещение: `↑ / ↓`, выбор: `Enter`, закрыть: `Esc`

**Bang-команды поиска:** `g` Google · `yt` YouTube · `gh` GitHub · `w` Wikipedia · `wru` Википедия · `npm` npm · `mdn` MDN · `y` Yandex · `d` DuckDuckGo

**Workspaces:** в верхней панели — табы. `+` создаёт новый. Внутри workspace ещё одна линия табов — это страницы.

### Синхронизация через GitHub Gist

1. Откройте **Настройки** (клик по иконке расширения → «Настройки», либо `chrome://extensions` → MyStart → «Параметры расширения»)
2. Создайте Personal Access Token:
   - перейдите на [github.com/settings/tokens](https://github.com/settings/tokens/new?scopes=gist&description=MyStart)
   - **Note:** `MyStart`
   - **Expiration:** на ваш выбор (можно «No expiration», но рекомендуется ротировать)
   - **Scopes:** только `gist` — больше ничего не нужно
   - Нажмите «Generate token» → скопируйте (показывается один раз)
3. Вставьте токен в поле «Настройки → Синхронизация» → **«Сохранить»**
4. Выберите провайдера: **GitHub Gist**, включите **«Авто-синхронизация»**
5. При первом изменении создаётся **приватный** Gist с файлом `mystart-config.json` — его ID сохраняется автоматически
6. На другом компьютере: установите расширение, вставьте тот же токен → нажмите **«Pull сейчас»** — данные загрузятся

> 🔒 **Безопасность:** токен хранится только в `chrome.storage.local` на этом устройстве. Он **никогда** не отправляется никуда, кроме `api.github.com`, и **никогда** не попадает в публичный репозиторий (есть `.gitignore`).

### Бэкап

- **Ручной экспорт:** меню `⋯` → «Экспорт в JSON» — скачается файл `mystart-backup-YYYY-MM-DD.json`
- **Ручной импорт:** меню `⋯` → «Импорт из JSON» — выберите файл (заменяет все текущие данные)
- **Авто-бэкап:** Настройки → ползунок «Авто-бэкап каждые N дней» (по умолчанию 7, 0 = выкл.). Файлы складываются в `Downloads/mystart-backups/`

### Структура проекта

```
src/
  newtab/        — главная страница (React + dashboard)
  options/       — страница настроек
  popup/         — popup при клике на иконку
  background/    — service worker (расписания, авто-синк)
  widgets/       — реализация всех виджетов
    _registry.tsx
    BookmarksGroup/  Search/  Clock/  Todo/  TopSites/  Recent/
  components/    — общие UI (Modal, Grid, TopBar, CommandPalette…)
  store/         — Zustand stores (appStore, uiStore)
  lib/           — storage, chromeApi, gist, backup, search-engines, sync
  types/         — модель данных TypeScript
  styles/        — глобальный CSS + Tailwind
  manifest.config.ts  — Manifest V3
```

### Технологии

React 18 · TypeScript · Vite · `@crxjs/vite-plugin` · Tailwind CSS · Zustand · dnd-kit · Fuse.js · Dexie · Manifest V3.

### Приватность

- Данные хранятся в `chrome.storage.local` на вашем устройстве.
- Если включить Gist-синк, данные загружаются **только** в приватный Gist в вашем GitHub-аккаунте.
- Токен GitHub никогда не покидает `chrome.storage.local`, не логируется, не отправляется никуда кроме `api.github.com`.
- Не коммитьте `secrets.json` или любые токены в публичный репозиторий (уже в `.gitignore`).

### Лицензия

MIT — используйте, форкайте, изменяйте свободно.

---

## 🇬🇧 English documentation

### Features

- 🔖 **Bookmarks** with favicons, import from Chrome native bookmarks
- 🔍 **Search** with bang commands (`g react`, `yt cats`, `gh react-query`, …)
- 🕐 **Clock** with optional greeting
- ✅ **Todo** list
- ⭐ **TopSites** (most-visited from Chrome)
- 🕘 **Recent** (recently closed tabs, one-click restore)
- 🗂️ **Workspaces & pages** — separate dashboards for Work / Personal / Study
- ⌘K **Command Palette** — fuzzy search across all your bookmarks, tabs and actions
- ☁️ **GitHub Gist sync** — your data, your private Gist, your control
- 💾 **Export / Import JSON** + auto-backup to `Downloads`
- 🎨 **Themes & backgrounds** — dark by default, custom colors / gradients / image URLs
- 🔒 **100% local-first** — works offline, no telemetry, no third-party servers (except Gist if you opt in)

### Installation (load unpacked — no Chrome Web Store needed)

```bash
git clone git@github.com:gds50/my_plagin.git
cd my_plagin
npm install
npm run build
```

Then in Chrome:
1. Open `chrome://extensions`
2. Toggle **Developer mode** (top-right)
3. Click **Load unpacked**
4. Select the `dist/` folder
5. Open a new tab — done.

### Development

```bash
npm run dev
```

Vite + `@crxjs/vite-plugin` serves the extension with hot reload. After the first run, load `dist/` into Chrome the same way as above; it auto-updates while `npm run dev` is running.

### Updating an installed extension

MyStart is loaded unpacked, so Chrome **does not auto-update it**. Updating
means rebuilding `dist/` and reloading it in `chrome://extensions`.

**macOS / Linux:**
```bash
cd my_plagin
git pull
npm install
npm run build
```

**Windows (PowerShell or Git Bash):**
```powershell
cd C:\path\to\my_plagin
git pull
npm install
npm run build
```

Then in Chrome:
1. Open `chrome://extensions`.
2. Find the **MyStart** card.
3. Click the round **Reload** arrow (🔄) on the card — or toggle the extension off/on.
4. Open a new tab — a **What's new** dialog will list the changes.

### Versioning & "What's new"

- The project version lives in [`package.json`](package.json) and is propagated to the Chrome manifest automatically.
- After every update, a "What's new" modal shows the changes; pressing "Понятно/OK" persists the seen version so it won't show again.
- Full history: [`CHANGELOG.md`](CHANGELOG.md).
- Fresh installs see the modal **only after their first update**, never on day one.


### `npm audit` warning — safe to ignore

After `npm install` you will see something like:

```
4 vulnerabilities (2 moderate, 2 high)
To address all issues (including breaking changes), run:
  npm audit fix --force
```

**This is expected and safe.** The vulnerabilities are in `esbuild` and `rollup` — build-time tools that run only on your machine. They are **not** included in `dist/`, so the installed extension is unaffected.

⚠️ **Do NOT run `npm audit fix --force`** in this project. It will downgrade `@crxjs/vite-plugin` from v2 to v1 and break the build (our manifest config targets the v2 API). If you ran it by mistake, revert with: `git checkout -- package.json package-lock.json && npm install`.

While `npm run dev` is running, avoid browsing untrusted sites in the same browser — that's the only real mitigation for the esbuild dev-server advisory.

### GitHub Gist sync

1. Open **Settings** (popup → ⚙ or right-click extension icon → Options).
2. Create a Personal Access Token at
   [github.com/settings/tokens](https://github.com/settings/tokens/new?scopes=gist&description=MyStart)
   with **scope: `gist`**. Classic token, or fine-grained with `Gists: read & write`.
3. Paste it into Settings → **Save**. The token is stored only in `chrome.storage.local` on
   this machine, never synced to Google or pushed to the repo.
4. Pick provider **GitHub Gist** and enable **Auto-sync**.
5. On first push a **private** Gist named `mystart-config.json` is created automatically.
6. To sync to another device: install MyStart there, paste the same token, then **Pull**.

### Project structure

```
src/
  newtab/        # new-tab dashboard (React)
  options/       # settings page
  popup/         # toolbar popup
  background/    # service worker (alarms, sync, auto-backup)
  widgets/       # all widget implementations
  components/    # shared UI
  store/         # zustand stores
  lib/           # storage, chrome APIs, gist sync, search engines
  types/         # TypeScript model
```

### Privacy & security

- Data is stored in `chrome.storage.local` on your device.
- If you enable Gist sync, your data is uploaded **only** to a private Gist under your GitHub account.
- Your GitHub token never leaves `chrome.storage.local` and is never logged or transmitted anywhere
  except `api.github.com`.
- Do not commit `secrets.json` or any token to the public repo (already in `.gitignore`).

### Tech stack

React 18 · TypeScript · Vite · `@crxjs/vite-plugin` · Tailwind CSS · Zustand · dnd-kit · Fuse.js ·
Dexie · Manifest V3.

### License

MIT — use, fork, modify freely.
