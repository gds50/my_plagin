# MyStart

**Personal new-tab dashboard for Chrome.** Local-first alternative to start.me with widgets,
GitHub Gist sync, and zero server dependencies. Free, open-source, no tracking, no ads.

![screenshot placeholder](docs/screenshot.png)

## Features

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

## Installation (load unpacked — no Chrome Web Store needed)

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

## Development

```bash
npm run dev
```
Vite + `@crxjs/vite-plugin` serves the extension with hot reload. After the first run, load
`dist/` into Chrome the same way as above; it auto-updates while `npm run dev` is running.

## GitHub Gist sync

1. Open **Settings** (popup → ⚙ or right-click extension icon → Options).
2. Create a Personal Access Token at
   [github.com/settings/tokens](https://github.com/settings/tokens/new?scopes=gist&description=MyStart)
   with **scope: `gist`**. Use a **classic** token, OR a fine-grained token with `Gists: read & write`.
3. Paste it into the Settings page → **Save**. The token is stored only in `chrome.storage.local` on
   this machine, never synced to Google or pushed to the repo.
4. Pick provider **GitHub Gist** and enable **Auto-sync**.
5. On first push a **private** Gist named `mystart-config.json` is created automatically.
6. To sync to another device: install MyStart there, paste the same token, then **Pull**.

## Project structure

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

## Privacy & security

- Data is stored in `chrome.storage.local` on your device.
- If you enable Gist sync, your data is uploaded **only** to a private Gist under your GitHub account.
- Your GitHub token never leaves `chrome.storage.local` and is never logged or transmitted to
  anywhere except `api.github.com`.
- Do not commit `secrets.json` or any token to the public repo (already in `.gitignore`).

## Tech stack

React 18 · TypeScript · Vite · `@crxjs/vite-plugin` · Tailwind CSS · Zustand · dnd-kit · Fuse.js ·
Dexie · Manifest V3.

## License

MIT — use, fork, modify freely.
