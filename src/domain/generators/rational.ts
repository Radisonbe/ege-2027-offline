// Exact bounded rational arithmetic; no floating-point answers.
export interface Rational { n: bigint; d: bigint }
const LIMIT=1000000000n;
export function rational(n:bigint,d=1n):Rational {
 if(d===0n)throw Error('Нулевой знаменатель');
 if(n>LIMIT||n < -LIMIT||d>LIMIT||d < -LIMIT)throw Error('Числа превышают предел пилота');
 if(d<0n){n=-n;d=-d;}
 let a=n<0n?-n:n,b=d;while(b){[a,b]=[b,a%b];}return {n:n/(a||1n),d:d/(a||1n)};
}
export const add=(a:Rational,b:Rational)=>rational(a.n*b.d+b.n*a.d,a.d*b.d);
export const multiply=(a:Rational,b:Rational)=>rational(a.n*b.n,a.d*b.d);
export const divide=(a:Rational,b:Rational)=>rational(a.n*b.d,a.d*b.n);
export const fractionText=(a:Rational)=>a.d===1n?String(a.n):`${a.n}/${a.d}`;
