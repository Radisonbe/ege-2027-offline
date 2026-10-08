import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {checkContentBank} from '../../scripts/content-bank.mjs';
import {checkAnswer,parseNumber} from '../../src/domain/answers.ts';
import {emptyState,localDate} from '../../src/domain/progress.ts';
import {saveCodeDraft,recordCodeAssessment,resumeCodeDraftIndex} from '../../src/domain/code-learning.ts';
import {validateStudyState,parseBackup,serializeBackup} from '../../src/domain/backup.ts';
import {selectReview,beginReview,answerReview,reviewSummary} from '../../src/domain/adaptive.ts';
import {validateContentPackage} from '../../src/domain/content.ts';
import {validateLessonPack} from '../../src/domain/lessons.ts';
import {assertBuildInput,isPrivatePath} from '../../scripts/content-policy.mjs';
const {questions:bank,taxonomy}=checkContentBank(),wave=bank.filter(q=>q.id.startsWith('b1-')),code=wave.filter(q=>q.answerType==='code'),q=code.find(q=>q.id==='b1-python-23'),now=new Date('2026-10-08T12:00:00.000Z');
test('Original wave is exactly 100, balanced 25 per subject, with 20 Python and 5 informatics coding exercises',()=>{
 assert.equal(wave.length,100);for(const subject of ['math','russian','informatics','python'])assert.equal(wave.filter(q=>q.subject===subject).length,25);
 assert.equal(code.filter(q=>q.subject==='python').length,20);assert.equal(code.filter(q=>q.subject==='informatics').length,5);
 assert.equal(bank.length,167);assert.ok(wave.every(q=>q.origin==='generated'&&q.examTaskType===null&&q.sourceYear===2026));
 assert.ok(wave.every(q=>q.prompt.trim()&&q.solution.trim()&&q.explanation.trim()&&q.hint.trim()));
});
test('All 25 math answers independently match arithmetic identities including signed/fractional values',()=>{
 const answers=[18-3*4,(18-3)*4,-6+9,72/6+1.5,(3*6+1*4)/(4*6),(5*4-1*6)/(6*4),(3*10)/(5*9),(7*4)/(8*7),80*35/100,24*100/30,1500-1500*12/100,250+250*8/100,960*100/80,1000+100-110,2000+100+105,2**(3+4),3**(5-3),(-2)**4-2**3,Math.sqrt(81)+Math.sqrt(16),Math.abs(-7),(11+7)/3,10/2+3,(15-3)/(4-2),-2*(-3)+5,12/3];
 const math=wave.filter(q=>q.subject==='math').sort((a,b)=>a.id.localeCompare(b.id));math.forEach((q,i)=>assert.ok(Math.abs(parseNumber(q.answer)-answers[i])<1e-12,q.id));
});
test('Informatics calculations and logic tables independently match the original answers',()=>{
 const expected={1:parseInt('10110',2),3:parseInt('2d',16),4:2**3,5:parseInt('101',2)+parseInt('11',2),7:Math.ceil(Math.log2(17)),8:2**6,9:40*4/8,10:24*5/8,12:Number(true&&false),13:Number(false||true),14:Number(!true||false),15:[0,1].flatMap(a=>[0,1].map(b=>a&&!b)).filter(Boolean).length,17:7*8,18:3*1024,19:2*1024/2,20:128*8};
 for(const [i,n] of Object.entries(expected)){const q=wave.find(q=>q.id==='b1-informatics-'+String(i).padStart(2,'0'));assert.equal(parseNumber(q.answer),n,q.id);}
});
test('Multiple-answer questions are order-independent and incomplete/extra selections fail; format is not scored',()=>{
 for(const q of wave.filter(q=>q.answerType==='multiple-choice')){
  const expected=JSON.parse(q.answer);assert.equal(checkAnswer(q,JSON.stringify([...expected].reverse())).correct,true);
  assert.equal(checkAnswer(q,JSON.stringify([expected[0]])).correct,false);assert.equal(checkAnswer(q,JSON.stringify(q.options)).correct,false);
  assert.equal(checkAnswer(q,'[]').valid,false);assert.equal(checkAnswer(q,'not JSON').valid,false);
 }
});
test('Declared binary input format rejects text without creating an educational answer',()=>{
 const q=wave.find(q=>q.id==='b1-informatics-02');assert.equal(checkAnswer(q,'word').valid,false);assert.equal(checkAnswer(q,'10011').correct,true);assert.equal(checkAnswer(q,'10010').correct,false);
});
test('Code questions require three complete test cases and never accept a typed textual answer',()=>{
 for(const q of code){const tests=[...q.python.visibleTests,...q.python.hiddenTests];assert.ok(tests.length>=3);assert.ok(q.hints.length>=2);assert.equal(checkAnswer(q,q.answer).valid,false);}
 const topics=JSON.parse(fs.readFileSync('src/data/reference.json')).topics;
 const pack=JSON.parse(fs.readFileSync('src/data/banks/stage3b1-python.json'));pack.questions.find(q=>q.answerType==='code').python.hiddenTests=[];assert.throws(()=>validateContentPackage(pack,topics,taxonomy));
});
test('Two exercise drafts are separate and their edits do not create learning attempts, errors or activity',()=>{
 const before=emptyState('fixture');let s=saveCodeDraft(before,q,'def double(x):\n    return x*2','',now);s=saveCodeDraft(s,code[0],'print(42)','2',now);
 assert.equal(s.codeDrafts[q.id].code,'def double(x):\n    return x*2');assert.equal(s.codeDrafts[code[0].id].code,'print(42)');
 assert.deepEqual(s.attempts,before.attempts);assert.deepEqual(s.errors,before.errors);assert.deepEqual(s.activity,before.activity);assert.deepEqual(s.topics,before.topics);
 assert.deepEqual(parseBackup(serializeBackup(s)).data,s);
});
test('Code drafts with invalid IDs, size, schema or dates are rejected before any replacement',()=>{
 const s=saveCodeDraft(emptyState('fixture'),q,'pass','',now);
 for(const change of [s=>s.codeDrafts[q.id].schemaVersion=2,s=>s.codeDrafts[q.id].code='a'.repeat(100001),s=>s.codeDrafts[q.id].stdin='a'.repeat(32001),s=>s.codeDrafts[q.id].updatedAt='invalid',s=>s.codeDrafts[q.id].questionVersion=0,s=>s.codeDrafts['bad/id']=s.codeDrafts[q.id]]){const copy=structuredClone(s);change(copy);assert.throws(()=>validateStudyState(copy));}
});
test('Malformed historical multi-answer/code snapshots are refused during backup validation',()=>{
 for(const question of [wave.find(q=>q.answerType==='multiple-choice'),q]){
  const s=beginReview(emptyState('fixture'),[{question,score:1,reasons:[],firstCorrect:null,correct:null,attemptIds:[]}],5,'all','snapshot',now);
  const corrupted=structuredClone(s);if(question.answerType==='code')corrupted.adaptive.sessions[0].items[0].question.python.hiddenTests=[];else corrupted.adaptive.sessions[0].items[0].question.answer='broken JSON';
  assert.throws(()=>validateStudyState(corrupted));assert.deepEqual(parseBackup(serializeBackup(s)).data,s);
 }
});
test('A corrupt saved multi-answer cannot replace progress or crash a resumed question',()=>{
 const question=wave.find(q=>q.answerType==='multiple-choice');let s=beginReview(emptyState('fixture'),[{question,score:1,reasons:[],firstCorrect:null,correct:null,attemptIds:[]}],5,'all','multi',now);
 s=answerReview(s,'multi',question.answer,true,'selected',now);
 for(const wrong of ['not JSON','{}','["unknown"]','[]']){const corrupt=structuredClone(s);corrupt.attempts[0].answer=wrong;assert.throws(()=>parseBackup(JSON.stringify({format:'ege-progress-backup',backupVersion:2,appVersion:'0.3.2-dev',createdAt:now.toISOString(),data:corrupt})));}
 assert.deepEqual(parseBackup(serializeBackup(s)).data,s);
});
test('Repeated checks count at most one error and one correction; a later day is independent history',()=>{
 let s=recordCodeAssessment(emptyState('fixture'),q,'wrong',false,'test','a',undefined,now);for(let i=0;i<30;i++)s=recordCodeAssessment(s,q,'still wrong',false,'test','repeat-'+i,undefined,now);
 assert.equal(s.attempts.length,1);assert.equal(s.errors.length,1);
 s=recordCodeAssessment(s,q,q.solution,true,'test','success',undefined,now);s=recordCodeAssessment(s,q,q.solution,true,'test','again',undefined,now);
 assert.equal(s.attempts.length,2);assert.equal(s.errors.length,1);assert.equal(s.reviews['topic:'+q.topic].stage,0);
 s=recordCodeAssessment(s,q,'wrong later',false,'test','later',undefined,new Date(now.getTime()+86400000));assert.equal(s.errors.length,2);assert.deepEqual(parseBackup(serializeBackup(s)).data,s);
});
test('Code grading updates the same adaptive item and preserves first-error/correction, exposures and historic snapshots',()=>{
 const s0=emptyState('fixture'),item={question:q,score:1,reasons:[],firstCorrect:null,correct:null,attemptIds:[]};let s=beginReview(s0,[item],5,'python','coding',now);
 s=recordCodeAssessment(s,q,'def double(x): return x',false,'adaptive','wrong','coding',now);s=recordCodeAssessment(s,q,'wrong again',false,'adaptive','duplicate','coding',now);s=recordCodeAssessment(s,q,q.solution,true,'adaptive','correct','coding',now);
 assert.equal(s.adaptive.sessions[0].items[0].firstCorrect,false);assert.equal(s.adaptive.sessions[0].items[0].correct,true);assert.equal(s.adaptive.exposures.length,1);assert.equal(s.attempts.length,2);
 assert.equal(reviewSummary(s.adaptive.sessions[0],s,bank).corrected,1);assert.deepEqual(parseBackup(serializeBackup(s)).data,s);
});
test('Adaptive sessions contain unique IDs, stop at the eligible count and never pull new prerequisites',()=>{
 const s=emptyState('fixture');s.topics['py-variables']={topic:'py-variables',status:'Изучаю',note:'',last:localDate(now)};
 let plan=selectReview(s,bank,taxonomy.skills,20,{},now);assert.ok(!plan.items.some(i=>i.question.id==='b1-python-01'));assert.equal(plan.repeated,0);assert.ok(plan.items.length<20);
 s.topics['py-types']={topic:'py-types',status:'Изучаю',note:''};plan=selectReview(s,bank,taxonomy.skills,20,{},now);assert.ok(plan.items.some(i=>i.question.id==='b1-python-01'));assert.equal(new Set(plan.items.map(i=>i.question.id)).size,plan.items.length);
});
test('Legacy backups without drafts remain valid and do not mutate the supplied old state',()=>{
 const current=emptyState('fixture');delete current.codeDrafts;const old={...current,schemaVersion:1};delete old.adaptive;
 for(const [version,data] of [[1,old],[2,current]]){const text=JSON.stringify({format:'ege-progress-backup',backupVersion:version,appVersion:version===1?'0.2.1':'0.3.1',createdAt:now.toISOString(),data});const before=structuredClone(data),converted=parseBackup(text);assert.equal(converted.data.schemaVersion,2);assert.equal(converted.data.codeDrafts,undefined);assert.deepEqual(data,before);}
});
test('Supplemental explanations reject malformed fields and unknown topic links',()=>{
 const topics=JSON.parse(fs.readFileSync('src/data/reference.json')).topics,lessons=JSON.parse(fs.readFileSync('src/data/stage3b1-lessons.json'));assert.equal(validateLessonPack(lessons,topics),lessons);
 for(const change of [p=>p.lessons[0].topic='unknown',p=>p.origin='official',p=>p.lessons[0].paragraphs=[''],p=>p.lessons.push(p.lessons[0]),p=>p.lessons[0].html='<script>bad</script>']){const copy=structuredClone(lessons);change(copy);assert.throws(()=>validateLessonPack(copy,topics));}
});
test('Renamed local study documents and per-exercise paths cannot enter publication inputs',()=>{
 assert.ok(isPrivatePath('public/exercise-drafts/code.json'));fs.mkdirSync('outputs',{recursive:true});const file='outputs/own-personal-control.json';fs.writeFileSync(file,JSON.stringify(saveCodeDraft(emptyState('fixture'),q,'private local code','',now)));assert.throws(()=>assertBuildInput(file));
});

test("An ordinary quiz resumes the most recent matching draft, with unrelated and missing drafts ignored",()=>{const s=saveCodeDraft(emptyState("fixture"),code[0],"first","",now),later=saveCodeDraft(s,q,"later","",new Date(now.getTime()+1000));assert.equal(resumeCodeDraftIndex(later,[code[0],q]),1);assert.equal(resumeCodeDraftIndex(later,[code[0]]),0);assert.equal(resumeCodeDraftIndex(later,[bank.find(q=>q.id==="p2")]),0);});
