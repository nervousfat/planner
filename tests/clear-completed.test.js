import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

const task = (fields = {}) => ({
  id: 't', title: 'T', notes: '', status: 'todo', priority: 'medium',
  due: '', tags: [], createdAt: '2026-07-01T09:00:00.000Z', ...fields
});
const stateOf = (...tasks) => ({ version: 1, tasks });

test('clearCompleted removes finished tasks only', () => {
  const state = stateOf(task({ id: 'a', status: 'done' }), task({ id: 'b', status: 'doing' }), task({ id: 'c', status: 'done' }));
  const next = core.clearCompleted(state);
  assert.deepEqual(next.tasks.map(item => item.id), ['b']);
});
test('clearCompleted keeps states without finished tasks', () => {
  const state = stateOf(task({ id: 'a' }));
  assert.deepEqual(core.clearCompleted(state), state);
  assert.deepEqual(core.clearCompleted(stateOf()).tasks, []);
});
