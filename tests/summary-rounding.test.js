import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

const task = (fields = {}) => ({
  id: 't', title: 'T', notes: '', status: 'todo', priority: 'medium',
  due: '', tags: [], createdAt: '2026-05-01T09:00:00.000Z', ...fields
});

test('summarize rounds completion percent and reports empty lists', () => {
  const today = '2026-05-06';
  const tasks = [task({ status: 'done' }), task({}), task({})];
  const stats = core.summarize(tasks, today);
  assert.equal(stats.total, 3);
  assert.equal(stats.done, 1);
  assert.equal(stats.active, 2);
  assert.equal(stats.percent, 33);
  assert.deepEqual(core.summarize([], today), { total: 0, done: 0, active: 0, overdue: 0, dueToday: 0, high: 0, percent: 0 });
});
test('summarize counts overdue and due-today work excluding finished tasks', () => {
  const today = '2026-05-06';
  const tasks = [
    task({ id: 'late', due: '2026-05-04' }),
    task({ id: 'late-done', due: '2026-05-04', status: 'done' }),
    task({ id: 'today', due: today, priority: 'high' }),
    task({ id: 'today-done', due: today, status: 'done' })
  ];
  const stats = core.summarize(tasks, today);
  assert.equal(stats.overdue, 1);
  assert.equal(stats.dueToday, 1);
  assert.equal(stats.high, 1);
  assert.throws(() => core.summarize(tasks, '2026-13-01'), /参考日期不正确/);
});
