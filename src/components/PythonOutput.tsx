import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {OUTPUT_PREVIEW_LINES,OUTPUT_PREVIEW_CHARS,outputLines,outputPreview,outputPosition,outputScroll,tracebackSummary,type OutputPosition} from '../domain/output';
import {Button} from './ui';
export function PythonOutput({text,label='Вывод stdout',resultId,empty='Вывода пока нет.',error=false,incomplete=false}:{text:string;label?:string;resultId:string|number;empty?:string;error?:boolean;incomplete?:boolean}){
 const [open,setOpen]=useState(false),positions=useRef(new Map<string|number,OutputPosition>()),count=outputLines(text);
 useEffect(()=>setOpen(false),[resultId]);
 const limit='Выполнение остановлено из-за предела вывода. Сохранена только часть текста, это неполный результат программы.';
 return <div aria-label={error?label:undefined} role={error?'group':undefined}>{incomplete&&<p className="callout" role="status">{limit}</p>}{error&&tracebackSummary(text)&&<p className="python-error-summary">{tracebackSummary(text)}</p>}<pre className={'python-output output-preview'+(error?' python-error':'')} aria-label={error?undefined:label}>{text?outputPreview(text):empty}</pre>{(count>OUTPUT_PREVIEW_LINES||text.length>OUTPUT_PREVIEW_CHARS)&&<div className="button-row"><p className="small muted">Строк: {count}. Предпросмотр: до {OUTPUT_PREVIEW_LINES} строк и {OUTPUT_PREVIEW_CHARS} символов; полный текст доступен ниже.</p><Button variant="outline" onClick={()=>setOpen(true)}>Открыть полный вывод</Button></div>}{open&&createPortal(<FullOutput text={text} label={label} warning={incomplete?limit:undefined} position={positions.current.get(resultId)} save={p=>positions.current.set(resultId,p)} close={()=>setOpen(false)}/>,document.body)}</div>;
}
function FullOutput({text,label,position,save,close,warning}:{text:string;label:string;warning?:string;position?:OutputPosition;save:(p:OutputPosition)=>void;close:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),scroll=useRef<HTMLDivElement>(null),pre=useRef<HTMLPreElement>(null),[copied,setCopied]=useState(''),[line,setLine]=useState(1);
 const callbacks=useRef({save,close});callbacks.current={save,close};const anchor=useRef<OutputPosition>(position??{line:0,fraction:0,left:0}),historyId=useRef(crypto.randomUUID()),byBack=useRef(false);
 function remember(){if(!scroll.current||!pre.current)return;anchor.current=outputPosition(scroll.current.scrollTop,scroll.current.scrollLeft,parseFloat(getComputedStyle(pre.current).lineHeight));callbacks.current.save(anchor.current);setLine(anchor.current.line+1);}
 useEffect(()=>{
  const area=scroll.current!,code=pre.current!,modal=dialog.current!,focus=document.activeElement as HTMLElement|null,y=window.scrollY;
  focus?.blur();const body={position:document.body.style.position,top:document.body.style.top,width:document.body.style.width,overflow:document.body.style.overflow};
  Object.assign(document.body.style,{position:'fixed',top:`-${y}px`,width:'100%',overflow:'hidden'});
  history.pushState({...history.state,egeOutput:historyId.current},'',location.href);modal.showModal();
  const restore=()=>{area.scrollTop=outputScroll(anchor.current,parseFloat(getComputedStyle(code).lineHeight));area.scrollLeft=anchor.current.left;};requestAnimationFrame(restore);
  const resize=new ResizeObserver(restore);resize.observe(area);
  const back=()=>{byBack.current=true;callbacks.current.close();};window.addEventListener('popstate',back);
  const cancel=(e:Event)=>{e.preventDefault();history.back();};modal.addEventListener('cancel',cancel);
  return()=>{callbacks.current.save(anchor.current);resize.disconnect();window.removeEventListener('popstate',back);modal.removeEventListener('cancel',cancel);modal.close();Object.assign(document.body.style,body);window.scrollTo(0,y);focus?.focus({preventScroll:true});if(!byBack.current&&history.state?.egeOutput===historyId.current)history.back();};
 },[]);
 async function copy(){const selected=window.getSelection();const selection=selected?.anchorNode&&dialog.current?.contains(selected.anchorNode)?selected.toString():'';try{await navigator.clipboard.writeText(selection||text);setCopied(selection?'Выделенный фрагмент скопирован.':'Полный вывод скопирован.');}catch{setCopied('Копирование недоступно. Выдели текст и используй меню браузера.');}}
 return <dialog ref={dialog} className="output-viewer" aria-label="Полный вывод Python"><header><strong>{label}</strong><Button variant="outline" onClick={()=>history.back()}>Закрыть вывод</Button></header>{warning&&<p className="small output-view-warning">{warning}</p>}<div className="output-view-tools"><Button variant="ghost" onMouseDown={e=>e.preventDefault()} onClick={()=>void copy()}>Скопировать вывод</Button><Button variant="ghost" onClick={()=>{scroll.current!.scrollTop=0;remember();}}>В начало</Button><Button variant="ghost" onClick={()=>{scroll.current!.scrollTop=scroll.current!.scrollHeight;remember();}}>В конец</Button><span className="small">Строка около {line} / {outputLines(text)}</span><span role="status" className="small">{copied}</span></div><div ref={scroll} className="output-view-scroll" onScroll={remember} tabIndex={0} aria-label="Текст полного вывода"><pre ref={pre}>{text}</pre></div></dialog>;
}
