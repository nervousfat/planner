import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
import {task, stateOf, freeze} from './fixtures.mjs';

test('relative labels use calendar days across leap days and new year', () => {
  assert.deepEqual(core.dueLabel(task({due: '2024-02-29'}), '2024-02-28'), {text: '明天截止', tone: 'warning'});
  assert.deepEqual(core.dueLabel(task({due: '2025-01-01'}), '2024-12-31'), {text: '明天截止', tone: 'warning'});
  assert.deepEqual(core.dueLabel(task({due: '2024-02-28'}), '2024-03-01'), {text: '已逾期 2 天', tone: 'danger'});
  assert.deepEqual(core.dueLabel(task({due: '2025-01-03'}), '2025-01-01'), {text: '2025-01-03', tone: 'neutral'});
});
test('undated and completed tasks avoid urgency while invalid due dates fail', () => {
  assert.deepEqual(core.dueLabel(task(), '2025-08-10'), {text: '未设截止日', tone: 'neutral'});
  assert.deepEqual(core.dueLabel(task({status: 'done', due: '2025-08-09'}), '2025-08-10'), {text: '2025-08-09', tone: 'neutral'});
  assert.throws(() => core.dueLabel(task({due: '2025-06-31'}), '2025-08-10'), /截止日期/);
});
