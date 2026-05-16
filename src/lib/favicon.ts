// Return a favicon URL via Chrome's _favicon API (available with "favicon" permission).
// Falls back to a Google favicon service if not available.
export function faviconUrl(pageUrl: string, size = 32): string {
  try {
    const u = new URL(pageUrl);
    if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
      const url = new URL(chrome.runtime.getURL('/_favicon/'));
      url.searchParams.set('pageUrl', u.origin + '/');
      url.searchParams.set('size', String(size));
      return url.toString();
    }
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=${size}`;
  } catch {
    return '';
  }
}
