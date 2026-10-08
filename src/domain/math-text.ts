// A deliberately small display grammar for existing lesson text, not an evaluator.
export type MathPart = {kind:'text';raw:string} | {kind:'fraction';raw:string;numerator:string;denominator:string;separator:string} | {kind:'power';raw:string;base:string;exponent:string} | {kind:'root';raw:string;radicand:string};
const superscripts='⁰¹²³⁴⁵⁶⁷⁸⁹ⁿᵐ';
const atom='(?:[−-]?\\d+(?:[.,]\\d+)?|[A-Za-zα-ωΑ-Ω])';
const group='\\([\\dA-Za-zα-ωΑ-Ω \\t.,+−*/·×÷^⁰¹²³⁴⁵⁶⁷⁸⁹ⁿᵐ-]{1,48}\\)';
const base=`(?:${group}|${atom})`;
const exponent=`(?:\\^[−-]?(?:\\d+|[nm])|[${superscripts}]+)`;
const term=`${base}(?:${exponent})?`;
const fraction=new RegExp(`^(${term})([ \\t]*/[ \\t]*)(${term})$`,'u');
const power=new RegExp(`^(${base})(${exponent})$`,'u');
const candidate=new RegExp(`${term}[ \\t]*/[ \\t]*${term}|${base}${exponent}|√${term}`,'gu');
const boundary=/[\p{L}\p{N}_/\\^⁰¹²³⁴⁵⁶⁷⁸⁹ⁿᵐ]/u;
export function isCodeText(text:string):boolean {
  return /(^|\n)\s*(?:def\s|class\s|from\s|import\s|for\s.+\bin\b|while\s|if\s.+:|elif\s|else:|return\b|print\s*\()/.test(text);
}
export function plainExponent(value:string):string {
  if(value.startsWith('^'))return value.slice(1);
  return [...value].map(c=>'0123456789nm'[superscripts.indexOf(c)]??c).join('');
}
export function mathParts(text:string):MathPart[] {
  if(isCodeText(text))return [{kind:'text',raw:text}];
  const parts:MathPart[]=[];let start=0;
  // A fresh expression per call prevents leaking RegExp.lastIndex across renders.
  for(const match of text.matchAll(new RegExp(candidate.source,'gu'))){
    const at=match.index,raw=match[0],end=at+raw.length;
    if((at&&boundary.test(text[at-1]))||(end<text.length&&boundary.test(text[end])))continue;
    if(at>start)parts.push({kind:'text',raw:text.slice(start,at)});
    const f=fraction.exec(raw),p=power.exec(raw);
    if(f)parts.push({kind:'fraction',raw,numerator:f[1],separator:f[2],denominator:f[3]});
    else if(p)parts.push({kind:'power',raw,base:p[1],exponent:plainExponent(p[2])});
    else parts.push({kind:'root',raw,radicand:raw.slice(1)});
    start=end;
  }
  if(start<text.length)parts.push({kind:'text',raw:text.slice(start)});
  return parts.length?parts:[{kind:'text',raw:text}];
}
