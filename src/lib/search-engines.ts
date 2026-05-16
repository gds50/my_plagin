import type { SearchEngine } from '@/types';

export const DEFAULT_ENGINES: SearchEngine[] = [
  { key: 'google', name: 'Google', url: 'https://www.google.com/search?q={q}', bang: 'g' },
  { key: 'ddg', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q={q}', bang: 'd' },
  { key: 'yandex', name: 'Yandex', url: 'https://yandex.ru/search/?text={q}', bang: 'y' },
  { key: 'youtube', name: 'YouTube', url: 'https://www.youtube.com/results?search_query={q}', bang: 'yt' },
  { key: 'github', name: 'GitHub', url: 'https://github.com/search?q={q}', bang: 'gh' },
  { key: 'wiki', name: 'Wikipedia', url: 'https://en.wikipedia.org/w/index.php?search={q}', bang: 'w' },
  { key: 'wiki-ru', name: 'Википедия', url: 'https://ru.wikipedia.org/w/index.php?search={q}', bang: 'wru' },
  { key: 'npm', name: 'npm', url: 'https://www.npmjs.com/search?q={q}', bang: 'npm' },
  { key: 'mdn', name: 'MDN', url: 'https://developer.mozilla.org/en-US/search?q={q}', bang: 'mdn' },
];

export interface ResolvedQuery {
  engine: SearchEngine;
  query: string;
  url: string;
}

export function resolveQuery(
  raw: string,
  engines: SearchEngine[],
  defaultEngineKey: string,
): ResolvedQuery | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // direct URL detection
  if (/^https?:\/\//i.test(trimmed)) {
    return {
      engine: { key: 'url', name: 'Open URL', url: trimmed },
      query: trimmed,
      url: trimmed,
    };
  }

  // bang detection
  const bangMatch = trimmed.match(/^([a-z][a-z0-9-]{0,10})\s+(.+)$/i);
  if (bangMatch) {
    const [, bang, rest] = bangMatch;
    const eng = engines.find((e) => e.bang?.toLowerCase() === bang.toLowerCase());
    if (eng) {
      return {
        engine: eng,
        query: rest,
        url: eng.url.replace('{q}', encodeURIComponent(rest)),
      };
    }
  }

  const eng =
    engines.find((e) => e.key === defaultEngineKey) ?? engines[0];
  return {
    engine: eng,
    query: trimmed,
    url: eng.url.replace('{q}', encodeURIComponent(trimmed)),
  };
}
