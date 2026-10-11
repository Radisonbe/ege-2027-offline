// Reproducible synthetic history report; never reads a user's IndexedDB or backup.
import fs from 'node:fs';
import {checkContentBank} from './content-bank.mjs';
import {emptyState,recordAttempt} from '../src/domain/progress.ts';
import {recordTraining,learningSets} from '../src/domain/study-flow.ts';
import {quickDefaults,selectQuick} from '../src/domain/quick-practice.ts';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const reference=read('src/data/reference.json');
const ready=new Set([...reference.topics.filter(t=>t.live).map(t=>t.id),...['stage3b1-lessons.json','stage3b2-lessons.json','stage3c2-a-lessons.json'].flatMap(n=>read('src/data/'+n).lessons.map(l=>l.topic))]);
const topics=reference.topics.map(t=>({...t,materialStatus:ready.has(t.id)?'ready':'planned'}));
const {questions,taxonomy}=checkContentBank(),flow=read('src/data/study-flow.json').topics;
const bank=topics.flatMap(t=>learningSets(questions,t.id,flow).practice);
const prefs={...quickDefaults(emptyState('synthetic'),topics),topics:topics.filter(t=>ready.has(t.id)).map(t=>t.id),count:30};
const now=new Date('2026-10-11T10:00:00.000Z'),rows=[];
for(const count of [0,10,50,100,200,bank.length]){
 let state=emptyState('synthetic');
 bank.slice(0,count).forEach((q,i)=>{state=i%2?recordTraining(state,q,q.answer,true,'t'+i,now):recordAttempt(state,q,q.answer,true,'session','a'+i,now);});
 const result=selectQuick(state,bank,topics,taxonomy.skills,prefs,'fixed-'+count);
 rows.push({solved:count,available:result.available,fresh:result.fresh,selected:result.questions.length,repeat:result.repeated,ids:result.questions.map(q=>q.id)});
}
fs.mkdirSync('outputs',{recursive:true});
fs.writeFileSync('outputs/CONTENT3C2-SELECTION.json',JSON.stringify({method:'Synthetic history, all 44 topics explicitly selected; mixed easy/medium, hard requires explicit choice',rows},null,2));
console.log(JSON.stringify(rows.map(({ids,...row})=>row)));
