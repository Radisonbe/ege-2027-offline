export interface Edit {text:string;start:number;end:number}
export function insertText(text:string,start:number,end:number,value:string):Edit {
  return {text:text.slice(0,start)+value+text.slice(end),start:start+value.length,end:start+value.length};
}
export function indent(text:string,start:number,end:number,remove=false):Edit {
  if(start===end&&!remove)return insertText(text,start,end,'    ');
  const first=text.lastIndexOf('\n',start-1)+1,last=end>start&&text[end-1]==='\n'?end-1:end;
  const boundary=text.indexOf('\n',last),finish=boundary===-1?text.length:boundary;
  let delta=0,firstDelta=0;
  const lines=text.slice(first,finish).split('\n').map((line,index)=>{
    const n=remove?-Math.min(4,line.match(/^ */)![0].length):4;
    if(index===0)firstDelta=n;delta+=n;return remove?line.slice(-n):'    '+line;
  });
  return {text:text.slice(0,first)+lines.join('\n')+text.slice(finish),start:Math.max(first,start+firstDelta),end:Math.max(first,end+delta)};
}
export function newline(text:string,start:number,end:number):Edit {
  const current=text.slice(text.lastIndexOf('\n',start-1)+1,start),space=current.match(/^ */)![0];
  return insertText(text,start,end,'\n'+space+(current.trimEnd().endsWith(':')?'    ':''));
}
