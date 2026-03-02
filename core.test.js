import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from './core.js';
const today = '2026-09-10';
const empty = () => ({ version: 1, tasks: [] });
const add = (state = empty(), fields = {}, id = 'one') => core.createTask(state, { title: '测试任务', ...fields }, id, today + 'T09:00:00.000Z');

test('日期验证拒绝溢出日期并接受闰日', () => {
  assert.equal(core.isDate('2024-02-29'), true);
  assert.equal(core.isDate('2025-02-29'), false);
  assert.equal(core.isDate('2026-04-31'), false);
  assert.equal(core.isDate('2026-13-01'), false);
  assert.equal(core.isDate('2026-9-1'), false);
  assert.equal(core.isDate(null), false);
  assert.equal(core.isDate(today), true);
});

