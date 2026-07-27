const sensitive = /password|token|secret|authorization|cookie/i;
export function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, sensitive.test(key) ? '[MASQUÉ]' : redact(item)]),
    );
  return value;
}
