import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {checkContentBank} from '../../scripts/content-bank.mjs';
import {emptyState,recordAttempt} from '../../src/domain/progress.ts';
import {selectReview,questionPriority,beginReview,showReviewQuestion,answerReview,advanceReview,reviewSummary,weakEvidence} from '../../src/domain/adaptive.ts';
import {parseBackup,serializeBackup,validateStudyState} from '../../src/domain/backup.ts';
const {questions:allQuestions,taxonomy}=checkContentBank(),bank=allQuestions.filter(q=>!q.id.startsWith("b1-")),skills=taxonomy.skills,byId=Object.fromEntries(bank.map(q=>[q.id,q])),now=new Date('2026-10-08T12:00:00.000Z');
function studiedState(ids=['percent','functions','binary']){const s=emptyState('fixture');for(const topic of ids){s.topics[topic]={topic,status:topic==='percent'?'Нужна практика':'Уверенно',note:'Keep note',last:'2026-09-01'};s.reviews['topic:'+topic]={id:'topic:'+topic,targetType:'topic',targetId:topic,due:'2026-09-20',stage:1};}return s;}
function fixedHistory(){let s=studiedState();s=recordAttempt(s,byId.p2,'12',false,'test','p-old',new Date('2026-09-30T12:00:00Z'));s=recordAttempt(s,byId.p2,'12',false,'test','p-recent',new Date('2026-10-05T12:00:00Z'));s=recordAttempt(s,byId.f1,'9',true,'test','f-correct',new Date('2026-08-01T12:00:00Z'));s.topics.functions.status='Уверенно';s.reviews['topic:percent'].due='2026-09-20';return s;}
test('Fixed history deterministically chooses a prerequisite, weak-topic questions and confident maintenance',()=>{
  const state=fixedHistory(),plan=selectReview(state,bank,skills,5,{},now);
  assert.deepEqual(plan.items.map(i=>i.question.id),['e4','p3','f1','b2','p2']);
  assert.deepEqual(plan,selectReview(state,bank,skills,5,{},now));
  assert.ok(plan.items.some(i=>i.question.topic==='functions'||i.question.topic==='binary'));
  assert.ok(plan.items[0].reasons.some(r=>r.code==='basics'&&r.points===12));
  assert.ok(plan.items.find(i=>i.question.id==='p2').reasons.some(r=>r.code==='question-error'&&r.points===28));
  fs.mkdirSync('outputs',{recursive:true});
  fs.writeFileSync('outputs/STAGE3A-PRIORITY-EXAMPLE.json',JSON.stringify({history:state.attempts,selection:plan.items.map(i=>({id:i.question.id,score:i.score,reasons:i.reasons}))},null,2));
});
test('5/10/15/20 sizes use distinct IDs and small banks honestly return shorter sessions',()=>{
  for(const size of [5,10,15,20]){const result=selectReview(studiedState(),bank,skills,size,{},now);assert.equal(result.items.length,Math.min(size,result.available));assert.equal(new Set(result.items.slice(0,Math.min(result.available,size)).map(i=>i.question.id)).size,Math.min(result.available,size));}
  const result=selectReview(studiedState(['py-types']),bank,skills,15,{},now);assert.equal(result.available,2);assert.equal(result.items.length,2);assert.equal(result.repeated,0);
});
test('Unstudied topics and unavailable prerequisites never enter a session',()=>{
  assert.equal(selectReview(emptyState('fixture'),bank,skills,15,{},now).items.length,0);
  const s=studiedState(['py-csv']);const result=selectReview(s,bank,skills,5,{},now);assert.ok(result.items.every(i=>i.question.id!=='py-csv-q'));
  s.topics['py-types']={topic:'py-types',status:'Изучаю',note:''};assert.ok(selectReview(s,bank,skills,5,{subject:'python'},now).items.some(i=>i.question.id==='py-csv-q'));
});
test('One-subject and mixed filters work, with future topic/difficulty/origin filters',()=>{
  const s=studiedState();assert.ok(selectReview(s,bank,skills,20,{subject:'informatics'},now).items.every(i=>i.question.subject==='informatics'));
  assert.ok(new Set(selectReview(s,bank,skills,20,{subject:'all'},now).items.map(i=>i.question.subject)).size>1);
  assert.ok(selectReview(s,bank,skills,5,{topic:'percent',difficulty:'medium',origin:'generated'},now).items.every(i=>i.question.topic==='percent'&&i.question.difficulty==='medium'));
});
test('Show cooldown and diversity lower an repeatedly displayed weak question without losing weak-topic priority',()=>{
  const s=fixedHistory(),base=questionPriority(byId.e4,s,bank,skills,now).score;
  const items=selectReview(s,bank,skills,5,{},now).items;let after=beginReview(s,items,5,'all','shown',now);after=showReviewQuestion(after,'shown',now);
  assert.ok(questionPriority(byId.e4,after,bank,skills,now).score<base);
  assert.notEqual(selectReview(after,bank,skills,5,{},now).items[0].question.id,'e4');
  const chosen=selectReview(s,bank,skills,20,{},now).items;assert.ok(chosen.filter(i=>i.question.topic==='percent').length>0);assert.ok(chosen.some(i=>i.question.topic==='functions'));
});
test('Independent repeated errors support a weakness; same-step retries and one casual error do not',()=>{
  let s=studiedState();s=recordAttempt(s,byId.p2,'12',false,'test','a',now);assert.equal(weakEvidence(s.attempts).weak,false);
  s=recordAttempt(s,byId.p2,'12',false,'test','retry',new Date('2026-10-08T12:01:00Z'));assert.equal(weakEvidence(s.attempts).weak,false);
  s=recordAttempt(s,byId.p2,'12',false,'test','next-day',new Date('2026-10-09T12:00:00Z'));assert.equal(weakEvidence(s.attempts).weak,true);
});
test('Session persists first-answer result, correction, snapshots, exposure and error history across backup round trip',()=>{
  let s=studiedState(),plan=selectReview(s,bank,skills,5,{subject:'math'},now);s=beginReview(s,plan.items,5,'math','session',now);s=showReviewQuestion(s,'session',now);
  const q=s.adaptive.sessions[0].items[0].question;s=answerReview(s,'session',q.answer==='120'?'12':'999',false,'wrong',now);s=answerReview(s,'session',q.answer,true,'correct',new Date('2026-10-08T12:01:00Z'));
  assert.equal(s.errors.length,1);assert.equal(s.adaptive.sessions[0].items[0].firstCorrect,false);assert.equal(s.adaptive.sessions[0].items[0].correct,true);assert.equal(s.adaptive.exposures.length,1);
  assert.deepEqual(parseBackup(serializeBackup(s)).data,s);assert.deepEqual(validateStudyState(s),s);
  const summary=reviewSummary(s.adaptive.sessions[0],s,bank);assert.equal(summary.corrected,1);assert.ok(summary.topics.every(t=>!t.persistent));
});
test('Successful due review advances the original interval once; an error keeps the one-day reset',()=>{
  for(const error of [false,true]){let s=studiedState(['py-types']);s=beginReview(s,selectReview(s,bank,skills,5,{},now).items,5,'all','session',now);for(let i=0;i<s.adaptive.sessions[0].items.length;i++){s=showReviewQuestion(s,'session',now);const q=s.adaptive.sessions[0].items[i].question;s=answerReview(s,'session',q.answer,!(error&&i===0),'attempt-'+i,now);s=advanceReview(s,'session',now);}assert.ok(s.adaptive.sessions[0].completedAt);assert.equal(s.reviews['topic:py-types'].stage,error?0:2);assert.equal(s.reviews['topic:py-types'].due,error?'2026-10-09':'2026-10-15');assert.deepEqual(parseBackup(serializeBackup(s)).data,s);}
});
test('Stage 2 document and backup v1 migrate additively, with all original fields intact',()=>{
  const old=structuredClone(fixedHistory());delete old.adaptive;old.schemaVersion=1;for(const a of old.attempts){delete a.subject;delete a.subtopic;delete a.skills;}for(const e of old.errors){delete e.question.skills;delete e.question.remediates;}
  const before=structuredClone(old),converted=validateStudyState(old);const backup={format:'ege-progress-backup',backupVersion:1,appVersion:'0.2.1',createdAt:now.toISOString(),data:old};const imported=parseBackup(JSON.stringify(backup)).data;
  assert.deepEqual(converted,imported);assert.deepEqual(old,before);const rest=structuredClone(converted);delete rest.adaptive;rest.schemaVersion=1;assert.deepEqual(rest,old);
});
test('Corrupted new session/exposure/attempt links are rejected before import replaces progress',()=>{
  let s=studiedState();s=beginReview(s,selectReview(s,bank,skills,5,{},now).items,5,'all','session',now);s=showReviewQuestion(s,'session',now);s=answerReview(s,'session','999',false,'a',now);
  for(const mutate of [s=>s.adaptive.exposures[0].questionId='other',s=>s.adaptive.exposures[0].skills=['other'],s=>s.attempts.at(-1).skills=['other'],s=>s.adaptive.sessions[0].index=3,s=>s.adaptive.sessions[0].items[0].attemptIds=['absent'],s=>s.adaptive.sessions[0].items[0].firstCorrect=true,s=>s.adaptive.sessions[0].completedAt=now.toISOString(),s=>s.adaptive.exposures=[]]){const copy=structuredClone(s);mutate(copy);assert.throws(()=>parseBackup(JSON.stringify({format:'ege-progress-backup',backupVersion:2,appVersion:'0.3.0-dev',createdAt:now.toISOString(),data:copy})));}
});
test('Exposure at local midnight is treated as today, independent of its UTC date',()=>{
  const midnight=new Date(2026,9,8,0,30);let s=studiedState();const plan=selectReview(s,bank,skills,5,{},midnight);s=beginReview(s,plan.items,5,'all','midnight',midnight);s=showReviewQuestion(s,'midnight',midnight);
  const priority=questionPriority(plan.items[0].question,s,bank,skills,midnight);assert.ok(priority.reasons.some(r=>r.code==='shown-today'&&r.points===-30));
});
test('Unlinked manual error-bank records increase studied-topic priority but do not unlock an unstudied topic',()=>{
  const s=studiedState(),before=questionPriority(byId.p3,s,bank,skills,now).score;
  s.errors.push({id:'manual-error',topic:'percent',prompt:'Local fixture',wrong:'x',correct:'y',reason:'',principle:'',solution:'',note:'',date:'2026-10-07',status:'не понял',due:'2026-10-08',stage:0});
  assert.ok(questionPriority(byId.p3,s,bank,skills,now).score>before);
  const blank=emptyState('fixture');blank.errors=s.errors;assert.equal(selectReview(blank,bank,skills,5,{},now).items.length,0);
});
test('Linked error-bank records are not counted twice in topic priority',()=>{
  const s=fixedHistory(),full=questionPriority(byId.p3,s,bank,skills,now);const noRows={...s,errors:[]};assert.deepEqual(questionPriority(byId.p3,noRows,bank,skills,now),full);
});
