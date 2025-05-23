export const STATUSES = ['todo', 'doing', 'done'];
export const PRIORITIES = ['high', 'medium', 'low'];
export function isDate(value) {
  if (typeof value !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + 'T00:00:00.000Z');
  if (!Number.isFinite(parsed.getTime())) return false;
  return parsed.toISOString().slice(0, 10) === value;
}

export function normalizeTask(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('任务格式不正确');
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (!title || title.length > 120) throw new Error('任务名称应为 1–120 个字符');
  const notes = input.notes ?? '';
  if (typeof notes !== 'string' || notes.length > 2000) throw new Error('备注最多 2000 个字符');
  if (!STATUSES.includes(input.status)) throw new Error('任务状态不正确');
  if (!PRIORITIES.includes(input.priority)) throw new Error('任务优先级不正确');
  if (typeof input.id !== 'string' || !input.id.trim() || input.id.length > 100) throw new Error('任务 ID 不正确');
  const due = input.due ?? '';
  if (due !== '' && !isDate(due)) throw new Error('截止日期不正确');
  const tags = input.tags ?? [];
  if (!Array.isArray(tags) || tags.length > 8 || tags.some(tag => typeof tag !== 'string' || !tag.trim() || tag.length > 24)) throw new Error('最多 8 个标签，每个 1–24 字');
  if (typeof input.createdAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(input.createdAt) || !isDate(input.createdAt.slice(0, 10)) || !Number.isFinite(Date.parse(input.createdAt))) throw new Error('创建时间不正确');
  if (new Date(input.createdAt).toISOString() !== input.createdAt.replace(/(?<=:\d{2})Z$/, '.000Z')) throw new Error('创建时间不正确');
  return { id: input.id, title, notes, status: input.status, priority: input.priority, due, tags: [...new Set(tags.map(tag => tag.trim()))], createdAt: new Date(input.createdAt).toISOString() };
}

