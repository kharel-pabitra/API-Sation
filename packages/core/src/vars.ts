/** Replace {{name}} placeholders using environment variables. Unknown names are left as-is. */
export function interpolate(input: string, vars: Record<string, string> = {}): string {
  return input.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (m, k: string) => (k in vars ? vars[k] : m));
}

export function parseKeyValueLines(text: string, sep: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split('\n')) {
    const i = line.indexOf(sep);
    if (i > 0 && line.slice(i + 1).trim()) out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return out;
}

export const stringifyKeyValues = (o: Record<string, string>, sep: string): string =>
  Object.entries(o).map(([k, v]) => `${k}${sep} ${v}`).join('\n');

/** Read a dotted path (data.accessToken, items.0.id) from a parsed JSON value. */
export function getByPath(obj: unknown, path: string): unknown {
  return path.split('.').filter(Boolean).reduce<unknown>(
    (o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined),
    obj,
  );
}
