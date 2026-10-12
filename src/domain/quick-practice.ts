import {family} from './question-families.ts';
export {family,legacyFamilyAliases} from './question-families.ts';
// Mirrors the reviewed alias registry; parity is tested. Avoid JSON module import attributes in Chromium dev mode.
import type {Question,StudyState,Attempt,SubjectId,Topic,Skill} from './types.ts';
import {validateQuestion} from './backup.ts';
import {recordTraining} from './study-flow.ts';
import {textContext} from './text-context.ts';
export interface QuickPreferences {subjects:SubjectId[];topics:string[];count:10|20|30;difficulty:'mixed'|'easy'|'medium'|'hard';unseenFirst:boolean;allowRepeats:boolean;generatedVariants?:boolean}
export interface QuickItem {key:string;answer:string;correct:boolean|null;shown:boolean;repeat:boolean;attemptIds:string[];assisted?:boolean;independentCorrect?:boolean}
export interface QuickSession {id:string;startedAt:string;completedAt?:string;index:number;preferences:QuickPreferences;items:QuickItem[]}
export interface QuickProgress {schemaVersion:1;preferences:QuickPreferences;snapshots:Record<string,Question>;sessions:QuickSession[]}
export const quickKey=(q:Question)=>q.id+'@'+q.version;
export function quickDefaults(state:StudyState,topics:Topic[]):QuickPreferences {
 return {subjects:['math','russian','informatics','python'],topics:topics.filter(t=>t.materialStatus==='ready'&&state.topics[t.id]&&state.topics[t.id].status!=='Не изучено').map(t=>t.id),count:20,difficulty:'mixed',unseenFirst:true,allowRepeats:false};
}
export function encountered(state:StudyState):Set<string>{
 const ids=new Set([...state.attempts,...state.training??[]].map(a=>a.questionId));
 for(const s of state.topicTests??[])s.items.forEach((v,i)=>{if(i<=s.index)ids.add(v.question.id);});
 for(const s of state.adaptive.sessions)s.items.forEach(v=>{if(v.shownAt)ids.add(v.question.id);});
 for(const s of state.quickPractice?.sessions??[])for(const i of s.items)if(i.shown)ids.add(state.quickPractice!.snapshots[i.key].id);
 return ids;
}
// Only explicitly chosen ready topics; readiness is never treated as learner mastery.
export function selectQuick(state:StudyState,bank:Question[],topics:Topic[],skills:Skill[],prefs:QuickPreferences,seed:string){
 const selected=new Set(prefs.topics),eligible=new Set(topics.filter(t=>selected.has(t.id)&&prefs.subjects.includes(t.subject)&&t.materialStatus==='ready').map(t=>t.id));
 const known=new Set([...eligible,...Object.values(state.topics).filter(t=>t.status!=='Не изучено').map(t=>t.topic)]),skillMap=new Map(skills.map(s=>[s.id,s]));
 const satisfies=(id:string)=>known.has(skillMap.get(id)?.topic??id);
 const pool=bank.filter(q=>eligible.has(q.topic)&&(prefs.difficulty==='mixed'?q.difficulty!=='hard':prefs.difficulty===q.difficulty)&&[...q.requires,...(q.skills??[]).flatMap(id=>skillMap.get(id)?.requires??[])].every(satisfies));
 const seen=encountered(state),seenFamilies=new Set(bank.filter(q=>seen.has(q.id)).map(family)),fresh=pool.filter(q=>!seen.has(q.id));
 const candidates=prefs.allowRepeats?pool:fresh;
 const hash=(v:string)=>{let h=2166136261;for(const c of seed+v)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
 const queue=[...candidates].sort((a,b)=>(prefs.unseenFirst?Number(seen.has(a.id))-Number(seen.has(b.id)):0)||Number(seenFamilies.has(family(a)))-Number(seenFamilies.has(family(b)))||hash(a.id)-hash(b.id)||a.id.localeCompare(b.id));
 const result:Question[]=[],used=new Map<string,number>(),usedTexts=new Map<string,number>();
 while(queue.length&&result.length<prefs.count){
  let best=0;const score=(q:Question)=>[prefs.unseenFirst?Number(seen.has(q.id)):0,textContext(q)?usedTexts.get(textContext(q)!)??0:0,used.get(family(q))??0,result.at(-1)?.topic===q.topic?1:0,result.at(-1)?.subtopic===q.subtopic?1:0];
  const less=(a:number[],b:number[])=>{for(let i=0;i<a.length;i++)if(a[i]!==b[i])return a[i]<b[i];return false;};
  for(let i=1;i<queue.length;i++)if(less(score(queue[i]),score(queue[best])))best=i;
  const q=queue.splice(best,1)[0];result.push(q);used.set(family(q),(used.get(family(q))??0)+1);const context=textContext(q);if(context)usedTexts.set(context,(usedTexts.get(context)??0)+1);
 }
 return {questions:result,available:pool.length,fresh:fresh.length,shortfall:prefs.count-result.length,repeated:result.filter(q=>seen.has(q.id)).length,blockedPrerequisites:bank.filter(q=>eligible.has(q.topic)).length-pool.length,reusedTextQuestions:[...usedTexts.values()].reduce((sum,n)=>sum+n-1,0)};
}
export function saveQuickPreferences(state:StudyState,preferences:QuickPreferences):StudyState {
 const p=state.quickPractice??{schemaVersion:1 as const,preferences,snapshots:{},sessions:[]};return {...state,quickPractice:{...p,preferences:structuredClone(preferences)}};
}
export function startQuick(state:StudyState,preferences:QuickPreferences,questions:Question[],id:string,now=new Date()):StudyState {
 if(!questions.length||questions.length>preferences.count||new Set(questions.map(q=>q.id)).size!==questions.length)throw Error('Неверная подборка');
 let next=saveQuickPreferences(state,preferences),p=next.quickPractice!;
 if(p.sessions.length>=10000)throw Error('История практики достигла технического предела. Сначала сохрани JSON-backup. История не удалена.');
 if(p.sessions.some(s=>s.id===id||!s.completedAt))throw Error('Сначала продолжи или заверши текущую подборку');
 const snapshots={...p.snapshots},seen=encountered(state);
 for(const q of questions){const key=quickKey(q);if(snapshots[key]&&JSON.stringify(snapshots[key])!==JSON.stringify(q))throw Error('Содержание изменено без версии');snapshots[key]??=structuredClone(q);}
 const session:QuickSession={id,preferences:structuredClone(preferences),startedAt:now.toISOString(),index:0,items:questions.map(q=>({key:quickKey(q),answer:'',correct:null,shown:false,repeat:seen.has(q.id),attemptIds:[],...(q.generation?{assisted:false}: {})}))};
 return {...next,quickPractice:{...p,snapshots,sessions:[...p.sessions,session]}};
}
export function editQuick(state:StudyState,id:string,answer?:string,expectedKey?:string):StudyState {
 const p=state.quickPractice;if(!p)return state;
 const active=p.sessions.find(s=>s.id===id&&!s.completedAt);if(!active||expectedKey!==undefined&&active.items[active.index].key!==expectedKey)return state;
 return {...state,quickPractice:{...p,sessions:p.sessions.map(s=>s.id!==id||s.completedAt?s:{...s,items:s.items.map((v,i)=>i!==s.index?v:{...v,shown:true,...(answer!==undefined?{answer}: {})})})}};
}
export function answerQuick(state:StudyState,id:string,answer:string,correct:boolean,attemptId:string,now=new Date(),expectedKey?:string):StudyState {
 const s=state.quickPractice?.sessions.find(s=>s.id===id&&!s.completedAt);if(!s)return state;const item=s.items[s.index];if(expectedKey!==undefined&&item.key!==expectedKey)return state;const q=state.quickPractice!.snapshots[item.key];
 if(item.attemptIds.some(key=>state.training?.find(a=>a.id===key)?.answer===answer))return state;
 const recorded=recordTraining(state,q,answer,correct,attemptId,now),p=recorded.quickPractice!;
 return {...recorded,training:recorded.training?.map(a=>a.id===attemptId?{...a,sessionId:id}:a),quickPractice:{...p,sessions:p.sessions.map(v=>v.id!==id?v:{...v,items:v.items.map((v,i)=>i===s.index?{...v,answer,correct,shown:true,...(q.generation?{assisted:!!v.assisted||!correct,independentCorrect:v.independentCorrect??(!v.attemptIds.length&&!v.assisted&&correct)}:{}),attemptIds:[...v.attemptIds,attemptId]}:v)})}};
}
export function moveQuick(state:StudyState,id:string,index:number,finish=false,now=new Date()):StudyState {
 const p=state.quickPractice;if(!p)return state;return {...state,quickPractice:{...p,sessions:p.sessions.map(s=>s.id!==id||s.completedAt?s:{...s,index:Math.max(0,Math.min(s.items.length-1,index)),...(finish?{completedAt:now.toISOString()}:{})})}};
}
// Import validation is independent of today's catalogue: old pooled snapshots remain usable.
export function validateQuickProgress(raw:unknown,rawTraining:unknown):QuickProgress {
 const fail=()=>{throw Error('Некорректная быстрая практика');};
 const obj=(v:unknown,keys:string[],optional:string[]=[])=>{if(!v||typeof v!=='object'||Array.isArray(v))return fail();const o=v as Record<string,unknown>;if(keys.some(k=>!Object.hasOwn(o,k))||Object.keys(o).some(k=>!keys.includes(k)&&!optional.includes(k)))fail();return o;};
 const id=(v:unknown)=>typeof v==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9_.@-]{0,499}$/.test(v)&&!['__proto__','constructor','prototype'].includes(v);
 const instant=(v:unknown)=>{if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString()!==v)fail();};
 const list=(v:unknown,max=100000):unknown[]=>{if(!Array.isArray(v)||v.length>max)fail();return v as unknown[];};
 const strings=(v:unknown)=>{const a=list(v,1000);if(a.some(v=>!id(v))||new Set(a).size!==a.length)fail();return a;};
 const prefs=(v:unknown)=>{const p=obj(v,['subjects','topics','count','difficulty','unseenFirst','allowRepeats'],['generatedVariants']);if(p.generatedVariants!==undefined&&typeof p.generatedVariants!=='boolean')fail();if(strings(p.subjects).some(v=>!['math','russian','informatics','python'].includes(String(v)))||!list(p.subjects).length)fail();strings(p.topics);if(![10,20,30].includes(Number(p.count))||typeof p.count!=='number'||!['mixed','easy','medium','hard'].includes(String(p.difficulty))||typeof p.unseenFirst!=='boolean'||typeof p.allowRepeats!=='boolean')fail();};
 const p=obj(raw,['schemaVersion','preferences','snapshots','sessions']);if(p.schemaVersion!==1)fail();prefs(p.preferences);
 const snapshots=p.snapshots as Record<string,unknown>;if(!snapshots||typeof snapshots!=='object'||Array.isArray(snapshots)||Object.keys(snapshots).length>100000)fail();for(const [key,v]of Object.entries(snapshots)){const q=validateQuestion(v);if(!id(key)||quickKey(q)!==key)fail();}
 const training=new Map((rawTraining as Attempt[]).map(a=>[a.id,a])),linked=new Set<string>(),sessions=new Set<string>();let active=0;
 for(const raw of list(p.sessions,10000)){const s=obj(raw,['id','preferences','startedAt','index','items'],['completedAt']);if(!id(s.id)||sessions.has(String(s.id)))fail();sessions.add(String(s.id));prefs(s.preferences);instant(s.startedAt);if(s.completedAt!==undefined)instant(s.completedAt);else active++;const items=list(s.items,30),seen=new Set<string>();if(!items.length||items.length>(s.preferences as QuickPreferences).count||!Number.isInteger(s.index)||Number(s.index)<0||Number(s.index)>=items.length)fail();
  for(const raw of items){const i=obj(raw,['key','answer','correct','shown','repeat','attemptIds'],['assisted','independentCorrect']);for(const k of ['assisted','independentCorrect'])if(i[k]!==undefined&&typeof i[k]!=='boolean')fail();if(i.independentCorrect===true&&(!Array.isArray(i.attemptIds)||!i.attemptIds.length||i.correct===null))fail();if(!id(i.key)||!Object.hasOwn(snapshots,String(i.key)))fail();const q=snapshots[String(i.key)] as Question;if(!q||seen.has(q.id)||typeof i.answer!=='string'||i.answer.length>100000||![null,true,false].includes(i.correct as null)||typeof i.shown!=='boolean'||typeof i.repeat!=='boolean')fail();seen.add(q.id);const ids=strings(i.attemptIds);for(const key of ids){const a=training.get(String(key));if(!a||linked.has(String(key))||a.sessionId!==s.id||a.questionId!==q.id||a.questionVersion!==q.version||a.topic!==q.topic||a.subject!==q.subject||a.subtopic!==q.subtopic||JSON.stringify(a.skills??[])!==JSON.stringify(q.skills??[]))fail();linked.add(String(key));}if(i.independentCorrect===true&&(!q.generation||training.get(String(ids[0]))?.correct!==true))fail();if(ids.length){const last=training.get(String(ids.at(-1)))!;if(i.correct!==last.correct||!i.shown)fail();}else if(i.correct!==null)fail();
  }
 }
 if(active>1)fail();for(const a of training.values())if(sessions.has(a.sessionId??'')&&!linked.has(a.id))fail();return raw as QuickProgress;
}

export function markQuickHelp(state:StudyState,id:string,key:string):StudyState {
 const p=state.quickPractice;if(!p)return state;
 return {...state,quickPractice:{...p,sessions:p.sessions.map(s=>s.id!==id||s.completedAt?s:{...s,items:s.items.map(i=>i.key===key?{...i,assisted:true}:i)})}};
}
export function generatorStatistics(state:StudyState){
 const p=state.quickPractice,items=(p?.sessions??[]).flatMap(s=>s.items).filter(i=>p?.snapshots[i.key]?.generation),shown=items.filter(i=>i.shown),solved=items.filter(i=>i.independentCorrect===true);
 const correct=(state.training??[]).filter(a=>a.correct&&a.questionId.startsWith('gen-'));
 return {encountered:new Set(shown.map(i=>p!.snapshots[i.key].id)).size,independentlySolved:new Set(solved.map(i=>p!.snapshots[i.key].id)).size,repeatedAnswers:correct.length-new Set(correct.map(a=>a.questionId)).size};
}
