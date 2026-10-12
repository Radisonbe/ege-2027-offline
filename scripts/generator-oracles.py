"""Independent Fraction/enumeration oracle; checks every explanatory line too."""
import json,sys,re,math
from fractions import Fraction as F
sys.stdin.reconfigure(encoding="utf-8");sys.stdout.reconfigure(encoding="utf-8");sys.stderr.reconfigure(encoding="utf-8")
def fmt(x):
 x=F(x);return str(x.numerator) if x.denominator==1 else f'{x.numerator}/{x.denominator}'
def verify(row):
 k=row['certificate']['kind'];p=row['certificate']['parameters'];q=row['question'];steps=[]
 if k=='fraction-add':
  a,b,c,d,op=p;v=F(a,b)+op*F(c,d)
  steps=[f'Общий знаменатель: {b} · {d} = {b*d}.',f'Числитель: {a} · {d} {"+" if op==1 else "−"} {c} · {b} = {a*d+op*c*b}.',f'После сокращения: {fmt(v)}.']
  assert re.findall(r'(-?\d+)/(\d+)',q['prompt'])==[(str(a),str(b)),(str(c),str(d))]
 elif k=='fraction-product':
  a,b,c,d,op=p;v=F(a,b)*F(c,d) if op==0 else F(a,b)/F(c,d)
  n,den=(a*c,b*d) if op==0 else (a*d,b*c)
  steps=['Умножь числители и знаменатели.' if op==0 else 'При делении умножь на обратную дробь.',f'До сокращения: {n}/{den}.',f'После сокращения: {fmt(v)}.']
 elif k=='whole-from-share':
  a,d,part=p;v=F(part,1)/F(a,d);assert 0<a<d
  steps=[f'Одна доля: {part} : {a} = {fmt(F(part,a))} см.',f'Все {d} долей: {fmt(F(part,a))} · {d} = {fmt(v)} см.']
 elif k=='percent-chain':
  initial,a,b,reverse=p;mid=F(initial)*(1+F(a,100));last=mid*(1-F(b,100));v=last/((1+F(a,100))*(1-F(b,100))) if reverse else last
  assert 0<b<100 and v>0
  steps=[f'Множитель повышения: {100+a}/100.',f'Множитель скидки: {100-b}/100.',f'Исходная цена: {fmt(last)} : ({100+a}/100 · {100-b}/100) = {fmt(v)}.' if reverse else f'Итог: {initial} · {100+a}/100 · {100-b}/100 = {fmt(v)}.']
 elif k=='percent-price':
  whole,discount=p;paid=F(whole)*(1-F(discount,100));v=paid/(1-F(discount,100));assert 0<discount<100
  steps=[f'Оплачено {100-discount}% исходной цены.',f'Цена до скидки: {fmt(paid)} · 100 : {100-discount} = {fmt(v)} руб.']
 elif k=='linear-both':
  a,b,c,d=p;assert a!=c
  roots=[x for x in range(-100,101) if a*x+b==c*x+d];assert len(roots)==1;v=roots[0]
  steps=[f'Собери переменные: ({a} − {c})x = {d} − ({b}).',f'{a-c}x = {d-b}.',f'x = {v}. Проверка: обе части равны {a*v+b}.']
 elif k=='linear-fractions':
  a,b,c,d,n,den=p;assert b and d and den and F(a,b)!=F(c,d)
  roots=[x for x in range(-100,101) if F(a*x,b)-F(c*x,d)==F(n,den)];assert len(roots)==1;v=roots[0];coef=F(a,b)-F(c,d)
  steps=[f'Коэффициент при x: {a}/{b} − {c}/{d} = {fmt(coef)}.',f'Раздели обе части: x = ({fmt(F(n,den))}) : ({fmt(coef)}) = {v}.',f'Подстановка даёт {fmt(F(n,den))} в обеих частях.']
 elif k=='power-rules':
  b,a,c,d=p;v=F(b**a*b**c,b**d)
  steps=[f'При одинаковом основании показатель: {a} + {c} − {d} = {a+c-d}.',f'Значение {b}^{a+c-d} = {fmt(v)}.']
 elif k=='root-absolute':
  x,a=p;root=math.isqrt(x*x);assert root*root==x*x;v=root+a
  steps=[f'Арифметический корень неотрицателен: √(({x})²) = |{x}| = {root}.',f'Сумма: {root} + {a} = {v}.']
 elif k=='probability-bag':
  red,blue,green,inv=p;outcomes=['red']*red+['blue']*blue+['green']*green;fav=sum((x!='red') if inv else (x=='red') for x in outcomes);v=F(fav,len(outcomes))
  steps=[f'Всего равновозможных исходов: {red} + {blue} + {green} = {len(outcomes)}.',f'Благоприятных исходов: {fav}.',f'Вероятность: {fav}/{len(outcomes)} = {fmt(v)}.']
 elif k=='base-convert':
  b,value=p;digits=re.search(r'число ([0-9A-Z]+)',q['prompt'])[1];assert all(int(c,36)<b for c in digits);v=sum(int(c,36)*b**i for i,c in enumerate(reversed(digits)));assert v==value
  terms=[f'{int(c,36)} · {b}^{len(digits)-i-1}' for i,c in enumerate(digits)]
  steps=['Разрядная сумма: '+' + '.join(terms)+'.',f'Значение суммы: {v}.']
 elif k=='base-digit':
  b,lead,tail,value=p;solutions=[x for x in range(b) if lead*b*b+x*b+tail==value];assert len(solutions)==1;v=solutions[0];assert 0<lead<b and 0<=tail<b
  steps=[f'{lead} · {b}² + x · {b} + {tail} = {value}.',f'x = ({value} − {lead*b*b} − {tail}) : {b} = {v}.',f'Цифра допустима: 0 ≤ {v} < {b}.']
 elif k=='base-restore':
  lead,tail,value=p;solutions=[b for b in range(2,37) if max(lead,tail)<b and lead*b+tail==value];assert len(solutions)==1;v=solutions[0]
  steps=[f'{lead} · b + {tail} = {value}.',f'b = ({value} − {tail}) : {lead} = {v}.',f'Основание {v} больше каждой цифры записи.']
 elif k=='base-append':
  b,value,digit=p;assert 0<=digit<b
  # Independent conversion of the actual appended representation.
  chars='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';ds='';n=value
  while n:ds=chars[n%b]+ds;n//=b
  v=int(ds+chars[digit],b)
  steps=[f'Сдвиг разрядов: {value} · {b} = {value*b}.',f'Добавь младшую цифру: {value*b} + {digit} = {v}.']
 elif k=='information-size':
  count,size,kib=p;v=F(count*size,1024) if kib else count*size*8
  steps=[f'В байтах: {count} · {size} = {count*size}.',f'В КиБ: {count*size}/1024 = {fmt(v)}.' if kib else f'В битах: {count*size} · 8 = {v}.']
 elif k=='uniform-code':
  alphabet,length=p;bits=(alphabet-1).bit_length();v=F(length*bits,8)
  steps=[f'{2**(bits-1)} < {alphabet} ≤ {2**bits}, поэтому нужно {bits} бит на символ.',f'Всего бит: {length} · {bits} = {length*bits}.',f'Всего байтов: {length*bits} : 8 = {fmt(v)}.']
 elif k=='logic-interval':
  lo,hi,a,b,use_or=p;assert lo<=hi
  values=[x for x in range(lo,hi+1) if (x<a or x>b) if use_or] if use_or else [x for x in range(lo,hi+1) if not(x<a or x>b)]
  v=len(values);steps=['Подходящие значения: '+', '.join(map(str,values))+'.',f'Количество: {v}.']
 elif k=='dag-paths':
  branches,extra,direct=p;edges=re.findall(r'([SAUT]\d*)→([SAUT]\d*)',q['prompt']);assert len(edges)==len(set(edges));graph={}
  for a,b in edges:graph.setdefault(a,[]).append(b)
  def paths(at,seen):
   assert at not in seen
   return 1 if at=='T' else sum(paths(b,seen|{at}) for b in graph.get(at,[]))
  v=paths('S',set());steps=[f'Через вершины A: {branches} коротких путей.',f'Через U: {min(extra,branches)} дополнительных путей.',f'Прямая дуга S→T: {direct}. Всего: {branches} + {min(extra,branches)} + {direct} = {v}.']
 else:raise ValueError(k)
 if k=='fraction-add':expected=f'Вычисли: {a}/{b} {"+" if op==1 else "−"} {c}/{d}. Ответ запиши дробью или точным десятичным числом.'
 elif k=='fraction-product':expected=f'Вычисли: ({a}/{b}) {"·" if op==0 else ":"} ({c}/{d}).'
 elif k=='whole-from-share':expected=f'{a}/{d} всей длины ленты составляет {part} см. Найди полную длину ленты в сантиметрах.'
 elif k=='percent-chain':expected=f'После повышения цены на {a}% и затем скидки {b}% товар стоит {fmt(last)} руб. Какой была исходная цена?' if reverse else f'Товар стоил {initial} руб. Цену повысили на {a}%, затем снизили на {b}%. Найди итоговую цену.'
 elif k=='percent-price':expected=f'После скидки {discount}% покупатель заплатил {fmt(paid)} руб. Найди цену до скидки.'
 elif k=='linear-both':expected=f'Реши уравнение {a}x + ({b}) = {c}x + ({d}).'
 elif k=='linear-fractions':expected=f'Реши уравнение ({a}/{b})x − ({c}/{d})x = {fmt(F(n,den))}.'
 elif k=='power-rules':expected=f'Упрости {b}^{a} · {b}^{c} : {b}^{d} и запиши значение.'
 elif k=='root-absolute':expected=f'Вычисли √(({x})²) + {a}.'
 elif k=='probability-bag':expected=f'В мешке {red} красных, {blue} синих и {green} зелёных одинаковых шаров. Случайно выбирают один. Найди вероятность {"выбрать не красный" if inv else "выбрать красный"} шар.'
 elif k=='base-convert':expected=f'Переведи число {digits} из системы с основанием {b} в десятичную.'
 elif k=='base-digit':expected=f'Запись {lead}x{tail} в системе с основанием {b} равна {value} в десятичной. x обозначает значение одной цифры. Найди x в десятичной записи.'
 elif k=='base-restore':expected=f'Двузначная запись {lead}{tail} в неизвестной системе равна {value} в десятичной. Найди основание.'
 elif k=='base-append':expected=f'К записи числа {value} в системе с основанием {b} справа дописали цифру {digit}. Найди новое число в десятичной системе.'
 elif k=='information-size':expected=f'Сообщение содержит {count} символов. Каждый занимает {size} байт. Найди объём в '+('КиБ (1 КиБ = 1024 байта)' if kib else 'битах (1 байт = 8 бит)')+'.'
 elif k=='uniform-code':expected=f'Алфавит содержит {alphabet} символов. Для каждого используют равномерный двоичный код минимальной длины. Сообщение содержит {length} символов. Сколько байтов занимает только код сообщения?'
 elif k=='logic-interval':expected=f'Для целых x от {lo} до {hi} включительно посчитай значения, для которых истинно '+(f'(x < {a}) ИЛИ (x > {b})' if use_or else f'(x ≥ {a}) И (x ≤ {b})')+'.'
 else:
  expected_edges=[]
  for i in range(1,branches+1):
   expected_edges.extend([('S',f'A{i}'),(f'A{i}','T')])
   if i<=extra:expected_edges.append((f'A{i}','U'))
  if extra:expected_edges.append(('U','T'))
  if direct:expected_edges.append(('S','T'))
  expected='Ориентированный граф задан дугами: '+', '.join(a+'→'+b for a,b in expected_edges)+'. Других дуг нет. Сколько различных путей ведёт из S в T?'
 assert q['prompt']==expected,(q['id'],'prompt mismatch')
 assert q['answer']==fmt(v),(q['id'],q['answer'],fmt(v))
 assert steps==row['certificate']['steps'],(q['id'],steps,row['certificate']['steps'])
 assert q['explanation']=='\n'.join(steps) and q['solution']=='\n'.join(steps),q['id']
 return q['id']
rows=json.load(sys.stdin);results=[verify(row) for row in rows];json.dump({'verified':len(results),'ids':results},sys.stdout)
