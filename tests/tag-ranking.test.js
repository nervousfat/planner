import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

const task = (fields = {}) => ({
  id: 't', title: 'T', notes: '', status: 'todo', priority: 'medium',
  due: '', tags: [], createdAt: '2026-04-01T09:00:00.000Z', ...fields
});

test('collectTags counts usage and ranks by count then name', () => {
  const tasks = [
    task({ tags: ['work', 'team'] }),
    task({ tags: ['work'] }),
    task({ tags: ['team', 'plan'] })
  ];
  const ranked = core.collectTags(tasks);
  assert.deepEqual(ranked.map(item => item.tag), ['team', 'work', 'plan']);
  assert.deepEqual(ranked.map(item => item.count), [2, 2, 1]);
});

test('collectTags ignores repeated tags within one task', () => {
  const tasks = [task({ tags: ['work', 'work', 'plan'] })];
  assert.deepEqual(core.collectTags(tasks).map(item => item.tag), ['plan', 'work']);
  assert.deepEqual(core.collectTags(tasks).map(item => item.count), [1, 1]);
});
test('collectTags accepts empty lists and rejects non-arrays', () => {
  assert.deepEqual(core.collectTags([]), []);
  assert.throws(() => core.collectTags('nope'), /任务列表不正确/);
});
