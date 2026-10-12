"""Independent prompt-derived arithmetic / enumeration checks for the author pilot."""
import json,re,math,ast,io,contextlib,itertools,collections,sys,copy
from fractions import Fraction
sys.stdin.reconfigure(encoding="utf-8");sys.stdout.reconfigure(encoding="utf-8");sys.stderr.reconfigure(encoding="utf-8")
data=json.load(sys.stdin)
review={r['id']:{'oracle':{'op':r['op']}} for r in data['fixtures']}
def nums(s):return [Fraction(n.replace('−','-')) for n in re.findall(r'[-−]?\d+(?:/\d+)?',re.sub(r'([−-])\s+(?=\d)',r'\1',s))]
def ft(v):
 v=Fraction(v);return str(v.numerator) if v.denominator==1 else f'{v.numerator}/{v.denominator}'
def rat(n,d):
 assert d!=0
 g=math.gcd(n,d);n//=g;d//=g
 return (n,d) if d>0 else (-n,-d)
def numeric(q):
 o=review[q['id']]['oracle']['op'];p=q['prompt'];n=nums(p);proof=[]
 if o in ['frac-add','frac-md']:
  raw=re.findall(r'([-−]?\d+)/(\d+)',p);(a,b),(c,d)=[tuple(map(int,x)) for x in raw]
  if o=='frac-add':
   sign=-1 if '−' in p else 1;den=math.lcm(b,d);num=a*(den//b)+sign*c*(den//d);v=Fraction(*rat(num,den));proof=[den,num]
  else:
   div=':' in p;num,den=(a*d,b*c) if div else (a*c,b*d);v=Fraction(*rat(num,den));proof=[num,den]
 elif o=='part-whole':
  share,part=n;assert 0<share<=1;matches=[w for w in range(1,2001) if w*share==part];assert len(matches)==1;v=matches[0];proof=[part/share]
 elif o=='percent-part':
  total,rate=n;matches=[c for c in range(int(total)+1) if 100*c==total*rate];assert len(matches)==1;v=matches[0]
 elif o=='percent-inverse':
  rate,paid=n;matches=[price for price in range(1,3001) if price*(100-rate)==paid*100];assert len(matches)==1;v=matches[0];proof=[100-rate]
 elif o=='percent-chain':
  initial,inc,dec=n;raised=int(initial*100)+int(initial*inc);final_cents=raised*(100-int(dec))//100;assert raised*(100-int(dec))%100==0;v=Fraction(final_cents,100);proof=[raised,final_cents]
 elif o=='linear':
  a,b,c,d=n;assert a!=c;roots=[x for x in range(-100,101) if a*x+b==c*x+d];assert len(roots)==1;v=roots[0];proof=[a*v+b,c*v+d]
 elif o=='linear-frac':
  a,b,rhs=n;assert a!=b;roots=[x for x in range(-100,101) if a*x-b*x==rhs];assert len(roots)==1;v=roots[0];proof=[a-b,a*v-b*v]
 elif o=='roots-factor':
  a,b=n[:2];assert n[2]==0;roots=[x for x in range(-100,101) if (x+a)*(x+b)==0];assert len(roots)==2;v=max(roots);proof=roots
 elif o=='area':
  delta,area=n;roots=[x for x in range(-100,101) if x*(x+delta)==area];good=[x for x in roots if x>0 and x+delta>0];assert len(good)==1;v=good[0];proof=roots
 elif o=='exponent':
  b,m,b2,e,b3,k=n;assert b==b2==b3;v=Fraction(b**int(m)*b**int(e),b**int(k));proof=[m+e-k]
 elif o=='root-mod':
  x,offset=n;root=math.isqrt(int(x*x));assert root*root==x*x;v=root+offset;proof=[root]
 elif o=='function-value':
  a,shift,b,x=n;v=a*x+a*shift+b;proof=[x+shift]
 elif o=='zero':
  b,negative_a=n;assert negative_a;v=-b/negative_a;assert b+negative_a*v==0
 elif o=='work':
  a,b,start,hours=n;v=start
  for _ in range(int(hours)):v+=a;v+=b
  proof=[a+b,(a+b)*hours]
 elif o=='distance':
  speed,minutes=n;v=Fraction(speed*1000*minutes*60,3600*1000);proof=[minutes/60]
 elif o=='probability':
  red,blue,green=map(int,n);outcomes=['red']*red+['blue']*blue+['green']*green;inv='не красный' in p;fav=sum((c!='red') if inv else (c=='red') for c in outcomes);v=Fraction(fav,len(outcomes));proof=[len(outcomes),fav]
 elif o=='mean':
  values=n;v=Fraction(sum(values),len(values));assert sum(x-v for x in values)==0;proof=[sum(values),len(values)]
 elif o=='interval':
  lo,hi=n;values=[x for x in range(-100,101) if x>=lo and x<hi];v=len(values);proof=values
 elif o=='log':
  b,target=n;assert b>0 and b!=1 and target>0;roots=[e for e in range(-12,13) if b**e==target];assert len(roots)==1;v=roots[0]
 elif o=='complement-percent':
  total,rate=n;red=total*rate/100;assert red.denominator==1;v=total-red;proof=[red]
 elif o=='sumdiff':
  diff,total=n;solutions=[(a,b) for a in range(-100,101) for b in range(-100,101) if a-b==diff and a+b==total];assert len(solutions)==1;v=solutions[0][0];proof=list(solutions[0])
 elif o=='angle':
  den=n[0];v=Fraction(360,2*den);proof=[180]
 elif o=='base-to10':
  digits,base=re.search(r'числа ([0-9A-Z]+) с основанием (\d+)',p).groups();base=int(base);assert 2<=base<=36 and all(int(c,36)<base for c in digits);v=sum(int(c,36)*base**i for i,c in enumerate(digits[::-1]));proof=[int(digits,base)]
 elif o=='base-from10':
  value,base=map(int,n);size=1
  while base**size<=value:size+=1
  remaining=value;digits=[]
  for i in range(size-1,-1,-1):d,remaining=divmod(remaining,base**i);digits.append('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'[d])
  v=''.join(digits);assert int(v,base)==value;return v,[value]
 elif o=='unknown-digit':
  lead,tail,base,value=map(int,n);matches=[d for d in range(base) if lead*base*base+d*base+tail==value];assert len(matches)==1;v=matches[0]
 elif o=='base-recover':
  digits,value=re.search(r'число (\d+) .*равно (\d+)',p).groups();lead,tail=map(int,digits);value=int(value);matches=[b for b in range(2,37) if max(lead,tail)<b and int(digits,b)==value];assert len(matches)==1;v=matches[0]
 elif o=='volume':length,bits=n;v=sum(bits for _ in range(int(length)))
 elif o=='minimum-bits':
  alphabet=n[0];v=next(k for k in range(1,20) if sum(1 for _ in itertools.product([0,1],repeat=k))>=alphabet);proof=[2**(v-1),2**v]
 elif o=='fano-decode':
  raw=re.search(r'Строку ([01]+)',p)[1];codes=['0','10','11'];ways=[0]*(len(raw)+1);counts=[set() for _ in ways];ways[0]=1;counts[0]={0}
  for i in range(len(raw)):
   for code in codes:
    if raw.startswith(code,i):ways[i+len(code)]+=ways[i];counts[i+len(code)].update(c+1 for c in counts[i])
  assert ways[-1]==1 and len(counts[-1])==1;v=counts[-1].pop()
 elif o=='logic':
  lo,hi,cut=map(int,n);vals=[x for x in range(lo,hi+1) if not(x>cut or x%2!=0)] if ' И ' in p else [x for x in range(lo,hi+1) if not(x<=cut and x%2==0)];v=len(vals);proof=vals
 elif o=='graph-paths':
  edges=re.findall(r'([A-Z]\d*)→([A-Z]\d*)',p);assert len(edges)==len(set(edges));ways=collections.defaultdict(int);ways['A']=1;nodes=set(x for e in edges for x in e);indegree=collections.Counter(b for a,b in edges);queue=[x for x in nodes if not indegree[x]];visited=0
  while queue:
   at=queue.pop();visited+=1
   for a,b in edges:
    if a==at:ways[b]+=ways[a];indegree[b]-=1;queue.extend([b] if indegree[b]==0 else [])
  assert visited==len(nodes);v=ways['D'];proof=[v]
 elif o=='table-count':
  # The column is between colon and period; the threshold occurs in the final condition.
  values=[int(x) for x in re.search(r'значения ([^.]*)\.',p)[1].split(',')];threshold=int(re.search(r'≥ (\d+)',p)[1]);v=len(list(filter(lambda x:not x<threshold,values)));proof=[x for x in values if x>=threshold]
 elif o=='trace':
  first,limit,factor,increment=map(int,n);assert increment==1;states=[first]
  for step in range(100):
   if states[-1]>=limit:break
   states.append(states[-1]*factor+1)
  else:raise ValueError('nonterminating trace')
  v=states[-1];proof=states
 elif o=='infpython-even':
  code=p.split('\n',1)[1].rsplit('\n',1)[0];v=int(run_stdout(code));proof=[v]
 else:raise ValueError(o)
 return ft(v),[ft(x) for x in proof]
def run_stdout(code):
 tree=ast.parse(code);assert not any(isinstance(n,(ast.Import,ast.ImportFrom,ast.While)) for n in ast.walk(tree));assert not any(isinstance(n,ast.Name) and n.id in ['open','exec','eval','__import__'] for n in ast.walk(tree))
 out=io.StringIO()
 with contextlib.redirect_stdout(out):exec(compile(tree,'<independent-owned-example>','exec'),{})
 return out.getvalue().rstrip('\n')

def archive_expected(n,args):
  v=args[0]
  if n==61:return sum(1 for a,b in zip(v,v[1:]) if b>a)
  if n==62:return [v[i+1 if i%2==0 and i+1<len(v) else i-1 if i%2 else i] for i in range(len(v))]
  if n==63:return len({ord(c)+32 if 'A'<=c<='Z' else ord(c) for c in v if 'A'<=c<='Z' or 'a'<=c<='z'})
  if n==64:return max((len(list(g)) for _,g in itertools.groupby(v)),default=0)
  if n==65:return {k:sum(value for key,value in v if key==k) for k in set(k for k,_ in v)}
  if n==66:return len([x for x in v if x%2==0])>1
  if n==67:return [len(m.group()) for m in re.finditer(r'\S+',v)]
  if n==68:return next((i for i in range(len(v)-1,-1,-1) if v[i]%2==0),-1)
  if n==69:return math.prod([x for x in v if x>0]) if any(x>0 for x in v) else 0
  a,b,limit=args;return sorted([max(a,b)-min(a,b),limit])[0]

def own_expected(name,args):
 if name=='runs':return [[key,len(list(group))] for key,group in itertools.groupby(args[0])]
 if name=='merge':return sorted(args[0]+args[1])
 if name=='once':return [v for v in args[0] if args[0].count(v)==1]
 if name=='signs':return [list(filter(lambda x:x<0,args[0])),list(filter(lambda x:x>=0,args[0]))]
 if name=='transpose':return list(map(list,zip(*args[0])))
 if name=='missing':return sorted(set(range(min(args[0]),max(args[0])+1))-set(args[0]))
 if name=='suffix':return max([k for k in range(min(map(len,args))+1) if k==0 or args[0][-k:]==args[1][-k:]])
 if name=='clock':
  t=args[0];return next((h*60+m for h in range(24) for m in range(60) if f'{h:02}:{m:02}'==t),-1)
 if name=='tokens':return sum(int(x) for x in re.findall(r'(?<!\S)[+-]?[0-9]+(?!\S)',args[0]))
 if name=='pair-sums':return [a+b for a,b in zip(args[0],args[0][1:])]
 if name=='stock':return {k: max(0,v-(args[1][k] if k in args[1] else 0)) for k,v in args[0].items()}
 if name=='peak':return next((i for i,(a,b,c) in enumerate(zip(args[0],args[0][1:],args[0][2:]),1) if b>max(a,c)),-1)
 if name=='balanced':return sum(args[0])==0 and all(sum(args[0][:i])>=0 for i in range(1,len(args[0])+1))
 if name=='blocks':return [args[0][min(len(args[0]),(i//args[1]+1)*args[1])-1-(i%args[1])] for i in range(len(args[0]))]
 if name=='nearest':return sorted(args[0],key=lambda v:(abs(v),-v))[0]

current={q['id']:q for q in data['questions']}
for f in data['fixtures']:
 actual,proof=numeric(f)
 assert actual==f['answer'],f['id']
 if f['accepted']:assert actual==current[f['id']]['answer'],f['id']
predictions=0
for q in data['questions']:
 if q.get('python',{}).get('type')=='predict-output':
  assert run_stdout(q['python']['starterCode'])==q['answer'],q['id'];predictions+=1
for fixture in data['programs']:
 fn=fixture['task']['functionName'];tests=fixture['task']['visibleTests']+fixture['task']['hiddenTests']
 scope={};exec(fixture['reference'],scope)
 for t in tests:
  independently=archive_expected(int(fixture['id'][-3:]),t['args']) if fixture['id'].startswith('chat500-') else own_expected(fixture['id'].removeprefix('codex500-python-'),t['args'])
  assert independently==t['expectedReturn'] and type(independently)==type(t['expectedReturn']),fixture['id']+' expected behavior'
  assert scope[fn](*copy.deepcopy(t['args']))==independently,fixture['id']
 for mutant in fixture['mutants']:
  scope={};exec(mutant,scope);failed=False
  for t in tests:
   try:failed|=scope[fn](*copy.deepcopy(t['args']))!=t['expectedReturn']
   except Exception:failed=True
  assert failed,fixture['id']
# Independent calculations for handwritten numerical conditions; inspect actual prompt tokens too.
expect={}
expect['math-remaining-share']=Fraction(250)/(1-Fraction(3,8))/(1-Fraction(1,3))
expect['math-two-discounts']=Fraction(720)-Fraction(720)/(Fraction(4,5)*Fraction(9,10))*Fraction(7,10)
expect['math-boxes-model']=next(x for x in range(1,100) if 4*(x+4)+3*x==51)
rect=[2*(x+x+2) for x in range(1,100) if x*(x+2)==48];assert len(rect)==1;expect['math-rectangle-border']=rect[0]
outcomes=[(a,b) for a in range(5) for b in range(5) if a!=b];expect['math-without-replacement']=Fraction(sum((a<3)!=(b<3) for a,b in outcomes),len(outcomes))
expect['math-weighted-mean']=Fraction(3*12+2*17,5)
expect['informatics-record-padding']=sum((9*5+7)//8 for _ in range(40));assert 2**4<17<=2**5
expect['informatics-packet-overhead']=2500+len(range(0,2500,1000))*24
roots=[b for b in range(4,37) if 2*b+3==17];assert len(roots)==1;expect['informatics-base-equation']=roots[0]
expect['informatics-logic-window']=len([x for x in range(21) if x>=5 and x<12 and x%2])
word='1011010';decoded=[]
while word:
 token=word[:1] if word[0]=='0' else word[:2];assert token in ['0','10','11'];decoded.append(token);word=word[len(token):]
expect['informatics-prefix-word']=decoded.count('10')
expect['informatics-filter-two']=sum(score>=8 and missed<=1 for score,missed in [(7,0),(9,2),(8,1),(5,0),(10,1)])
for suffix,expected in expect.items():
 q=current['codex500-'+suffix];assert ft(expected)==q['answer'],q['id']
print(json.dumps({'numericalOriginals':len(data['fixtures']),'ownNumerical':len(expect),'predictions':predictions,'programs':len(data['programs']),'referenceCases':sum(len(f['task']['visibleTests'])+len(f['task']['hiddenTests']) for f in data['programs']),'mutants':sum(len(f['mutants']) for f in data['programs'])}))
