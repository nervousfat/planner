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
test('importState reports precise errors for broken files', () => {
  assert.throws(() => core.importState('not json at all'), /JSON 文件格式不正确/);
  assert.throws(() => core.importState('{"version":2,"tasks":[]}'), /不支持此备份版本/);
  assert.throws(() => core.importState('{"version":1,"tasks":[]}{"version":1}'), /JSON 文件格式不正确/);
});
