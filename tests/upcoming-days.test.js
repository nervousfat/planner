import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

const task = (fields = {}) => ({
  id: 't', title: 'T', notes: '', status: 'todo', priority: 'medium',
  due: '', tags: [], createdAt: '2026-04-01T09:00:00.000Z', ...fields
});
const today = '2026-04-13';

test('upcomingDays buckets open tasks by date', () => {
  const tasks = [
    task({ id: 'a', due: today, priority: 'high' }),
    task({ id: 'b', due: today }),
    task({ id: 'c', due: '2026-04-15' }),
    task({ id: 'd', due: '2026-04-15', status: 'done' })
  ];
  const days = core.upcomingDays(tasks, today, 3);
  assert.equal(days.length, 3);
  assert.deepEqual(days[0], { date: today, count: 2, high: 1 });
  assert.deepEqual(days[1], { date: '2026-04-14', count: 0, high: 0 });
  assert.deepEqual(days[2], { date: '2026-04-15', count: 1, high: 0 });
});
