import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
import {task, stateOf, freeze} from './fixtures.mjs';

test('normalization produces an allowlisted independent record', () => {
  const source = freeze(task({tags: [' work ', 'work'], extra: {internal: true}}));
  const result = core.normalizeTask(source);
  assert.deepEqual(Object.keys(result), ['id', 'title', 'notes', 'status', 'priority', 'due', 'tags', 'createdAt']);
  result.tags.push('personal');
  result.title = 'Changed';
  assert.deepEqual(source.tags, [' work ', 'work']);
  assert.equal(source.title, 'Read');
});
test('optional fields get defaults while invalid record shapes fail', () => {
  const {notes, due, tags, ...minimal} = task();
  assert.deepEqual(core.normalizeTask(minimal), task());
  for (const value of [null, [], 'record', 3]) assert.throws(() => core.normalizeTask(value), /格式/);
  for (const fields of [{notes: 3}, {id: ' '}, {title: false}]) assert.throws(() => core.normalizeTask(task(fields)));
});
