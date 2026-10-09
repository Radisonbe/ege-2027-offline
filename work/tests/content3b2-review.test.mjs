import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {checkContentBank} from '../../scripts/content-bank.mjs';
import {checkAnswer} from '../../src/domain/answers.ts';
import {emptyState, recordAttempt} from '../../src/domain/progress.ts';
import {startTopicTest} from '../../src/domain/study-flow.ts';
import {saveCodeDraft} from '../../src/domain/code-learning.ts';
import {parseBackup, serializeBackup} from '../../src/domain/backup.ts';

const base = '2a540ae8990954841c752cdc1186c0dc3a143a0d';
const {questions: bank} = checkContentBank();
const ids = ['b2-russian-text-pronoun', 'b2-python-py-file-roundtrip', 'b2-python-py-file-positive'];
const previous = ['russian', 'python'].flatMap(subject => JSON.parse(execFileSync('git', ['show', `${base}:src/data/banks/stage3b2-${subject}.json`], {encoding: 'utf8'})).questions);
const review = JSON.parse(fs.readFileSync('sources/stage3b2-review.json', 'utf8')).questions;

test('Pronoun exercise has one feminine antecedent, the same skill and canonical answer', () => {
  const q = bank.find(q => q.id === ids[0]), old = previous.find(candidate => candidate.id === q.id);
  assert.ok(q.prompt.includes('«Олег достал фотографию. Мальчик положил её в альбом»'));
  assert.deepEqual(q.options, ['Олег', 'фотографию', 'мальчик', 'альбом']);
  assert.equal(q.answer, old.answer);
  assert.deepEqual(q.skills, old.skills);
  assert.equal(q.version, 2);
  for (const option of q.options) assert.equal(checkAnswer(q, option).correct, option === 'фотографию');
  const check = review.find(r => r.id === q.id).check;
  assert.equal(check.reason, q.explanation);
  assert.match(check.ambiguity, /только фотография/);
});

test('Both visible file-task conditions disclose stdout-only grading; reference programs and test cases are unchanged', () => {
  for (const id of ids.slice(1)) {
    const q = bank.find(q => q.id === id), old = previous.find(q => q.id === id);
    for (const text of [q.prompt, q.presentation.statement]) {
      assert.match(text, /Автоматическая проверка сравнивает только вывод программы/);
      assert.match(text, /не проверяет факт использования файлов/);
      assert.match(text, /Для отработки навыка используй файлы по условию/);
    }
    assert.deepEqual(q.python, old.python);
    assert.equal(q.solution, old.solution);
    assert.deepEqual(q.skills, old.skills);
    assert.equal(q.version, 2);
    assert.match(review.find(r => r.id === id).check.verificationScope, /stdout only/);
  }
});

test('Previous revision snapshots, first results, notes and file drafts round-trip without rewriting after methodical corrections', () => {
  for (const id of ids) {
    const old = previous.find(q => q.id === id), current = bank.find(q => q.id === id);
    let s = recordAttempt(emptyState('previous-wave'), old, 'Own synthetic incorrect answer', false, 'test', 'old-error');
    s = startTopicTest(s, old.topic, [old], 'old-active');
    s.topics[old.topic].note = 'Own synthetic note';
    if (old.answerType === 'code') s = saveCodeDraft(s, old, '# Own synthetic unfinished draft', old.python.stdin);
    const restored = parseBackup(serializeBackup(s)).data;
    assert.deepEqual(restored, s);
    assert.deepEqual(restored.topicTests[0].items[0].question, old);
    assert.deepEqual(restored.errors[0].question, old);
    assert.equal(restored.attempts[0].questionVersion, 1);
    assert.equal(current.version, 2);
    if (old.answerType === 'code') assert.equal(restored.codeDrafts[id].questionVersion, 1);
  }
});
