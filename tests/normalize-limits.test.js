import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

const base = (fields = {}) => ({
  id: 't', title: 'T', notes: '', status: 'todo', priority: 'medium',
  due: '', tags: [], createdAt: '2026-09-02T09:00:00.000Z', ...fields
});

test('normalizeTask enforces field capacities', () => {
  assert.throws(() => core.normalizeTask(base({ title: 'A'.repeat(121) })), /任务名称应为 1–120 个字符/);
  assert.throws(() => core.normalizeTask(base({ tags: Array.from({ length: 9 }, (_, index) => 't' + index) })), /最多 8 个标签，每个 1–24 字/);
  assert.throws(() => core.normalizeTask(base({ notes: 'N'.repeat(2001) })), /备注最多 2000 个字符/);
});
test('normalizeTask dedupes and trims tags', () => {
  const task = core.normalizeTask(base({ tags: [' a ', 'a', 'b'] }));
  assert.deepEqual(task.tags, ['a', 'b']);
  assert.throws(() => core.normalizeTask(base({ status: 'paused' })), /任务状态不正确/);
});
