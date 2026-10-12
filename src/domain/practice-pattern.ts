import type {Question} from './types.ts';
// Presentation variety within one method, never a new skill/mastery identity.
export function practicePattern(q:Question):string|undefined {
 if(q.subject!=='russian'||!/^chat500-russian-1(?:0[6-9]|1[0-4])$/.test(q.id))return;
 const n=Number(q.id.slice(-3));
 if(n===107)return 'gerund-single';
 if(q.version>=4){if(n===108)return 'gerund-end';if(n===109)return 'gerund-middle';if(n===111)return 'gerund-homogeneous';}
 return 'gerund-initial';
}
