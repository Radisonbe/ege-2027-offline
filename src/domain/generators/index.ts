import type {Question} from '../types.ts';
import {rational,add,multiply,fractionText} from './rational.ts';
export interface GeneratorDescriptor {
 id:string;version:number;title:string;subject:'math'|'informatics';topic:string;subtopic:string;skills:string[];
 difficulty:'easy'|'medium';familyId:string;requires:string[];variants:number;
}
export interface GeneratedVariant {question:Question;certificate:{kind:string;parameters:number[];steps:string[]}}
const define=(id:string,title:string,topic:string,subtopic:string,skill:string,difficulty:'easy'|'medium',familyId:string,requires:string[]=[]):GeneratorDescriptor=>({id,version:1,title,subject:['binary','information','encoding','logic','graphs'].includes(topic)?'informatics':'math',topic,subtopic,skills:[skill],difficulty,familyId,requires,variants:24});
export const generators:readonly GeneratorDescriptor[]=[
 define('fraction-add','Сложение и вычитание дробей','fractions','fractions.sub.foundation','fractions.skill.operations','easy','fraction-common-denominator'),
 define('fraction-product','Умножение и деление дробей','fractions','fractions.sub.foundation','fractions.skill.operations','medium','fraction-product-quotient'),
 define('whole-from-share','Целое по известной доле','fractions','fractions.sub.extension','fractions.skill.3b2-frac-restore','medium','fraction-restore-whole'),
 define('percent-chain','Последовательные изменения','percent','percent.sub.change','percent.skill.chain','medium','percent-multiplier-chain'),
 define('percent-price','Цена до скидки','percent','percent.sub.inverse','percent.skill.original-price','medium','percent-restore-price'),
 define('linear-both','Переменная в обеих частях','linear','linear.sub.foundation','linear.skill.solve','easy','linear-equivalent-transformations'),
 define('linear-fractions','Дробные коэффициенты','linear','linear.sub.foundation','linear.skill.solve','medium','linear-denominator-clearing',['fractions']),
 define('power-rules','Правила степеней','powers','powers.sub.foundation','powers.skill.rules','easy','power-exponent-rules'),
 define('root-absolute','Корень квадрата','roots','roots.sub.foundation','roots.skill.principal','easy','root-absolute'),
 define('probability-bag','Равновозможные исходы','probability','probability.sub.extension','probability.skill.3b2-outcomes','medium','probability-count-outcomes',['fractions']),
 define('base-convert','Перевод из системы счисления','binary','binary.sub.extension','binary.skill.3b2-binary-base','easy','base-place-polynomial'),
 define('base-digit','Неизвестная цифра','binary','binary.sub.extension','binary.skill.3b2-binary-base','medium','base-missing-digit'),
 define('base-restore','Неизвестное основание','binary','binary.sub.extension','binary.skill.3b2-binary-base','medium','base-restore'),
 define('base-append','Дописанные цифры','binary','binary.sub.extension','binary.skill.3b2-binary-rule','medium','base-shift-append'),
 define('information-size','Размер сообщения','information','information.sub.foundation','information.skill.units','easy','information-unit-conversion'),
 define('uniform-code','Равномерный код','encoding','encoding.sub.alphabet','encoding.skill.minimum-bits','medium','encoding-minimum-bits'),
 define('logic-interval','Целые числа и логическое условие','logic','logic.sub.foundation','logic.skill.operations','medium','logic-integer-interval'),
 define('dag-paths','Пути в направленном графе','graphs','graphs.sub.extension','graphs.skill.3b2-count-paths','medium','graph-dag-path-count'),
];
export const generatorById=new Map(generators.map(g=>[g.id,g]));
const f=(n:number,d=1)=>rational(BigInt(n),BigInt(d)),text=fractionText;
// A finite, fully audited pilot domain. Invalid seeds/versions fail, never silently substitute.
export function generateVariant(id:string,seed:number,version=1):GeneratedVariant|null {
 const g=generatorById.get(id);if(!g||g.version!==version||!Number.isInteger(seed)||seed<0||seed>=g.variants)return null;
 const s=seed,sign=s%2?-1:1;let p:number[]=[],prompt='',answer='',steps:string[]=[],hint='';
 switch(id){
 case 'fraction-add':{
  const a=sign*(s+1),b=2+s%7,c=2+s%5,d=3+s%6,op=s%3===0?-1:1;p=[a,b,c,d,op];
  prompt=`Вычисли: ${a}/${b} ${op===1?'+':'−'} ${c}/${d}. Ответ запиши дробью или точным десятичным числом.`;
  const r=add(f(a,b),f(op*c,d));answer=text(r);steps=[`Общий знаменатель: ${b} · ${d} = ${b*d}.`,`Числитель: ${a} · ${d} ${op===1?'+':'−'} ${c} · ${b} = ${a*d+op*c*b}.`,`После сокращения: ${answer}.`];hint='Приведи дроби к общему знаменателю.';break;}
 case 'fraction-product':{
  const a=sign*(s+2),b=2+s%6,c=1+s%7,d=3+s%5,op=s%2;p=[a,b,c,d,op];
  prompt=`Вычисли: (${a}/${b}) ${op===0?'·':':'} (${c}/${d}).`;
  const n=op===0?a*c:a*d,den=op===0?b*d:b*c;answer=text(f(n,den));steps=[op===0?'Умножь числители и знаменатели.':'При делении умножь на обратную дробь.',`До сокращения: ${n}/${den}.`,`После сокращения: ${answer}.`];hint='При делении переворачивается только делитель.';break;}
 case 'whole-from-share':{
  const d=3+s%6,a=1+s%(d-1),whole=d*(s+4),part=a*(s+4);p=[a,d,part];
  prompt=`${a}/${d} всей длины ленты составляет ${part} см. Найди полную длину ленты в сантиметрах.`;answer=String(whole);steps=[`Одна доля: ${part} : ${a} = ${s+4} см.`,`Все ${d} долей: ${s+4} · ${d} = ${whole} см.`];hint='Сначала найди одну долю.';break;}
 case 'percent-chain':{
  const initial=1000+100*s,a=5+5*(s%5),b=10+5*(s%4),reverse=s%2;p=[initial,a,b,reverse];
  const mid=f(initial*(100+a),100),last=multiply(mid,f(100-b,100));
  prompt=reverse?`После повышения цены на ${a}% и затем скидки ${b}% товар стоит ${text(last)} руб. Какой была исходная цена?`:`Товар стоил ${initial} руб. Цену повысили на ${a}%, затем снизили на ${b}%. Найди итоговую цену.`;
  answer=reverse?String(initial):text(last);steps=[`Множитель повышения: ${100+a}/100.`,`Множитель скидки: ${100-b}/100.`,reverse?`Исходная цена: ${text(last)} : (${100+a}/100 · ${100-b}/100) = ${answer}.`:`Итог: ${initial} · ${100+a}/100 · ${100-b}/100 = ${answer}.`];hint='Каждый процент относится к цене на своём шаге.';break;}
 case 'percent-price':{
  const whole=200+20*s,discount=10+5*(s%7),paid=whole*(100-discount)/100;p=[whole,discount];
  prompt=`После скидки ${discount}% покупатель заплатил ${paid} руб. Найди цену до скидки.`;answer=String(whole);steps=[`Оплачено ${100-discount}% исходной цены.`,`Цена до скидки: ${paid} · 100 : ${100-discount} = ${whole} руб.`];hint='Оплаченная часть — это не размер скидки.';break;}
 case 'linear-both':{
  const a=2+s%5,c=a+1+s%3,x=s-12,b=5-s,d=(a-c)*x+b;p=[a,b,c,d];
  prompt=`Реши уравнение ${a}x + (${b}) = ${c}x + (${d}).`;answer=String(x);steps=[`Собери переменные: (${a} − ${c})x = ${d} − (${b}).`,`${a-c}x = ${d-b}.`,`x = ${answer}. Проверка: обе части равны ${a*x+b}.`];hint='Переноси слагаемые, меняя знак.';break;}
 case 'linear-fractions':{
  const b=2+s%5,d=3+s%4,a=s%3+1,c=a*d+1,x=s-12,r=add(multiply(f(a,b),f(x)),multiply(f(-c,d),f(x)));p=[a,b,c,d,r.n===0n?0:Number(r.n),Number(r.d)];
  prompt=`Реши уравнение (${a}/${b})x − (${c}/${d})x = ${text(r)}.`;
  const coefficient=add(f(a,b),f(-c,d));if(coefficient.n===0n)return null;answer=String(x);steps=[`Коэффициент при x: ${a}/${b} − ${c}/${d} = ${text(coefficient)}.`,`Раздели обе части: x = (${text(r)}) : (${text(coefficient)}) = ${x}.`,`Подстановка даёт ${text(r)} в обеих частях.`];hint='Сначала вычти коэффициенты как дроби.';break;}
 case 'power-rules':{
  const base=2+s%4,a=2+Math.floor(s/4),b=1+s%2,c=1+s%2;p=[base,a,b,c];
  prompt=`Упрости ${base}^${a} · ${base}^${b} : ${base}^${c} и запиши значение.`;answer=String(base**(a+b-c));steps=[`При одинаковом основании показатель: ${a} + ${b} − ${c} = ${a+b-c}.`,`Значение ${base}^${a+b-c} = ${answer}.`];hint='При умножении показатели складываются, при делении вычитаются.';break;}
 case 'root-absolute':{
  const x=sign*(s+2),a=1+s%5;p=[x,a];prompt=`Вычисли √((${x})²) + ${a}.`;answer=String(Math.abs(x)+a);steps=[`Арифметический корень неотрицателен: √((${x})²) = |${x}| = ${Math.abs(x)}.`,`Сумма: ${Math.abs(x)} + ${a} = ${answer}.`];hint='Корень квадрата равен модулю числа.';break;}
 case 'probability-bag':{
  const red=s+2,blue=3+s%5,green=1+s%4,notRed=s%2;p=[red,blue,green,notRed];const total=red+blue+green,fav=notRed?blue+green:red;
  prompt=`В мешке ${red} красных, ${blue} синих и ${green} зелёных одинаковых шаров. Случайно выбирают один. Найди вероятность ${notRed?'выбрать не красный':'выбрать красный'} шар.`;answer=text(f(fav,total));steps=[`Всего равновозможных исходов: ${red} + ${blue} + ${green} = ${total}.`,`Благоприятных исходов: ${fav}.`,`Вероятность: ${fav}/${total} = ${answer}.`];hint='Определи благоприятные цвета, затем раздели количество на общее.';break;}
 case 'base-convert':{
  const base=2+s%7,value=20+7*s,digits=value.toString(base).toUpperCase();p=[base,value];prompt=`Переведи число ${digits} из системы с основанием ${base} в десятичную.`;answer=String(value);const terms=[...digits].map((ch,i)=>`${parseInt(ch,base)} · ${base}^${digits.length-i-1}`);steps=[`Разрядная сумма: ${terms.join(' + ')}.`,`Значение суммы: ${value}.`];hint='Вес разряда — степень основания, начиная с нулевой справа.';break;}
 case 'base-digit':{
  const base=10+s,lead=1+s%9,digit=s%base,tail=(s+1)%10,value=lead*base*base+digit*base+tail;p=[base,lead,tail,value];prompt=`Запись ${lead}x${tail} в системе с основанием ${base} равна ${value} в десятичной. x обозначает значение одной цифры. Найди x в десятичной записи.`;answer=String(digit);steps=[`${lead} · ${base}² + x · ${base} + ${tail} = ${value}.`,`x = (${value} − ${lead*base*base} − ${tail}) : ${base} = ${digit}.`,`Цифра допустима: 0 ≤ ${digit} < ${base}.`];hint='Раскрой разрядную запись и проверь диапазон цифры.';break;}
 case 'base-restore':{
  const base=4+s,lead=1+s%3,tail=s%4,value=lead*base+tail;p=[lead,tail,value];prompt=`Двузначная запись ${lead}${tail} в неизвестной системе равна ${value} в десятичной. Найди основание.`;answer=String(base);steps=[`${lead} · b + ${tail} = ${value}.`,`b = (${value} − ${tail}) : ${lead} = ${base}.`,`Основание ${base} больше каждой цифры записи.`];hint='У двузначной записи старшая цифра умножается на основание.';break;}
 case 'base-append':{
  const base=2+s%7,value=3+s,digit=s%base;p=[base,value,digit];prompt=`К записи числа ${value} в системе с основанием ${base} справа дописали цифру ${digit}. Найди новое число в десятичной системе.`;answer=String(value*base+digit);steps=[`Сдвиг разрядов: ${value} · ${base} = ${value*base}.`,`Добавь младшую цифру: ${value*base} + ${digit} = ${answer}.`];hint='Дописанная цифра увеличивает длину записи на один разряд.';break;}
 case 'information-size':{
  const count=8*(s+3),bytes=1+s%4,kib=s%2;p=[count,bytes,kib];prompt=`Сообщение содержит ${count} символов. Каждый занимает ${bytes} байт. Найди объём в ${kib?'КиБ (1 КиБ = 1024 байта)':'битах (1 байт = 8 бит)'}.`;answer=kib?text(f(count*bytes,1024)):String(count*bytes*8);steps=[`В байтах: ${count} · ${bytes} = ${count*bytes}.`,kib?`В КиБ: ${count*bytes}/1024 = ${answer}.`:`В битах: ${count*bytes} · 8 = ${answer}.`];hint='Сначала найди число байтов, затем переведи единицы.';break;}
 case 'uniform-code':{
  const alphabet=3+s,length=8*(s+2);let bits=1;while(2**bits<alphabet)bits++;p=[alphabet,length];prompt=`Алфавит содержит ${alphabet} символов. Для каждого используют равномерный двоичный код минимальной длины. Сообщение содержит ${length} символов. Сколько байтов занимает только код сообщения?`;answer=String(bits*length/8);steps=[`${2**(bits-1)} < ${alphabet} ≤ ${2**bits}, поэтому нужно ${bits} бит на символ.`,`Всего бит: ${length} · ${bits} = ${length*bits}.`,`Всего байтов: ${length*bits} : 8 = ${answer}.`];hint='Найди минимальное число бит, вмещающее весь алфавит.';break;}
 case 'logic-interval':{
  const lo=s-12,hi=lo+4+s%5,a=lo+1,b=hi-1,or=s%2;p=[lo,hi,a,b,or];const values=Array.from({length:hi-lo+1},(_,i)=>i+lo).filter(x=>or?(x<a||x>b):(x>=a&&x<=b));prompt=`Для целых x от ${lo} до ${hi} включительно посчитай значения, для которых истинно ${or?`(x < ${a}) ИЛИ (x > ${b})`:`(x ≥ ${a}) И (x ≤ ${b})`}.`;answer=String(values.length);steps=[`Подходящие значения: ${values.join(', ')}.`,`Количество: ${values.length}.`];hint='Проверь каждое целое число из ограниченного диапазона.';break;}
 case 'dag-paths':{
  // Four vertices per layered branch; forward-only edges keep the graph acyclic.
  const branches=2+s%4,extra=Math.floor(s/4)%3,direct=Math.floor(s/12);const edges:string[][]=[];for(let i=1;i<=branches;i++){edges.push(['S','A'+i],['A'+i,'T']);if(i<=extra)edges.push(['A'+i,'U']);}if(extra)edges.push(['U','T']);if(direct)edges.push(['S','T']);p=[branches,extra,direct];const paths=branches+Math.min(extra,branches)+direct;
  prompt=`Ориентированный граф задан дугами: ${edges.map(e=>e.join('→')).join(', ')}. Других дуг нет. Сколько различных путей ведёт из S в T?`;
  answer=String(paths);steps=[`Через вершины A: ${branches} коротких путей.`,`Через U: ${Math.min(extra,branches)} дополнительных путей.`,`Прямая дуга S→T: ${direct}. Всего: ${branches} + ${Math.min(extra,branches)} + ${direct} = ${paths}.`];hint='Раздели пути на прямой, через A и через A с U.';break;}
 default:return null;
 }
 const question:Question={id:`gen-${g.id}-v${g.version}-s${seed}`,version:1,subject:g.subject,topic:g.topic,subtopic:g.subtopic,skills:[...g.skills],difficulty:g.difficulty,familyId:g.familyId,requires:[...g.requires],related:[],origin:'generated',source:`Оригинальный алгоритмический вариант ${g.id}, генератор v${g.version}, seed ${seed}; не официальный КИМ`,sourceYear:2026,sourceType:'training',examTaskType:null,answerType:'number',prompt,answer,hint,principle:hint,explanation:steps.join('\n'),solution:steps.join('\n'),generation:{generatorId:g.id,generatorVersion:g.version,seed}};
 return {question,certificate:{kind:id,parameters:p,steps}};
}
export function pilotVariants(topics:readonly string[]):Question[]{const chosen=new Set(topics);return generators.filter(g=>chosen.has(g.topic)).flatMap(g=>Array.from({length:g.variants},(_,seed)=>generateVariant(g.id,seed)?.question).filter((q):q is Question=>!!q));}
export function validateGenerated(result:GeneratedVariant):void {
 const q=result.question,m=q.generation;if(!m)throw Error('Нет метаданных генератора');
 const expected=generateVariant(m.generatorId,m.seed,m.generatorVersion);if(!expected||JSON.stringify(expected)!==JSON.stringify(result))throw Error('Условие, ответ или объяснение расходятся с вычислением');
}
