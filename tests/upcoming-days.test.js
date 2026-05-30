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
test('upcomingDays validates the reference date and window size', () => {
  assert.throws(() => core.upcomingDays([], '2026-4-13', 3), /参考日期不正确/);
  assert.throws(() => core.upcomingDays([], today, 0), /天数应为 1–31/);
  assert.throws(() => core.upcomingDays([], today, 32), /天数应为 1–31/);
  assert.equal(core.upcomingDays([], today, 31).length, 31);
});

test('upcomingDays spans month boundaries', () => {
  const days = core.upcomingDays([task({ due: '2026-05-01' })], '2026-04-29', 4);
  assert.deepEqual(days.map(day => day.date), ['2026-04-29', '2026-04-30', '2026-05-01', '2026-05-02']);
  assert.deepEqual(days.map(day => day.count), [0, 0, 1, 0]);
});
