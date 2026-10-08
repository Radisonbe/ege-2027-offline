import {PythonRunner} from './runner';
import {validatePythonTask,type PythonTask,type PythonTest} from './tasks';
import {matchesPythonActual,type PythonActual} from './assessment';

export function runPythonCheck(code:string,test:PythonTest,functionName?:string,timeout=10000,signal?:AbortSignal):Promise<PythonActual> {
  return new Promise(resolve=>{
    const actual:PythonActual={stdout:'',stderr:'',ok:false};
    if(signal?.aborted){resolve({...actual,kind:'stopped'});return;}
    const abort=()=>runner.stop();
    const runner=new PythonRunner(event=>{
      if(event.type==='ready')runner.run({code,stdin:test.stdin??'',interactive:false,timeout,...(functionName?{functionCall:{name:functionName,args:test.args??[]}}:{})});
      else if(event.type==='stdout')actual.stdout+=event.text;
      else if(event.type==='stderr'||event.type==='traceback')actual.stderr+=event.text;
      else if(event.type==='return')actual.value=event.value;
      else if(['done','terminated','load-error'].includes(event.type)){
        actual.ok=event.type==='done'&&event.ok===true;if(event.text)actual.stderr+=event.text;
        if(!actual.ok)actual.kind=event.type==='load-error'?'infrastructure':event.type==='terminated'?(signal?.aborted?'stopped':event.text?.includes('лимит времени')?'timeout':'infrastructure'):/\b(SyntaxError|IndentationError|TabError):/.test(actual.stderr)?'syntax':'runtime';
        signal?.removeEventListener('abort',abort);runner.dispose();resolve(actual);
      }
    });
    signal?.addEventListener('abort',abort,{once:true});
    runner.initialize();
  });
}
export async function gradePython(code:string,definition:PythonTask,signal?:AbortSignal,onResult?:(result:PythonGrade,index:number)=>void) {
  const task=validatePythonTask(definition),tests=[...(task.visibleTests??[]),...(task.hiddenTests??[])];
  if(!tests.length)tests.push({stdin:task.stdin,expectedOutput:task.expectedOutput,expectedReturn:task.expectedReturn});
  const results:PythonGrade[]=[];
  // Only inputs/function name cross the boundary. No expected outputs, assertions or tests.
  for(let index=0;index<tests.length;index++){
    const actual=await runPythonCheck(code,tests[index],task.functionName,task.timeout,signal),result={passed:matchesPythonActual(actual,tests[index]),actual};results.push(result);onResult?.(result,index);
    if(actual.kind)break;
  }
  return results;
}
export interface PythonGrade {passed:boolean;actual:PythonActual}
