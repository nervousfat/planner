import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
import {task, stateOf, freeze} from './fixtures.mjs';

test('text fields accept their limits and reject the next code unit', () => {
  const limits = {title: 120, notes: 2000, id: 100};
  for (const [field, length] of Object.entries(limits)) {
    assert.equal(core.normalizeTask(task({[field]: '字'.repeat(length)}))[field].length, length);
    assert.throws(() => core.normalizeTask(task({[field]: '字'.repeat(length + 1)})));
  }
  assert.equal(core.normalizeTask(task({title: '  Read  '})).title, 'Read');
  assert.throws(() => core.normalizeTask(task({title: '\t\n'})), /名称/);
});
test('tag limits apply before normalization and preserve first occurrence order', () => {
  const tags = Array.from({length: 8}, (_, i) => 'tag-' + i);
  assert.deepEqual(core.normalizeTask(task({tags})).tags, tags);
  assert.throws(() => core.normalizeTask(task({tags: [...tags, 'extra']})), /标签/);
  assert.deepEqual(core.normalizeTask(task({tags: [' beta ', 'alpha', 'beta']})).tags, ['beta', 'alpha']);
  assert.equal(core.normalizeTask(task({tags: ['字'.repeat(24)]})).tags[0].length, 24);
  for (const tags of [['字'.repeat(25)], [' '], [null], 'tag']) assert.throws(() => core.normalizeTask(task({tags})), /标签/);
});
