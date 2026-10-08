import test from 'node:test';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {mathParts,isCodeText,plainExponent} from '../../src/domain/math-text.ts';
import {checkContentBank} from '../../scripts/content-bank.mjs';
import {emptyState} from '../../src/domain/progress.ts';
import {saveCodeDraft,recordCodeAssessment} from '../../src/domain/code-learning.ts';
import {parseBackup,serializeBackup} from '../../src/domain/backup.ts';
import {beginReview} from '../../src/domain/adaptive.ts';
const bank=checkContentBank().questions,oldBank=['python','informatics'].flatMap(s=>JSON.parse(execFileSync('git',['show','2470167:src/data/banks/stage3b1-'+s+'.json'],{encoding:'utf8'})).questions),codes=bank.filter(q=>q.answerType==='code');
test('Display grammar recognises fractions with parentheses, signs, spaces, decimals and variables',()=>{
 for(const [text,a,b] of [['1/2','1','2'],['(2/3) · (9/4)','2','3'],['-3 / 5','-3','5'],['0,5/2','0,5','2'],['p / 100','p','100'],['−b/(2a)','b','(2a)']]){const fraction=mathParts(text).find(p=>p.kind==='fraction');assert.ok(fraction,text);assert.equal(fraction.numerator,a);assert.equal(fraction.denominator,b);}
 assert.equal(mathParts('1/2 + 1/3 = 3/6 + 2/6 = 5/6').filter(p=>p.kind==='fraction').length,5);
});
test('Unsupported prose, links, paths, dates and code remain literal; math is not an HTML interpreter',()=>{
 for(const text of ['08/10/2026','1/2/3','https://example.com/1/2','C:\\files\\1/2','word1/2word','<script>alert(1)</script>','print(1/2)','def f(x):\n    return x / 2','1\n/\n2'])assert.deepEqual(mathParts(text),[{kind:'text',raw:text}],text);
 assert.equal(isCodeText('for x in range(3):\n    print(x)'),true);
});
test('Every display token preserves original source and parses deterministically',()=>{
 for(const text of ['1/2 + 1/3','(2/3) · (9/4)','√x²','2^10 · 3²','−b/(2a)','<img src=x> 1/2','xⁿ⁻¹','Строка без математики']){assert.equal(mathParts(text).map(p=>p.raw).join(''),text);assert.deepEqual(mathParts(text),mathParts(text));}
 assert.equal(plainExponent('²⁰'),'20');assert.equal(plainExponent('^-3'),'-3');assert.equal(mathParts('√x²')[0].kind,'root');assert.equal(mathParts('2^10')[0].exponent,'10');
});
test('Polishing changes only programming test/explanation revisions; IDs, conditions, solutions and old cases are retained',()=>{
 assert.equal(bank.length,167);assert.equal(codes.length,25);
 for(const old of oldBank){const current=bank.find(q=>q.id===old.id);assert.ok(current);if(old.answerType!=='code'){assert.deepEqual(current,old);continue;}
  assert.equal(current.version,3);for(const field of ['prompt','answer','solution','hint','hints','origin','topic','skills','requires','subtopic'])assert.deepEqual(current[field],old[field],old.id+' '+field);
  assert.deepEqual(current.python.visibleTests,old.python.visibleTests);assert.deepEqual(current.python.hiddenTests.slice(0,old.python.hiddenTests.length),old.python.hiddenTests);
  const all=[...current.python.visibleTests,...current.python.hiddenTests];assert.ok(all.length>4);assert.equal(new Set(all.map(t=>JSON.stringify(t.args??t.stdin))).size,all.length,current.id+' duplicate input');
 }
});
test('Strengthened programming cases stay within declared domains and exercise their important upper limits',()=>{
 const find=id=>bank.find(q=>q.id===id),tests=q=>[...q.python.visibleTests,...q.python.hiddenTests];
 for(const id of ['b1-python-10','b1-python-11','b1-informatics-22']){const limit=id.includes('informatics')?1000:100;const all=tests(find(id));assert.ok(all.some(t=>Number(t.stdin)===limit));assert.ok(all.every(t=>Number(t.stdin)>=0&&Number(t.stdin)<=limit));for(const t of all){const n=Number(t.stdin);assert.equal(Number(t.expectedOutput),n*(n+1)/2);}}
 for(const id of ['b1-python-16','b1-python-17','b1-informatics-23','b1-informatics-24']){const all=tests(find(id));assert.ok(all.some(t=>t.stdin.split(' ').length===20));assert.ok(all.every(t=>t.stdin.split(' ').every(n=>Number(n)>=-100&&Number(n)<=100)));}
 const binary=tests(find('b1-informatics-25'));assert.ok(binary.some(t=>t.stdin.length===12&&t.expectedOutput==='4095'));assert.ok(binary.every(t=>/^[01]{1,12}$/.test(t.stdin)));binary.forEach(t=>assert.equal(Number(t.expectedOutput),parseInt(t.stdin,2)));
 for(const id of ['b1-python-23','b1-python-24','b1-python-25'])assert.ok(tests(find(id)).every(t=>t.args.every(x=>x>=-100&&x<=100)));
});
test('Version 1 exercise drafts and history survive backup; version 2 assessment does not overwrite them',()=>{
 const old=oldBank.find(q=>q.id==='b1-python-23'),now=new Date('2026-10-08T12:00:00Z');let s=saveCodeDraft(emptyState('control'),old,old.solution,'',now);
 s=recordCodeAssessment(s,old,'def double(x): return x',false,'test','old',undefined,now);
 const before=structuredClone(s),restored=parseBackup(serializeBackup(s)).data;assert.deepEqual(restored,before);assert.equal(restored.codeDrafts[old.id].questionVersion,1);assert.equal(restored.errors[0].question.version,1);
 s=recordCodeAssessment(restored,bank.find(q=>q.id===old.id),old.solution,true,'test','new',undefined,now);assert.equal(s.attempts.length,2);assert.equal(s.errors[0].question.version,1);assert.equal(s.codeDrafts[old.id].code,old.solution);assert.deepEqual(parseBackup(serializeBackup(s)).data,s);
});
test('Older in-progress adaptive sessions retain their original question snapshot and test set',()=>{
 const old=oldBank.find(q=>q.id==='b1-python-10');const s=beginReview(emptyState('control'),[{question:old,score:1,reasons:[],firstCorrect:null,correct:null,attemptIds:[]}],5,'python','old');assert.deepEqual(parseBackup(serializeBackup(s)).data.adaptive.sessions[0].items[0].question,old);
});
