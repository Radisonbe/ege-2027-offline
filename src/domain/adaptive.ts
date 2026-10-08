import type { AdaptiveItem, AdaptiveSession, Attempt, Question, QuestionExposure, Skill, StudyState, SubjectId } from './types';
import { addDays, localDate, recordAttempt, reviewIntervals } from './progress.ts';

export type ReviewSize = 5 | 10 | 15 | 20;
export interface ReviewFilter { subject?: SubjectId | 'all'; topic?: string; difficulty?: Question['difficulty']; origin?: Question['origin'] }
const calendar = (value: string) => value.length === 10 ? value : localDate(new Date(value));
const days = (a: string, b: string) => Math.max(0, Math.floor((Date.parse(calendar(a)+'T12:00:00Z') - Date.parse(calendar(b)+'T12:00:00Z')) / 86400000));
const ordered = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
export function studied(state: StudyState, topic: string): boolean {
  const progress = state.topics[topic];
  return progress ? progress.status !== 'Не изучено' : state.attempts.some(a => a.topic === topic);
}
// Retries/repeated slots of the same question in one session are one piece of evidence.
// Stage 2 has no show log: same-question same-day attempts are grouped conservatively.
export function evidence(attempts: Attempt[]): Attempt[] {
  const seen = new Set<string>();
  return [...attempts].sort((a,b)=>a.at.localeCompare(b.at)||ordered(a.id,b.id)).filter(a=>{
    const key=a.questionId+':'+(a.sessionId??a.date);
    if(seen.has(key))return false;seen.add(key);return true;
  }).slice(-12);
}
export function weakEvidence(attempts: Attempt[]) {
  const observations=evidence(attempts), wrong=observations.filter(a=>!a.correct).length;
  return { attempts:observations.length, wrong, weak:wrong>=2 && wrong/observations.length>=.4 };
}
interface ReviewIndex { questions: Map<string,Attempt[]>; topics: Map<string,Attempt[]>; skills: Map<string,Attempt[]>; exposures: Map<string,QuestionExposure[]>; firstActivity: Map<string,string>; definitions: Map<string,Skill>; dependents: Map<string,string[]> }
function reviewIndex(state: StudyState, bank: Question[], definitions: Skill[]): ReviewIndex {
  const index:ReviewIndex={questions:new Map(),topics:new Map(),skills:new Map(),exposures:new Map(),firstActivity:new Map(),definitions:new Map(definitions.map(s=>[s.id,s])),dependents:new Map()};
  const bankMap=new Map(bank.map(q=>[q.id,q]));
  const append=<T,>(map:Map<string,T[]>,key:string,value:T)=>{const values=map.get(key)??[];values.push(value);map.set(key,values);};
  for(const attempt of state.attempts){append(index.questions,attempt.questionId,attempt);append(index.topics,attempt.topic,attempt);for(const skill of new Set(attempt.skills?.length?attempt.skills:bankMap.get(attempt.questionId)?.skills??[]))append(index.skills,skill,attempt);}
  for(const error of state.errors.filter(e=>!e.attemptId&&e.status==='не понял')) {
    const questionId=error.questionId??error.question?.id??'bank-error:'+error.id;
    if(state.attempts.some(a=>a.questionId===questionId&&a.date===error.date&&!a.correct&&a.answer===error.wrong))continue;
    const question=bankMap.get(questionId),skills=error.question?.skills?.length?error.question.skills:question?.skills??[];
    const observation:Attempt={id:'bank-error:'+error.id,questionId,questionVersion:error.question?.version??1,topic:error.topic,answer:error.wrong,correct:false,date:error.date,at:error.date+'T12:00:00.000Z',context:'error',skills,subject:question?.subject??error.question?.subject??bank.find(q=>q.topic===error.topic)?.subject};
    append(index.topics,error.topic,observation);for(const skill of new Set(skills))append(index.skills,skill,observation);
    if(question)append(index.questions,questionId,observation);
  }
  for(const exposure of state.adaptive.exposures)append(index.exposures,exposure.questionId,exposure);
  for(const activity of state.activity){const before=index.firstActivity.get(activity.topic);if(!before||activity.date<before)index.firstActivity.set(activity.topic,activity.date);}
  for(const skill of definitions)for(const dependency of skill.requires)append(index.dependents,dependency,skill.id);
  return index;
}
function historyForSkill(state: StudyState, skill: string, bank: Question[], index?: ReviewIndex) {
  if(index)return index.skills.get(skill)??[];
  const map=new Map(bank.map(q=>[q.id,q]));
  return state.attempts.filter(a=>(a.skills?.length?a.skills:map.get(a.questionId)?.skills??[]).includes(skill));
}
export function questionPriority(question: Question, state: StudyState, bank: Question[], skills: Skill[], now = new Date(), index=reviewIndex(state,bank,skills)) {
  const today=localDate(now), qHistory=index.questions.get(question.id)??[], topicHistory=index.topics.get(question.topic)??[];
  const latest=[...qHistory].sort((a,b)=>b.at.localeCompare(a.at))[0];
  const skillHistory=question.skills?.flatMap(skill=>historyForSkill(state,skill,bank,index))??qHistory;
  const observations=evidence([...new Map(skillHistory.map(a=>[a.id,a])).values()]);
  const confidence=observations.length?(observations.filter(a=>a.correct).length+1)/(observations.length+2):state.topics[question.topic]?.status==='Уверенно'?.8:.5;
  const shows=index.exposures.get(question.id)??[];
  const last=[...shows.map(e=>e.at),...qHistory.map(a=>a.at)].sort().at(-1);
  const recentShows=shows.filter(e=>days(today,e.at)<=7).length || new Set(qHistory.filter(a=>days(today,a.date)<=7).map(a=>a.date)).size;
  const reasons: AdaptiveItem['reasons']=[];
  const add=(code:string,points:number,label:string)=>{if(points)reasons.push({code,points,label});};
  const lastWrong=[...qHistory].filter(a=>!a.correct).sort((a,b)=>b.at.localeCompare(a.at))[0];
  add('question-error',lastWrong&&latest?.correct===false?(days(today,lastWrong.date)<=7?28:10):0,'Недавняя ошибка в этом задании');
  const topicWrong=topicHistory.filter(a=>!a.correct&&days(today,a.date)<=7);
  add('topic-errors',Math.min(18,weakEvidence(topicWrong).wrong*9),'Ошибки в теме за последние 7 дней');
  add('spacing',last?Math.min(30,days(today,last)):12,last?'Давно не показывалось':'Ещё не показывалось в изученной теме');
  const due=state.reviews['topic:'+question.topic]?.due;
  add('due',due&&due<=today?10+Math.min(10,days(today,due)):0,'Подошёл срок повторения темы');
  const status=state.topics[question.topic]?.status;
  add('status',status==='Нужна практика'?22:status==='Повторить'?20:status==='Изучаю'?8:4,'Текущая уверенность: '+(status??'Изучаю'));
  const first=index.firstActivity.get(question.topic);
  add('recent-learning',first&&days(today,first)<=7?8:0,'Тема изучена недавно');
  add('confidence',Math.round((1-confidence)*10),'Уверенность по независимым попыткам');
  const fit=question.difficulty==='easy'?confidence<.65:question.difficulty==='medium'?confidence>=.35&&confidence<.85:question.difficulty==='hard'?confidence>=.7:true;
  add('difficulty',fit?8:-8,'Соответствие сложности текущей уверенности');
  const skillMap=index.definitions;
  const remediation=(question.skills??[]).some(id=>{
    const direct=skillMap.get(id)?.remediates??[];
    const dependents=index.dependents.get(id)??[];
    return [...direct,...dependents].some(target=>weakEvidence(historyForSkill(state,target,bank,index)).weak);
  });
  add('basics',remediation?12:0,'Базовый навык для шага с повторными ошибками');
  const required=[...question.requires,...(question.skills??[]).flatMap(id=>skillMap.get(id)?.requires??[])];
  const weakPrerequisite=required.some(id=>skillMap.has(id)&&weakEvidence(historyForSkill(state,id,bank,index)).weak);
  add('prerequisite',weakPrerequisite?-12:0,'Сначала полезно закрепить базовый навык');
  add('shown-today',last&&days(today,last)===0?-30:0,'Уже показывалось сегодня');
  add('frequency',-Math.min(4,recentShows)*12,'Частота показов за 7 дней');
  return {score:reasons.reduce((sum,r)=>sum+r.points,0),reasons,confidence};
}
export function selectReview(state: StudyState, bank: Question[], skills: Skill[], size: ReviewSize=15, filter: ReviewFilter={}, now=new Date()) {
  const index=reviewIndex(state,bank,skills), skillMap=index.definitions, available=new Map<string,boolean>(),attemptedTopics=new Set(state.attempts.map(a=>a.topic));
  const learned=(topic:string)=>state.topics[topic]?state.topics[topic].status!=='Не изучено':attemptedTopics.has(topic);
  function prerequisite(id:string,visiting=new Set<string>()):boolean {
    if(available.has(id))return available.get(id)!;
    if(visiting.has(id))return false;
    const skill=skillMap.get(id);visiting.add(id);
    const result=skill?learned(skill.topic)&&skill.requires.every(required=>prerequisite(required,new Set(visiting))):learned(id);
    available.set(id,result);return result;
  }
  const eligible=bank.filter(q=>q.origin!=='private-import'&&studied(state,q.topic)
    &&(!filter.subject||filter.subject==='all'||q.subject===filter.subject)&&(!filter.topic||q.topic===filter.topic)
    &&(!filter.difficulty||q.difficulty===filter.difficulty)&&(!filter.origin||q.origin===filter.origin)
    &&[...q.requires,...(q.skills??[]).flatMap(id=>skillMap.get(id)?.requires??[])].every(id=>prerequisite(id)));
  const candidates=eligible.map(q=>({question:q,...questionPriority(q,state,bank,skills,now,index)}));
  const items:AdaptiveItem[]=[], appearances=new Map<string,number>(), topicCounts=new Map<string,number>(), skillCounts=new Map<string,number>(), subCounts=new Map<string,number>();
  for(let index=0;index<Math.min(size,candidates.length);index++) {
    const last=items.at(-1)?.question;
    const ranked=candidates.map(candidate=>{
      const q=candidate.question, qs=q.skills??[], reasons=[...candidate.reasons];
      const points=-(appearances.get(q.id)??0)*80-(topicCounts.get(q.topic)??0)*12-qs.reduce((sum,id)=>sum+(skillCounts.get(id)??0)*18,0)-(subCounts.get(q.subtopic??'')??0)*8
        -(last?.id===q.id?100:0)-(last?.topic===q.topic?12:0)-(qs.some(id=>last?.skills?.includes(id))?35:0);
      if(points)reasons.push({code:'diversity',points,label:'Разнообразие текущего занятия: тема, подтема, навык и повторы'});
      return {...candidate,score:candidate.score+points,reasons};
    }).sort((a,b)=>b.score-a.score||ordered(a.question.id,b.question.id));
    // New sessions use distinct IDs. Legacy sessions with repeated slots still load.
    const unused=ranked.filter(r=>!appearances.has(r.question.id));
    const chosen=unused[0]??ranked[0], q=chosen.question;
    items.push({question:q,score:chosen.score,reasons:chosen.reasons,firstCorrect:null,correct:null,attemptIds:[]});
    appearances.set(q.id,(appearances.get(q.id)??0)+1);topicCounts.set(q.topic,(topicCounts.get(q.topic)??0)+1);
    subCounts.set(q.subtopic??'',(subCounts.get(q.subtopic??'')??0)+1);for(const skill of q.skills??[])skillCounts.set(skill,(skillCounts.get(skill)??0)+1);
  }
  return {items,available:eligible.length,repeated:items.length-new Set(items.map(i=>i.question.id)).size};
}
export function beginReview(state:StudyState, items:AdaptiveItem[], requested:ReviewSize, subject:SubjectId|'all',id:string,now=new Date()):StudyState {
  if(!items.length||items.length>requested||new Set(items.map(i=>i.question.id)).size!==items.length||state.adaptive.sessions.some(s=>s.id===id))throw new Error('Невозможно создать подборку');
  const session:AdaptiveSession={id,requested,subject,startedAt:now.toISOString(),index:0,items};
  return {...state,adaptive:{...state.adaptive,sessions:[...state.adaptive.sessions,session]}};
}
export function showReviewQuestion(state:StudyState, sessionId:string,now=new Date()):StudyState {
  const session=state.adaptive.sessions.find(s=>s.id===sessionId);if(!session||session.completedAt)return state;
  const item=session.items[session.index];if(item.shownAt)return state;
  const at=now.toISOString(),id=sessionId+':'+session.index;
  return {...state,adaptive:{sessions:state.adaptive.sessions.map(s=>s.id===sessionId?{...s,items:s.items.map((i,index)=>index===s.index?{...i,shownAt:at}:i)}:s),exposures:[...state.adaptive.exposures,{id,sessionId,index:session.index,questionId:item.question.id,topic:item.question.topic,skills:item.question.skills??[],at}]}};
}
export function answerReview(state:StudyState,sessionId:string,answer:string,correct:boolean,id:string,now=new Date()):StudyState {
  const session=state.adaptive.sessions.find(s=>s.id===sessionId);if(!session||session.completedAt)throw new Error('Занятие недоступно');
  const shown=showReviewQuestion(state,sessionId,now),item=shown.adaptive.sessions.find(s=>s.id===sessionId)!.items[session.index];
  const next=recordAttempt(shown,item.question,answer,correct,'adaptive',id,now,sessionId);
  return {...next,adaptive:{...next.adaptive,sessions:next.adaptive.sessions.map(s=>s.id===sessionId?{...s,items:s.items.map((i,index)=>index===s.index?{...i,firstCorrect:i.firstCorrect??correct,correct,attemptIds:[...i.attemptIds,id]}:i)}:s)}};
}
export function advanceReview(state:StudyState,sessionId:string,now=new Date()):StudyState {
  const session=state.adaptive.sessions.find(s=>s.id===sessionId);
  if(!session||session.completedAt||session.items[session.index].correct===null)return state;
  const finished=session.index===session.items.length-1,reviews={...state.reviews},today=localDate(now);
  if(finished)for(const topic of new Set(session.items.map(i=>i.question.topic))) {
    const key='topic:'+topic,review=reviews[key];
    if(review&&review.due<=today&&review.last!==today&&session.items.filter(i=>i.question.topic===topic).every(i=>i.firstCorrect===true)) {
      const stage=Math.min(review.stage+1,4);reviews[key]={...review,stage,last:today,due:addDays(reviewIntervals[stage],today)};
    }
  }
  return {...state,reviews,adaptive:{...state.adaptive,sessions:state.adaptive.sessions.map(s=>s.id!==sessionId?s:finished?{...s,completedAt:now.toISOString()}:{...s,index:s.index+1})}};
}
export function reviewSummary(session:AdaptiveSession,state:StudyState,bank:Question[]) {
  const index=reviewIndex(state,bank,[]);
  const groups=(kind:'subject'|'topic'|'skill')=>{
    const result=new Map<string,{id:string;correct:number;total:number;wrong:number;persistent:boolean}>();
    for(const item of session.items) {
      if(item.firstCorrect===null)continue;
      const keys=kind==='skill'?item.question.skills??[]:[item.question[kind]];
      for(const id of keys){const row=result.get(id)??{id,correct:0,total:0,wrong:0,persistent:false};row.total++;if(item.firstCorrect)row.correct++;else row.wrong++;result.set(id,row);}
    }
    for(const row of result.values()) {
      const history=kind==='skill'?historyForSkill(state,row.id,bank,index):kind==='topic'?index.topics.get(row.id)??[]:[...index.topics.values()].flat().filter(a=>(a.subject??bank.find(q=>q.id===a.questionId)?.subject)===row.id);
      row.persistent=weakEvidence(history).weak;
    }
    return [...result.values()];
  };
  return {correct:session.items.filter(i=>i.firstCorrect===true).length,total:session.items.length,corrected:session.items.filter(i=>i.firstCorrect===false&&i.correct===true).length,subjects:groups('subject'),topics:groups('topic'),skills:groups('skill')};
}
