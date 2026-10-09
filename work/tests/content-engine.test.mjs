import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { contentFingerprint,validateContentPackage,validateTaxonomy,loadContentPackages,originLabels } from '../../src/domain/content.ts';
import { checkContentBank } from '../../scripts/content-bank.mjs';
const reference=JSON.parse(fs.readFileSync('src/data/reference.json','utf8'));
const topics=reference.topics.map(t=>({...t,materialStatus:t.live?'ready':'planned'}));
const taxonomy=JSON.parse(fs.readFileSync('src/data/taxonomy.json','utf8'));
const pack=()=>JSON.parse(fs.readFileSync('src/data/banks/math.json','utf8'));
test('All 67 original IDs and every instructional field survive classification; all origins remain generated',()=>{
  const {questions}=checkContentBank();assert.equal(questions.filter(q=>!q.id.startsWith("b1-")&&!q.id.startsWith("b2-")).length,67);assert.equal(new Set(questions.map(q=>q.id)).size,questions.length);
  for(const old of reference.questions){const q=questions.find(q=>q.id===old.id);assert.ok(q);for(const field of ['prompt','answer','hint','solution','principle'])assert.equal(q[field],old[field],old.id+'.'+field);assert.equal(q.explanation,old.solution);assert.deepEqual(q.wrongAnswers,old.wrong);assert.equal(Boolean(q.easy),Boolean(old.easy));assert.deepEqual(q.options,old.options);assert.equal(q.answerType,old.kind);assert.equal(q.origin,'generated');assert.ok(q.skills.length);assert.ok(q.subtopic);assert.notEqual(q.difficulty,'unspecified');}
});
test('Missing fields, duplicate questions, invalid answers and skill/topic mismatch are rejected',()=>{
  const mutations=[p=>delete p.questions[0].prompt,p=>p.questions.push(p.questions[0]),p=>p.questions[0].topic='absent',p=>p.questions[0].skills=['absent'],p=>p.questions[0].skills=['binary.skill.to-decimal'],p=>p.questions[0].requires=['absent'],p=>p.questions[0].origin='private-import',p=>p.questions[0].answer='not-a-number',p=>p.questions.find(q=>q.answerType==='choice').options=['duplicate','duplicate']];
  for(const change of mutations){const p=pack();change(p);assert.throws(()=>validateContentPackage(p,topics,taxonomy));}
});
test('Invalid taxonomy references, repeated skill IDs and required-skill cycles are rejected',()=>{
  for(const change of [t=>t.skills[0].subtopic='absent',t=>t.skills.push(t.skills[0]),t=>{t.skills[0].requires=[t.skills[1].id];t.skills[1].requires=[t.skills[0].id];}]){const t=structuredClone(taxonomy);change(t);assert.throws(()=>validateTaxonomy(t,topics));}
});
test('A malformed subject package is isolated at runtime and prevents a strict production validation',()=>{
  const good=pack(),broken={schemaVersion:99};const result=loadContentPackages([broken,good],topics,taxonomy);assert.equal(result.questions.length,good.questions.length);assert.equal(result.diagnostics.length,1);assert.throws(()=>loadContentPackages([broken,good],topics,taxonomy,true));
});
test('Cross-package duplicate IDs are rejected before any records from that package are added',()=>{
  const a=pack(),b=pack();b.id='different-package';const result=loadContentPackages([a,b],topics,taxonomy);assert.equal(result.questions.length,a.questions.length);assert.equal(result.diagnostics.length,1);
});
test('Origins have distinct labels and cannot silently become official',()=>{
  for(const origin of ['generated','custom','reconstructed','private-import'])assert.notEqual(originLabels[origin],originLabels.official);
});
test('Bank version is stable and changes when question or taxonomy metadata changes',()=>{
  const bank=checkContentBank(),before=contentFingerprint(bank.questions,bank.taxonomy);assert.equal(before,contentFingerprint(structuredClone(bank.questions),structuredClone(bank.taxonomy)));
  const changed=structuredClone(bank.questions);changed[0].version++;assert.notEqual(before,contentFingerprint(changed,bank.taxonomy));
  const taxonomy=structuredClone(bank.taxonomy);taxonomy.skills[0].title+=' (revised)';assert.notEqual(before,contentFingerprint(bank.questions,taxonomy));
});
