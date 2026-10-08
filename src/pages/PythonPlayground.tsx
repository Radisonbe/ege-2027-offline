import {useEffect,useRef,useState,type KeyboardEvent} from 'react';
import {Button,Heading,Panel} from '../components/ui';
import {PythonRunner,type RunnerEvent} from '../python/runner';
import {indent,insertText,newline,type Edit} from '../python/editor';
import {playgroundStorage,starterCode} from '../storage/playground';

type Phase='loading'|'ready'|'running'|'input'|'error';
export function PythonPlaygroundPage() {
  const [code,setCode]=useState(starterCode),[stdin,setStdin]=useState(''),[loaded,setLoaded]=useState(false),[saveError,setSaveError]=useState(''),[saved,setSaved]=useState(true);
  const [phase,setPhase]=useState<Phase>('loading'),[version,setVersion]=useState(''),[interactive,setInteractive]=useState(false),[useInput,setUseInput]=useState(true);
  const [stdout,setStdout]=useState(''),[stderr,setStderr]=useState(''),[notice,setNotice]=useState(''),[prompt,setPrompt]=useState(''),[value,setValue]=useState(''),[generation,setGeneration]=useState(0);
  const editor=useRef<HTMLTextAreaElement>(null),runner=useRef<PythonRunner|null>(null),queue=useRef(Promise.resolve()),revision=useRef(0),loadFailed=useRef(false);
  useEffect(()=>{let live=true;void playgroundStorage.load().then(d=>{if(live){if(d){setCode(d.code);setStdin(d.stdin);}setLoaded(true);}}).catch(()=>{loadFailed.current=true;if(live){setSaveError('Сохранённый код не удалось прочитать. Он не перезаписан.');setLoaded(true);}});return()=>{live=false;};},[]);
  useEffect(()=>{
    setPhase('loading');
    const receive=(event:RunnerEvent)=>{
      if(event.type==='ready'){setPhase('ready');setVersion(event.version!);setInteractive(event.interactive!);}
      else if(event.type==='stdout')setStdout(s=>(s+event.text).slice(0,65536));
      else if(event.type==='stderr'||event.type==='traceback')setStderr(s=>(s+(event.type==='traceback'&&s?'\n':'')+event.text).slice(0,82000));
      else if(event.type==='input'){setPhase('input');setPrompt(event.prompt!);setValue('');}
      else if(event.type==='done'){setPhase('ready');setPrompt('');setNotice(event.ok?'Программа завершена.':'Программа завершилась с ошибкой Python.');}
      else if(event.type==='load-error'){setPhase('error');setNotice(event.text!);}
      else if(event.type==='terminated'){setNotice(event.text!);setPrompt('');setGeneration(n=>n+1);}
    };
    const instance=new PythonRunner(receive);runner.current=instance;instance.initialize();
    return()=>{instance.dispose();if(runner.current===instance)runner.current=null;};
  },[generation]);
  function persist(nextCode:string,nextStdin:string){
    if(!loaded||loadFailed.current)return;
    const current=++revision.current;setSaved(false);
    queue.current=queue.current.then(async()=>{try{await playgroundStorage.save({schemaVersion:1,code:nextCode,stdin:nextStdin,updatedAt:new Date().toISOString()});if(current===revision.current){setSaved(true);setSaveError('');}}catch{setSaveError('Не удалось сохранить код на устройстве. Скопируй его перед закрытием.');}});
  }
  useEffect(()=>{const protect=(event:BeforeUnloadEvent)=>{if(!saved){event.preventDefault();event.returnValue='';}};window.addEventListener('beforeunload',protect);return()=>window.removeEventListener('beforeunload',protect);},[saved]);
  function update(nextCode:string,nextStdin=stdin){setCode(nextCode);setStdin(nextStdin);persist(nextCode,nextStdin);}
  function edit(transform:(text:string,start:number,end:number)=>Edit){const area=editor.current;if(!area)return;const result=transform(code,area.selectionStart,area.selectionEnd);update(result.text);requestAnimationFrame(()=>{area.focus();area.setSelectionRange(result.start,result.end);});}
  function keys(event:KeyboardEvent<HTMLTextAreaElement>){if(event.nativeEvent.isComposing)return;if(event.key==='Tab'){event.preventDefault();edit((t,s,e)=>indent(t,s,e,event.shiftKey));}else if(event.key==='Enter'){event.preventDefault();edit(newline);}}
  function run(){setStdout('');setStderr('');setNotice('');setPrompt('');setPhase('running');try{runner.current?.run({code,stdin,interactive:interactive&&useInput});}catch(e){setNotice(String(e instanceof Error?e.message:e));setPhase('ready');}}
  const busy=phase==='running'||phase==='input';
  return <><Heading eyebrow="ПИСАТЬ И ПРОВЕРЯТЬ" title="Python Playground" subtitle="Настоящий Python на этом устройстве — без отправки кода в интернет."/>
    <Panel><div className="section-heading"><h2>Программа</h2><span className="small muted" role="status">{phase==='loading'?'Python загружается…':phase==='error'?'Python не загрузился':busy?phase==='input'?'Ожидает ввод':'Выполняется…':`Python ${version} готов`}</span></div>
      <label className="sr-only" htmlFor="python-code">Код Python</label><textarea ref={editor} id="python-code" className="python-editor" value={code} disabled={!loaded} onChange={e=>update(e.target.value)} onKeyDown={keys} spellCheck={false} autoCapitalize="off" autoCorrect="off" wrap="off" maxLength={100000}/>
      <div className="python-keys" aria-label="Клавиши Python"><Button variant="outline" onMouseDown={e=>e.preventDefault()} onClick={()=>edit((t,s,e)=>indent(t,s,e))}>Tab · 4 пробела</Button><Button variant="outline" onMouseDown={e=>e.preventDefault()} onClick={()=>edit((t,s,e)=>indent(t,s,e,true))}>Уменьшить отступ</Button>{[':', '(', ')', '[', ']', '{', '}', '"', "'"].map(key=><Button key={key} variant="outline" aria-label={'Вставить '+key} onMouseDown={e=>e.preventDefault()} onClick={()=>edit((t,s,e)=>insertText(t,s,e,key))}>{key}</Button>)}</div>
      <p className="small muted">Tab — 4 пробела, Shift+Tab — уменьшить отступ. Enter после «:» добавляет отступ. Каждый запуск начинает программу с новых переменных. Лимит выполнения — 10 секунд; ожидание ввода — до 2 минут.</p>
      <div className="button-row"><Button onClick={run} disabled={phase!=='ready'||!loaded}>Запустить</Button><Button variant="outline" onClick={()=>runner.current?.stop()} disabled={!busy&&phase!=='loading'}>Остановить</Button><Button variant="ghost" onClick={()=>{setStdout('');setStderr('');}}>Очистить вывод</Button>{phase==='error'&&<Button variant="outline" onClick={()=>setGeneration(n=>n+1)}>Повторить загрузку</Button>}</div>
      <details className="python-reset"><summary>Исходный пример</summary><p>Замена текущего кода удалит его из редактора. При необходимости сначала скопируй программу.</p><Button variant="outline" disabled={!loaded||busy} onClick={()=>update(starterCode,'')}>Сбросить пример</Button></details>
      <p className="small muted" role="status">{saveError||(!loaded?'Читаем сохранённый код…':saved?'Код сохранён на этом устройстве.':'Сохраняем код…')}</p>
    </Panel>
    <Panel><h2>Ввод программы</h2>{interactive?<label className="python-input-mode"><input type="checkbox" checked={useInput} onChange={e=>setUseInput(e.target.checked)} disabled={busy}/> Отвечать на input() во время выполнения</label>:<p className="small muted">Этот браузер использует предварительный ввод: добавь строки для input() перед запуском.</p>}
      <label htmlFor="python-stdin" className="small">Предварительный stdin — одна строка на каждый input()</label><textarea id="python-stdin" className="python-stdin" value={stdin} onChange={e=>update(code,e.target.value)} disabled={!loaded||busy} spellCheck={false} maxLength={32000}/>
      {interactive&&useInput&&<p className="small muted">Предварительные строки используются, когда интерактивный ввод выключен.</p>}
      {phase==='input'&&<form className="python-input-request" onSubmit={e=>{e.preventDefault();runner.current?.input(value);setPhase('running');setPrompt('');}}><label htmlFor="python-input">{prompt||'Программа вызывает input()'}</label><input id="python-input" value={value} onChange={e=>setValue(e.target.value)} autoComplete="off" autoCapitalize="off" maxLength={8000} autoFocus/><div className="button-row"><Button type="submit">Передать ввод</Button><Button type="button" variant="outline" onClick={()=>{runner.current?.input(null);setPhase('running');setPrompt('');}}>Завершить ввод (EOF)</Button></div></form>}
    </Panel>
    <Panel><h2>Вывод · stdout</h2><pre className="python-output" aria-label="Вывод stdout">{stdout||'Здесь появится вывод print().'}</pre><h3>Ошибки · stderr / traceback</h3><pre className="python-output python-error" aria-label="Ошибки Python">{stderr||'Ошибок нет.'}</pre>{notice&&<p role="status">{notice}</p>}<p className="small muted">Запуски песочницы не меняют учебную статистику и банк ошибок. JSON-backup прогресса не включает этот черновик Python.</p></Panel>
  </>;
}
