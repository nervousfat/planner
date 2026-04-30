import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

const task = (fields = {}) => ({
  id: 'task-a', title: 'Read', notes: '', status: 'todo', priority: 'medium',
  due: '', tags: [], createdAt: '2026-03-01T09:00:00.000Z', ...fields
});
const stateOf = (...tasks) => ({ version: 1, tasks });

test('duplicateTask resets status and copies tags', () => {
  const source = stateOf(task({ id: 'origin', status: 'done', tags: ['产品', '本周'], title: '整理提纲' }));
  const next = core.duplicateTask(source, 'origin', 'copy-1', '2026-03-02T09:00:00.000Z');
  const copy = next.tasks.find(item => item.id === 'copy-1');
  assert.equal(next.tasks.length, 2);
  assert.equal(copy.status, 'todo');
  assert.deepEqual(copy.tags, ['产品', '本周']);
  assert.equal(copy.title, '整理提纲（副本）');
  assert.equal(copy.createdAt, '2026-03-02T09:00:00.000Z');
});

test('duplicateTask truncates long titles before appending the suffix', () => {
  const source = stateOf(task({ id: 'origin', title: 'A'.repeat(120) }));
  const next = core.duplicateTask(source, 'origin', 'copy-2', '2026-03-02T09:00:00.000Z');
  const copy = next.tasks.find(item => item.id === 'copy-2');
  assert.equal(copy.title.length, 120);
  assert.ok(copy.title.endsWith('（副本）'));
});
test('duplicateTask keeps the original untouched and reports missing sources', () => {
  const frozen = stateOf(task({ id: 'origin', status: 'doing' }));
  const next = core.duplicateTask(frozen, 'origin', 'copy-3', '2026-03-02T09:00:00.000Z');
  const origin = next.tasks.find(item => item.id === 'origin');
  assert.equal(origin.status, 'doing');
  assert.equal(origin.title, 'Read');
  assert.throws(() => core.duplicateTask(frozen, 'missing', 'copy-4'), /找不到该任务/);
});
