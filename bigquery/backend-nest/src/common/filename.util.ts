const ACCENT_MARKS = /[̀-ͯ]/g;

export function sanitizeFilename(
  input: string | undefined | null,
  fallback = 'export',
): string {
  const normalized = String(input ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(ACCENT_MARKS, '')
    .replace(/[\\/]/g, '-') // separadores de path
    .replace(/\.\.+/g, '-') // sequências ".."
    .replace(/[^a-z0-9._-]+/g, '-') // qualquer coisa fora do charset seguro
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 100);

  return normalized || fallback;
}
