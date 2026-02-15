import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFinished, validateTitle } from './validation.js';

test('validateTitle rejects empty/whitespace titles', () => {
  assert.ok(validateTitle('').error);
  assert.ok(validateTitle('   ').error);
});

test('validateTitle trims and enforces max length', () => {
  const ok = validateTitle('  halló  ');
  assert.equal(ok.value, 'halló');

  const long = 'x'.repeat(256);
  assert.ok(validateTitle(long).error);
});

test('parseFinished handles checkbox values', () => {
  assert.equal(parseFinished(null), false);
  assert.equal(parseFinished('on'), true);
});
