import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
import {task, stateOf, freeze} from './fixtures.mjs';

const tasks = freeze([
  task({id: 'active', title: 'Plan', notes: 'Roadmap', priority: 'high', due: '2025-08-10'}),
  task({id: 'done', status: 'done', title: 'Roadmap', priority: 'high', due: '2025-08-10'}),
  task({id: 'late', status: 'doing', tags: ['ROADMAP'], due: '2025-08-09'}),
  task({id: 'undated', title: 'Unscheduled'})
]);
const ids = filters => core.queryTasks(tasks, filters, '2025-08-10').map(item => item.id);
test('deadline filters and status filters intersect instead of replacing each other', () => {
  assert.deepEqual(ids({search: '  roadmap ', priority: 'high', status: 'todo', due: 'today'}), ['active']);
  assert.deepEqual(ids({due: 'today', status: 'done'}), []);
  assert.deepEqual(ids({due: 'overdue'}), ['late']);
  assert.deepEqual(ids({due: 'none'}), ['undated']);
});
test('empty search keeps all records and ordinary search includes completed work', () => {
  assert.equal(ids({search: '\t '}).length, 4);
  assert.deepEqual(ids({search: 'roadmap'}), ['active', 'done', 'late']);
  assert.deepEqual(ids({priority: 'low'}), []);
  assert.equal(tasks[0].notes, 'Roadmap');
});
