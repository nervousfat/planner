import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';

test('Gregorian century rules distinguish divisible-by-400 years', () => {
  for (const year of [1600, 2000, 2400]) assert.equal(core.isDate(year + '-02-29'), true);
  for (const year of [1700, 1800, 1900, 2100]) assert.equal(core.isDate(year + '-02-29'), false);
  for (const month of ['04', '06', '09', '11']) {
    assert.equal(core.isDate('2025-' + month + '-30'), true);
    assert.equal(core.isDate('2025-' + month + '-31'), false);
  }
});
test('calendar validation accepts only an exact date string', () => {
  for (const value of [' 2025-01-01', '2025-01-01\n', '2025-01-01T00:00:00Z', '2025-00-01', '2025-01-00', 20250101, {}, []]) {
    assert.equal(core.isDate(value), false, JSON.stringify(value));
  }
  assert.equal(core.isDate('0000-01-01'), true);
  assert.equal(core.isDate('9999-12-31'), true);
});
