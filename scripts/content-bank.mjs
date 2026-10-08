import fs from 'node:fs';
import path from 'node:path';
import { validateTaxonomy, loadContentPackages } from '../src/domain/content.ts';
import {validateLessonPack} from '../src/domain/lessons.ts';
export function checkContentBank(root=process.cwd()) {
  const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
  const reference=read('src/data/reference.json');
  const topics=reference.topics.map(t=>({...t,materialStatus:t.live?'ready':'planned'}));
  const taxonomy=validateTaxonomy(read('src/data/taxonomy.json'),topics);
  const lessons=validateLessonPack(read('src/data/stage3b1-lessons.json'),topics);
  const packages=fs.readdirSync(path.join(root,'src/data/banks')).filter(name=>name.endsWith('.json')).sort().map(name=>read('src/data/banks/'+name));
  const {questions}=loadContentPackages(packages,topics,taxonomy,true);
  for(const q of questions)if(q.id.startsWith('b1-')&&!reference.theories[q.topic]&&!lessons.lessons.some(l=>l.topic===q.topic))throw Error('New exercise has no theory: '+q.id);
  return {questions,taxonomy};
}
