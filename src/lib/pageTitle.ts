// Fetch and extract a page <title> for the given URL.
// Requests blanket host permission (*://*/*) once via chrome.permissions API
// so the user is asked only one time regardless of how many sites they use.
// Handles non-UTF-8 pages (e.g. windows-1251 on Russian sites) by reading
// the raw bytes and detecting charset from HTTP headers or <meta> tags.

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

// Request *://*/* once — covers every site, so the user sees the dialog at most once.
const WILDCARD_ORIGIN = '*://*/*';

export async function ensureHostPermission(_url: string): Promise<boolean> {
  if (!hasChrome || !chrome.permissions) return true; // dev mode
  try {
    const hasAll = await chrome.permissions.contains({ origins: [WILDCARD_ORIGIN] });
    if (hasAll) return true;
    // Ask once for all origins — subsequent calls skip straight to hasAll=true.
    return await chrome.permissions.request({ origins: [WILDCARD_ORIGIN] });
  } catch {
    return false;
  }
}

/** Decode an ArrayBuffer using the charset found in the HTTP Content-Type header
 *  or in the HTML <meta charset> / <meta http-equiv=Content-Type> tag.
 *  Falls back to UTF-8 if nothing is detected. */
function decodeHtml(buf: ArrayBuffer, contentTypeHeader: string | null): string {
  // 1. Try charset from HTTP header first.
  const ctCharset = contentTypeHeader?.match(/charset=([^\s;]+)/i)?.[1];
  if (ctCharset) {
    try {
      return new TextDecoder(ctCharset, { fatal: false }).decode(buf);
    } catch { /* unknown label — fall through */ }
  }

  // 2. Peek at the first 2 KB decoded as latin-1 (lossless byte-read)
  //    to find a <meta charset> or <meta http-equiv=Content-Type> tag.
  const peek = new TextDecoder('latin1').decode(buf.slice(0, 2048));
  const metaCharset =
    peek.match(/<meta[^>]+charset=["']?\s*([^"'\s;>]+)/i)?.[1] ??
    peek.match(/<meta[^>]+content=["'][^"']*charset=([^"'\s;>]+)/i)?.[1];
  if (metaCharset) {
    try {
      return new TextDecoder(metaCharset, { fatal: false }).decode(buf);
    } catch { /* unknown label — fall through */ }
  }

  // 3. Default to UTF-8.
  return new TextDecoder('utf-8', { fatal: false }).decode(buf);
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
    const buf = await res.arrayBuffer();
    const html = decodeHtml(buf, res.headers.get('content-type'));
    return extractTitle(html);
  } catch {
    return null;
  }
}
