import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
import {task, stateOf, freeze} from './fixtures.mjs';

test('equal priorities and dates use newest creation followed by identifier', () => {
  const source = freeze([
    task({id: 'b', createdAt: '2025-07-01T09:00:00.000Z', due: '2025-08-01'}),
    task({id: 'z', createdAt: '2025-06-01T09:00:00.000Z', due: '2025-08-01'}),
    task({id: 'a', createdAt: '2025-07-01T09:00:00.000Z', due: '2025-08-01'})
  ]);
  for (const mode of ['priority', 'due', 'newest', 'title']) {
    assert.deepEqual(core.sortTasks(source, mode).map(item => item.id), ['a', 'b', 'z']);
  }
  assert.deepEqual(source.map(item => item.id), ['b', 'z', 'a']);
});
test('title sort compares names and deadline sort puts undated tasks last', () => {
  const source = [task({id: 'z', title: 'Zulu'}), task({id: 'a', title: 'Alpha', due: '2025-12-31'})];
  assert.deepEqual(core.sortTasks(source, 'title').map(item => item.id), ['a', 'z']);
  assert.deepEqual(core.sortTasks(source, 'due').map(item => item.id), ['a', 'z']);
  assert.notEqual(core.sortTasks(source), source);
});
