// Runs only inside a sandboxed opaque-origin frame. No application storage is sent here.
let python, busy=false, inputResolve, currentRun, outputSize=0,limited=false;
const send=globalThis.postMessage.bind(globalThis);
const urls=[];
const blob=(bytes,type='text/javascript')=>{const url=URL.createObjectURL(new Blob([bytes],{type}));urls.push(url);return url;};
let inputFunction;
let pending={stdout:'',stderr:''};
function flushOutput(){for(const type of ['stdout','stderr'])if(pending[type]){send({type,run:currentRun,text:pending[type]});pending[type]='';}}
function write(type,decoder,bytes) {
  const text=decoder.decode(bytes,{stream:true});
  outputSize+=text.length;
  if(outputSize>65536){if(!limited){limited=true;send({type:'output-limit',run:currentRun});}throw new Error('Вывод программы превысил 65 536 символов.');}
  pending[type]+=text;
  if(pending[type].length>=2048)flushOutput();
  return bytes.length;
}
async function initialize(payload) {
  const start=performance.now(), source=payload;
  // Supply all binaries already read from our verified offline kit. No HTTP in this context.
  const fetchBlob=globalThis.fetch.bind(globalThis);
  globalThis.fetch=(resource,options)=>String(resource)==='https://pyodide.local.invalid/pyodide.asm.wasm'
    ? Promise.resolve(new Response(source['pyodide.asm.wasm'],{headers:{'Content-Type':'application/wasm'}}))
    : fetchBlob(resource,options);
  const {loadPyodide}=await import(blob(source['pyodide.mjs']));
  const {default:createPyodideModule}=await import(blob(source['pyodide.asm.mjs']));
  python=await loadPyodide({indexURL:'https://pyodide.local.invalid/',stdLibURL:blob(source['python_stdlib.zip'],'application/zip'),lockFileContents:new TextDecoder().decode(source['pyodide-lock.json']),createPyodideModule,jsglobals:Object.create(null),enableRunUntilComplete:false});
  const interactive=typeof WebAssembly.Suspending==='function' && typeof WebAssembly.promising==='function';
  python.registerJsModule('_playground_input',{read:prompt=>new Promise(resolve=>{
    flushOutput();
    inputResolve=resolve;send({type:'input',run:currentRun,prompt:String(prompt).slice(0,2000)});
  })});
  inputFunction=python.runPython(`
def _pg_input(prompt=""):
    from pyodide.ffi import run_sync, jsnull
    from _playground_input import read
    value = run_sync(read(str(prompt)))
    if value is None or value is jsnull:
        raise EOFError("EOF when reading a line")
    return str(value)
_pg_input
`);
  // No network is needed after bootstrap, including attempts to install packages.
  globalThis.fetch=()=>Promise.reject(new Error('Сеть отключена в Python Playground.'));
  send({type:'ready',version:python.runPython('import sys; sys.version.split()[0]'),interactive,ms:performance.now()-start});
}
async function run(message) {
  if(busy||!python)return;
  busy=true;currentRun=message.run;outputSize=0;limited=false;pending={stdout:'',stderr:''};
  const out=new TextDecoder(),err=new TextDecoder();
  python.setStdout({write:bytes=>write('stdout',out,bytes)});
  python.setStderr({write:bytes=>write('stderr',err,bytes)});
  const text=message.stdin.replaceAll('\r\n','\n');
  const lines=text===''?[]:text.split('\n');
  // A final line terminator does not invent an extra empty input line.
  // "\n" is one empty line; "a\n\n" is a followed by one empty line.
  if(text.endsWith('\n'))lines.pop();
  let index=0;
  python.setStdin({stdin:()=>index<lines.length?lines[index++]:null});
  const globals=python.runPython('dict(__name__="__main__")');
  const builtins=python.runPython('import builtins; dict(vars(builtins))');
  if(message.interactive)builtins.set('input',inputFunction);
  globals.set('__builtins__',builtins);
  try {
    const result=await python.runPythonAsync(message.code,{globals,filename:'playground.py',dedent:false});
    result?.destroy?.();
    // Assertions and expected values stay outside this worker. Only actual return values leave it.
    if(message.functionCall) {
      const fn=globals.get(message.functionCall.name);
      if(typeof fn!=='function')throw new Error('Функция '+message.functionCall.name+' не найдена.');
      try {
        const args=python.toPy(message.functionCall.args);
        try {const actual=fn.callKwargs(...Array.from(args),{});const converted=actual===undefined?null:actual?.toJs?actual.toJs({dict_converter:entries=>Object.fromEntries(entries)}):actual;
          send({type:'return',run:currentRun,value:converted});actual?.destroy?.();}
        finally{args.destroy?.();}
      } finally {fn.destroy?.();}
    }
    python.runPython('import sys; sys.stdout.flush(); sys.stderr.flush()');flushOutput();
    send({type:'done',run:currentRun,ok:true});
  }catch(error){
    if(!limited)try{python.runPython('import sys; sys.stdout.flush(); sys.stderr.flush()');}catch{}
    flushOutput();
    send({type:'traceback',run:currentRun,text:String(error.message??error).slice(0,16000)});
    send({type:'done',run:currentRun,ok:false});
  }finally{
    globals.destroy();builtins.destroy();inputResolve=undefined;busy=false;
  }
}
onmessage=async({data})=>{
  if(data.type==='init') {try{await initialize(data.payload);}catch(error){send({type:'load-error',text:String(error.message??error).slice(0,2000)});} }
  else if(data.type==='run'&&typeof data.code==='string'&&data.code.length<=100000&&typeof data.stdin==='string'&&data.stdin.length<=32000)await run(data);
  else if(data.type==='input'&&busy&&inputResolve&&(typeof data.value==='string'||data.value===null)){const resolve=inputResolve;inputResolve=undefined;resolve(data.value);}
};
