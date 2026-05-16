import type { AppData } from '@/types';

// GitHub Gist sync provider.
// Token is a Personal Access Token (classic, scope: "gist") OR fine-grained with "Gists" read+write.
// Token is stored ONLY in chrome.storage.local (never in chrome.storage.sync, never in code).

const GIST_FILENAME = 'mystart-config.json';
const TOKEN_KEY = 'mystart.gist.token';

export interface GistMeta {
  id: string;
  updatedAt: number;
}

async function getToken(): Promise<string | undefined> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return undefined;
  const res = await chrome.storage.local.get(TOKEN_KEY);
  return res[TOKEN_KEY] as string | undefined;
}

export async function setGistToken(token: string): Promise<void> {
  await chrome.storage.local.set({ [TOKEN_KEY]: token });
}

export async function clearGistToken(): Promise<void> {
  await chrome.storage.local.remove(TOKEN_KEY);
}

export async function hasToken(): Promise<boolean> {
  return Boolean(await getToken());
}

async function gh(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getToken();
  if (!token) throw new Error('GitHub token не задан.');
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GitHub API ${res.status}: ${text || res.statusText}`);
  }
  return res;
}

export async function createGist(data: AppData): Promise<string> {
  const body = {
    description: 'MyStart config (auto-managed). Do not edit manually.',
    public: false,
    files: { [GIST_FILENAME]: { content: JSON.stringify(data, null, 2) } },
  };
  const res = await gh('/gists', { method: 'POST', body: JSON.stringify(body) });
  const json = (await res.json()) as { id: string };
  return json.id;
}

export async function pushGist(gistId: string, data: AppData): Promise<void> {
  const body = { files: { [GIST_FILENAME]: { content: JSON.stringify(data, null, 2) } } };
  await gh(`/gists/${gistId}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export async function pullGist(gistId: string): Promise<AppData | null> {
  const res = await gh(`/gists/${gistId}`);
  const json = (await res.json()) as {
    files: Record<string, { content?: string; truncated?: boolean; raw_url?: string }>;
  };
  const file = json.files[GIST_FILENAME];
  if (!file) return null;
  let content = file.content;
  if (file.truncated && file.raw_url) {
    content = await (await fetch(file.raw_url)).text();
  }
  if (!content) return null;
  try {
    return JSON.parse(content) as AppData;
  } catch {
    return null;
  }
}

export async function testGist(): Promise<{ login: string }> {
  const res = await gh('/user');
  return (await res.json()) as { login: string };
}
