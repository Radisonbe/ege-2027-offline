import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawnSync,execFileSync} from 'node:child_process';
import {checkContentBank} from './content-bank.mjs';
import {family} from '../src/domain/question-families.ts';
import {checkChat500QA} from './chat500-qa-quality.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
export function checkAuthor500(){
 checkChat500QA();
 const {questions,taxonomy}=checkContentBank(),newQuestions=questions.filter(q=>/^(chat500|codex500)-/.test(q.id)),chat=read('sources/chat500-review.json'),own=read('sources/codex500-review.json');
 assert.equal(chat.questions.length,500);assert.equal(new Set(chat.questions.map(r=>r.id)).size,500);
 const accepted=chat.questions.filter(r=>r.status!=='rejected');assert.equal(accepted.length,475);assert.equal(own.questions.length,36);assert.equal(newQuestions.length,511);
 const byId=new Map(questions.map(q=>[q.id,q])),flow=read('src/data/study-flow.json').topics;
 for(const r of [...chat.questions,...own.questions]){
  if(r.status==='rejected'){assert.ok(!byId.has(r.id));assert.ok(r.reason);continue;}
  const q=byId.get(r.id);assert.ok(q,r.id);assert.ok(flow[q.topic][r.mode].includes(q.id),r.id);
  assert.ok(!flow[q.topic][r.mode==='test'?'practice':'test'].includes(q.id));assert.equal(q.origin,'generated');assert.equal(q.examTaskType,null);
  if(q.options){assert.deepEqual(r.optionReview.map(v=>v.option),q.options);const truth=q.answerType==='multiple-choice'?JSON.parse(q.answer):[q.answer];for(const option of r.optionReview)assert.equal(option.accepted,truth.includes(option.option),q.id);}
  const sorted=v=>Array.isArray(v)?v.map(sorted):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sorted(v[k])])):v;
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(sorted(q))).digest('hex'),r.approvedSha256,q.id+' changed since final review');
  assert.ok(taxonomy.skills.some(s=>q.skills.includes(s.id)&&s.subtopic===q.subtopic));
 }
 // Preserve every pre-import bank entity and every generator implementation, not just counts.
 const base='c791d6053b93a8a4c72fd2c5857bf21982671151';
 const paths=execFileSync('git',['ls-tree','-r','--name-only',base,'src/data/banks','src/data/exam'],{encoding:'utf8'}).trim().split('\n');let oldLearning=0;
 for(const p of paths.filter(p=>p.endsWith('.json'))){const old=JSON.parse(execFileSync('git',['show',base+':'+p],{encoding:'utf8'}));
  if(p.startsWith('src/data/banks/')){for(const q of old.questions){assert.deepEqual(byId.get(q.id),q,q.id);oldLearning++;}}
  else assert.deepEqual(read(p),old,p);
 }
 assert.equal(oldLearning,614);
 const programs=[...chat.programFixtures,...own.programFixtures];
 for(const q of newQuestions){if(q.answerType==='code'){const fixture=programs.find(f=>f.id===q.id);assert.ok(fixture,q.id);assert.equal(fixture.reference,q.solution,q.id);assert.deepEqual(fixture.task,q.python,q.id);}if(q.python?.type==='predict-output')assert.equal(q.python.expectedOutput,q.answer,q.id);}
 for(const p of ['src/domain/generators/index.ts','src/domain/generators/rational.ts'])assert.equal(fs.readFileSync(p,'utf8').replaceAll('\r\n','\n'),execFileSync('git',['show',base+':'+p],{encoding:'utf8'}).replaceAll('\r\n','\n'));
 const run=spawnSync(process.env.EGE_ORACLE_PYTHON??(process.platform==='win32'?'python':'python3'),['-I','scripts/author500-oracles.py'],{input:JSON.stringify({fixtures:chat.numericalFixtures,questions:newQuestions,programs}),encoding:'utf8',timeout:30000});assert.equal(run.status,0,run.stderr);
 return {accepted:accepted.length,corrected:chat.questions.filter(r=>r.status==='corrected').length,rejected:500-accepted.length,own:own.questions.length,learning:questions.length,exam:85,oldRetained:699,methods:new Set(newQuestions.map(family)).size,...JSON.parse(run.stdout)};
}
if(process.argv[1]?.endsWith('check-author500.mjs'))console.log('Author content checks:',checkAuthor500());
