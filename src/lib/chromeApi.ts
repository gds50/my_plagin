// Thin wrappers around chrome APIs that are safe to call from any context.
// All functions degrade gracefully when running outside the extension (e.g. `vite dev` in browser).

const hasChrome = typeof chrome !== 'undefined';

export async function getTopSites(): Promise<chrome.topSites.MostVisitedURL[]> {
  if (!hasChrome || !chrome.topSites) return [];
  try {
    return await chrome.topSites.get();
  } catch {
    return [];
  }
}

export interface RecentItem {
  id: string;
  title: string;
  url: string;
  sessionId?: string;
  lastModified?: number;
}

export async function getRecentlyClosed(limit = 12): Promise<RecentItem[]> {
  if (!hasChrome || !chrome.sessions) return [];
  try {
    const sessions = await chrome.sessions.getRecentlyClosed({ maxResults: limit });
    const items: RecentItem[] = [];
    for (const s of sessions) {
      if (s.tab && s.tab.url) {
        items.push({
          id: String(s.tab.sessionId ?? s.tab.id ?? Math.random()),
          title: s.tab.title || s.tab.url,
          url: s.tab.url,
          sessionId: s.tab.sessionId,
          lastModified: s.lastModified,
        });
      } else if (s.window && s.window.tabs) {
        for (const t of s.window.tabs) {
          if (!t.url) continue;
          items.push({
            id: String(t.sessionId ?? t.id ?? Math.random()),
            title: t.title || t.url,
            url: t.url,
            sessionId: t.sessionId,
            lastModified: s.lastModified,
          });
        }
      }
    }
    return items.slice(0, limit);
  } catch {
    return [];
  }
}

export async function restoreSession(sessionId: string): Promise<void> {
  if (!hasChrome || !chrome.sessions) return;
  try {
    await chrome.sessions.restore(sessionId);
  } catch {
    /* ignore */
  }
}

export interface FlatBookmark {
  id: string;
  title: string;
  url: string;
  folder: string;
}

export async function getAllBookmarks(): Promise<FlatBookmark[]> {
  if (!hasChrome || !chrome.bookmarks) return [];
  try {
    const tree = await chrome.bookmarks.getTree();
    const out: FlatBookmark[] = [];
    const walk = (nodes: chrome.bookmarks.BookmarkTreeNode[], folder: string) => {
      for (const n of nodes) {
        if (n.url) {
          out.push({ id: n.id, title: n.title || n.url, url: n.url, folder });
        }
        if (n.children) walk(n.children, n.title || folder);
      }
    };
    walk(tree, '');
    return out;
  } catch {
    return [];
  }
}

export function openUrl(url: string, newTab: boolean): void {
  if (newTab && hasChrome && chrome.tabs?.create) {
    chrome.tabs.create({ url });
  } else {
    window.location.href = url;
  }
}

export function triggerDownload(filename: string, content: string, mime = 'application/json'): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  if (hasChrome && chrome.downloads?.download) {
    chrome.downloads.download({ url, filename, saveAs: false }, () => {
      // revoke after a delay so the download starts
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    });
  } else {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}
