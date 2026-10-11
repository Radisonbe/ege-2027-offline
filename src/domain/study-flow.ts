import {family} from './question-families.ts';
import type {Question,StudyState,TopicTestSession} from './types.ts';
import {localDate,recordAttempt,topicProgress} from './progress.ts';

export function recordTraining(state:StudyState,q:Question,answer:string,correct:boolean,id:string,now=new Date()):StudyState {
 const date=localDate(now),progress=topicProgress(state,q.topic);
 return {...state,training:[...(state.training??[]),{id,questionId:q.id,questionVersion:q.version,topic:q.topic,subject:q.subject,subtopic:q.subtopic,skills:q.skills??[],answer,correct,context:'practice',date,at:now.toISOString()}],
 topics:{...state.topics,[q.topic]:{...progress,last:date,status:progress.status==='Не изучено'?'Изучаю':progress.status}},activity:[...state.activity,{id,topic:q.topic,date,kind:'lesson'}],settings:{...state.settings,lastTopic:q.topic}};
}
export function startTopicTest(state:StudyState,topic:string,questions:Question[],id:string,now=new Date()):StudyState {
 if(!questions.length||state.topicTests?.some(s=>s.topic===topic&&!s.completedAt))return state;
 const session:TopicTestSession={id,topic,startedAt:now.toISOString(),index:0,items:questions.map(question=>({question:structuredClone(question),answer:'',firstCorrect:null,correct:null}))};
 return {...state,topicTests:[...(state.topicTests??[]),session]};
}
export function answerTopicTest(state:StudyState,sessionId:string,answer:string,correct:boolean,id:string,now=new Date()):StudyState {
 const session=state.topicTests?.find(s=>s.id===sessionId);if(!session||session.completedAt)return state;
 const item=session.items[session.index];if(!item)return state;
 const first=item.firstCorrect===null;
 const next=first?recordAttempt(state,item.question,answer,correct,'test',id,now,sessionId):state;
 return {...next,topicTests:state.topicTests?.map(s=>s.id===sessionId?{...s,items:s.items.map((v,i)=>i===s.index?{...v,answer: first?answer:v.answer,lastAnswer:answer,firstCorrect:first?correct:v.firstCorrect,correct,...(first?{attemptId:id}:{})}:v)}:s)};
}
export function advanceTopicTest(state:StudyState,id:string,now=new Date()):StudyState {
 return {...state,topicTests:state.topicTests?.map(s=>s.id!==id||s.completedAt||s.items[s.index]?.firstCorrect===null?s:s.index===s.items.length-1?{...s,completedAt:now.toISOString()}:{...s,index:s.index+1})};
}
// Explicitly reviewed allocation: IDs alone are not evidence of independence.
export function learningSets(bank:Question[],topic:string,allocation:Record<string,{practice:string[];test:string[]}>){
 const row=allocation[topic],all=bank.filter(q=>q.topic===topic&&!q.easy),byId=new Map(all.map(q=>[q.id,q]));
 if(!row)return {practice:all,test:[]};
 const read=(ids:string[])=>ids.map(id=>{const q=byId.get(id);if(!q)throw Error('Неизвестное задание в учебном плане: '+id);return q;});
 if(row.test.some(id=>row.practice.includes(id)))throw Error('Практика совпадает с мини-тестом: '+topic);
 return {practice:read(row.practice),test:read(row.test)};
}
export function validateLearningFlow(value:unknown,bank:Question[]):Record<string,{practice:string[];test:string[]}> {
 const data=value as {schemaVersion:number;topics:Record<string,{practice:string[];test:string[]}>};
 if(!data||data.schemaVersion!==1||Object.keys(data).some(k=>!['schemaVersion','topics'].includes(k))||!data.topics||typeof data.topics!=='object'||Array.isArray(data.topics))throw Error('Неверный план практики и проверки');
 const expected=new Set(bank.filter(q=>!q.easy).map(q=>q.topic));
 if(Object.keys(data.topics).length!==expected.size)throw Error('В плане пропущена тема');
 for(const [topic,row] of Object.entries(data.topics)){
  if(!expected.has(topic)||!row||Object.keys(row).some(k=>!['practice','test'].includes(k))||!Array.isArray(row.practice)||!Array.isArray(row.test)||[...row.practice,...row.test].some(id=>typeof id!=='string'))throw Error('Неверный раздел плана: '+topic);
  const sets=learningSets(bank,topic,data.topics),ids=[...sets.practice,...sets.test].map(q=>q.id);
  if(new Set(ids).size!==ids.length||ids.length!==bank.filter(q=>q.topic===topic&&!q.easy).length)throw Error('Неполный или повторяющийся набор: '+topic);
 }
 return data.topics;
}

// A control pool is not the length of a single attempt. Old saved sessions are never resliced.
export const TOPIC_TEST_SIZE = 6;
export function topicTestQuestions(state:StudyState,topic:string,pool:Question[],limit=TOPIC_TEST_SIZE):Question[] {
 if(!Number.isInteger(limit)||limit<1||limit>20)throw Error('Неверный размер мини-теста');
 const last=new Map<string,string>();
 for(const s of state.topicTests??[])for(const i of s.items)last.set(i.question.id,s.startedAt);
 for(const a of state.attempts)last.set(a.questionId,a.at);
 const queue=[...new Map(pool.filter(q=>q.topic===topic&&!q.easy).map(q=>[q.id,q])).values()];
 queue.sort((a,b)=>Number(last.has(a.id))-Number(last.has(b.id))||(last.get(a.id)??'').localeCompare(last.get(b.id)??''));
 const result:Question[]=[],families=new Map<string,number>(),skills=new Set<string>();
 while(queue.length&&result.length<limit){
  const score=(q:Question)=>[Number(last.has(q.id)),families.get(family(q))??0,q.skills?.every(id=>skills.has(id))?1:0];
  const less=(a:number[],b:number[])=>{for(let i=0;i<a.length;i++)if(a[i]!==b[i])return a[i]<b[i];return false;};
  let best=0;for(let i=1;i<queue.length;i++)if(less(score(queue[i]),score(queue[best])))best=i;
  const q=queue.splice(best,1)[0];result.push(q);families.set(family(q),(families.get(family(q))??0)+1);q.skills?.forEach(id=>skills.add(id));
 }
 return result;
}
