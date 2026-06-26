import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

const task = (fields = {}) => ({
  id: 't', title: 'T', notes: '', status: 'todo', priority: 'medium',
  due: '', tags: [], createdAt: '2026-06-02T09:00:00.000Z', ...fields
});

test('groupByStatus keeps membership and totals consistent', () => {
  const tasks = [task({ status: 'todo' }), task({ status: 'doing' }), task({ status: 'done' }), task({ status: 'done' })];
  const groups = core.groupByStatus(tasks);
  assert.equal(groups.todo.length + groups.doing.length + groups.done.length, tasks.length);
  assert.equal(groups.done.length, 2);
});
