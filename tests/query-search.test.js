import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

const task = (fields = {}) => ({
  id: 't', title: 'Read', notes: '', status: 'todo', priority: 'medium',
  due: '', tags: [], createdAt: '2026-06-01T09:00:00.000Z', ...fields
});
const today = '2026-06-10';

test('queryTasks matches search text in titles notes and tags', () => {
  const tasks = [
    task({ id: 'a', title: 'Quarterly review prep' }),
    task({ id: 'b', notes: 'check with legal REVIEW first' }),
    task({ id: 'c', tags: ['Review'] }),
    task({ id: 'd', title: 'Unrelated' })
  ];
  assert.deepEqual(core.queryTasks(tasks, { search: 'review' }).map(item => item.id), ['a', 'b', 'c']);
});
test('queryTasks due filters exclude finished tasks', () => {
  const tasks = [
    task({ id: 'over', due: '2026-06-08' }),
    task({ id: 'over-done', due: '2026-06-08', status: 'done' }),
    task({ id: 'now', due: today }),
    task({ id: 'none' }),
    task({ id: 'with-due', due: '2026-06-30' })
  ];
  assert.deepEqual(core.queryTasks(tasks, { due: 'overdue' }, today).map(item => item.id), ['over']);
  assert.deepEqual(core.queryTasks(tasks, { due: 'today' }, today).map(item => item.id), ['now']);
  assert.deepEqual(core.queryTasks(tasks, { due: 'none' }, today).map(item => item.id), ['none']);
  assert.deepEqual(core.queryTasks(tasks, { priority: 'medium', search: 'unrelated' }).map(item => item.id), []);
});
