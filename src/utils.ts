export function genUUID(): string {
  return crypto.randomUUID();
}

export function now(): string {
  return new Date().toISOString();
}

export function formatLocalDateKey(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return typeof value === 'string' ? value.slice(0, 10) : '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
