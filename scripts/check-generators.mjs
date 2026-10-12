import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {generators,generateVariant,validateGenerated} from '../src/domain/generators/index.ts';
import {validateQuestion} from '../src/domain/backup.ts';
export function checkGenerators(){
 const taxonomy=JSON.parse(fs.readFileSync('src/data/taxonomy.json')),topics=JSON.parse(fs.readFileSync('src/data/reference.json')).topics;
 const all=generators.flatMap(g=>Array.from({length:g.variants},(_,s)=>generateVariant(g.id,s)));
 assert.equal(generators.length,18);assert.equal(all.length,432);assert.ok(all.every(Boolean));
 assert.equal(new Set(all.map(r=>r.question.id)).size,432);assert.equal(new Set(all.map(r=>r.question.prompt)).size,432);
 assert.equal(new Set(generators.map(g=>g.familyId)).size,18);
 for(const r of all){validateGenerated(r);const q=validateQuestion(r.question);assert.ok(topics.some(t=>t.id===q.topic&&t.subject===q.subject));assert.ok(taxonomy.subtopics.some(s=>s.id===q.subtopic&&s.topic===q.topic));for(const id of q.skills)assert.ok(taxonomy.skills.some(s=>s.id===id&&s.topic===q.topic));for(const id of q.requires)assert.ok(topics.some(t=>t.id===id));}
 const python=process.env.EGE_ORACLE_PYTHON??(process.platform==='win32'?'python':'python3');
 const run=spawnSync(python,['scripts/generator-oracles.py'],{input:JSON.stringify(all),encoding:'utf8',timeout:30000});assert.equal(run.status,0,run.stderr);assert.equal(JSON.parse(run.stdout).verified,432);
 return {generators:18,variants:432,methods:18,rejected:0,explanationsVerified:432};
}
if(process.argv[1]?.endsWith('check-generators.mjs'))console.log('Generator pilot verified:',checkGenerators());
