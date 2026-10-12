import type {Question} from './types.ts';

// Reviewed groups in the imported author pack: three full-text questions and
// one question quoting its first two sentences. This is catalogue metadata,
// not a field of a saved Question; old snapshots and backup schemas stay exact.
export const authorTextGroups=Array.from({length:15},(_,group)=>
 Array.from({length:4},(_,offset)=>'chat500-russian-'+String(group*4+offset+1).padStart(3,'0')));
const contexts=new Map(authorTextGroups.flatMap((ids,index)=>ids.map(id=>[id,'chat500-text-'+(index+1)] as const)));
export const textContext=(q:Question):string|undefined=>q.subject==='russian'?contexts.get(q.id):undefined;
