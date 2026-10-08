import type {Topic,ContentNode} from './types.ts';
export interface LessonPack {schemaVersion:1;origin:'generated';source:string;lessons:{topic:string;minutes:number;paragraphs:string[];example:string}[]}
export function validateLessonPack(value:unknown,topics:Pick<Topic,'id'>[]):LessonPack {
  const fail=():never=>{throw Error('Неверная структура базовых объяснений');};
  const obj=(v:unknown,keys:string[])=>{if(!v||typeof v!=='object'||Array.isArray(v))return fail();const o=v as Record<string,unknown>;if(Object.keys(o).length!==keys.length||keys.some(k=>!Object.hasOwn(o,k)))fail();return o;};
  const text=(v:unknown)=>typeof v==='string'&&!!v.trim()&&v.length<=10000;
  const p=obj(value,['schemaVersion','origin','source','lessons']);if(p.schemaVersion!==1||p.origin!=='generated'||!text(p.source)||!Array.isArray(p.lessons)||p.lessons.length>67)fail();
  const ids=new Set(topics.map(t=>t.id)),seen=new Set();
  for(const raw of p.lessons as unknown[]){const l=obj(raw,['topic','minutes','paragraphs','example']);if(!ids.has(String(l.topic))||seen.has(l.topic)||!Number.isInteger(l.minutes)||Number(l.minutes)<1||Number(l.minutes)>120||!Array.isArray(l.paragraphs)||!l.paragraphs.length||l.paragraphs.length>20||!l.paragraphs.every(text)||!text(l.example))fail();seen.add(l.topic);}
  return value as LessonPack;
}
export function lessonNode(lesson:LessonPack['lessons'][number]):ContentNode {
  const node=(tag:string,children:(ContentNode|string)[],className=''):ContentNode=>({tag,className,children});
  return node('section',[node('h2',['Базовые приёмы']),...lesson.paragraphs.map(p=>node('p',[p])),node('h3',['Разобранный пример']),node('pre',[lesson.example])],'panel prose');
}
