import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {checkExamContent} from '../../scripts/check-exam-content.mjs';
import {compatibleExamFormat, emptyExam, startExam, editExam, answerExam, selectExamTasks, coverage, mapKey} from '../../src/domain/exam.ts';
import {validateExamMap, validateExamAlignment, validateExamProgress} from '../../src/domain/exam-validation.ts';
import {emptyState} from '../../src/domain/progress.ts';
import {parseBackup, serializeBackup} from '../../src/domain/backup.ts';
const {maps,tasks}=checkExamContent();
const legacy=file=>JSON.parse(execFileSync('git',['show','44de3f6:'+file],{encoding:'utf8'}));
const oldMaps=legacy('src/data/exam/maps.json').exams,oldTasks=legacy('src/data/exam/tasks.json').tasks;
const ownMap=t=>maps.find(m=>m.positions.some(p=>p.id===t.positionId));

test('Geometric correction and reviewed skill revisions preserve all 36 identities/answers and use new snapshot versions',()=>{
  assert.equal(tasks.length,oldTasks.length);
  let revisions=0;
  for(const t of tasks){const old=oldTasks.find(o=>o.id===t.id);assert.ok(old);assert.equal(t.question.answer,old.question.answer);assert.equal(t.version,t.question.version);
    if(JSON.stringify(t)!==JSON.stringify(old)){assert.equal(t.version,old.version+1);revisions++;}else assert.equal(t.version,old.version);
    assert.doesNotMatch(t.question.prompt,/восьмигранн\S* кубик|десятигранн\S* кубик/i);
  }
  assert.equal(revisions,14);
  const face=tasks.find(t=>t.id==='exam27-math-4-faces');assert.match(face.question.prompt,/восьмигранной игральной кости/);assert.match(face.question.prompt,/равновероятны/);
  assert.deepEqual(face.question.skills,oldTasks.find(t=>t.id===face.id).question.skills);
  assert.ok(maps.every((m,i)=>m.version!==oldMaps[i].version));
});

test('Explicit refinements accept singleton sentence index and integer/bitstring coding tasks; unrelated formats reject',()=>{
  for(const t of tasks)assert.ok(compatibleExamFormat(ownMap(t),t),t.id);
  for(const [id,format,answer]of [
    ['exam27-math-4-faces','text','0.25'],['exam27-russian-16-repeated','integer','12'],
    ['exam27-russian-26-object','integer','-1'],['exam27-russian-26-object','bitstring','010'],
    ['exam27-informatics-4-lex','decimal','0.5'],['exam27-informatics-14-mixed','bitstring','10'],
  ]){const t=structuredClone(tasks.find(t=>t.id===id));t.format=format;t.question.answer=answer;assert.equal(compatibleExamFormat(ownMap(t),t),false,id);assert.throws(()=>validateExamAlignment(ownMap(t),t));}
  const single=structuredClone(tasks.find(t=>t.id==='exam27-russian-26-object'));single.question.answer='12';
  assert.equal(compatibleExamFormat(ownMap(single),single),true,'A single multi-digit sentence index remains a valid refinement');
  const m=structuredClone(maps[0]);m.positions[3].answerFormats=['decimal','essay'];assert.throws(()=>validateExamMap(m));
  const n=structuredClone(maps[2]);delete n.positions[3].answerFormats;assert.equal(compatibleExamFormat(n,tasks.find(t=>t.id==='exam27-informatics-4-lex')),false);
});

test('Only the checked legacy .1 format exceptions restore archived snapshots; new data require declarations',()=>{
  for(const t of oldTasks){const m=oldMaps.find(m=>m.positions.some(p=>p.id===t.positionId));assert.ok(compatibleExamFormat(m,t),t.id);}
  const t=oldTasks.find(t=>t.id==='exam27-informatics-4-lex'),m=structuredClone(oldMaps[2]);m.version='unreviewed';assert.equal(compatibleExamFormat(m,t),false);
  const broken=structuredClone(oldMaps[2]);broken.positions[3].format='decimal';assert.equal(compatibleExamFormat(broken,t),false,'Legacy exception must not bypass a changed base format');
});

test('Evidence-based skill links exclude statistics, unrelated punctuation, metaphors, byte-volume and algorithm encoding',()=>{
  const position=id=>maps.flatMap(m=>m.positions).find(p=>p.id===id);
  assert.deepEqual(position('ege-math-2027-4').skills,['probability.skill.3b2-outcomes']);
  for(const id of ['punctuation.skill.3b2-punct-address','punctuation.skill.3b2-punct-gerund','complex.skill.3b2-meaning'])assert.ok(!position('ege-russian-2027-16').skills.includes(id));
  assert.ok(!position('ege-russian-2027-26').skills.includes('text.skill.3b2-text-metaphor'));
  assert.deepEqual(position('ege-informatics-2027-4').skills,['encoding.skill.3b2-prefix']);
  assert.ok(!position('ege-informatics-2027-14').skills.includes('binary.skill.3b2-binary-rule'));
  assert.ok(position('ege-math-2027-7').skills.includes('powers.skill.rules'));
  const compound=tasks.find(t=>t.id==='exam27-russian-16-compound-list');assert.ok(compound.question.skills.includes('complex.skill.3b2-punctuation'));
  const bad=structuredClone(tasks[0]);bad.question.skills=['probability.skill.3b2-statistics'];assert.throws(()=>validateExamAlignment(ownMap(bad),bad));
});

test('Old .1 map and v1 task snapshots, first error/correction, answers, draft and backup remain exact beside new revisions',()=>{
  const old=oldTasks.find(t=>t.id==='exam27-math-4-faces'),current=tasks.find(t=>t.id===old.id),now=new Date('2026-10-10T12:00:00.000Z');
  let p=startExam(emptyExam(),oldMaps[0],[old],'number','legacy','old',now);
  p=answerExam(editExam(p,'old',0,'0'),'old',0,'first',now);
  p=answerExam(editExam(p,'old',0,old.question.answer),'old',0,'correction',now);
  p.sessions[0].items[0].draft='Own retained scratch work';const before=structuredClone(p);
  p=startExam(p,maps[0],[current],'number','reviewed','new',now);
  assert.deepEqual(p.sessions[0],before.sessions[0]);assert.deepEqual(p.maps[mapKey(oldMaps[0])],oldMaps[0]);assert.deepEqual(p.snapshots[old.id+'@1'],old);
  assert.equal(p.sessions[0].items[0].attempts[0].correct,false);assert.equal(p.sessions[0].items[0].attempts[1].correct,true);assert.equal(p.snapshots[current.id+'@2'].question.answer,old.question.answer);
  assert.equal(validateExamProgress(p),p);const s={...emptyState('legacy-040'),exam:p};assert.deepEqual(parseBackup(serializeBackup(s)).data,s);
  const broken=structuredClone(p);broken.snapshots[current.id+'@2'].format='text';assert.throws(()=>validateExamProgress(broken));
});

test('Unsupported format cannot enter selection, readiness or start, including a forged backup',()=>{
  const t=structuredClone(tasks[0]);t.format='bitstring';const m=maps[0];
  assert.equal(selectExamTasks(m,[t],[t.positionId],5,'numbers','fixed').available,0);
  assert.equal(coverage(m,[t]).find(p=>p.position.id===t.positionId).count,0);
  assert.throws(()=>startExam(emptyExam(),m,[t],'number','seed','s'));
});
