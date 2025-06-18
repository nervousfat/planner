import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
import {task, stateOf, freeze} from './fixtures.mjs';

test('the last available slot can be filled but never exceeded', () => {
  const before = freeze(stateOf(...Array.from({length: 499}, (_, i) => task({id: String(i)}))));
  const full = core.createTask(before, {title: 'Last'}, 'last', '2025-07-01T09:00:00Z');
  assert.equal(full.tasks.length, 500);
  assert.equal(before.tasks.length, 499);
  assert.throws(() => core.createTask(full, {title: 'Overflow'}, 'overflow'), /500/);
  assert.equal(full.tasks.at(-1).id, 'last');
});
test('explicit identity arguments override supplied fields and failures preserve inputs', () => {
  const source = freeze(stateOf(task()));
  const fields = freeze({title: 'New', id: 'spoofed', createdAt: 'bad', tags: ['one']});
  const result = core.createTask(source, fields, 'new', '2025-07-01T09:00:00Z');
  assert.equal(result.tasks[1].id, 'new');
  assert.equal(result.tasks[1].createdAt, '2025-07-01T09:00:00.000Z');
  result.tasks[1].tags.push('two');
  assert.deepEqual(fields.tags, ['one']);
  assert.throws(() => core.createTask(source, {title: 'New'}, 'task-a'), /已存在/);
  assert.throws(() => core.createTask(source, {title: 'New'}, 'new', 'bad'), /创建时间/);
  assert.deepEqual(source, stateOf(task()));
});
