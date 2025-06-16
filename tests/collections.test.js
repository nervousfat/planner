import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
import {task, stateOf, freeze} from './fixtures.mjs';

test('versioned collections accept 500 unique tasks and reject overflow', () => {
  const tasks = Array.from({length: 500}, (_, i) => task({id: String(i)}));
  assert.equal(core.validateState(stateOf(...tasks)).tasks.length, 500);
  assert.throws(() => core.validateState(stateOf(...tasks, task({id: 'extra'}))), /500/);
  assert.throws(() => core.validateState(stateOf(tasks[0], {...tasks[0], title: 'Other'})), /重复/);
});
test('collection validation returns a clean snapshot and rejects malformed containers', () => {
  const source = freeze({...stateOf(task({tags: ['one']})), transient: true});
  const copy = core.validateState(source);
  copy.tasks[0].tags.push('two');
  assert.deepEqual(source.tasks[0].tags, ['one']);
  assert.deepEqual(Object.keys(copy), ['version', 'tasks']);
  for (const input of [{version: 1}, {version: '1', tasks: []}, {version: 1, tasks: {}}, {version: 1, tasks: [null]}]) assert.throws(() => core.validateState(input));
});
