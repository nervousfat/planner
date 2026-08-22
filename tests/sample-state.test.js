import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

test('sampleState returns a valid board anchored to today', () => {
  const today = '2026-07-06';
  const state = core.sampleState(today);
  assert.equal(state.version, 1);
  assert.equal(state.tasks.length, 4);
  for (const item of state.tasks) {
    assert.ok(core.STATUSES.includes(item.status));
    assert.equal(item.createdAt, today + 'T09:00:00.000Z');
  }
  assert.equal(state.tasks.find(item => item.id === 'sample-1').due, today);
});
