import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

const task = (fields = {}) => ({
  id: 't', title: 'T', notes: '', status: 'todo', priority: 'medium',
  due: '', tags: [], createdAt: '2026-09-01T09:00:00.000Z', ...fields
});

test('dueLabel colors deadlines relative to today', () => {
  const today = '2026-09-08';
  assert.deepEqual(core.dueLabel(task({}), today), { text: '未设截止日', tone: 'neutral' });
  assert.deepEqual(core.dueLabel(task({ due: '2026-09-06' }), today), { text: '已逾期 2 天', tone: 'danger' });
  assert.deepEqual(core.dueLabel(task({ due: today }), today), { text: '今天截止', tone: 'warning' });
  assert.deepEqual(core.dueLabel(task({ due: '2026-09-09' }), today), { text: '明天截止', tone: 'warning' });
  assert.deepEqual(core.dueLabel(task({ due: '2026-09-20' }), today), { text: '2026-09-20', tone: 'neutral' });
});

test('dueLabel stays neutral for finished tasks', () => {
  const done = core.dueLabel(task({ due: '2026-09-01', status: 'done' }), '2026-09-08');
  assert.deepEqual(done, { text: '2026-09-01', tone: 'neutral' });
  assert.throws(() => core.dueLabel(task({}), '20260908'), /参考日期不正确/);
});
test('dueLabel validates stored due dates', () => {
  assert.throws(() => core.dueLabel(task({ due: '2026-9-8' }), '2026-09-08'), /截止日期不正确/);
  assert.throws(() => core.dueLabel(task({}), 'not-a-date'), /参考日期不正确/);
});
