import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { draftKey, readDraft, writeDraft } from '../src/lib/browserDrafts.ts';

beforeEach(() => {
  const data = new Map();
  globalThis.localStorage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
});

test('browser drafts survive reloads and are isolated by account, question, and language', () => {
  const key = draftKey('alice', 'fibonacci', 'java');
  writeDraft(key, 'class Main {}');
  assert.equal(readDraft(key), 'class Main {}');
  for (const other of [draftKey('bob', 'fibonacci', 'java'), draftKey('alice', 'palindrome', 'java'), draftKey('alice', 'fibonacci', 'python'), draftKey(undefined, 'fibonacci', 'java')]) assert.equal(readDraft(other), '');
  writeDraft(key, '');
  assert.equal(readDraft(key), '');
});

test('encoded identifiers cannot collide; corrupt or blocked storage is reported', () => {
  assert.notEqual(draftKey('alice:a', 'b', 'java'), draftKey('alice', 'a:b', 'java'));
  localStorage.setItem('broken', '{bad json');
  assert.throws(() => readDraft('broken'));
  localStorage.setItem('bad-type', '{"code":42}');
  assert.throws(() => readDraft('bad-type'));
  localStorage.setItem = () => { throw new Error('QuotaExceededError'); };
  assert.throws(() => writeDraft('draft', 'code'), /QuotaExceededError/);
});
