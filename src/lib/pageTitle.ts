// Fetch and extract a page <title> for the given URL.
// Requests host permission on demand via chrome.permissions API so the user
// stays in control. Returns null when permission is denied or fetch fails.

const hasChrome = typeof chrome !== 'undefined';

function normalizeUrl(input: string): string | null {
  try {
    const withScheme = /^https?:\/\//i.test(input) ? input : `https://${input}`;
    const u = new URL(withScheme);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.toString();
  } catch {
    return null;
  }
}

export async function ensureHostPermission(url: string): Promise<boolean> {
  const normalized = normalizeUrl(url);
  if (!normalized) return false;
  if (!hasChrome || !chrome.permissions) return true; // dev mode
  const u = new URL(normalized);
  const origin = `${u.protocol}//${u.hostname}/*`;
  try {
    const has = await chrome.permissions.contains({ origins: [origin] });
    if (has) return true;
    return await chrome.permissions.request({ origins: [origin] });
  } catch {
    return false;
  }
}

function extractTitle(html: string): string | null {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const og =
      doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ??
      doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content');
    const title = og?.trim() || doc.querySelector('title')?.textContent?.trim();
    return title && title.length > 0 ? title : null;
  } catch {
    return null;
  }
}

/**
 * Fetch the page and return its <title>. Returns null on any failure
 * (network error, CORS, permission denied, no title tag).
 */
export async function fetchPageTitle(url: string): Promise<string | null> {
  const normalized = normalizeUrl(url);
  if (!normalized) return null;
  const granted = await ensureHostPermission(normalized);
  if (!granted) return null;
  try {
    const res = await fetch(normalized, {
      credentials: 'omit',
      redirect: 'follow',
    });
    if (!res.ok) return null;
    const html = await res.text();
    return extractTitle(html);
  } catch {
    return null;
  }
}
