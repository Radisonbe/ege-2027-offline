export const OUTPUT_PREVIEW_LINES=15;
export const OUTPUT_PREVIEW_CHARS=3000;
export function outputLines(text:string):number{return text?text.split('\n').length-(text.endsWith('\n')?1:0):0;}
export function outputPreview(text:string):string {const lines=text.split('\n');return (lines.length<=OUTPUT_PREVIEW_LINES?text:lines.slice(0,OUTPUT_PREVIEW_LINES).join('\n')+'\n').slice(0,OUTPUT_PREVIEW_CHARS);}
export interface OutputPosition {line:number;fraction:number;left:number}
export function outputPosition(top:number,left:number,lineHeight:number):OutputPosition {const rows=top/Math.max(1,lineHeight);return {line:Math.floor(rows),fraction:rows-Math.floor(rows),left};}
export function outputScroll(position:OutputPosition,lineHeight:number):number{return (position.line+position.fraction)*Math.max(1,lineHeight);}
export function tracebackSummary(text:string):string {const lines=text.split('\n').map(line=>line.trim());const kind=lines.filter(line=>/^(?:[\w.]+(?:Error|Exception)|KeyboardInterrupt|SystemExit)(?::|$)/.test(line)).at(-1);const location=lines.filter(line=>/^File "[^\"]*(?:playground|solution)[^\"]*", line \d+/.test(line)).at(-1);return [kind,location].filter(Boolean).join(' · ').slice(0,1000);}
