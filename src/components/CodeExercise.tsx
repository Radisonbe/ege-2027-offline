import {useEffect,useRef,useState} from 'react';
import type {AttemptContext,Question} from '../domain/types';
import {saveCodeDraft,recordCodeAssessment,codeAssessmentKey} from '../domain/code-learning';
import {useStudy} from '../state/StudyProvider';
import {PythonRunner,type RunnerEvent} from '../python/runner';
import {gradePython,type PythonGrade} from '../python/grading';
import {indent,insertText,newline} from '../python/editor';
import {Button} from './ui';
import {QuestionMetadata} from './QuestionMetadata';
import {CodeExplanation} from './CodeExplanation';
import {PythonOutput} from './PythonOutput';
import {PythonInput,InputHelp} from './PythonInput';
import {pythonMismatch} from '../python/assessment';
import {answerTopicTest} from '../domain/study-flow';

export function CodeExercise({question:q,context='test',onDone,adaptiveSessionId,topicTestSessionId,initial}:{question:Question;context?:AttemptContext;onDone?:(correct:boolean)=>void;adaptiveSessionId?:string;topicTestSessionId?:string;initial?:{answer:string;result:boolean|null}}) {
  const {state,mutate,storageError,saving,replacing}=useStudy(),draft=state.codeDrafts?.[q.id],task=q.python!;
  const [code,setCode]=useState(draft?.code??(initial?.answer||task.starterCode||'')),[stdin,setStdin]=useState(draft?.stdin??task.stdin??''),[stdout,setStdout]=useState(''),[stderr,setStderr]=useState('');
  const [phase,setPhase]=useState('loading'),[generation,setGeneration]=useState(0),[message,setMessage]=useState(''),[results,setResults]=useState<PythonGrade[]>([]),[hints,setHints]=useState(0),[solution,setSolution]=useState(false);
  const [interactive,setInteractive]=useState(false),[useInput,setUseInput]=useState(false),[prompt,setPrompt]=useState(''),[value,setValue]=useState(''),[runKey,setRunKey]=useState(0),[runIncomplete,setRunIncomplete]=useState(false),[checkKey,setCheckKey]=useState(0);
  const runner=useRef<PythonRunner|null>(null),editor=useRef<HTMLTextAreaElement>(null),checking=useRef<AbortController|null>(null),live=useRef(true);
  const busy=['running','checking','input'].includes(phase),testCount=(task.visibleTests?.length??0)+(task.hiddenTests?.length??0);
  useEffect(()=>{live.current=true;const receive=(event:RunnerEvent)=>{
    if(!live.current)return;
    if(event.type==='ready'){setPhase('ready');setInteractive(!!event.interactive);}
    else if(event.type==='stdout')setStdout(t=>t+event.text);
    else if(event.type==='stderr'||event.type==='traceback')setStderr(t=>t+event.text);
    else if(event.type==='input'){setPhase('input');setPrompt(event.prompt??'');setValue('');}
    else if(event.type==='done'){setPhase('ready');setMessage(event.ok?'Запуск завершён. Решение не оценивалось.':'Ошибка Python при запуске. Учебная попытка не записана.');}
    else if(event.type==='terminated'){if(event.text?.includes('вывода'))setRunIncomplete(true);setMessage(event.text??'Остановлено.');setGeneration(n=>n+1);setPhase('loading');}
    else if(event.type==='load-error'){setMessage(event.text??'Не удалось загрузить Python.');setPhase('error');}
  };const r=new PythonRunner(receive);runner.current=r;r.initialize();return()=>{live.current=false;checking.current?.abort();r.dispose();};},[generation]);
  // A progress import changes the saved draft atomically, including an older backup without drafts.
  useEffect(()=>{if(!replacing)return;checking.current?.abort();runner.current?.stop();},[replacing]);
  function update(next:string,input=stdin){setCode(next);setStdin(input);setResults([]);setMessage('');mutate(s=>saveCodeDraft(s,q,next,input));}
  function edit(action:(t:string,s:number,e:number)=>{text:string;start:number;end:number}){const e=editor.current;if(!e)return;const next=action(code,e.selectionStart,e.selectionEnd);update(next.text);requestAnimationFrame(()=>{e.focus();e.setSelectionRange(next.start,next.end);});}
  function run(){setRunIncomplete(false);setRunKey(n=>n+1);setStdout('');setStderr('');setMessage('');setResults([]);setPhase('running');runner.current?.run({code,stdin,interactive:interactive&&useInput,timeout:task.timeout});}
  async function check(){
    const controller=new AbortController();checking.current=controller;runner.current?.dispose();setCheckKey(n=>n+1);setPhase('checking');setResults([]);setMessage('');
    try{
      const checked=await gradePython(code,task,controller.signal,result=>{if(live.current)setResults(old=>[...old,result]);});
      if(!live.current)return;
      const problem=checked.find(r=>r.actual.kind),passed=checked.length===testCount&&checked.every(r=>r.passed);
      if(controller.signal.aborted){setMessage('Проверка остановлена. Учебная попытка не записана.');return;}
      if(problem&&problem.actual.kind!=='runtime'){
        setMessage(problem.actual.kind==='syntax'?'Синтаксис программы требует исправления. Попытка не учитывается.':problem.actual.kind==='timeout'?'Превышен лимит времени. Попытка не учитывается.':'Проверка не завершена. Попытка не учитывается.');return;
      }
      const attemptId=crypto.randomUUID();mutate(s=>topicTestSessionId?answerTopicTest(s,topicTestSessionId,code,passed,attemptId):recordCodeAssessment(s,q,code,passed,context,attemptId,adaptiveSessionId));onDone?.(passed);
      setMessage(passed?'Все тесты пройдены. Решение верное.':context==='practice'?'Пока не все тесты пройдены. Это тренировка: контрольная ошибка не записана. Исправь код или открой подсказку.':'Решение пока не проходит проверку. Исправь код или открой подсказку. Первый самостоятельный результат не меняется от исправления.');
    }catch(e){if(live.current)setMessage('Проверка не завершена: '+String(e instanceof Error?e.message:e));}
    finally{checking.current=null;if(live.current){setPhase('loading');setGeneration(n=>n+1);}}
  }
  const shownHints=q.hints??[q.hint],key=codeAssessmentKey(state,q,context,adaptiveSessionId),scored=state.attempts.filter(a=>a.assessmentKey===key),allowHints=!topicTestSessionId||results.length>0||scored.length>0||initial?.result===true||initial?.result===false;
  const example=task.visibleTests?.[0];
  return <div className="code-exercise"><QuestionMetadata question={q}/>{q.presentation&&<h3>{q.presentation.title}</h3>}<p className="question-prompt">{q.presentation?.statement??q.prompt}</p>
    {example&&<section className="program-examples" aria-label="Пример из условия"><div><h4>{task.functionName?'Пример аргументов':'Пример входа'}</h4><pre>{task.functionName?JSON.stringify(example.args):example.stdin}</pre></div><div><h4>{task.functionName?'Ожидаемый return':'Пример выхода'}</h4><pre>{task.functionName?JSON.stringify(example.expectedReturn):example.expectedOutput}</pre></div><p className="small muted">Это только пример. Проверка использует другие значения. Используй данные программы, не записывай готовый ответ в код.</p></section>}
    {q.presentation&&<p className="small muted">Ограничения: {q.presentation.limits}</p>}
    {allowHints&&(q.presentation?.inputHelp??!task.functionName)&&<InputHelp/>}
    <p className="small muted">{phase==='loading'?'Python загружается…':phase==='error'?'Python не загрузился':phase==='checking'?`Проверка: ${results.length} / ${testCount}`:busy?'Выполняется…':'Python готов'} · Запуск — эксперимент, проверка — учебный результат.</p>
    {draft&&draft.questionVersion!==q.version&&<p className="callout">Условие обновилось. Твой черновик сохранён — сверь его с новой версией задания.</p>}
    <label className="field-label" htmlFor={'code-'+q.id}>Код решения</label><textarea id={'code-'+q.id} ref={editor} className="python-editor" value={code} disabled={busy||!!storageError||replacing} spellCheck={false} autoCorrect="off" autoCapitalize="off" wrap="off" maxLength={100000} onChange={e=>update(e.target.value)} onKeyDown={e=>{if(e.nativeEvent.isComposing)return;if(e.key==='Tab'){e.preventDefault();edit((t,s,end)=>indent(t,s,end,e.shiftKey));}else if(e.key==='Enter'){e.preventDefault();edit(newline);}}}/>
    <div className="python-keys"><Button variant="outline" disabled={busy} onMouseDown={e=>e.preventDefault()} onClick={()=>edit((t,s,e)=>indent(t,s,e))}>Tab · 4 пробела</Button><Button variant="outline" disabled={busy} onMouseDown={e=>e.preventDefault()} onClick={()=>edit((t,s,e)=>indent(t,s,e,true))}>Уменьшить отступ</Button>{[':', '(', ')', '[', ']', '{', '}', '"', "'"].map(k=><Button key={k} variant="outline" disabled={busy} aria-label={'Вставить '+k} onMouseDown={e=>e.preventDefault()} onClick={()=>edit((t,s,e)=>insertText(t,s,e,k))}>{k}</Button>)}</div>
    <PythonInput id={'stdin-'+q.id} value={stdin} onChange={v=>update(code,v)} interactive={interactive} useInput={useInput} onMode={setUseInput} busy={busy}/>
    <p className="small muted">Лимит одного экспериментального запуска: {(task.timeout??10000)/1000} с.</p>
    {task.functionName&&<p className="small muted">Запуск выполняет твой код: чтобы увидеть результат, добавь вызов функции через print(). Проверка сама вызывает {task.functionName} с разными аргументами и сравнивает return.</p>}
    <div className="button-row"><Button disabled={phase!=='ready'||!code.trim()} onClick={run}>Запустить</Button><Button disabled={phase!=='ready'||!code.trim()||!!storageError} onClick={()=>void check()}>Проверить решение</Button><Button variant="outline" disabled={!busy&&phase!=='loading'} onClick={()=>{if(checking.current)checking.current.abort();else runner.current?.stop();}}>Остановить</Button>{phase==='error'&&<Button variant="outline" onClick={()=>{setPhase('loading');setGeneration(n=>n+1);}}>Повторить загрузку</Button>}</div>
    {phase==='input'&&<form onSubmit={e=>{e.preventDefault();runner.current?.input(value);setPhase('running');}}><label htmlFor={'input-'+q.id}>{prompt||'Программа вызывает input()'}</label><input id={'input-'+q.id} value={value} maxLength={8000} onChange={e=>setValue(e.target.value)}/><Button type="submit">Передать ввод</Button></form>}
    <p className="small muted" role="status">{storageError|| (saving?'Сохраняем черновик…':'Черновик задания сохранён локально и входит в JSON-backup.')}</p>
    {message&&<p className="callout" role="status">{message}</p>}{scored.length>0&&<p className="small muted">Учтено в этой попытке: {scored.map(a=>a.correct?'верное решение':'ошибка').join(', ')}.</p>}
    <h3>Вывод · stdout</h3><p className="small muted">Фактический результат последнего «Запустить», без оценки решения.</p><PythonOutput text={stdout} resultId={runKey} incomplete={runIncomplete}/><h3>Ошибки Python</h3><PythonOutput text={stderr} label="Ошибки Python" resultId={runKey} empty="Ошибок нет." error/>
    {results.length>0&&<section aria-label="Результаты тестов"><h3>Проверка решения</h3>{results.map((r,i)=>{const test=task.visibleTests?.[i],failure=r.actual.kind;return <div className="code-test-result" key={i}><b>Тест {i+1}: {r.passed?'пройден':failure==='syntax'?'SyntaxError':failure==='runtime'?'ошибка выполнения':failure==='timeout'?'лимит времени':failure==='stopped'?'остановлен':'неверный результат'}</b>{!r.passed&&<p className="small">{pythonMismatch(r.actual,test,!!task.functionName)}</p>}{test&&<><p className="small">{task.functionName?'Аргументы: '+JSON.stringify(test.args):'Вход теста: '+(test.stdin||'(пустой)')}</p>{!r.passed&&<><p className="small">Ожидалось:</p><pre className="expected-output">{test.expectedOutput??JSON.stringify(test.expectedReturn)}</pre></>}</>}{task.functionName&&!r.passed&&!failure&&<p className="small">Полученный return: {JSON.stringify(r.actual.value)}</p>}<p className="small">Фактический stdout теста {i+1}:</p><PythonOutput text={r.actual.stdout} label={'Вывод теста '+(i+1)} resultId={checkKey+':'+i} incomplete={r.actual.kind==='infrastructure'&&r.actual.stderr.includes('вывода')}/>{r.actual.stderr&&<PythonOutput text={r.actual.stderr} label={'Traceback теста '+(i+1)} resultId={checkKey+':'+i} error/>}</div>;})}</section>}
    {allowHints&&hints<shownHints.length&&<Button variant="ghost" onClick={()=>setHints(n=>n+1)}>{hints?'Более конкретная подсказка':'Показать подсказку'}</Button>}{shownHints.slice(0,hints).map((h,i)=><p className="callout" key={i}>{h}</p>)}
    {allowHints&&<details><summary>Разбор и решение — по запросу</summary><Button variant="ghost" onClick={()=>setSolution(true)}>Показать полное решение</Button>{solution&&<><CodeExplanation text={q.explanation}/><pre className="python-output">{q.solution}</pre></>}</details>}
  </div>;
}
