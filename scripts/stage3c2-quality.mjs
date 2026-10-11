import fs from 'node:fs';import assert from 'node:assert/strict';import {spawnSync,execFileSync} from 'node:child_process';import {parseNumber,checkAnswer} from '../src/domain/answers.ts';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
export function c2Questions(){return [...fs.readdirSync('src/data/banks').filter(n=>n.startsWith('stage3c2-a-')).flatMap(n=>read('src/data/banks/'+n).questions),...read('src/data/exam/stage3c2-a.json').tasks.map(t=>t.question)];}
export const normalized=p=>p.toLowerCase().replaceAll('−','-').replace(/\d+(?:[.,]\d+)?/g,'#').replace(/\s+/gu,' ').trim();
export function checkC2(){
 const questions=c2Questions(),review=read('sources/stage3c2-a-review.json').questions,byId=new Map(questions.map(q=>[q.id,q]));assert.equal(new Set(questions.map(q=>q.id)).size,questions.length);assert.equal(new Set(review.map(r=>r.id)).size,questions.length);assert.equal(review.length,questions.length);
 const computed=review.filter(r=>r.verification),python=process.env.EGE_ORACLE_PYTHON??(process.platform==='win32'?'python':'python3');
 const run=spawnSync(python,['scripts/stage3c2-oracles.py'],{input:JSON.stringify(computed),encoding:'utf8',timeout:30000});assert.equal(run.status,0,run.stderr);const results=JSON.parse(run.stdout);
 for(const result of results){const q=byId.get(result.id);assert.ok(q);if(q.answerType==='number'||q.answerType==='choice'&&parseNumber(q.answer)!==null){assert.notEqual(parseNumber(result.value),null,result.id);assert.ok(Math.abs(parseNumber(result.value)-parseNumber(q.answer))<1e-10,result.id+' independent '+result.value+' vs '+q.answer);}else assert.equal(result.value,q.answer,result.id);}
 for(const q of questions){const r=review.find(r=>r.id===q.id);assert.equal(q.origin,'generated');assert.ok(r.reason.length>35);assert.equal(q.familyId,r.family);if(q.answerType!=='code')assert.ok(checkAnswer(q,q.answer).correct,q.id);if(q.answerType==='choice'){assert.equal(r.optionReview.length,q.options.length);assert.deepEqual(r.optionReview.map(v=>v.text),q.options);assert.deepEqual(r.optionReview.filter(v=>v.correct).map(v=>v.text),[q.answer]);assert.ok(r.optionReview.every(v=>v.reason.length>12));}
  if(q.answerType==='code'){assert.equal(r.mutants.length,2);assert.ok(q.python.hiddenTests.length>=3);assert.ok(q.hints.length>=2);}
  if(r.mode==='exam'&&q.subject==='russian'){assert.equal(r.sentences.length,5);if(r.commaCounts){assert.deepEqual(q.answer,r.commaCounts.flatMap((n,i)=>n===1?[String(i+1)]:[]).join(''));assert.equal(r.sentenceReasons.length,5);assert.ok(r.sentenceReasons.every(s=>s.length>20));}else{assert.equal(q.answer,String(r.target));assert.ok(r.languageReason.length>50);}}
 }
 // Compare against the actual accepted 0.5.0 content; old bank objects must be unchanged.
 const baseline=execFileSync('git',['ls-tree','--name-only','37e3ee1','src/data/banks/'],{encoding:'utf8'}).trim().split(/\r?\n/).flatMap(file=>{const old=JSON.parse(execFileSync('git',['show','37e3ee1:'+file],{encoding:'utf8'}));assert.deepEqual(read(file),old,file);return old.questions;});
 const oldExam=JSON.parse(execFileSync('git',['show','37e3ee1:src/data/exam/tasks.json'],{encoding:'utf8'}));assert.deepEqual(read('src/data/exam/tasks.json'),oldExam);assert.equal(baseline.length,317);assert.equal(oldExam.tasks.length,36);
 const all=[...baseline,...oldExam.tasks.map(t=>t.question),...questions],ids=new Set();for(const q of all){assert.ok(!ids.has(q.id),q.id);ids.add(q.id);}
 const exact=new Map(),numericVariants=[];for(const q of all){const text=(q.prompt+'\n'+(q.python?.starterCode??'')).replace(/\s+/g,' ').trim();if(exact.has(text)&&q.id.startsWith('c2a-'))throw Error('Exact duplicate: '+q.id+' / '+exact.get(text));exact.set(text,q.id);}
 const norm=new Map();for(const q of all){const text=normalized(q.prompt+' '+(q.python?.starterCode??'')),old=norm.get(text);if(old&&q.id.startsWith('c2a-'))numericVariants.push({a:old.id,b:q.id,family:q.familyId});else norm.set(text,q);}
 for(const pair of numericVariants){const r=review.find(r=>r.id===pair.b);assert.ok(r.duplicateReview?.length>30,'Unreviewed near numerical duplicate '+pair.a+' / '+pair.b);}
 const closePairs=[];
 const shingles=q=>{const source=q.python?.type==='predict-output'?q.python.starterCode:q.prompt;const tokens=normalized(source??'').match(/[a-zа-яё_]+|#|[^\s\wа-яё]/gu)??[];return new Set(tokens.slice(0,-3).map((_,i)=>tokens.slice(i,i+4).join(' ')));};
 for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++){
  if(!all[j].id.startsWith('c2a-')||all[i].topic!==all[j].topic||all[i].answerType!==all[j].answerType)continue;
  const a=shingles(all[i]),b=shingles(all[j]);if(a.size<6||b.size<6)continue;
  const common=[...a].filter(x=>b.has(x)).length,ratio=common/(a.size+b.size-common);
  if(ratio>=0.72)closePairs.push({a:all[i].id,b:all[j].id,similarity:Number(ratio.toFixed(3)),sameFamily:all[i].familyId===all[j].familyId});
 }

 for(const pair of closePairs){const r=review.find(r=>r.id===pair.b);assert.ok(r.duplicateReview?.length>30,'Unreviewed near-text duplicate '+pair.a+' / '+pair.b);}
 const exclusive=questions.find(q=>q.id==='c2a-informatics-exclusive');if(exclusive){const implementations=[(a,b)=>(a&&!b)||(!a&&b),(a,b)=>a&&b,(a,b)=>a||b,(a,b)=>!a&&!b];const inputs=[[false,false],[false,true],[true,false],[true,true]];const matches=implementations.map(fn=>inputs.every(([a,b])=>!!fn(a,b)===(a!==b)));assert.deepEqual(matches,[true,false,false,false]);assert.equal(exclusive.answer,exclusive.options[0]);}
 return {closePairs,total:questions.length,computed:results.length,language:questions.filter(q=>q.subject==='russian').length,programs:questions.filter(q=>q.answerType==='code').length,predictions:questions.filter(q=>q.python?.type==='predict-output').length,families:new Set(questions.map(q=>q.familyId)).size,numericVariants};
}
if(process.argv[1]?.endsWith('stage3c2-quality.mjs')){const r=checkC2();console.log('Stage 3C.2 package A quality:',JSON.stringify({...r,closePairs:r.closePairs.length}));}
