import { useEffect, useState } from 'react';
import { bootstrapStore, useAppStore } from '@/store/appStore';
import { useUiStore } from '@/store/uiStore';
import { ThemeApplier } from '@/components/ThemeApplier';
import { Toast } from '@/components/Toast';
import { setGistToken, clearGistToken, hasToken, testGist } from '@/lib/gist';
import { syncPushNow, syncPullNow } from '@/lib/sync';
import { exportAppData, importAppDataFromFile } from '@/lib/backup';
import type { ThemeMode } from '@/types';

export function OptionsApp() {
  const loaded = useAppStore((s) => s.loaded);
  const data = useAppStore((s) => s.data);
  const patchSettings = useAppStore((s) => s.patchSettings);
  const replaceAll = useAppStore((s) => s.replaceAll);
  const notify = useUiStore((s) => s.notify);
  const [token, setToken] = useState('');
  const [tokenSet, setTokenSet] = useState(false);
  const [ghUser, setGhUser] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      await bootstrapStore();
      setTokenSet(await hasToken());
    })();
  }, []);

  if (!loaded) return <div className="p-8 text-fg-muted">Загрузка…</div>;

  const onSaveToken = async () => {
    if (!token) return;
    await setGistToken(token);
    setToken('');
    setTokenSet(true);
    try {
      const u = await testGist();
      setGhUser(u.login);
      notify(`Авторизация OK: ${u.login}`, 'success');
    } catch (e) {
      notify(`Ошибка: ${(e as Error).message}`, 'error');
    }
  };

  const onTest = async () => {
    try {
      const u = await testGist();
      setGhUser(u.login);
      notify(`OK: ${u.login}`, 'success');
    } catch (e) {
      notify(`Ошибка: ${(e as Error).message}`, 'error');
    }
  };

  const onClearToken = async () => {
    if (!confirm('Удалить токен?')) return;
    await clearGistToken();
    setTokenSet(false);
    setGhUser(null);
  };

  const onPushNow = async () => {
    await syncPushNow();
    notify('Push отправлен', 'success');
  };

  const onPullNow = async () => {
    const remote = await syncPullNow();
    if (!remote) {
      notify('Нечего получать (нет gist или данных)', 'info');
      return;
    }
    if (confirm(`Применить данные из Gist (обновлены ${new Date(remote.updatedAt).toLocaleString()})?`)) {
      await replaceAll(remote);
      notify('Применено', 'success');
    }
  };

  const onImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const next = await importAppDataFromFile(file);
        if (!confirm('Заменить ВСЕ текущие данные?')) return;
        await replaceAll(next);
        notify('Импорт выполнен', 'success');
      } catch (e) {
        notify(`Ошибка: ${(e as Error).message}`, 'error');
      }
    };
    input.click();
  };

  return (
    <>
      <ThemeApplier />
      <div className="min-h-screen p-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">⚙️ MyStart — Настройки</h1>

        <Section title="Внешний вид">
          <Field label="Тема">
            <select
              className="input"
              value={data.settings.theme}
              onChange={(e) => patchSettings({ theme: e.target.value as ThemeMode })}
            >
              <option value="dark">Тёмная</option>
              <option value="light">Светлая</option>
              <option value="auto">Авто (по системе)</option>
            </select>
          </Field>
          <Field label="Фон">
            <select
              className="input mb-2"
              value={data.settings.background.type}
              onChange={(e) =>
                patchSettings({
                  background: {
                    type: e.target.value as 'color' | 'gradient' | 'image-url',
                    value: data.settings.background.value,
                  },
                })
              }
            >
              <option value="color">Сплошной цвет</option>
              <option value="gradient">Градиент (CSS)</option>
              <option value="image-url">URL картинки</option>
            </select>
            <input
              className="input"
              value={data.settings.background.value}
              onChange={(e) =>
                patchSettings({
                  background: { type: data.settings.background.type, value: e.target.value },
                })
              }
              placeholder="напр. #0f172a, linear-gradient(...), https://..."
            />
          </Field>
        </Section>

        <Section title="Бэкап">
          <div className="flex gap-2 flex-wrap">
            <button className="btn btn-primary" onClick={() => exportAppData(data)}>
              ⬇ Экспорт JSON
            </button>
            <button className="btn" onClick={onImport}>
              ⬆ Импорт JSON
            </button>
          </div>
          <Field label={`Авто-бэкап в Downloads каждые ${data.settings.autoBackupDays || 0} дней (0 = выкл.)`}>
            <input
              type="range"
              min={0}
              max={30}
              value={data.settings.autoBackupDays}
              onChange={(e) => patchSettings({ autoBackupDays: Number(e.target.value) })}
              className="w-full"
            />
          </Field>
        </Section>

        <Section title="Синхронизация: GitHub Gist">
          <p className="text-sm text-fg-muted mb-3">
            Создайте Personal Access Token на{' '}
            <a
              className="text-accent underline"
              target="_blank"
              rel="noreferrer"
              href="https://github.com/settings/tokens/new?scopes=gist&description=MyStart"
            >
              github.com/settings/tokens
            </a>{' '}
            (scope: <code>gist</code>). Токен сохраняется только локально в этом браузере.
          </p>
          {!tokenSet ? (
            <div className="flex gap-2">
              <input
                className="input"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_..."
                autoComplete="off"
              />
              <button className="btn btn-primary" onClick={onSaveToken}>
                Сохранить
              </button>
            </div>
          ) : (
            <div className="flex gap-2 flex-wrap items-center">
              <span className="text-sm text-emerald-400">✓ Токен сохранён{ghUser ? ` (${ghUser})` : ''}</span>
              <button className="btn" onClick={onTest}>Проверить</button>
              <button className="btn btn-danger" onClick={onClearToken}>Удалить</button>
            </div>
          )}

          <Field label="Провайдер">
            <select
              className="input"
              value={data.settings.sync.provider}
              onChange={(e) =>
                patchSettings({
                  sync: {
                    ...data.settings.sync,
                    provider: e.target.value as 'none' | 'gist' | 'gdrive',
                  },
                })
              }
            >
              <option value="none">Без синхронизации</option>
              <option value="gist">GitHub Gist</option>
              <option value="gdrive" disabled>
                Google Drive (скоро)
              </option>
            </select>
          </Field>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={data.settings.sync.autoSync}
              onChange={(e) =>
                patchSettings({ sync: { ...data.settings.sync, autoSync: e.target.checked } })
              }
            />
            Авто-синхронизация при изменениях (debounce 30с)
          </label>

          <div className="flex gap-2 flex-wrap pt-2">
            <button className="btn btn-primary" onClick={onPushNow} disabled={!tokenSet || data.settings.sync.provider !== 'gist'}>
              ↑ Push сейчас
            </button>
            <button className="btn" onClick={onPullNow} disabled={!tokenSet || !data.settings.sync.gistId}>
              ↓ Pull сейчас
            </button>
          </div>

          {data.settings.sync.gistId && (
            <p className="text-xs text-fg-muted mt-2">
              Gist ID: <code>{data.settings.sync.gistId}</code>
              {data.settings.sync.lastPushAt && (
                <> · последний push: {new Date(data.settings.sync.lastPushAt).toLocaleString()}</>
              )}
            </p>
          )}
        </Section>

        <Section title="Поиск">
          <Field label="Поисковик по умолчанию (key)">
            <input
              className="input"
              value={data.settings.defaultSearchEngine}
              onChange={(e) => patchSettings({ defaultSearchEngine: e.target.value })}
            />
          </Field>
        </Section>
      </div>
      <Toast />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 mb-5">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm text-fg-muted mb-1 block">{label}</span>
      {children}
    </label>
  );
}
