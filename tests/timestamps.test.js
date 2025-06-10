import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
import {task, stateOf, freeze} from './fixtures.mjs';

test('second precision timestamps normalize without changing their instant', () => {
  assert.equal(core.normalizeTask(task({createdAt: '2025-12-31T23:59:59Z'})).createdAt, '2025-12-31T23:59:59.000Z');
  assert.equal(core.normalizeTask(task({createdAt: '2024-02-29T00:00:00.123Z'})).createdAt, '2024-02-29T00:00:00.123Z');
});
test('timestamps reject ambiguous zones and normalized rollover values', () => {
  const invalid = ['2025-01-01', '2025-01-01T00:00:00', '2025-01-01T08:00:00+08:00',
    '2025-01-01T00:60:00Z', '2025-01-01T00:00:60Z', '2025-01-01T00:00:00.1Z',
    '2025-01-01T00:00:00.1234Z', '2025-01-01T00:00:00z', null];
  for (const createdAt of invalid) assert.throws(() => core.normalizeTask(task({createdAt})), /创建时间/);
});
