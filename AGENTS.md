# AGENTS.md — Instructions for AI coding agents working on MyStart

> Этот файл — обязательное чтение перед любой работой в этом репозитории.
> Он фиксирует контекст, договорённости с владельцем проекта и архитектурные решения.
>
> This file is required reading before doing any work in this repo.
> It captures context, agreements with the project owner, and architecture decisions.

---

## 1. Project identity

- **Name:** MyStart
- **Type:** Chrome extension (Manifest V3) — overrides the new-tab page
- **Goal:** A local-first, privacy-respecting personal dashboard. Open-source alternative to start.me.
- **Owner / GitHub:** `gds50` — repo `git@github.com:gds50/my_plagin.git` (public)
- **License:** MIT

## 2. Communication conventions (with the owner)

- **Default language: Russian.** Reply to the owner in Russian. Be **detailed and educational** —
  the owner appreciates careful explanations of *what* something is and *why* it's done that way.
- When proposing a plan or making non-trivial changes:
  1. Explain in plain Russian what you understood from the request.
  2. Propose options with trade-offs (table form is welcome).
  3. End with a short TL;DR section.
- Avoid jargon dumps without context. If you must use a term like "Zustand store" or
  "service worker", briefly say what it is on first use within the message.
- Avoid time estimates.
- No emojis in code; emojis OK in UI labels and chat messages when they aid clarity.

## 3. Documentation conventions

- **All user-facing documentation MUST start with the Russian section, then English.**
  Use clear top-level sections such as:

  ```markdown
  ## 🇷🇺 Документация на русском
  ...
  ## 🇬🇧 English documentation
  ...
  ```

- The Russian section is the source of truth — make it complete first, then translate to English.
- Inline code comments in source files: English (keeps the code internationally readable).
- Do NOT create extra "what changed" markdown files unless explicitly requested.

## 4. Repository constraints (security)

- The repo is **public**. Treat it accordingly.
- **NEVER commit any secrets**: GitHub tokens, OAuth client secrets, API keys, cookies, etc.
- The following are already ignored in `.gitignore` — keep them ignored:
  `secrets.json`, `**/secrets.local.*`, `.gist-token`, `.env*`
- Personal tokens (e.g. user's GitHub PAT) live **only** in `chrome.storage.local`,
  never in source files, never in commit messages, never in build artifacts.
- Outgoing network: only `https://api.github.com/*` is whitelisted in the manifest.
  Do not add new `host_permissions` without explicit owner approval.
- No telemetry, no analytics, no third-party trackers ever.

## 5. Tech stack (locked decisions — do not switch without asking)

| Concern | Choice |
|---|---|
| Frontend framework | **React 18** + TypeScript |
| Bundler | **Vite** + `@crxjs/vite-plugin` (handles MV3 manifest, HMR for extensions) |
| Styling | **Tailwind CSS** with CSS variables for theming |
| State management | **Zustand** (one store per concern: `appStore`, `uiStore`) |
| Drag-and-drop | **dnd-kit** (currently using manual pointer events in `Grid.tsx`) |
| Fuzzy search | **Fuse.js** (for Command Palette) |
| Large data / cache | **Dexie** (IndexedDB) — reserved for future RSS/screenshots |
| Storage (primary) | `chrome.storage.local` |
| Cloud sync | **GitHub Gist** (implemented). Google Drive — stubbed; implement only if asked |
| Manifest | **MV3 only** |

If a new dependency is needed: pick a lightweight, well-maintained one. State the reason
in the commit message.

## 6. Architecture overview

### Data model (single source of truth: `src/types/index.ts`)

```ts
AppData
 ├── version
 ├── workspaces: Workspace[]
 │     └── pages: Page[]
 │           └── widgets: Widget[]
 │                 ├── type: WidgetType
 │                 ├── position: { x, y, w, h }   // 12-col grid
 │                 └── config: WidgetConfig       // discriminated by type
 ├── activeWorkspaceId
 ├── settings: { theme, background, sync, autoBackupDays, ... }
 └── updatedAt   ← bumped on every save (used for sync conflict resolution)
```

### Data flow

```
React UI
  ↕  reads/writes via useAppStore (Zustand)
appStore  ───→  saveAppData()  ───→  chrome.storage.local  (or localStorage fallback in dev)
                                          │
                                          ↓ chrome.storage.onChanged
                                       cross-tab subscribers
   ↑
   └── sync.ts (debounced push to Gist) and background/index.ts (alarms)
```

### Widget plugin pattern

Each widget lives under `src/widgets/<Name>/Widget.tsx` and exports two components:

```ts
export function <Name>Widget({ widget, wsId, pageId }: Props) { ... }
export function <Name>Settings({ widget, wsId, pageId }: Props) { ... }
```

They are registered in `src/widgets/_registry.tsx` via `widgetMeta` (label/icon/description/Settings)
and `renderWidget(widget, wsId, pageId)` switch. To add a new widget type:

1. Add the type literal to `WidgetType` union in `src/types/index.ts`
2. Add its `*Config` interface to `WidgetConfig` union
3. Create `src/widgets/<Name>/Widget.tsx` with the two exports above
4. Register in `_registry.tsx` and add default config + default size in `appStore.ts`
   (`defaultWidgetConfig` + `defaultWidgetSize`)
5. Optionally add it to `defaultWorkspace()` in `lib/storage.ts` for new installs

Never put widget-specific logic in `Grid.tsx` or `WidgetFrame.tsx`.

### Entry points

| Entry | File | Role |
|---|---|---|
| `chrome_url_overrides.newtab` | `src/newtab/index.html` → `App.tsx` | Main dashboard |
| `options_page` | `src/options/index.html` → `OptionsApp.tsx` | Settings + sync |
| `action.default_popup` | `src/popup/index.html` | Small popup, plain HTML+TS |
| `background.service_worker` | `src/background/index.ts` | Alarms, auto-backup, auto-sync push |

Manifest is generated from `src/manifest.config.ts` by `@crxjs/vite-plugin`.

## 7. Build / dev commands

```bash
npm install        # first time
npm run dev        # Vite dev server with HMR; load dist/ into chrome://extensions once
npm run build      # tsc --noEmit && vite build  →  output in dist/
npm run typecheck  # tsc --noEmit -b
```

`tsc` is configured with `noEmit` — Vite is the only thing that emits JS. **Never** run
`tsc -b` without `--noEmit`; it would emit `.js` files next to `.ts` files and pollute the tree.

`tsconfig.json` uses `paths: { "@/*": ["./src/*"] }` without `baseUrl` (deprecated since
TS 6.x). Import as `@/lib/...`, never `../../lib/...` from deep nesting.

## 8. Coding conventions

- **Strict TypeScript** (`strict: true`). No `any` unless absolutely necessary and commented.
- **Prefer functional components** with hooks. No class components.
- **One default export rule:** components prefer named exports.
- **CSS:** Tailwind utility classes + a few semantic classes in `global.css` (`.card`, `.btn`,
  `.btn-primary`, `.btn-ghost`, `.btn-danger`, `.input`). Theme via CSS variables `--bg`, `--fg`,
  `--accent`, etc. — do NOT hardcode hex colors in components.
- **No `useEffect` for derivable state** — use `useMemo` instead.
- **Async I/O:** never throw across `chrome.*` wrappers (`lib/chromeApi.ts`); degrade gracefully
  to support `npm run dev` outside the extension context.
- **Storage writes:** always go through `appStore` actions (which call `saveAppData`). Do not
  call `chrome.storage.local.set` directly from components.
- **`updatedAt` is sacred** — it must be updated on every persisted change. `saveAppData` handles it.
- **File naming:** components PascalCase, utilities camelCase. JSX files are `.tsx`, pure TS `.ts`.

## 9. Sync model

- Provider abstraction is informal — but `lib/sync.ts` is the only place that orchestrates
  push/pull. UI never calls `lib/gist.ts` directly except in the Options page (for token mgmt
  and explicit Push/Pull buttons).
- Push is debounced 30s on data changes when `settings.sync.autoSync && provider === 'gist'`.
- Conflict resolution: on app start, pull remote; if `remote.updatedAt > local.updatedAt`,
  ask user before replacing.
- Background service worker also pushes periodically (every 30 min) via `chrome.alarms` so
  changes propagate even if newtab isn't open.

## 10. Things to AVOID

- ❌ Adding telemetry, analytics, third-party CDNs, or external fonts loaded at runtime.
- ❌ Switching from React/Vite/TypeScript to another stack without explicit owner approval.
- ❌ Hardcoding secrets or example tokens (even fake) — reviewers may copy-paste.
- ❌ Using deprecated Chrome APIs (MV2 background pages, etc.).
- ❌ Synchronous `XMLHttpRequest`, `eval`, `new Function`.
- ❌ Long-running `setInterval` in service worker — use `chrome.alarms`.
- ❌ Editing files in `dist/` — it's generated output. Commit it only if explicitly asked.
- ❌ Running `npm audit fix --force` without reviewing breaking changes.

## 11. Things to PREFER

- ✅ Reading existing patterns before adding new ones. Especially: how widgets register and how
  config is patched (`patchWidgetConfig`).
- ✅ Small, focused commits with clear English commit subjects; body may be bilingual if useful.
- ✅ Asking the owner before adding heavy dependencies or new permissions.
- ✅ Keeping bundle size small. Newtab must render < 100ms after disk read.
- ✅ Graceful degradation: every `chrome.*` API call must work (or no-op cleanly) when running
  outside an extension context (e.g. `npm run dev` in a regular browser tab).

## 12. Roadmap (not implemented yet — pick from here)

- Notes widget (markdown, hosted in widget config or Dexie)
- Weather widget (Open-Meteo, no key required)
- RSS widget (fetched in service worker to bypass CORS, cached in Dexie)
- Calendar widget (Google Calendar iCal URL → parse)
- Iframe widget
- Hotkeys 1–9 to open first 9 bookmarks
- Google Drive sync provider (implement same interface as `gist.ts`)
- Extension icons 16/32/48/128 (currently default Chrome icon)
- Optional unsplash backgrounds with rotation

## 13. Versioning & releases (MANDATORY for every user-visible change)

This project follows [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`.

- `PATCH` — bug fixes, internal refactors with no user-visible behavior change.
- `MINOR` — new features, new widgets, new settings (backward-compatible).
- `MAJOR` — breaking changes to the data model (`AppData` schema) or removal of features.

### Release checklist — do ALL of these in the same commit/PR

1. **Bump `version` in `package.json`.** The Chrome manifest version is generated from
   `package.json` (`src/manifest.config.ts` uses `pkg.version`), so this single bump propagates
   to the manifest.
2. **Update `APP_VERSION` in `src/lib/changelog.ts`** to match.
3. **Prepend a new entry at the TOP of the `changelog` array** in `src/lib/changelog.ts` with:
   - `version` (must equal new `APP_VERSION`)
   - `date` (ISO `YYYY-MM-DD`)
   - `ru` — bullet points in Russian (primary, mandatory)
   - `en` — bullet points in English (mandatory)
   - Keep bullets short and user-facing. No internal refactors that the user can't see.
4. **Mirror the same entry in `CHANGELOG.md`** (the human-readable source of truth, bilingual,
   Russian section first per repo convention).
5. **If the `AppData` schema changed:** bump `DATA_VERSION` in `src/types/index.ts` and add a
   migration branch in `loadAppData()` in `src/lib/storage.ts`. NEVER silently change the
   schema — old installs must keep loading.
6. **Never edit historical changelog entries** (in either file). Only append at the top.

### How the user sees updates

On every newtab load, `WhatsNewModal` (`src/components/WhatsNewModal.tsx`) compares
`APP_VERSION` from the bundle against `lastSeenVersion` stored in `chrome.storage.local`
under key `mystart.meta.v1` (separate from `AppData` — NOT synced to Gist). If newer entries
exist, it shows a modal listing them; on dismiss it persists the new version. Fresh installs
record the version silently and don't see the modal (avoid greeting new users with history).

### Meta storage rules

- `mystart.meta.v1` (helpers: `getMeta()` / `patchMeta()` in `src/lib/storage.ts`) is for
  per-device state that **must not** sync via Gist (last-seen version, future per-device flags).
- `mystart.data.v1` (`AppData`) is the syncable user data — keep it small and portable.
- When adding a new meta field, extend the `MetaShape` interface in `storage.ts`.

## 14. When in doubt

1. Ask the owner in Russian, briefly.
2. Show 2 options, pick a recommended default, justify.
3. Don't proceed with destructive changes (file deletion, force-push, schema migration)
   without confirmation.

---

_Last updated: 2026-05-16. Update this file when conventions change._
