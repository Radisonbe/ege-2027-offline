import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {execFileSync} from 'node:child_process';
import {checkChat500QA,checkTextAnswerDiversity,assertQAFeedback} from '../../scripts/chat500-qa-quality.mjs';
import {checkContentBank} from '../../scripts/content-bank.mjs';
import {checkAnswer} from '../../src/domain/answers.ts';
import {emptyState,recordAttempt} from '../../src/domain/progress.ts';
import {startTopicTest,answerTopicTest} from '../../src/domain/study-flow.ts';
import {startQuick,quickDefaults,editQuick,answerQuick,moveQuick,selectQuick} from '../../src/domain/quick-practice.ts';
import {authorTextGroups,textContext} from '../../src/domain/text-context.ts';
import {parseBackup,serializeBackup} from '../../src/domain/backup.ts';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),qa=read('sources/chat500-qa-review.json'),{questions,taxonomy}=checkContentBank(),flow=read('src/data/study-flow.json').topics;
const baseline=JSON.parse(execFileSync('git',['show',qa.base+':src/data/banks/author-chat500-russian.json'],{encoding:'utf8'})).questions;
const topics=[{id:'text',subject:'russian',materialStatus:'ready'}],prefs={...quickDefaults(emptyState('0.5.0'),topics),subjects:['russian'],topics:['text'],count:30};

test('CHAT500-QA: all editorial witnesses, complete option reviews and diverse answer counts pass; systematic three-answer bias fails',()=>{
 assert.equal(checkChat500QA().revised,51);const group=questions.filter(q=>q.id.startsWith('chat500-russian-')&&q.answerType==='multiple-choice');
 for(const n of [1,2,3,4])assert.ok(group.some(q=>JSON.parse(q.answer).length===n));
 const biased=group.map(q=>({...q,answer:JSON.stringify(q.options.slice(0,3))}));assert.throws(()=>checkTextAnswerDiversity(biased));
 const nearlyBiased=group.map((q,i)=>({...q,answer:JSON.stringify(q.options.slice(0,i<12?3:i===12?1:2))}));assert.throws(()=>checkTextAnswerDiversity(nearlyBiased));
 const prefixKeys=group.map(q=>({...q,answer:JSON.stringify(q.options.slice(0,JSON.parse(q.answer).length))}));assert.throws(()=>checkTextAnswerDiversity(prefixKeys));
 assert.throws(()=>assertQAFeedback({...group[0],explanation:group[0].explanation+' Решение должно опираться на правило, а не на угадывание.'}));
 assert.throws(()=>assertQAFeedback({...group[0],solution:'Такая особенность действительно заметна в изложении.'}));
});
test('Every changed source matches the reviewed Git baseline; unchanged author texts and non-target tasks remain exact',()=>{
 const changed=new Set(qa.changes.map(c=>c.id));
 for(const c of qa.changes){assert.deepEqual(c.before,baseline.find(q=>q.id===c.id),c.id);assert.equal(c.after.prompt,c.before.prompt);}
 for(const old of baseline.filter(q=>!changed.has(q.id)))assert.deepEqual(questions.find(q=>q.id===old.id),old,old.id);
 for(const c of qa.changes){const n=+c.id.slice(-3),sentence=c.after.prompt.match(/«([^»]+)»/)?.[1];
  if(n>=70&&n<=78){const words=new Set(sentence.toLowerCase().match(/[а-яё]+/g));for(const o of c.after.options)for(const w of o.toLowerCase().match(/[а-яё]+/g))assert.ok(words.has(w),c.id+' extraneous word '+w);}
  if(n>=88&&n<=114){const clean=s=>s.replaceAll(',','');for(const o of c.after.options)assert.equal(clean(o),sentence,c.id+' punctuation changes lexical source');}
 }
});
test('Each revised question accepts the new key and rejects every wrong variant or incomplete multiple-choice set',()=>{
 for(const c of qa.changes){const q=c.after;assert.equal(checkAnswer(q,q.answer).correct,true,q.id);
  for(const o of c.optionReview){const answer=q.answerType==='multiple-choice'?JSON.stringify([o.option]):o.option;
   if(q.answerType!=='multiple-choice'||!o.accepted||JSON.parse(q.answer).length>1)assert.equal(checkAnswer(q,answer).correct,q.answerType!=='multiple-choice'&&o.accepted,q.id+' '+o.option);
  }
  if(q.answerType==='multiple-choice'){const correct=JSON.parse(q.answer);assert.equal(checkAnswer(q,JSON.stringify([...correct,c.optionReview.find(o=>!o.accepted).option])).correct,false);assert.notEqual(checkAnswer(q,JSON.stringify(correct.slice(1))).correct,true);}
 }
});
for(const c of qa.changes)test(c.id+': old v'+c.before.version+' snapshots, first results, wrong answers and notes survive new v'+c.after.version,()=>{
 const old=c.before,current=c.after,topic=[{id:old.topic,subject:old.subject,materialStatus:'ready'}],p={...quickDefaults(emptyState('0.5.0'),topic),topics:[old.topic],subjects:[old.subject],count:10};
 let s=startQuick(emptyState('0.5.0'),p,[old],'old');s=editQuick(s,'old','исторический ответ');s=answerQuick(s,'old','исторический ответ',false,'training-old');s=moveQuick(s,'old',0,true);
 s=recordAttempt(s,old,'историческая ошибка',false,'test','old-error');s=startTopicTest(s,old.topic,[old],'old-mini');s=answerTopicTest(s,'old-mini','историческая ошибка',false,'first');
 s.topics[old.topic].note='Старая заметка';const historical=structuredClone(s);s=startQuick(s,p,[current],'new');const restored=parseBackup(serializeBackup(s)).data;
 assert.deepEqual(restored.quickPractice.snapshots[old.id+'@'+old.version],old);assert.deepEqual(restored.quickPractice.snapshots[current.id+'@'+current.version],current);
 for(const key of ['attempts','training','errors','topicTests','topics','reviews'])assert.deepEqual(restored[key],historical[key],old.id+' '+key);
 assert.equal(restored.topicTests[0].items[0].firstCorrect,false);assert.deepEqual(restored.quickPractice.sessions[0],historical.quickPractice.sessions[0]);
});
test('Reviewed text groups include short quotations; 10/20/30 selections prefer different eligible texts, then allow reuse without losing questions',()=>{
 const bank=questions.filter(q=>authorTextGroups.flat().includes(q.id));const firstTwo=q=>q.prompt.split('\n').filter(s=>/^\([12]\)/.test(s)).join('\n');
 for(const ids of authorTextGroups){const group=ids.map(id=>bank.find(q=>q.id===id)).filter(Boolean);assert.ok(group.length>0);assert.equal(new Set(group.map(firstTwo)).size,1);const full=group.filter(q=>q.prompt.includes('\n(3)'));assert.equal(new Set(full.map(q=>q.prompt.split('\n').slice(1).join('\n'))).size,1);assert.equal(new Set(group.map(textContext)).size,1);assert.ok(group.every(q=>flow[q.topic].practice.includes(q.id)));}
 const state=emptyState('0.5.0'),before=structuredClone(state);
 for(const count of [10,20,30])for(const seed of ['qa','other','phone']){const result=selectQuick(state,bank,topics,taxonomy.skills,{...prefs,count},seed);assert.equal(result.questions.length,count);assert.equal(new Set(result.questions.slice(0,Math.min(count,15)).map(textContext)).size,Math.min(count,15));assert.equal(result.reusedTextQuestions,Math.max(0,count-15));assert.deepEqual(result,selectQuick(state,bank,topics,taxonomy.skills,{...prefs,count},seed));}
 const small=bank.filter(q=>authorTextGroups[0].includes(q.id)),r=selectQuick(state,small,topics,taxonomy.skills,prefs,'small');assert.equal(r.questions.length,4);assert.equal(r.reusedTextQuestions,3);
 assert.deepEqual(state,before);let s=startQuick(state,{...prefs,count:10},r.questions,'practice');for(let i=0;i<r.questions.length;i++){s=moveQuick(s,'practice',i);s=answerQuick(s,'practice',r.questions[i].answer,true,'a'+i);}
 assert.equal(s.training.length,4);assert.equal(s.attempts.length,0);assert.notEqual(s.topics.text.status,'Уверенно');assert.deepEqual(parseBackup(serializeBackup(s)).data,s);
});
