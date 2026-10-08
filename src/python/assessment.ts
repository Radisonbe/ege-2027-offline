import type {PythonTest} from './tasks.ts';
export interface PythonActual {stdout:string;stderr:string;value?:unknown;ok:boolean}
function equal(a:unknown,b:unknown):boolean {
  if(a===b)return true;
  if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;
  const keys=Object.keys(a).sort(),other=Object.keys(b).sort();
  return keys.length===other.length&&keys.every((key,i)=>key===other[i]&&equal((a as Record<string,unknown>)[key],(b as Record<string,unknown>)[key]));
}
export function matchesPythonActual(actual:PythonActual,test:PythonTest) {
  const canonical=(text:string)=>text.replaceAll('\r\n','\n').replace(/\n$/,'');
  return actual.ok&&(test.expectedOutput===undefined||canonical(actual.stdout)===canonical(test.expectedOutput))
    &&(test.expectedReturn===undefined||equal(actual.value,test.expectedReturn));
}
