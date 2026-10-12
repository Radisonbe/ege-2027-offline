import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {validateQuestion} from '../../src/domain/backup.ts';
test('Workshop correction keeps answer, versions and historical snapshot; both links point to sentence 3',()=>{
 const id='c2b-russian-exam-link-workshop';
 const t=JSON.parse(fs.readFileSync('src/data/exam/stage3c2-b.json')).tasks.find(t=>t.id===id);
 const old=JSON.parse(execFileSync('git',['show','1b23182:src/data/exam/stage3c2-b.json'],{encoding:'utf8'})).tasks.find(t=>t.id===id);
 assert.equal(t.version,2);assert.equal(t.question.version,2);assert.equal(t.question.answer,old.question.answer);
 assert.ok(t.question.prompt.includes('(3) Мастер установил в мастерской новые полки.'));
 assert.ok(t.question.prompt.includes('(4) Он разместил на полках запасные детали.'));
 assert.ok(t.question.explanation.includes('другой падежной форме'));assert.deepEqual(validateQuestion(old.question),old.question);
 const r=JSON.parse(fs.readFileSync('sources/stage3c2-b-review.json')).questions.find(r=>r.id===id);
 assert.equal(r.referent,'Мастер');assert.equal(r.target,4);assert.ok(r.sentences.every(s=>t.question.prompt.includes(s)));
});
