import type {Question,Attempt} from './types.ts';

// An opt-in tag inside an already persisted session ID avoids adding backup or
// IndexedDB fields. Existing sessions keep their original source order.
export const CHOICE_ORDER_PREFIX='choice-order-v1-';
export const newChoiceSessionId=()=>CHOICE_ORDER_PREFIX+crypto.randomUUID();
export const sessionChoiceSeed=(id?:string)=>id?.startsWith(CHOICE_ORDER_PREFIX)?id:undefined;
// Ordinary quizzes previously had no saved session object. Keep the seed in
// the existing unique attempt ID, without changing evidence grouping by date.
export const newChoiceAttemptId=(seed?:string)=>seed?seed+'.'+crypto.randomUUID():crypto.randomUUID();
export function attemptChoiceSeed(a?:Attempt):string|undefined {
 if(!a)return;
 const session=sessionChoiceSeed(a.sessionId);if(session)return session;
 const parts=a.id.split('.');return parts.length===2&&parts[0].startsWith(CHOICE_ORDER_PREFIX)?parts[0]:undefined;
}

function reviews(q:Question,text:string):string[]|undefined {
 const lines=text.split('\n');
 if(!q.options||lines.length!==q.options.length)return;
 const rows=q.options.map((option,i)=>{const prefix=`${i+1}. «${option}»: `;return lines[i].startsWith(prefix)?lines[i].slice(prefix.length):undefined;});
 return rows.every(row=>row!==undefined)?rows as string[]:undefined;
}
export const supportsChoiceOrdering=(q:Question)=>q.subject==='russian'&&q.id.startsWith('chat500-russian-')&&['choice','multiple-choice'].includes(q.answerType)&&!!reviews(q,q.explanation)&&!!reviews(q,q.solution);
export function choicePresentation(q:Question,seed?:string){
 const options=[...q.options??[]],explanation=reviews(q,q.explanation),solution=reviews(q,q.solution);
 // Limit this correction to the reviewed author questions with complete,
 // text-identified option analyses. Unstructured positional explanations stay exact.
 if(!seed||!supportsChoiceOrdering(q)||!explanation||!solution)
  return {options,explanation:q.explanation,solution:q.solution};
 let h=2166136261;for(const c of seed+'|'+q.id+'@'+q.version)h=Math.imul(h^c.charCodeAt(0),16777619);
 const random=()=>{h+=0x6D2B79F5;let t=h;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};
 const indices=options.map((_,i)=>i);
 for(let i=indices.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[indices[i],indices[j]]=[indices[j],indices[i]];}
 const format=(rows:string[])=>indices.map((original,i)=>`${i+1}. «${options[original]}»: ${rows[original]}`).join('\n');
 return {options:indices.map(i=>options[i]),explanation:format(explanation),solution:format(solution)};
}
