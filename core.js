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

export function validateState(input) {
  if (!input || typeof input !== 'object') throw new Error('备份必须是对象');
  if (input.version !== 1) throw new Error('不支持此备份版本');
  if (!Array.isArray(input.tasks)) throw new Error('备份缺少任务列表');
  if (input.tasks.length > 500) throw new Error('最多支持 500 个任务');
  const tasks = input.tasks.map(normalizeTask);
  const ids = new Set(tasks.map(task => task.id));
  if (ids.size !== tasks.length) throw new Error('备份包含重复任务 ID');
  return { version: 1, tasks };
}

export function createTask(state, fields, id = crypto.randomUUID(), now = new Date().toISOString()) {
  const valid = validateState(state);
  if (valid.tasks.length >= 500) throw new Error('任务已达 500 个，请先清理');
  if (valid.tasks.some(task => task.id === id)) throw new Error('任务 ID 已存在');
  const task = normalizeTask({ title: '', notes: '', priority: 'medium', status: 'todo', due: '', tags: [], ...fields, id, createdAt: now });
  const tasks = [...valid.tasks, task];
  const result = { version: 1, tasks };
  validateState(result);
  return result;
}

export function updateTask(state, id, fields) {
  const valid = validateState(state);
  const index = valid.tasks.findIndex(task => task.id === id);
  if (index < 0) throw new Error('找不到该任务');
  const original = valid.tasks[index];
  const task = normalizeTask({ ...original, ...fields, id: original.id, createdAt: original.createdAt });
  const tasks = [...valid.tasks];
  tasks[index] = task;
  return { version: 1, tasks };
}

