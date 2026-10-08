import type {AttemptContext,Question,StudyState,CodeDraft} from './types.ts';
import {localDate,recordAttempt} from './progress.ts';
import {answerReview} from './adaptive.ts';

export function saveCodeDraft(state:StudyState,question:Question,code:string,stdin:string,now=new Date()):StudyState {
  const draft:CodeDraft={schemaVersion:1,questionVersion:question.version,code,stdin,updatedAt:now.toISOString()};
  return {...state,codeDrafts:{...state.codeDrafts,[question.id]:draft}};
}
export function resumeCodeDraftIndex(state:StudyState,questions:Question[]):number {
  const drafts=questions.map((q,index)=>({index,at:state.codeDrafts?.[q.id]?.updatedAt??''})).filter(d=>d.at);
  return drafts.sort((a,b)=>b.at.localeCompare(a.at)||a.index-b.index)[0]?.index??0;
}
export function codeAssessmentKey(state:StudyState,q:Question,context:AttemptContext,sessionId?:string,now=new Date()) {
  return sessionId?`code:${sessionId}:${state.adaptive.sessions.find(s=>s.id===sessionId)?.index}`:`code:${q.id}:${context}:${localDate(now)}`;
}
// One error and one subsequent success per question/day/context or adaptive slot.
// Re-running/editing the same exercise cannot produce dozens of scored errors.
export function recordCodeAssessment(state:StudyState,q:Question,code:string,correct:boolean,context:AttemptContext,id:string,sessionId?:string,now=new Date()):StudyState {
  const key=codeAssessmentKey(state,q,context,sessionId,now),prior=state.attempts.filter(a=>a.assessmentKey===key);
  if(prior.some(a=>a.correct)||(!correct&&prior.some(a=>!a.correct)))return state;
  const next=sessionId?answerReview(state,sessionId,code,correct,id,now):recordAttempt(state,q,code,correct,context,id,now);
  return {...next,attempts:next.attempts.map(a=>a.id===id?{...a,assessmentKey:key}:a)};
}
