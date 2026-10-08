import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {indent,insertText,newline} from '../../src/python/editor.ts';
import {validatePythonTask} from '../../src/python/tasks.ts';
import {matchesPythonActual} from '../../src/python/assessment.ts';
import {validateDraft} from '../../src/storage/playground.ts';
import {validateQuestion} from '../../src/domain/backup.ts';
import {isPrivatePath,assertBuildInput} from '../../scripts/content-policy.mjs';

test('Tab preserves Python text, replaces selection and uses four spaces',()=>{
  assert.deepEqual(indent('a=1',2,2),{text:'a=    1',start:6,end:6});
  assert.equal(insertText('print(x)',6,7,'"Привет"').text,'print("Привет")');
});
test('Multi-line indent and outdent preserve selection and blank lines',()=>{
  assert.equal(indent('x\ny\n',0,4).text,'    x\n    y\n');
  assert.equal(indent('    x\n  y\n',0,10,true).text,'x\ny\n');
  assert.equal(indent('x',0,0,true).text,'x');
});
test('Enter retains nesting and adds indentation after colon',()=>{
  assert.deepEqual(newline('if True:',8,8),{text:'if True:\n    ',start:13,end:13});
  assert.equal(newline('    print(1)',12,12).text,'    print(1)\n    ');
});
test('Draft schema has bounded code/stdin and never silently accepts corrupt or future data',()=>{
  const d={schemaVersion:1,code:'print("Привет")',stdin:'Аня',updatedAt:new Date().toISOString()};
  assert.deepEqual(validateDraft(d),d);
  for(const invalid of [{...d,schemaVersion:2},{...d,code:'x'.repeat(100001)},{...d,stdin:1},{...d,extra:1},{...d,updatedAt:'bad'}])assert.throws(()=>validateDraft(invalid));
});
test('Future Python task schema supports all five kinds and rejects unsafe/broken test metadata',()=>{
  for(const type of ['predict-output','write-program','complete-code','fix-bug','write-function'])assert.equal(validatePythonTask({type,starterCode:'',stdin:'',timeout:1000,visibleTests:[],hiddenTests:[{args:[2],expectedReturn:4}],functionName:'double'}).type,type);
  for(const invalid of [{type:'pip-install'},{type:'write-program',timeout:0},{type:'write-function',functionName:'x;print(1)'},{type:'write-program',hiddenTests:[{expectedReturn:Infinity}]},{type:'write-program',hiddenTests:[{code:'print(5)'}]}])assert.throws(()=>validatePythonTask(invalid));
});
test('Question snapshots may carry validated Python metadata without changing historic questions',()=>{
  const q=JSON.parse(fs.readFileSync('src/data/banks/python.json')).questions[0];
  assert.deepEqual(validateQuestion({...q,python:{type:'write-program',expectedOutput:'5'}}).python,{type:'write-program',expectedOutput:'5'});
  assert.throws(()=>validateQuestion({...q,python:{type:'write-program',timeout:-1}}));
  assert.deepEqual(validateQuestion(q),q);
});
test('Output checking preserves meaningful spaces/blank lines and tolerates one final newline',()=>{
  assert.ok(matchesPythonActual({ok:true,stdout:'5\r\n',stderr:''},{expectedOutput:'5'}));
  assert.ok(!matchesPythonActual({ok:true,stdout:' 5\n',stderr:''},{expectedOutput:'5'}));
  assert.ok(!matchesPythonActual({ok:true,stdout:'5\n\n',stderr:''},{expectedOutput:'5'}));
  assert.ok(!matchesPythonActual({ok:false,stdout:'5',stderr:'error'},{expectedOutput:'5'}));
});
test('Function checking compares actual JSON structures, including false/null and different object key order',()=>{
  assert.ok(matchesPythonActual({ok:true,stdout:'',stderr:'',value:{b:[false,null],a:2}},{expectedReturn:{a:2,b:[false,null]}}));
  assert.ok(!matchesPythonActual({ok:true,stdout:'',stderr:'',value:6},{expectedReturn:4}));
});
test('Personal code paths and names cannot become public build inputs',()=>{
  for(const p of ['public/python-drafts/code.json','src/playground-code/test.py','own.private-playground.json']){assert.ok(isPrivatePath(p));assert.throws(()=>assertBuildInput(p));}
});
test('Renamed local draft JSON cannot enter build inputs',()=>{
  fs.mkdirSync('work/playground-policy',{recursive:true});
  const file='work/playground-policy/ordinary.json';fs.writeFileSync(file,JSON.stringify({schemaVersion:1,code:'private',stdin:'',updatedAt:new Date().toISOString()}));
  assert.throws(()=>assertBuildInput(file),/Personal JSON/);
});
