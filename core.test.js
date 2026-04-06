import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from './core.js';
const today = '2026-09-10';
const empty = () => ({ version: 1, tasks: [] });
const add = (state = empty(), fields = {}, id = 'one') => core.createTask(state, { title: '测试任务', ...fields }, id, today + 'T09:00:00.000Z');

test('日期验证拒绝溢出日期并接受闰日', () => {
  assert.equal(core.isDate('2024-02-29'), true);
  assert.equal(core.isDate('2025-02-29'), false);
  assert.equal(core.isDate('2026-04-31'), false);
  assert.equal(core.isDate('2026-13-01'), false);
  assert.equal(core.isDate('2026-9-1'), false);
  assert.equal(core.isDate(null), false);
  assert.equal(core.isDate(today), true);
});

test('创建任务规范化标题且不修改旧状态', () => {
  const before = empty();
  const state = add(before, { title: '  阅读  ', tags: ['学习', '学习'] });
  assert.equal(before.tasks.length, 0);
  assert.equal(state.tasks.length, 1);
  assert.equal(state.tasks[0].title, '阅读');
  assert.deepEqual(state.tasks[0].tags, ['学习']);
  assert.equal(state.tasks[0].priority, 'medium');
  assert.equal(state.tasks[0].status, 'todo');
});

test('创建拒绝无效字段且保持现有数据', () => {
  const state = add();
  assert.throws(() => add(state, { title: '  ' }, 'two'), /名称/);
  assert.throws(() => add(state, { due: '2025-02-29' }, 'two'), /日期/);
  assert.throws(() => add(state, { priority: 'urgent' }, 'two'), /优先级/);
  assert.throws(() => add(state, { status: 'unknown' }, 'two'), /状态/);
  assert.throws(() => add(state, { tags: [2] }, 'two'), /标签/);
  assert.throws(() => add(state, {}, 'one'), /已存在/);
  assert.equal(state.tasks.length, 1);
});

test('更新保留标识和创建时间，移动状态可逆', () => {
  const state = add();
  const changed = core.updateTask(state, 'one', { title: '已修改', id: 'hijack', createdAt: 'bad' });
  assert.equal(changed.tasks[0].id, 'one');
  assert.equal(changed.tasks[0].createdAt, state.tasks[0].createdAt);
  assert.equal(state.tasks[0].title, '测试任务');
  const done = core.moveTask(changed, 'one', 'done');
  assert.equal(done.tasks[0].status, 'done');
  assert.equal(core.moveTask(done, 'one', 'todo').tasks[0].status, 'todo');
  assert.throws(() => core.updateTask(state, 'missing', {}), /找不到/);
});

test('移除只影响指定任务，未知标识给出错误', () => {
  const first = add();
  const state = add(first, { title: '保留任务' }, 'two');
  const result = core.removeTask(state, 'one');
  assert.equal(result.tasks.length, 1);
  assert.equal(result.tasks[0].id, 'two');
  assert.equal(state.tasks.length, 2);
  assert.throws(() => core.removeTask(state, 'missing'), /找不到/);
  assert.throws(() => core.removeTask(state, 2), /ID/);
});

test('搜索覆盖备注标签并组合优先级和截止日', () => {
  const first = add(empty(), { notes: 'REVIEW 文档', due: today, priority: 'high' });
  const state = add(first, { title: '另一个', tags: ['Review'], due: '2026-09-09' }, 'two');
  assert.equal(core.queryTasks(state.tasks, { search: 'review' }, today).length, 2);
  assert.equal(core.queryTasks(state.tasks, { search: 'review', priority: 'high' }, today).length, 1);
  assert.equal(core.queryTasks(state.tasks, { due: 'today' }, today)[0].id, 'one');
  assert.equal(core.queryTasks(state.tasks, { due: 'overdue' }, today)[0].id, 'two');
  assert.equal(core.queryTasks(state.tasks, { search: '不存在' }, today).length, 0);
  assert.throws(() => core.queryTasks(state.tasks, {}, 'bad'), /日期/);
});

test('排序以优先级和截止日为准且不修改原数组', () => {
  const a = add(empty(), { priority: 'low' });
  const b = add(a, { priority: 'high', due: today }, 'two');
  const c = add(b, { priority: 'medium', due: '2026-09-09' }, 'three');
  assert.deepEqual(core.sortTasks(c.tasks).map(task => task.id), ['two', 'three', 'one']);
  assert.deepEqual(core.sortTasks(c.tasks, 'due').map(task => task.id), ['three', 'two', 'one']);
  assert.equal(c.tasks[0].id, 'one');
  assert.throws(() => core.sortTasks(c.tasks, 'random'), /排序/);
  assert.equal(core.sortTasks([], 'newest').length, 0);
});

test('统计不把已完成任务计入逾期或今日待办', () => {
  const a = add(empty(), { due: '2026-09-09', priority: 'high' });
  const b = add(a, { status: 'done', due: '2026-09-08' }, 'two');
  const c = add(b, { due: today }, 'three');
  assert.deepEqual(core.summarize(c.tasks, today), { total: 3, done: 1, active: 2, overdue: 1, dueToday: 1, high: 1, percent: 33 });
  assert.equal(core.summarize([], today).percent, 0);
  assert.equal(core.dueLabel(c.tasks[0], today).tone, 'danger');
  assert.equal(core.dueLabel(c.tasks[1], today).tone, 'neutral');
  assert.equal(core.dueLabel(c.tasks[2], today).text, '今天截止');
});

test('状态分组和边界移动保持任务数量', () => {
  const state = core.sampleState(today);
  const groups = core.groupByStatus(state.tasks);
  assert.equal(groups.todo.length, 2);
  assert.equal(groups.doing.length, 1);
  assert.equal(groups.done.length, 1);
  assert.equal(core.nextStatus('todo', -1), 'todo');
  assert.equal(core.nextStatus('doing', 1), 'done');
  assert.equal(core.nextStatus('done', 1), 'done');
  assert.throws(() => core.nextStatus('todo', 0), /方向/);
});

test('备份往返完整保留中文和用户文本', () => {
  const state = add(empty(), { title: '<img src=x>', notes: '中文\n第二行', tags: ['记录'] });
  const text = core.exportState(state);
  const restored = core.importState(text);
  assert.deepEqual(restored, state);
  assert.equal(restored.tasks[0].title, '<img src=x>');
  assert.equal(restored.tasks[0].notes, '中文\n第二行');
  restored.tasks[0].tags.push('新增');
  assert.deepEqual(state.tasks[0].tags, ['记录']);
});

test('导入拒绝坏 JSON、版本、重复 ID 和无效任务', () => {
  const state = add();
  assert.throws(() => core.importState('{'), /JSON/);
  assert.throws(() => core.importState('null'), /对象/);
  assert.throws(() => core.importState('{"version":2,"tasks":[]}'), /版本/);
  assert.throws(() => core.importState(JSON.stringify({ ...state, tasks: [state.tasks[0], state.tasks[0]] })), /重复/);
  assert.throws(() => core.importState(JSON.stringify({ ...state, tasks: [{ ...state.tasks[0], due: '2026-02-30' }] })), /日期/);
  assert.throws(() => core.importState('x'.repeat(2_000_001)), /2 MB/);
  assert.throws(() => core.importState('汉'.repeat(700_001)), /2 MB/);
  assert.throws(() => core.importState(JSON.stringify({ ...state, tasks: [{ ...state.tasks[0], createdAt: '2026-02-30T09:00:00.000Z' }] })), /创建时间/);
  assert.throws(() => core.importState(JSON.stringify({ ...state, tasks: [{ ...state.tasks[0], createdAt: '2026-09-10T24:00:00.000Z' }] })), /创建时间/);
  assert.equal(state.tasks.length, 1);
});

test('复制创建新任务并截断长标题，标签互相独立', () => {
  const state = add(empty(), { title: '字'.repeat(120), status: 'done', tags: ['工作'] });
  const copied = core.duplicateTask(state, 'one', 'copy', today + 'T10:00:00Z');
  assert.equal(copied.tasks.length, 2);
  assert.equal(copied.tasks[1].title.length, 120);
  assert.equal(copied.tasks[1].status, 'todo');
  assert.equal(copied.tasks[1].id, 'copy');
  copied.tasks[1].tags.push('新标签');
  assert.deepEqual(copied.tasks[0].tags, ['工作']);
});

