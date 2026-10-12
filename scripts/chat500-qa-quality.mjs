import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sorted=v=>Array.isArray(v)?v.map(sorted):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sorted(v[k])])):v;
const hash=v=>crypto.createHash('sha256').update(JSON.stringify(sorted(v))).digest('hex');
const boilerplate=/Решение должно опираться на правило, а не на угадывание|Правильно описана коммуникативная задача текста|Такая особенность действительно заметна в изложении/;
export function assertQAFeedback(q){assert.ok(!boilerplate.test(q.explanation)&&!boilerplate.test(q.solution),q.id+' boilerplate');}

// A group-level imbalance guard, not a rule against any particular answer count.
export function checkTextAnswerDiversity(questions){
 assert.equal(questions.length,15);
 const counts=questions.map(q=>JSON.parse(q.answer).length),histogram={};
 for(const [i,n] of counts.entries()){assert.ok(n>0&&n<questions[i].options.length);histogram[n]=(histogram[n]??0)+1;}
 assert.ok(Object.keys(histogram).length>=3,'Text analysis has too few different answer counts');
 assert.ok(Math.max(...Object.values(histogram))/counts.length<=0.6,'Text analysis has a systematic answer-count bias');
 const patterns=questions.map(q=>q.options.map(o=>JSON.parse(q.answer).includes(o)?'1':'0').join(''));
 assert.ok(new Set(patterns).size>=8,'Text analysis has a systematic correct-option position bias');
 return histogram;
}
export function checkChat500QA(){
 const bank=read('src/data/banks/author-chat500-russian.json').questions,review=read('sources/chat500-review.json').questions,qa=read('sources/chat500-qa-review.json');
 assert.equal(qa.schemaVersion,1);assert.equal(qa.stage,'CHAT500-QA');
 assert.equal(qa.base,'256d34da4cc1feff995a15e1664b02380e362d97');assert.equal(qa.changes.length,51);
 assert.equal(new Set(qa.changes.map(c=>c.id)).size,51);
 for(const q of bank)assertQAFeedback(q);
 for(const c of qa.changes){
  const q=bank.find(q=>q.id===c.id),r=review.find(r=>r.id===c.id);
  assert.deepEqual(q,c.after,c.id+' current revision');assert.equal(q.version,c.before.version+1,c.id);
  assert.equal(q.prompt,c.before.prompt,c.id+' original text');assert.equal(q.id,c.before.id);
  assert.equal(q.origin,'generated');assert.equal(q.examTaskType,null);
  assert.ok(!boilerplate.test(q.principle)&&!boilerplate.test(q.hint),q.id+' generic feedback');
  assert.equal(hash(c.before),c.oldSha256);assert.equal(hash(q),c.newSha256);assert.equal(r.approvedSha256,c.newSha256);
  assert.deepEqual(r.optionReview,c.optionReview);assert.deepEqual(r.optionReview.map(o=>o.option),q.options);
  const truth=q.answerType==='multiple-choice'?JSON.parse(q.answer):[q.answer];
  for(const [i,o] of r.optionReview.entries()){
   assert.equal(o.accepted,truth.includes(o.option));assert.ok(o.principle.length>=25&&!boilerplate.test(o.principle));
   assert.ok(q.explanation.includes(o.principle),c.id+' explanation '+(i+1));
   if(q.answerType==='multiple-choice'){
    assert.ok(o.evidence?.length,c.id+' missing source witness');
    for(const e of o.evidence){const line=q.prompt.split('\n').find(line=>line.startsWith('('+e.sentence+')'));assert.ok(line?.includes(e.quote)&&e.quote.length>=5,c.id+' evidence');}
   }
  }
 }
 const group=bank.filter(q=>q.answerType==='multiple-choice');
 assert.equal(qa.unchangedReview.length,9);
 for(const [i,r] of qa.unchangedReview.entries()){
  assert.equal(r.id,'chat500-russian-'+String(133+i));assert.equal(r.status,'unchanged');
  assert.ok([1,2].includes(r.checkedBases));
  const q=bank.find(q=>q.id===r.id);assert.equal(q.answer,r.checkedBases===1?'Одна':'Две');assert.ok(r.reason.length>20);
 }
 return {revised:qa.changes.length,textAnalysis:group.length,answerCounts:checkTextAnswerDiversity(group)};
}
if(process.argv[1]?.endsWith('chat500-qa-quality.mjs'))console.log('CHAT500-QA:',checkChat500QA());
