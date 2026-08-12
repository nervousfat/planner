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

function taskButton(label, action, className = '') {
  const button = element('button', className, label);
  button.type = 'button';
  button.addEventListener('click', () => attempt(action));
  return button;
}
function renderTask(task, today) {
  const card = element('article', 'task');
  card.dataset.taskId = task.id;
  const top = element('div', 'task-top');
  const due = core.dueLabel(task, today);
  top.append(element('span', 'priority ' + task.priority, priorities[task.priority]), element('span', 'due ' + due.tone, due.text));
  card.append(top, element('h3', '', task.title));
  if (task.notes) card.append(element('p', 'notes', task.notes));
  if (task.tags.length) {
    const tags = element('div', 'tags');
    for (const tag of task.tags) tags.append(element('span', 'tag', tag));
    card.append(tags);
  }
  const actions = element('div', 'task-actions');
  actions.append(taskButton('编辑', () => editTask(task)));
  actions.append(taskButton('复制', () => persist(core.duplicateTask(state, task.id), '已复制任务，副本放入待开始。')));
  actions.append(taskButton('删除', () => {
    if (!confirm(`删除“${task.title}”？`)) return;
    persist(core.removeTask(state, task.id), '已删除任务。可使用下方撤销按钮恢复。');
    if (editingId === task.id) resetForm();
    offerUndo();
  }, 'delete'));
  if (task.status !== 'todo') actions.append(taskButton('← 退回', () => persist(core.moveTask(state, task.id, core.nextStatus(task.status, -1)), '任务已退回上一状态。')));
  if (task.status !== 'done') actions.append(taskButton(task.status === 'todo' ? '开始 →' : '完成 ✓', () => persist(core.moveTask(state, task.id, core.nextStatus(task.status)), '任务已更新。'), 'advance'));
  card.append(actions);
  return card;
}

function renderBoard(today) {
  const filters = { search: $('#search').value, priority: $('#filter-priority').value, due: $('#filter-due').value };
  const visible = core.sortTasks(core.queryTasks(state.tasks, filters, today), $('#sort').value);
  const groups = core.groupByStatus(visible);
  const board = $('#board');
  board.replaceChildren();
  $('#result-count').textContent = `显示 ${visible.length} / ${state.tasks.length} 个任务`;
  const empties = { todo: '还没有待办任务。\n写下你的下一个小目标。', doing: '这里等待你的专注。\n点击“开始”推进一个任务。', done: '完成的任务会留在这里。\n每一步都值得记录。' };
  for (const status of core.STATUSES) {
    const column = element('section', 'column ' + status);
    column.setAttribute('aria-label', names[status]);
    const heading = element('div', 'column-head');
    heading.append(element('span', 'status-dot'), element('h2', '', names[status]), element('span', 'badge', String(groups[status].length)));
    column.append(heading);
    for (const task of groups[status]) column.append(renderTask(task, today));
    if (!groups[status].length) column.append(element('p', 'empty', visible.length !== state.tasks.length ? '没有符合筛选条件的任务。' : empties[status]));
    board.append(column);
  }
  $('#clear-done').disabled = !state.tasks.some(task => task.status === 'done');
}
function render() {
  const today = localToday();
  $('#date-label').textContent = new Date(today + 'T12:00:00').toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
  renderMetrics(today);
  renderBoard(today);
}
function offerUndo() {
  if (!undoState) return;
  const target = undoState;
  const button = taskButton('撤销刚才的操作', () => {
    persist(target, '已撤销上一次操作。');
    resetForm();
  }, 'text-button');
  button.style.marginLeft = '12px';
  $('#status').append(button);
}

