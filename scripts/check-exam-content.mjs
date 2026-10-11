import fs from 'node:fs';import assert from 'node:assert/strict';
import {validateExamMap,validateExamTask,validateExamAlignment} from '../src/domain/exam-validation.ts';
export function checkExamContent(){
 const mapFile=JSON.parse(fs.readFileSync('src/data/exam/maps.json')),taskFile=JSON.parse(fs.readFileSync('src/data/exam/tasks.json')),review=JSON.parse(fs.readFileSync('sources/exam3c1-review.json'));
 assert.equal(mapFile.schemaVersion,1);assert.equal(taskFile.schemaVersion,1);assert.equal(review.schemaVersion,1);assert.equal(Object.keys(mapFile).sort().join(','),'exams,reviewedOn,schemaVersion');assert.equal(Object.keys(taskFile).sort().join(','),'schemaVersion,tasks');
 const additions=fs.readdirSync('src/data/exam').filter(n=>/^stage3c2-.*\.json$/.test(n)).flatMap(n=>JSON.parse(fs.readFileSync('src/data/exam/'+n)).tasks);
 const addedReview=JSON.parse(fs.readFileSync('sources/stage3c2-a-review.json')).questions.filter(r=>r.mode==='exam');
 taskFile.tasks.push(...additions);review.questions.push(...addedReview.map(r=>({id:r.id,version:1,oracle:{kind:'stage3c2-check'}})));
 const maps=mapFile.exams.map(validateExamMap),tasks=taskFile.tasks.map(validateExamTask),positions=maps.flatMap(m=>m.positions),taxonomy=JSON.parse(fs.readFileSync('src/data/taxonomy.json'));
 assert.equal(new Set(maps.map(m=>m.id)).size,maps.length);assert.equal(new Set(tasks.map(t=>t.id)).size,tasks.length);assert.equal(new Set(positions.map(p=>p.id)).size,positions.length);assert.equal(new Set(review.questions.map(r=>r.id)).size,tasks.length);assert.equal(review.questions.length,tasks.length);
 const topicIds=new Set(JSON.parse(fs.readFileSync('src/data/reference.json')).topics.map(t=>t.id));
 for(const p of positions){for(const id of p.topics)assert.ok(topicIds.has(id),id);for(const id of p.skills)assert.ok(taxonomy.skills.some(s=>s.id===id&&p.topics.includes(s.topic)),id+' position topic');}
 for(const task of tasks){const map=maps.find(m=>m.positions.some(p=>p.id===task.positionId)),q=task.question,r=review.questions.find(r=>r.id===task.id);assert.ok(map&&r);assert.equal(r.version,task.version,task.id+' review version');assert.equal(map.subject,q.subject);validateExamAlignment(map,task);assert.equal(q.origin,'generated');assert.ok(q.source.includes('не официальный'));assert.ok(q.skills.length);if(q.subtopic)assert.ok(taxonomy.subtopics.some(s=>s.id===q.subtopic&&s.topic===q.topic),task.id+' subtopic');for(const id of q.requires??[])assert.ok(topicIds.has(id),task.id+' prerequisite');for(const id of q.skills)assert.ok(taxonomy.skills.some(s=>s.id===id&&map.positions.find(p=>p.id===task.positionId).topics.includes(s.topic)));
  const c=r.oracle;let result;
  if(c.kind==='language-review'||c.kind==='stage3c2-check')continue;
  if(c.kind==='ratio')result=c.favourable/c.total;
  else if(c.kind==='difference')result=c.a-c.b;
  else if(c.kind==='linear')result=(c.d-c.b)/(c.a-c.c);
  else if(c.kind==='quadratic'){const roots=[];for(let x=-100;x<=100;x++)if(c.a*x*x+c.b*x+c.c===0)roots.push(x);result=Math.max(...roots);}
  else if(c.kind==='rational-equation'){const roots=[];for(let x=-100;x<=100;x++)if(x!==c.pole&&(x+c.offset)/(x-c.pole)===c.target)roots.push(x);assert.equal(roots.length,1);result=roots[0];}
  else if(['exponential','logarithm'].includes(c.kind))result=c.kind==='logarithm'?c.base**c.power+c.offset:c.power+c.offset;
  else if(c.kind==='word-length')result=[...c.word].reduce((s,x)=>s+c.codes[x].length,0);
  else if(c.kind==='decode'){let remaining=c.bits,count=0;while(remaining){const code=c.codes.find(s=>remaining.startsWith(s));assert.ok(code);remaining=remaining.slice(code.length);count++;}result=count;}
  else if(['prefix-min','prefix-count','prefix-fixed'].includes(c.kind)){const valid=s=>c.codes.every(old=>!old.startsWith(s)&&!s.startsWith(old));if(c.kind==='prefix-min'){for(let n=1;n<16;n++)if(Array.from({length:2**n},(_,i)=>i.toString(2).padStart(n,'0')).some(valid)){result=n;break;}}else{const options=Array.from({length:2**c.length},(_,i)=>i.toString(2).padStart(c.length,'0')).filter(valid);result=c.kind==='prefix-count'?options.length:options[0];}}
  else if(c.kind==='base-sum')result=c.terms.reduce((s,[v,b])=>s+parseInt(v,b),0);
  else if(c.kind==='base-find'){const possible=[];for(let b=3;b<=36;b++)if(parseInt(c.digits,b)===c.value)possible.push(b);assert.equal(possible.length,1);result=possible[0];}
  else if(c.kind==='digit-find'){const possible=[];for(let x=0;x<c.base;x++)if((c.prefix*c.base*c.base+x*c.base+c.suffix)%c.divisor===0)possible.push(x);assert.equal(possible.length,1);result=possible[0];}
  else if(c.kind==='digit-count'){const n=c.terms.reduce((s,[b,e,sign])=>s+BigInt(sign)*BigInt(b)**BigInt(e),0n);result=[...n.toString(c.base)].filter(v=>v===c.digit).length;}
  else throw Error('Unknown independent oracle '+c.kind);
  assert.ok(result!==undefined,task.id);if(task.format==='bitstring')assert.equal(String(result),q.answer,task.id);else assert.ok(Math.abs(Number(result)-Number(q.answer))<1e-12,task.id+' independently got '+result);
 }
 return{maps,tasks,positions};
}
if(process.argv[1]?.endsWith('check-exam-content.mjs')){const c=checkExamContent();console.log(`Exam content valid: ${c.maps.length} project maps, ${c.positions.length} positions, ${c.tasks.length} original tasks`);}
