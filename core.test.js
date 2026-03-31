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

