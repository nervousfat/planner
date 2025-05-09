export const STATUSES = ['todo', 'doing', 'done'];
export const PRIORITIES = ['high', 'medium', 'low'];
export function isDate(value) {
  if (typeof value !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + 'T00:00:00.000Z');
  if (!Number.isFinite(parsed.getTime())) return false;
  return parsed.toISOString().slice(0, 10) === value;
}

