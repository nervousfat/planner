import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
import {task, stateOf, freeze} from './fixtures.mjs';

test('every valid status can move directly to every other status', () => {
  for (const from of core.STATUSES) for (const to of core.STATUSES) {
    const source = freeze(stateOf(task({status: from})));
    const result = core.moveTask(source, 'task-a', to);
    assert.deepEqual(result.tasks[0], {...source.tasks[0], status: to});
    assert.equal(source.tasks[0].status, from);
    assert.deepEqual(core.moveTask(result, 'task-a', from), source);
  }
});
test('same-status moves normalize safely and missing identities fail', () => {
  const source = stateOf(task({title: ' Read '}));
  assert.equal(core.moveTask(source, 'task-a', 'todo').tasks[0].title, 'Read');
  assert.equal(source.tasks[0].title, ' Read ');
  assert.throws(() => core.moveTask(source, 'missing', 'done'), /找不到/);
  for (const status of ['', null, 'DONE']) assert.throws(() => core.moveTask(source, 'task-a', status), /状态/);
});
