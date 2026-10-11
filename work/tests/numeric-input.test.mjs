import test from 'node:test';
import assert from 'node:assert/strict';
import { insertFractionSlash, insertAnswerSymbol } from '../../src/domain/numeric-input.ts';
import { parseNumber, checkAnswer } from '../../src/domain/answers.ts';

test('Fraction key inserts at start, middle, end and replaces a selection', () => {
  for (const [text, start, end, expected, cursor] of [
    ['14', 1, 1, '1/4', 2], ['-14', 2, 2, '-1/4', 3],
    ['14', 0, 0, '/14', 1], ['14', 2, 2, '14/', 3],
    ['1 wrong 4', 1, 8, '1/4', 2], ['14', null, null, '14/', 3],
    ['−14', 2, 2, '−1/4', 3], ['1,54', 3, 3, '1,5/4', 4],
  ]) assert.deepEqual(insertFractionSlash(text, start, end), { value: expected, cursor });
});

test('Fraction key respects input length without losing text or truncating suffix', () => {
  assert.equal(insertFractionSlash('1234', 2, 2, 4), null);
  assert.deepEqual(insertFractionSlash('1234', 1, 2, 4), {value: '1/34', cursor: 2});
  assert.deepEqual(insertFractionSlash('', 0, 0, 1), {value: '/', cursor: 1});
  assert.deepEqual(insertFractionSlash('14', -4, 9), {value: '/', cursor: 1});
});

test('Existing parser accepts signed fractions, decimal comma and decimal point', () => {
  for (const [raw, expected] of [['1/4', .25], ['-1/4', -.25], ['−1/4', -.25],
    ['1/-4', -.25], ['-1/-4', .25], ['+1 / 4', .25], ['0/4', 0],
    ['12,5', 12.5], ['-0.25', -.25], ['1,5/0,5', 3]]) assert.equal(parseNumber(raw), expected, raw);
});

test('Zero denominators and malformed answers remain unscored format errors', () => {
  const q = {answerType: 'number', answer: '-0.25'};
  for (const raw of ['1/0', '-1/-0', '0/0', '1/0,0', '/', '1//4', '1/4/2',
    'text', '1/4abc', '1,2,3', 'Infinity', '1e309']) {
    assert.equal(parseNumber(raw), null, raw);
    assert.equal(checkAnswer(q, raw).valid, false, raw);
  }
  assert.equal(checkAnswer(q, '-1/4').correct, true);
  assert.equal(checkAnswer(q, '-0,25').correct, true);
  assert.equal(checkAnswer(q, '1/4').valid, true);
  assert.equal(checkAnswer(q, '1/4').correct, false);
});

test('Minus key preserves suffix and replaces selection; Unicode minus keeps parser semantics', () => {
  assert.deepEqual(insertAnswerSymbol('14',0,0,'−'),{value:'−14',cursor:1});
  assert.deepEqual(insertAnswerSymbol('x1/4',0,1,'−'),{value:'−1/4',cursor:1});
  assert.deepEqual(insertAnswerSymbol('1234',2,3,'−'),{value:'12−4',cursor:3});
  assert.equal(parseNumber('12−4'),null);
  assert.equal(parseNumber('−1/4'),-0.25);
  assert.equal(insertAnswerSymbol('12',0,0,'−',2),null);
});
