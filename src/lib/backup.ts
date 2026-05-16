import type { AppData } from '@/types';
import { triggerDownload } from './chromeApi';

const FILENAME_PREFIX = 'mystart-backup';

export function exportJsonFilename(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${FILENAME_PREFIX}-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.json`;
}

export function exportAppData(data: AppData): void {
  const json = JSON.stringify(data, null, 2);
  triggerDownload(exportJsonFilename(), json);
}

export function validateImported(raw: unknown): raw is AppData {
  if (!raw || typeof raw !== 'object') return false;
  const d = raw as Partial<AppData>;
  return (
    typeof d.version === 'number' &&
    Array.isArray(d.workspaces) &&
    typeof d.activeWorkspaceId === 'string' &&
    !!d.settings
  );
}

export async function importAppDataFromFile(file: File): Promise<AppData> {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!validateImported(parsed)) {
    throw new Error('Файл бэкапа повреждён или имеет неверный формат.');
  }
  return parsed;
}
