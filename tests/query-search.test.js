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
