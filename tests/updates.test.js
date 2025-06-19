import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
import {task, stateOf, freeze} from './fixtures.mjs';

test('a partial edit preserves every unrelated field and record', () => {
  const source = freeze(stateOf(task({tags: ['work'], notes: 'Keep'}), task({id: 'second', title: 'Other'})));
  const result = core.updateTask(source, 'task-a', {priority: 'high'});
  assert.deepEqual(result.tasks[0], {...source.tasks[0], priority: 'high'});
  assert.deepEqual(result.tasks[1], source.tasks[1]);
  result.tasks[0].tags.push('new');
  assert.deepEqual(source.tasks[0].tags, ['work']);
});
test('invalid patches cannot partially change an existing task', () => {
  const source = freeze(stateOf(task()));
  for (const fields of [{title: ''}, {notes: 'a'.repeat(2001)}, {due: '2025-11-31'}, {status: null}]) {
    assert.throws(() => core.updateTask(source, 'task-a', fields));
    assert.deepEqual(source, stateOf(task()));
  }
  assert.deepEqual(core.updateTask(source, 'task-a', {}), source);
});
