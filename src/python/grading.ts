import {PythonRunner} from './runner';
import {validatePythonTask,type PythonTask,type PythonTest} from './tasks';
import {matchesPythonActual,type PythonActual} from './assessment';

export function runPythonCheck(code:string,test:PythonTest,functionName?:string,timeout=10000):Promise<PythonActual> {
  return new Promise(resolve=>{
    const actual:PythonActual={stdout:'',stderr:'',ok:false};
    const runner=new PythonRunner(event=>{
      if(event.type==='ready')runner.run({code,stdin:test.stdin??'',interactive:false,timeout,...(functionName?{functionCall:{name:functionName,args:test.args??[]}}:{})});
      else if(event.type==='stdout')actual.stdout+=event.text;
      else if(event.type==='stderr'||event.type==='traceback')actual.stderr+=event.text;
      else if(event.type==='return')actual.value=event.value;
      else if(['done','terminated','load-error'].includes(event.type)){actual.ok=event.type==='done'&&event.ok===true;if(event.text)actual.stderr+=event.text;runner.dispose();resolve(actual);}
    });
    runner.initialize();
  });
}
export async function gradePython(code:string,definition:PythonTask) {
  const task=validatePythonTask(definition),tests=[...(task.visibleTests??[]),...(task.hiddenTests??[])];
  if(!tests.length)tests.push({stdin:task.stdin,expectedOutput:task.expectedOutput,expectedReturn:task.expectedReturn});
  const results=[];
  // Only inputs/function name cross the boundary. No expected outputs, assertions or tests.
  for(const test of tests){const actual=await runPythonCheck(code,test,task.functionName,task.timeout);results.push({passed:matchesPythonActual(actual,test),actual});}
  return results;
}
