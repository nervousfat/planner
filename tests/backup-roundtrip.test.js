import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

const task = (fields = {}) => ({
  id: 't', title: 'T', notes: '', status: 'todo', priority: 'medium',
  due: '', tags: [], createdAt: '2026-06-03T09:00:00.000Z', ...fields
});
const stateOf = (...tasks) => ({ version: 1, tasks });

test('exportState and importState round-trip without loss', () => {
  const state = stateOf(task({ id: 'a', tags: ['x'] }), task({ id: 'b', status: 'done', due: '2026-07-01' }));
  const restored = core.importState(core.exportState(state));
  assert.deepEqual(restored, state);
});
