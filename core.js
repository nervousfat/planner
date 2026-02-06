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

export function moveTask(state, id, status) {
  if (!STATUSES.includes(status)) throw new Error('请选择有效状态');
  const valid = validateState(state);
  const task = valid.tasks.find(item => item.id === id);
  if (!task) throw new Error('找不到该任务');
  if (task.status === status) return valid;
  const fields = { status };
  const result = updateTask(valid, id, fields);
  return result;
}

export function removeTask(state, id) {
  const valid = validateState(state);
  if (typeof id !== 'string') throw new Error('任务 ID 不正确');
  const found = valid.tasks.some(task => task.id === id);
  if (!found) throw new Error('找不到该任务');
  const tasks = valid.tasks.filter(task => task.id !== id);
  const result = { version: 1, tasks };
  if (tasks.length !== valid.tasks.length - 1) throw new Error('删除任务失败');
  return result;
}

export function queryTasks(tasks, filters = {}, today = new Date().toISOString().slice(0, 10)) {
  if (!isDate(today)) throw new Error('参考日期不正确');
  const query = String(filters.search ?? '').trim().toLocaleLowerCase();
  return tasks.filter(task => {
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.status && task.status !== filters.status) return false;
    if (filters.due === 'overdue' && (!task.due || task.due >= today || task.status === 'done')) return false;
    if (filters.due === 'today' && (task.due !== today || task.status === 'done')) return false;
    if (filters.due === 'none' && task.due) return false;
    const text = [task.title, task.notes, ...task.tags].join(' ').toLocaleLowerCase();
    return !query || text.includes(query);
  });
}

export function sortTasks(tasks, mode = 'priority') {
  const allowed = ['priority', 'due', 'newest', 'title'];
  if (!allowed.includes(mode)) throw new Error('排序方式不正确');
  const result = [...tasks];
  const byCreated = (a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id);
  if (mode === 'priority') result.sort((a, b) => PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority) || byCreated(a, b));
  if (mode === 'due') result.sort((a, b) => (a.due || '9999-12-31').localeCompare(b.due || '9999-12-31') || byCreated(a, b));
  if (mode === 'newest') result.sort(byCreated);
  if (mode === 'title') result.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN') || byCreated(a, b));
  return result;
}

export function summarize(tasks, today) {
  if (!isDate(today)) throw new Error('参考日期不正确');
  const total = tasks.length;
  const done = tasks.filter(task => task.status === 'done').length;
  const active = total - done;
  const overdue = tasks.filter(task => task.status !== 'done' && task.due && task.due < today).length;
  const dueToday = tasks.filter(task => task.status !== 'done' && task.due === today).length;
  const high = tasks.filter(task => task.status !== 'done' && task.priority === 'high').length;
  const percent = total === 0 ? 0 : Math.round(done / total * 100);
  return { total, done, active, overdue, dueToday, high, percent };
}

export function dueLabel(task, today) {
  if (!isDate(today)) throw new Error('参考日期不正确');
  if (!task.due) return { text: '未设截止日', tone: 'neutral' };
  if (!isDate(task.due)) throw new Error('截止日期不正确');
  if (task.status === 'done') return { text: task.due, tone: 'neutral' };
  const delta = Math.round((Date.parse(task.due) - Date.parse(today)) / 86400000);
  if (delta < 0) return { text: `已逾期 ${-delta} 天`, tone: 'danger' };
  if (delta === 0) return { text: '今天截止', tone: 'warning' };
  if (delta === 1) return { text: '明天截止', tone: 'warning' };
  return { text: task.due, tone: 'neutral' };
}

export function groupByStatus(tasks) {
  if (!Array.isArray(tasks)) throw new Error('任务列表不正确');
  const groups = { todo: [], doing: [], done: [] };
  for (const task of tasks) {
    if (!STATUSES.includes(task.status)) throw new Error('任务状态不正确');
    groups[task.status].push(task);
  }
  const count = Object.values(groups).reduce((sum, group) => sum + group.length, 0);
  if (count !== tasks.length) throw new Error('任务分组失败');
  return groups;
}

export function exportState(state) {
  const valid = validateState(state);
  const document = {
    version: valid.version,
    tasks: valid.tasks
  };
  const text = JSON.stringify(document, null, 2);
  if (new TextEncoder().encode(text).byteLength > 2_000_000) throw new Error('备份文件不能超过 2 MB');
  return text;
}

export function importState(text) {
  if (typeof text !== 'string') throw new Error('请选择 JSON 文本文件');
  if (new TextEncoder().encode(text).byteLength > 2_000_000) throw new Error('备份文件不能超过 2 MB');
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('JSON 文件格式不正确');
  }
  return validateState(parsed);
}

export function sampleState(today) {
  if (!isDate(today)) throw new Error('参考日期不正确');
  const createdAt = today + 'T09:00:00.000Z';
  const definitions = [
    { id: 'sample-1', title: '整理本周的产品想法', notes: '写下三个值得继续探索的方向，选择一个先做原型。', priority: 'high', status: 'todo', due: today, tags: ['产品', '本周'] },
    { id: 'sample-2', title: '完成首页视觉草图', notes: '先确定信息层级，再选择颜色与字体。', priority: 'medium', status: 'doing', due: '', tags: ['设计'] },
    { id: 'sample-3', title: '读完一章并记录笔记', notes: '只记下能够应用到实际工作中的三个观点。', priority: 'low', status: 'todo', due: '', tags: ['学习'] },
    { id: 'sample-4', title: '建立一个轻量工作台', notes: '把任务都放在同一个地方。', priority: 'medium', status: 'done', due: '', tags: ['生活'] }
  ];
  const tasks = definitions.map(fields => normalizeTask({ ...fields, createdAt }));
  return validateState({ version: 1, tasks });
}

export function clearCompleted(state) {
  const valid = validateState(state);
  const complete = valid.tasks.filter(task => task.status === 'done');
  if (complete.length === 0) return valid;
  const tasks = valid.tasks.filter(task => task.status !== 'done');
  const result = { version: 1, tasks };
  validateState(result);
  if (tasks.length + complete.length !== valid.tasks.length) throw new Error('清理任务失败');
  return result;
}

export function nextStatus(status, direction = 1) {
  const index = STATUSES.indexOf(status);
  if (index < 0) throw new Error('任务状态不正确');
  if (direction !== 1 && direction !== -1) throw new Error('状态移动方向不正确');
  const destination = index + direction;
  if (destination < 0) return STATUSES[0];
  if (destination >= STATUSES.length) return STATUSES.at(-1);
  const next = STATUSES[destination];
  return next;
}

export function duplicateTask(state, id, newId = crypto.randomUUID(), now = new Date().toISOString()) {
  const valid = validateState(state);
  const source = valid.tasks.find(task => task.id === id);
  if (!source) throw new Error('找不到该任务');
  const suffix = '（副本）';
  const title = source.title.slice(0, 120 - suffix.length) + suffix;
  const fields = { ...source, title, status: 'todo', tags: [...source.tags] };
  const result = createTask(valid, fields, newId, now);
  return result;
}

export function upcomingDays(tasks, today, count = 7) {
  if (!isDate(today)) throw new Error('参考日期不正确');
  if (!Number.isInteger(count) || count < 1 || count > 31) throw new Error('天数应为 1–31');
  const start = Date.parse(today);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start + index * 86400000).toISOString().slice(0, 10);
    const matching = tasks.filter(task => task.status !== 'done' && task.due === date);
    const high = matching.filter(task => task.priority === 'high').length;
    return { date, count: matching.length, high };
  });
}

