import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
import {task, stateOf, freeze} from './fixtures.mjs';

test('deleting first middle or last keeps all survivors in their original order', () => {
  const source = freeze(stateOf(...['a', 'b', 'c'].map(id => task({id}))));
  for (const id of ['a', 'b', 'c']) {
    assert.deepEqual(core.removeTask(source, id).tasks.map(item => item.id), ['a', 'b', 'c'].filter(value => value !== id));
    assert.equal(source.tasks.length, 3);
  }
  assert.deepEqual(core.removeTask(stateOf(task()), 'task-a'), stateOf());
});
test('deletion rejects corrupt collections before removing any matching record', () => {
  const duplicate = freeze(stateOf(task(), task()));
  assert.throws(() => core.removeTask(duplicate, 'task-a'), /重复/);
  assert.equal(duplicate.tasks.length, 2);
  assert.throws(() => core.removeTask(stateOf(), 'task-a'), /找不到/);
});
