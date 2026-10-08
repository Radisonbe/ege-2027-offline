export type JsonValue=null|boolean|number|string|JsonValue[]|{[key:string]:JsonValue};
export interface PythonTest {args?:JsonValue[];stdin?:string;expectedOutput?:string;expectedReturn?:JsonValue}
export interface PythonTask {
  type:'predict-output'|'write-program'|'complete-code'|'fix-bug'|'write-function';
  starterCode?:string;stdin?:string;expectedOutput?:string;timeout?:number;
  visibleTests?:PythonTest[];hiddenTests?:PythonTest[];functionName?:string;expectedReturn?:JsonValue;
}
export function validatePythonTask(value:unknown):PythonTask {
  const fail=():never=>{throw new Error('Неверная модель задания Python');};
  const object=(v:unknown,allowed:string[])=>{if(!v||typeof v!=='object'||Array.isArray(v))return fail();const r=v as Record<string,unknown>;if(Object.keys(r).some(k=>!allowed.includes(k)))fail();return r;};
  const text=(v:unknown,max=100000)=>{if(typeof v!=='string'||v.length>max)fail();};
  function json(v:unknown,depth=0):void {if(depth>20)fail();if(v===null||typeof v==='boolean'||typeof v==='string')return;if(typeof v==='number'&&Number.isFinite(v))return;if(Array.isArray(v)){if(v.length>1000)fail();v.forEach(x=>json(x,depth+1));return;}if(v&&typeof v==='object'){for(const [key,x] of Object.entries(v)){if(['__proto__','constructor','prototype'].includes(key))fail();json(x,depth+1);}return;}fail();}
  const t=object(value,['type','starterCode','stdin','expectedOutput','timeout','visibleTests','hiddenTests','functionName','expectedReturn']);
  if(!['predict-output','write-program','complete-code','fix-bug','write-function'].includes(String(t.type)))fail();
  for(const key of ['starterCode','stdin','expectedOutput'])if(t[key]!==undefined)text(t[key]);
  if(t.functionName!==undefined&&(!/^[A-Za-z_][A-Za-z_0-9]*$/.test(String(t.functionName))||String(t.functionName).length>100))fail();
  if(t.timeout!==undefined&&(!Number.isInteger(t.timeout)||Number(t.timeout)<100||Number(t.timeout)>30000))fail();
  if(t.expectedReturn!==undefined)json(t.expectedReturn);
  for(const key of ['visibleTests','hiddenTests'])if(t[key]!==undefined){if(!Array.isArray(t[key])||t[key].length>100)fail();for(const test of t[key] as unknown[]){const c=object(test,['args','stdin','expectedOutput','expectedReturn']);if(c.args!==undefined){if(!Array.isArray(c.args)||c.args.length>30)fail();json(c.args);}if(c.stdin!==undefined)text(c.stdin,32000);if(c.expectedOutput!==undefined)text(c.expectedOutput,65536);if(c.expectedReturn!==undefined)json(c.expectedReturn);}}
  return value as PythonTask;
}
