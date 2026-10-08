import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { checkAnswer, parseNumber } from '../../src/domain/answers.ts';
import { addDays, emptyState, recordAttempt, stats } from '../../src/domain/progress.ts';

const data = JSON.parse(fs.readFileSync(new URL('../../src/data/reference.json', import.meta.url), 'utf8'));
const question = { ...data.questions.find(q => q.id === 'p2'), answerType: 'number', version: 1, wrongAnswers: {} };
const date = new Date(2026, 9, 8, 12);
test('Malformed numeric input cannot create a scored answer', () => {
  for (const value of ['па', '', '   ', '12abc', 'Infinity', '1/0', '1e309', '1 20', 'NaN', '1,2,3']) {
    assert.equal(checkAnswer(question, value).valid, false, value);
  }
  assert.deepEqual(checkAnswer(question, '120'), { valid: true, correct: true, normalized: '120' });
  assert.equal(checkAnswer(question, '12').correct, false);
});
test('Decimal comma, fractions and Unicode minus are handled', () => {
  assert.equal(parseNumber('12,5'), 12.5);
  assert.equal(parseNumber('1 / 4'), .25);
  assert.equal(parseNumber('−3'), -3);
  assert.equal(parseNumber('-1.5/0.5'), -3);
});
test('Incorrect then correct attempts preserve error history and deduplicate solved questions', () => {
  let state = emptyState('test');
  state = recordAttempt(state, question, '12', false, 'test', 'a1', date);
  state = recordAttempt(state, question, '120', true, 'test', 'a2', date);
  state = recordAttempt(state, question, '120,0', true, 'practice', 'a3', date);
  assert.equal(state.attempts.length, 3);
  assert.equal(state.errors.length, 1);
  assert.equal(state.errors[0].wrong, '12');
  assert.equal(state.errors[0].correct, '120');
  assert.equal(state.reviews['topic:percent'].due, '2026-10-09');
  assert.deepEqual(stats(state, '2026-10-08'), { started: 1, mastered: 0, due: 0, solved: 1, errors: 1, attempts: 3, streak: 1 });
  assert.equal(stats(state, '2026-10-09').streak, 1);
  assert.equal(stats(state, '2026-10-10').streak, 0);
});
test('An error resets an existing review interval; a correct answer alone does not inflate it', () => {
  let state = emptyState('test');
  state.reviews['topic:percent'] = { id: 'topic:percent', targetType: 'topic', targetId: 'percent', due: '2026-11-01', stage: 4 };
  state = recordAttempt(state, question, '120', true, 'test', 'a1', date);
  assert.equal(state.reviews['topic:percent'].stage, 4);
  state = recordAttempt(state, question, '12', false, 'test', 'a2', date);
  assert.equal(state.reviews['topic:percent'].stage, 0);
  assert.equal(state.reviews['topic:percent'].due, '2026-10-09');
});
test('Local calendar date transitions and empty progress do not create study activity', () => {
  assert.equal(addDays(1, '2026-12-31'), '2027-01-01');
  assert.equal(addDays(1, '2028-02-28'), '2028-02-29');
  assert.equal(stats(emptyState('test'), '2026-10-08').streak, 0);
});
test('Transferred content matches the verified source inventory and every ready module has theory and questions', () => {
  assert.equal(data.topics.length, 67);
  assert.equal(data.topics.filter(t => t.live).length, 19);
  assert.equal(Object.keys(data.theories).length, 19);
  assert.equal(data.questions.length, 67);
  assert.equal(new Set(data.questions.map(q => q.id)).size, 67);
  assert.equal(data.sentences.length, 3);
  for (const topic of data.topics.filter(t => t.live)) {
    assert.ok(data.theories[topic.id]);
    assert.ok(data.questions.some(q => q.topic === topic.id && !q.easy));
  }
  for (const item of data.questions) {
    assert.ok(data.topics.some(t => t.id === item.topic));
    if (item.kind === 'choice') assert.ok(item.options.includes(item.answer), item.id);
    if (item.kind === 'number') assert.notEqual(parseNumber(item.answer), null, item.id);
  }
});
