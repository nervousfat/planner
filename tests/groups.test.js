import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
import {task, stateOf, freeze} from './fixtures.mjs';

test('grouping partitions all records while preserving order within each column', () => {
  const tasks = freeze(['doing', 'todo', 'done', 'todo', 'doing'].map((status, index) => task({id: String(index), status})));
  const result = core.groupByStatus(tasks);
  assert.deepEqual(result.todo.map(item => item.id), ['1', '3']);
  assert.deepEqual(result.doing.map(item => item.id), ['0', '4']);
  assert.deepEqual(result.done.map(item => item.id), ['2']);
  assert.equal(new Set(Object.values(result).flat().map(item => item.id)).size, tasks.length);
  result.todo.pop();
  assert.equal(tasks.length, 5);
});
test('empty groups are present and invalid input does not return partial groups', () => {
  assert.deepEqual(core.groupByStatus([]), {todo: [], doing: [], done: []});
  assert.throws(() => core.groupByStatus(null), /列表/);
  assert.throws(() => core.groupByStatus([task(), task({status: 'unknown'})]), /状态/);
});
