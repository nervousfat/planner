import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
import {task, stateOf, freeze} from './fixtures.mjs';

test('workload totals partition all tasks while urgency excludes completed work', () => {
  const tasks = [];
  for (const status of core.STATUSES) for (const priority of core.PRIORITIES) {
    tasks.push(task({id: status + priority, status, priority, due: '2025-08-09'}));
  }
  const result = core.summarize(tasks, '2025-08-10');
  assert.deepEqual(result, {total: 9, done: 3, active: 6, overdue: 6, dueToday: 0, high: 2, percent: 33});
  assert.equal(result.total, result.done + result.active);
  assert.deepEqual(core.summarize(tasks.map(item => ({...item, status: 'done'})), '2025-08-10'),
    {total: 9, done: 9, active: 0, overdue: 0, dueToday: 0, high: 0, percent: 100});
});
test('empty and future-only workloads have no overdue or due-today counts', () => {
  assert.deepEqual(core.summarize([], '2025-08-10'), {total: 0, done: 0, active: 0, overdue: 0, dueToday: 0, high: 0, percent: 0});
  const future = core.summarize([task({due: '2025-08-11'}), task()], '2025-08-10');
  assert.equal(future.overdue + future.dueToday, 0);
  assert.throws(() => core.summarize([], '2025-02-29'), /日期/);
});
