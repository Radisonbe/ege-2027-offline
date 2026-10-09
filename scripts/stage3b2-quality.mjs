// Independent verification of authored answers, not the content-authoring script.
import fs from 'node:fs';import assert from 'node:assert/strict';
import {checkContentBank} from './content-bank.mjs';import {checkAnswer,parseNumber} from '../src/domain/answers.ts';
export function compute(c){
 switch(c.kind){
 case 'expression': {assert.match(c.expression,/^[0-9A-Za-z_\s()+*/%.,"!<>=&|?:-]+$/);for(const token of c.expression.match(/[A-Za-z_][A-Za-z0-9_]*/g)??[])assert.ok(['Math','floor','ceil','sqrt','log2','parseInt'].includes(token));return Function('return ('+c.expression+')')();}
 case 'constant':return c.value;
 case 'rational':return c.numerator/c.denominator;
 case 'square-negative':return c.rhs<0?0:c.rhs===0?1:2;
 case 'urn-one':return c.favourable/(c.favourable+c.other);
 case 'share-remaining':return 1-c.a[0]/c.a[1]-c.b[0]/c.b[1];
 case 'circle-sin':{const [[a,b],[n,d]]=c.coordinates;assert.equal(a*a*d*d+n*n*b*b,b*b*d*d);return n/d;}
 case 'cos-from-sin':{const [n,d]=c.sin;return (c.quadrant===2?-1:1)*Math.sqrt(d*d-n*n)/d;}
 case 'double-from-tan':{const [a,b]=c.tan;return 2*a*b/(a*a+b*b);}
 case 'mean':return c.values.reduce((a,b)=>a+b,0)/c.values.length;
 case 'roots':{const D=c.b*c.b-4*c.a*c.c;const values=[(-c.b-Math.sqrt(D))/(2*c.a),(-c.b+Math.sqrt(D))/(2*c.a)].sort((a,b)=>a-b);assert.ok(values.every(x=>Math.abs(c.a*x*x+c.b*x+c.c)<1e-9));return c.select==='sum'?values[0]+values[1]:values[0];}
 case 'root-pairs':{let result=0;for(let a=1;a<c.sum;a++)for(let b=a+1;b<c.sum;b++)if(a+b===c.sum)result+=a*b;return result;}
 case 'rectangle-border':{for(let w=1;w<c.area;w++)if(w*(w+c.delta)===c.area)return (w+2*c.border)*(w+c.delta+2*c.border)-c.area;throw Error('No dimension');}
 case 'enumerate':{assert.match(c.predicate,/^[0-9x\s()+*/%.,!<>=&|-]+$/);const predicate=Function('x','return '+c.predicate),xs=[];for(let x=c.from;x<=c.to;x++)if(predicate(x))xs.push(x);return c.select==='min'?Math.min(...xs):c.select==='max'?Math.max(...xs):c.select==='sum'?xs.reduce((a,b)=>a+b,0):xs.length;}
 case 'budget':{let n=0;while((n+1)*c.price+c.fixed<=c.budget)n++;return n;}
 case 'mixture':{const x=c.mass*(c.target-c.start)/(c.added-c.target);assert.ok(Math.abs((c.mass*c.start+x*c.added)/(c.mass+x)-c.target)<1e-9);return x;}
 case 'different-balls':{const balls=Array(c.white).fill('w').concat(Array(c.black).fill('b'));let good=0,all=0;for(let i=0;i<balls.length;i++)for(let j=0;j<balls.length;j++)if(i!==j){all++;if(balls[i]!==balls[j])good++;}return good/all;}
 case 'dice-conditional':{let all=0,good=0;for(let a=1;a<=6;a++)for(let b=1;b<=6;b++)if(a+b>8){all++;if(a===b)good++;}return good/all;}
 case 'log':{for(let n=-30;n<=30;n++)if(c.base**n===c.arg)return n;throw Error('No log');}
 case 'trig-count':{const xs=[Math.PI/6,Math.PI/2,5*Math.PI/6];assert.ok(xs.every(x=>Math.abs(2*Math.sin(x)**2-3*Math.sin(x)+1)<1e-10));const roots=[.5,1];return roots.reduce((n,s)=>n+(s===1?1:2),0);}
 case 'fraction-calc':return ((c.left[0]*c.subtract[1]-c.subtract[0]*c.left[1])*c.divide[1])/(c.left[1]*c.subtract[1]*c.divide[0]);
 case 'fraction-difference':return Math.abs(c.a[0]*c.b[1]-c.b[0]*c.a[1])/(c.a[1]*c.b[1]);
 case 'graph-degree':return c.edges.filter(e=>e.includes(c.vertex)).length;
 case 'graph-shortest':{let best=Infinity;const visit=(v,path,sum)=>{if(v===c.end)best=Math.min(best,sum);for(const [a,b,w]of c.edges){const next=a===v?b:b===v?a:null;if(next&&!path.includes(next))visit(next,[...path,next],sum+w);}};visit(c.start,[c.start],0);return best;}
 case 'graph-paths':{let count=0;const visit=(v,path)=>{if(v===c.forbidden)return;if(v===c.end){if(!c.required||path.includes(c.required))count++;return;}for(const[a,b]of c.edges)if(a===v&&!path.includes(b))visit(b,[...path,b]);};visit(c.start,[c.start]);return count;}
 case 'spanning-tree':{const vs=[...new Set(c.edges.flatMap(([a,b])=>[a,b]))];let best=Infinity;for(let bits=0;bits<2**c.edges.length;bits++){const chosen=c.edges.filter((_,i)=>(bits>>i)&1);if(chosen.length!==vs.length-1)continue;const seen=new Set([vs[0]]);for(let i=0;i<vs.length;i++)for(const[a,b]of chosen){if(seen.has(a))seen.add(b);if(seen.has(b))seen.add(a);}if(seen.size===vs.length)best=Math.min(best,chosen.reduce((s,e)=>s+e[2],0));}return best;}
 case 'formula-copy':{const dx=c.to[0]-c.from[0],dy=c.to[1]-c.from[1];return '='+c.terms.map(t=>(t.fixedCol?'$':'')+String.fromCharCode(64+t.col+(t.fixedCol?0:dx))+(t.fixedRow?'$':'')+(t.row+(t.fixedRow?0:dy))).join('*');}
 case 'table-filter':return c.rows.filter(([city,n])=>city===c.city&&n>=c.minimum).reduce((s,r)=>s+r[1],0);
 case 'join':return c.orders.filter(r=>r[2]).reduce((s,[k,n])=>s+c.prices[k]*n,0);
 case 'gcd':{const ds=[];for(let d=1;d<=Math.min(c.a,c.b);d++)if(c.a%d===0&&c.b%d===0)ds.push(d);return Math.max(...ds);}
 case 'nested':{let total=0;for(let i=1;i<=c.limit;i++)for(let j=1;j<=i;j++)if((i+j)%3===0)total++;return total;}
 case 'binary-search':{let l=0,r=c.values.length-1,n=0;while(l<=r){n++;const m=Math.floor((l+r)/2);if(c.values[m]===c.target)return n;if(c.values[m]<c.target)l=m+1;else r=m-1;}throw Error('Not found');}
 case 'binary-ones':return c.value.toString(2).split('1').length-1;
 case 'base-value':{let v=0;for(const d of c.digits)v=v*c.base+Number(d);return v;}
 case 'parity-append':{for(let n=1;n<10000;n++){const s=n.toString(2),bit=s.split('1').length%2===0?'1':'0';if(parseInt(s+bit,2)>c.threshold)return n;}throw Error('Not found');}
 case 'prefix-free':{for(let n=1;n<20;n++)for(let v=0;v<2**n;v++){const s=v.toString(2).padStart(n,'0');if(c.codes.every(old=>!old.startsWith(s)&&!s.startsWith(old)))return n;}throw Error('No code');}
 case 'truth-count':{assert.match(c.expression,/^[ABC01\s!&|()]+$/);let count=0;for(let A=0;A<2;A++)for(let B=0;B<2;B++)for(let C=0;C<2;C++)if(Function('A','B','C','return '+c.expression)(A,B,C))count++;return count;}
 case 'universal-bound':{for(let a=0;a<=c.maximum;a++){let ok=true;for(let x=0;x<=c.maximum;x++)if(x<=c.antecedent&&!(x<=a))ok=false;if(ok)return a;}throw Error('No bound');}
 default:throw Error('Unknown independent oracle '+c.kind);
 }
}
export function checkWave({structural=true}={}){
 const read=p=>JSON.parse(fs.readFileSync(p)),review=read('sources/stage3b2-review.json'),wave=['math','russian','informatics','python'].flatMap(s=>read('src/data/banks/stage3b2-'+s+'.json').questions);
 assert.equal(wave.length,150);assert.equal(review.questions.length,wave.length);assert.equal(new Set(review.questions.map(r=>r.id)).size,wave.length);
 if(structural)checkContentBank();let computed=0,languages=0,codes=0,predictions=0;
 // Detect simple number-only rewordings across learning modes. This is a flagging
 // guard, not a claim that text normalization proves semantic independence.
 const flow=read('src/data/study-flow.json').topics,wholeBank=fs.readdirSync('src/data/banks').filter(f=>f.endsWith('.json')).flatMap(f=>read('src/data/banks/'+f).questions),byId=new Map(wholeBank.map(q=>[q.id,q]));
 const signature=q=>q.prompt.toLocaleLowerCase('ru-RU').replace(/[−+-]?\d+(?:[.,/]\d+)?/g,'#').replace(/\s+/g,' ').trim();
 for(const q of wave){const row=review.questions.find(r=>r.id===q.id),opposite=row.mode==='practice'?'test':'practice';for(const id of flow[q.topic][opposite])assert.notEqual(signature(q),signature(byId.get(id)),'Possible number-only practice/control duplicate: '+q.id+' / '+id);}
 const families=new Map();for(const q of wave){const r=review.questions.find(x=>x.id===q.id);assert.ok(r,q.id);assert.equal(q.origin,'generated');assert.equal(q.examTaskType,null);assert.ok(q.hint&&q.explanation&&q.solution&&q.skills.length);assert.ok(!families.has(r.family),r.family);families.set(r.family,q.id);if(r.check.kind==='language-review'){assert.equal(q.subject,'russian');assert.ok(r.check.reason.length>80);assert.equal(new Set(q.options).size,q.options.length);assert.ok(q.options.includes(q.answer));languages++;continue;}if(r.check.kind==='python'){assert.equal(q.answerType,'code');assert.equal(r.check.mutants.length,2);codes++;continue;}if(r.check.kind==='prediction'){predictions++;continue;}const actual=compute(r.check);if(q.answerType==='number')assert.ok(Math.abs(actual-parseNumber(q.answer))<1e-8,q.id+' expected '+q.answer+' independently got '+actual);else assert.equal(String(actual),q.answer,q.id);assert.equal(checkAnswer(q,q.answer).correct,true);computed++;}
 return {total:wave.length,computed,languages,codes,predictions};
}
if(process.argv[1]?.endsWith('stage3b2-quality.mjs'))console.log(checkWave({structural:process.argv[2]!=='--package-only'}));
