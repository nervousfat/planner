import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

test('nextStatus steps forward and clamps at both ends', () => {
  assert.equal(core.nextStatus('todo'), 'doing');
  assert.equal(core.nextStatus('doing'), 'done');
  assert.equal(core.nextStatus('done'), 'done');
  assert.equal(core.nextStatus('todo', -1), 'todo');
  assert.equal(core.nextStatus('doing', -1), 'todo');
});

test('nextStatus rejects unknown statuses and directions', () => {
  assert.throws(() => core.nextStatus('paused'), /任务状态不正确/);
  assert.throws(() => core.nextStatus('todo', 0), /状态移动方向不正确/);
  assert.throws(() => core.nextStatus('todo', 2), /状态移动方向不正确/);
});
