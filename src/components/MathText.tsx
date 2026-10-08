import {Fragment} from 'react';
import {mathParts} from '../domain/math-text';

export function MathText({children,enabled=true,depth=0}:{children:string|number;enabled?:boolean;depth?:number}) {
  const text=String(children);
  if(!enabled||depth>4)return <>{text}</>;
  return <>{mathParts(text).map((part,i)=>part.kind==='text'?<Fragment key={i}>{part.raw}</Fragment>:part.kind==='fraction'?
    <span key={i} className="math-fraction" data-math-kind="fraction" role="math" aria-label={part.raw}><span className="math-numerator"><MathText depth={depth+1}>{part.numerator}</MathText></span><span className="math-source-separator" aria-hidden="true">{part.separator}</span><span className="math-denominator"><MathText depth={depth+1}>{part.denominator}</MathText></span></span>:part.kind==='power'?
    <span key={i} className="math-power" data-math-kind="power" role="math" aria-label={part.raw}><MathText depth={depth+1}>{part.base}</MathText><sup>{part.exponent}</sup></span>:
    <span key={i} className="math-root" data-math-kind="root" role="math" aria-label={part.raw}><span aria-hidden="true">√</span><span className="math-radicand"><MathText depth={depth+1}>{part.radicand}</MathText></span></span>)}</>;
}
