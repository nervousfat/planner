import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../core.js';
import {task, stateOf, freeze} from './fixtures.mjs';

test('valid UTF-8 JSON accepts the exact byte limit and rejects one byte more', () => {
  const json = JSON.stringify(stateOf(task({notes: '中文 🪴\nline two'})));
  const byteLength = new TextEncoder().encode(json).byteLength;
  const exact = json + ' '.repeat(2_000_000 - byteLength);
  assert.equal(new TextEncoder().encode(exact).byteLength, 2_000_000);
  assert.deepEqual(core.importState(exact), stateOf(task({notes: '中文 🪴\nline two'})));
  assert.throws(() => core.importState(exact + ' '), /2 MB/);
});
test('export rejects oversized valid collections and supported backups are canonical', () => {
  const large = stateOf(...Array.from({length: 400}, (_, i) => task({id: String(i), notes: '汉'.repeat(2000)})));
  assert.equal(core.validateState(large).tasks.length, 400);
  assert.throws(() => core.exportState(large), /2 MB/);
  const source = stateOf(task({tags: ['one'], title: '<literal>', notes: '\u0000\r\n中文'}));
  const exported = core.exportState(source);
  assert.equal(core.exportState(core.importState(exported)), exported);
  assert.throws(() => core.importState(new Uint8Array()), /文本文件/);
});
