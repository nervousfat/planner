import * as core from './core.js';
const KEY = 'shixu-planner-v1';
const $ = selector => document.querySelector(selector);
const form = $('#task-form');
const names = { todo: '待开始', doing: '进行中', done: '已完成' };
const priorities = { high: '高优先', medium: '中优先', low: '低优先' };
let state = { version: 1, tasks: [] };
let editingId = null;
let undoState = null;
function localToday() {
  const date = new Date();
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function notify(message, error = false) {
  const status = $('#status');
  status.textContent = message;
  status.classList.toggle('error', error);
}
function persist(next, message) {
  const serialized = core.exportState(next);
  try {
    localStorage.setItem(KEY, serialized);
  } catch {
    throw new Error('浏览器未能保存数据，请检查存储空间或隐私设置。当前修改未保存。');
  }
  undoState = state;
  state = next;
  render();
  notify(message);
}
function attempt(action) {
  try { action(); } catch (error) { notify(error.message, true); }
}
function resetForm() {
  editingId = null;
  form.reset();
  $('#form-heading').textContent = '添加一个任务';
  $('#form-mode').textContent = '新建';
  $('#submit-task').textContent = '添加任务';
  $('#cancel-edit').hidden = true;
}
function editTask(task) {
  editingId = task.id;
  for (const key of ['title', 'notes', 'priority', 'status', 'due']) form.elements[key].value = task[key];
  form.elements.tags.value = task.tags.join(', ');
  $('#form-heading').textContent = '编辑任务';
  $('#form-mode').textContent = '编辑中';
  $('#submit-task').textContent = '保存修改';
  $('#cancel-edit').hidden = false;
  form.elements.title.focus();
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function renderMetrics(today) {
  const summary = core.summarize(state.tasks, today);
  const metrics = $('#metrics');
  metrics.replaceChildren();
  const values = [
    ['未完成', summary.active, `其中 ${summary.high} 项高优先`],
    ['今天截止', summary.dueToday, '留给今天的一点专注'],
    ['已经逾期', summary.overdue, '调整计划，重新出发'],
    ['完成进度', summary.percent + '%', `共 ${summary.total} 项，已完成 ${summary.done} 项`]
  ];
  for (const [label, value, detail] of values) {
    const card = element('article', 'stat');
    card.append(element('span', 'muted', label), element('strong', '', value), element('p', 'muted', detail));
    metrics.append(card);
  }
  const week = $('#week');
  week.replaceChildren();
  for (const [index, day] of core.upcomingDays(state.tasks, today).entries()) {
    const label = index === 0 ? '今天' : day.date.slice(5).replace('-', '/');
    const block = element('div', 'day' + (index === 0 ? ' today' : ''));
    block.title = `${day.date}：${day.count} 项待办，${day.high} 项高优先`;
    block.append(element('span', '', label), element('strong', '', String(day.count)));
    week.append(block);
  }
}

