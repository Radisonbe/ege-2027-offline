# Runs only the project's newly authored references/mutants in isolated CPython processes.
# Never reads learner code, IndexedDB, drafts, exports or private packages.
import json,pathlib,subprocess,sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
questions=json.loads((ROOT/'src/data/banks/stage3c2-b-python.json').read_text(encoding='utf-8'))['questions']
review={r['id']:r for r in json.loads((ROOT/'sources/stage3c2-b-review.json').read_text(encoding='utf-8'))['questions']}
harness='''import json,sys,io,contextlib,builtins
x=json.load(sys.stdin);out=io.StringIO();ns={}
lines=iter(x.get('stdin','').splitlines());builtins.input=lambda prompt='':next(lines)
try:
 with contextlib.redirect_stdout(out):
  exec(x['source'],ns)
  value=ns[x['function']](*x['args']) if x.get('function') else None
 print(json.dumps({'value':value,'stdout':out.getvalue()}))
except Exception as e:
 print(json.dumps({'error':type(e).__name__+': '+str(e)}))
'''
def run(source,task,test):
 p=subprocess.run([sys.executable,'-I','-c',harness],input=json.dumps(dict(source=source,function=task.get('functionName'),args=test.get('args',[]),stdin=test.get('stdin',''))),capture_output=True,text=True,encoding='utf-8',timeout=4)
 assert p.returncode==0,p.stderr
 v=json.loads(p.stdout)
 return not v.get('error') and (v['value']==test['expectedReturn'] if task.get('functionName') else v['stdout'].strip()==test['expectedOutput'].strip())
report=[]
for q in questions:
 task=q['python'];r=review[q['id']]
 if q['answerType']=='code':
  tests=task['visibleTests']+task['hiddenTests'];assert all(run(q['solution'],task,t) for t in tests),q['id']+' reference'
  for mutant in r['mutants']:assert any(not run(mutant,task,t) for t in tests),q['id']+' surviving mutant'
  report.append(dict(id=q['id'],tests=len(tests),mutantsRejected=2))
 else:
  assert run(task['starterCode'],{},dict(expectedOutput=q['answer'])),q['id']+' prediction'
print(json.dumps(dict(programs=report,predictions=sum(q['answerType']!='code' for q in questions),python=sys.version.split()[0])))
