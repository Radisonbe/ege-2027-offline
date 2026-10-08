export interface PlaygroundDraft {schemaVersion:1;code:string;stdin:string;updatedAt:string}
export const starterCode='print("Привет, мир")\n';
export function validateDraft(value:unknown):PlaygroundDraft {
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Неверный черновик Python');
  const d=value as Record<string,unknown>;
  if(Object.keys(d).sort().join(',')!=='code,schemaVersion,stdin,updatedAt'||d.schemaVersion!==1||typeof d.code!=='string'||d.code.length>100000||typeof d.stdin!=='string'||d.stdin.length>32000||typeof d.updatedAt!=='string'||!Number.isFinite(Date.parse(d.updatedAt)))throw new Error('Неверный черновик Python');
  return value as PlaygroundDraft;
}
function open():Promise<IDBDatabase> {return new Promise((resolve,reject)=>{const r=indexedDB.open('ege-python-playground',1);r.onupgradeneeded=()=>r.result.createObjectStore('drafts');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export const playgroundStorage={
  async load():Promise<PlaygroundDraft|undefined>{const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('drafts','readonly'),r=tx.objectStore('drafts').get('current');let result:PlaygroundDraft|undefined;r.onsuccess=()=>{try{result=r.result?validateDraft(r.result):undefined;}catch(e){reject(e);}};tx.oncomplete=()=>{db.close();resolve(result);};tx.onerror=()=>{db.close();reject(tx.error);};});},
  async save(draft:PlaygroundDraft){validateDraft(draft);const db=await open();return new Promise<void>((resolve,reject)=>{const tx=db.transaction('drafts','readwrite');tx.objectStore('drafts').put(draft,'current');tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(tx.error);};tx.onabort=()=>{db.close();reject(tx.error??new Error('Черновик не сохранён'));};});}
};
