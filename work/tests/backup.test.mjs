import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBackup, serializeBackup, validateStudyState, MAX_BACKUP_BYTES } from '../../src/domain/backup.ts';
import { emptyState, recordAttempt } from '../../src/domain/progress.ts';

const q = { id:'history-q', topic:'percent', subject:'math', subtopic:null, difficulty:'unspecified', origin:'custom', source:'reference', sourceYear:null, sourceType:'training', examTaskType:null, answerType:'number', prompt:'18 — это 15% некоторого числа. Найди это число.', answer:'120', hint:'Найди один процент.', explanation:'18 / 15 * 100 = 120', solution:'18 / 15 * 100 = 120', principle:'Сначала назови целое', version:1, requires:[], related:[] };
function sample() {
  const question = structuredClone(q);
  let state = recordAttempt(emptyState('old-content'), question, '12', false, 'test', 'attempt-1', new Date('2026-10-08T09:00:00.000Z'));
  state = recordAttempt(state, question, '120', true, 'test', 'attempt-2', new Date('2026-10-08T09:01:00.000Z'));
  state.topics.percent.note = 'Сохрани мою заметку';
  state.settings.theme = 'dark';
  return state;
}
test('Backup round trip preserves attempts, errors and historical question snapshot, notes, reviews, activity and settings', () => {
  const state = sample(), text = serializeBackup(state);
  assert.deepEqual(parseBackup(text).data, state);
  assert.equal(parseBackup(text).backupVersion, 2);
  assert.equal(parseBackup(text).data.schemaVersion, 2);
  assert.ok(!Object.hasOwn(JSON.parse(text), 'questions'));
  assert.ok(!Object.hasOwn(JSON.parse(text).data, 'theories'));
});
test('Malformed, incompatible and prototype-bearing files are rejected without altering current data', () => {
  const current = sample(), before = structuredClone(current);
  for (const text of ['{', 'null', '[]', '{}', '{"__proto__":{"polluted":true}}', JSON.stringify(current)]) assert.throws(() => parseBackup(text));
  assert.deepEqual(current, before); assert.equal({}.polluted, undefined);
});
test('Future schema and backup versions require explicit migration; never silently imported', () => {
  for (const mutate of [b => b.backupVersion = 3, b => b.data.schemaVersion = 3, b => b.data.app = 'another-app']) {
    const backup = JSON.parse(serializeBackup(sample())); mutate(backup); assert.throws(() => parseBackup(JSON.stringify(backup)));
  }
});
test('Nested fields, calendar dates, enums, duplicates and dangling references are validated', () => {
  const cases = [
    s => s.attempts[0].correct = 'false', s => s.attempts[0].date = '2026-02-30',
    s => s.attempts.push(s.attempts[0]), s => s.topics.percent.status = 'unknown',
    s => s.topics.percent.topic = 'mismatch', s => s.errors[0].attemptId = 'missing',
    s => s.errors[0].stage = 99, s => s.errors[0].question.origin = 'fipi',
    s => s.errors[0].question.options = [17], s => s.activity[0].kind = 'demo',
    s => s.reviews['topic:percent'].due = '2026-13-01', s => s.settings.theme = 'pink',
    s => s.questions = [], s => s.attempts[0].at = 'not-a-date', s => s.errors = {},
  ];
  for (const mutate of cases) {
    const state = sample(); mutate(state); assert.throws(() => validateStudyState(state));
  }
});
test('Content replacement cannot invalidate historic IDs or remove question snapshots from a backup', () => {
  const state = sample(); state.contentVersion = 'previous-content';
  state.topics['retired-topic'] = { topic:'retired-topic', status:'Повторить', note:'Старый урок' };
  state.attempts[0].questionId = 'retired-question'; state.errors[0].questionId = 'retired-question';
  state.errors[0].question.id = 'retired-question';
  assert.deepEqual(parseBackup(serializeBackup(state)).data, state);
});
test('Oversized JSON is refused before parsing', () => { assert.throws(() => parseBackup(' '.repeat(MAX_BACKUP_BYTES + 1)), /20 МБ/); });
