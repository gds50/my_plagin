export function uid(prefix = 'id'): string {
  // 9-char random base36 + timestamp suffix for uniqueness
  const rand = Math.random().toString(36).slice(2, 11);
  const t = Date.now().toString(36);
  return `${prefix}_${t}${rand}`;
}
