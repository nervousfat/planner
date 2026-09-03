import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

const task = (fields = {}) => ({
  id: 't', title: 'T', notes: '', status: 'todo', priority: 'medium',
  due: '', tags: [], createdAt: '2026-09-01T09:00:00.000Z', ...fields
});
const stateOf = (...tasks) => ({ version: 1, tasks });

test('moveTask advances status and is idempotent for same targets', () => {
  const state = stateOf(task({ id: 'a', status: 'todo' }));
  const doing = core.moveTask(state, 'a', 'doing');
  assert.equal(doing.tasks[0].status, 'doing');
  const again = core.moveTask(doing, 'a', 'doing');
  assert.deepEqual(again, doing);
  assert.throws(() => core.moveTask(state, 'a', 'paused'), /请选择有效状态/);
  assert.throws(() => core.moveTask(state, 'missing', 'doing'), /找不到该任务/);
});
