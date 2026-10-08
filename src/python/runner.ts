import source from './worker.js?raw';
import sandbox from './sandbox.html?raw';

export type RunnerEvent = {type:string;run?:string;text?:string;prompt?:string;version?:string;interactive?:boolean;ms?:number;ok?:boolean;value?:unknown};
export interface RunRequest {code:string;stdin:string;interactive:boolean;timeout?:number;functionCall?:{name:string;args:unknown[]}}
const files=['pyodide.mjs','pyodide.asm.mjs','pyodide.asm.wasm','python_stdlib.zip','pyodide-lock.json'];
let assets:Promise<Record<string,ArrayBuffer>>|undefined;
function runtimeAssets() {
  return assets??=Promise.all(files.map(async file=>{
    const response=await fetch(new URL(import.meta.env.BASE_URL+'python-runtime/314.0.7/'+file,document.baseURI));
    if(!response.ok)throw new Error('Не удалось прочитать локальный Python runtime: '+file);
    return [file,await response.arrayBuffer()] as const;
  })).then(Object.fromEntries).catch(error=>{assets=undefined;throw error;});
}
export class PythonRunner {
  private frame?:HTMLIFrameElement;
  private timer?:number;
  private loadingTimer?:number;
  private active?:string;
  private disposed=false;
  private output=0;
  private remaining=10000;
  private started=0;
  private receive=(event:MessageEvent)=>{
    if(event.source!==this.frame?.contentWindow||!event.data||typeof event.data.type!=='string')return;
    const message=event.data as RunnerEvent;
    if(this.disposed&&message.type!=='stopped')return;
    if(message.type==='frame-ready')void runtimeAssets().then(payload=>{if(!this.disposed)this.post({type:'init',source,payload});}).catch(e=>{if(!this.disposed)this.emit({type:'load-error',text:String(e.message)});});
    else if(message.type==='ready'&&typeof message.version==='string'&&typeof message.interactive==='boolean'){clearTimeout(this.loadingTimer);this.emit(message);}
    else if(message.type==='load-error'){clearTimeout(this.loadingTimer);this.stopTimers();this.emit({type:'load-error',text:String(message.text).slice(0,2000)});}
    else if(message.type==='stopped'){this.frame?.remove();this.frame=undefined;window.removeEventListener('message',this.receive);}
    else if(message.run===this.active){
      if(message.type==='output-limit'){this.stop('Программа превысила предел вывода. Python перезапускается.');return;}
      if(['stdout','stderr','traceback'].includes(message.type)&&typeof message.text==='string'){this.output+=message.text.length;if(this.output>82000){this.stop('Программа превысила предел вывода.');return;}this.emit({type:message.type,run:message.run,text:message.text});}
      else if(message.type==='input'&&typeof message.prompt==='string'){
        this.remaining=Math.max(1,this.remaining-(performance.now()-this.started));clearTimeout(this.timer);
        this.timer=window.setTimeout(()=>this.stop('Истекло время ожидания ввода.'),120000);
        this.emit({type:'input',run:message.run,prompt:message.prompt.slice(0,2000)});
      }
      else if(message.type==='return')this.emit(message);
      else if(message.type==='done'&&typeof message.ok==='boolean'){this.stopTimers();this.active=undefined;this.emit(message);}
    }
  };
  constructor(private emit:(event:RunnerEvent)=>void){}
  initialize() {
    const frame=document.createElement('iframe');frame.hidden=true;frame.title='Изолированный Python runner';frame.setAttribute('sandbox','allow-scripts');
    this.frame=frame;window.addEventListener('message',this.receive);frame.srcdoc=sandbox;document.body.append(frame);
    this.loadingTimer=window.setTimeout(()=>this.stop('Python не успел загрузиться. Можно повторить запуск.'),30000);
  }
  run(request:RunRequest) {
    if(this.disposed||this.active)throw new Error('Python занят');
    if(request.code.length>100000||request.stdin.length>32000)throw new Error('Программа или ввод слишком велики.');
    this.active=crypto.randomUUID();this.output=0;
    this.remaining=Math.max(100,Math.min(request.timeout??10000,30000));this.started=performance.now();
    this.timer=window.setTimeout(()=>this.stop('Достигнут лимит времени выполнения.'),this.remaining);
    this.post({type:'run',run:this.active,...request});
  }
  input(value:string|null) {if(this.active){clearTimeout(this.timer);this.started=performance.now();this.timer=window.setTimeout(()=>this.stop('Достигнут лимит времени выполнения.'),this.remaining);this.post({type:'input',value});}}
  stop(reason='Выполнение остановлено.') {this.disposed=true;this.stopTimers();this.active=undefined;this.post({type:'stop'});this.emit({type:'terminated',text:reason});}
  dispose() {this.disposed=true;this.stopTimers();if(this.frame)this.post({type:'stop'});else window.removeEventListener('message',this.receive);}
  private post(message:unknown){this.frame?.contentWindow?.postMessage(message,'*');}
  private stopTimers(){clearTimeout(this.timer);clearTimeout(this.loadingTimer);}
}
