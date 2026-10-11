import ast,json,sys
from fractions import Fraction
from math import isqrt
from itertools import product,permutations
# Owned, reviewed oracle subset: no filesystem/network/code-loader access.
def linear_solution_count(a,b,c,d):
 if a==c:return 0 if b!=d else -1
 return 1
def run_loop(x,bound):
 while x<bound:x=2*x+1
 return x
def count_commands(a,b):
 if a==b:return 1
 if a>b:return 0
 return count_commands(a+1,b)+count_commands(a*2,b)
def min_prefix_length(codes):
 for n in range(1,12):
  if any(all(not s.startswith(c) and not c.startswith(s) for c in codes) for s in map(''.join,product('01',repeat=n))):return n
 raise ValueError('no code')
def minimum_two_codes(old):
 words=[s for n in range(1,7) for s in map(''.join,product('01',repeat=n)) if all(not s.startswith(c) and not c.startswith(s) for c in old)]
 return min(len(a)+len(b) for a in words for b in words if not a.startswith(b) and not b.startswith(a))
def decode_count(bits,codes):
 count=0
 while bits:
  match=[c for c in codes if bits.startswith(c)]
  if len(match)!=1:raise ValueError('ambiguous code')
  bits=bits[len(match[0]):];count+=1
 return count
def digits(n,b):
 if n==0:return [0]
 result=[]
 while n:
  n,r=divmod(n,b);result.append(r)
 return result[::-1]
def path_count(edges,start,end,via=None):
 def walk(node,seen):
  if node==end:return int(via is None or via in seen)
  return sum(walk(b,seen+[b]) for a,b in edges if a==node and b not in seen)
 return walk(start,[start])
def shortest_path(edges,start,end):
 nodes=sorted({v for a,b,w in edges for v in [a,b]})
 candidates=[]
 costs={(a,b):w for a,b,w in edges}
 costs.update({(b,a):w for a,b,w in edges})
 middle=[n for n in nodes if n not in [start,end]]
 for size in range(len(middle)+1):
  for group in permutations(middle,size):
   route=[start,*group,end]
   if all((a,b) in costs for a,b in zip(route,route[1:])):
    candidates.append(sum(costs[a,b] for a,b in zip(route,route[1:])))
 return min(candidates)

safe=dict(digits=digits,path_count=path_count,shortest_path=shortest_path,linear_solution_count=linear_solution_count,Fraction=Fraction,isqrt=isqrt,product=product,permutations=permutations,run_loop=run_loop,count_commands=count_commands,min_prefix_length=min_prefix_length,minimum_two_codes=minimum_two_codes,decode_count=decode_count,range=range,zip=zip,int=int,str=str,len=len,bin=bin,format=format,pow=pow,sum=sum,next=next,min=min,max=max,abs=abs,sorted=sorted,list=list,map=map,all=all,bool=bool)
results=[]
for record in json.load(sys.stdin):
 source=record['verification'];tree=ast.parse(source,mode='eval')
 for node in ast.walk(tree):
  if isinstance(node,ast.Attribute) and node.attr not in ['count','startswith','join']:raise ValueError('not allowed attribute')
  if isinstance(node,ast.Name) and node.id.startswith('_'):raise ValueError('not allowed name')
  if isinstance(node,ast.Call) and isinstance(node.func,ast.Name) and node.func.id not in safe:raise ValueError('not allowed call '+node.func.id+' in '+record['id'])
 result=eval(compile(tree,'<owned-independent-oracle>','eval'),{'__builtins__':{},**safe},{})
 results.append(dict(id=record['id'],value=str(result)))
json.dump(results,sys.stdout,ensure_ascii=False)
