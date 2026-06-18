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

