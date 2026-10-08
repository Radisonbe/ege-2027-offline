// Isolated test profiles, local servers, synthetic progress. No user's installed PWA.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {checkContentBank} from '../../scripts/content-bank.mjs';
import {emptyState,recordAttempt} from '../../src/domain/progress.ts';
import {beginReview,selectReview,showReviewQuestion,answerReview} from '../../src/domain/adaptive.ts';
const {chromium}=createRequire(pathToFileURL(path.join(process.argv[2],'_runtime.js')))('playwright');
const directory=path.resolve(process.argv[3]),oldDirectory=path.resolve(process.argv[4]);
const runId=new Date().toISOString().replace(/[:.]/g,'-'),profile=path.resolve('work/playground-profile-'+runId),fixtures=path.resolve('work/playground-fixtures-'+runId);
fs.mkdirSync(fixtures,{recursive:true});
const prefix='/ege-2027-offline/';
function resources(dir){const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(d+'/'+e.name):[[path.relative(dir,d+'/'+e.name).replaceAll('\\','/'),fs.readFileSync(d+'/'+e.name)]]);return new Map(walk(dir));}
const updated=resources(directory),previous=resources(oldDirectory);let current=previous;
const modules=new Map();
for(const name of ['runner','tasks','assessment','grading']){
 let source=fs.readFileSync('src/python/'+name+'.ts','utf8');
 if(name==='runner')source=source.replace("import source from './worker.js?raw';",'const source='+JSON.stringify(fs.readFileSync('src/python/worker.js','utf8'))+';').replace("import sandbox from './sandbox.html?raw';",'const sandbox='+JSON.stringify(fs.readFileSync('src/python/sandbox.html','utf8'))+';').replaceAll('import.meta.env.BASE_URL',JSON.stringify(prefix));
 source=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replaceAll(/from ['"]\.\/(runner|tasks|assessment)(?:\.ts)?['"]/g,(_m,n)=>"from '/harness/"+n+".mjs'");
 modules.set('/harness/'+name+'.mjs',source);
 if(name==='runner')modules.set('/harness/runner-nojspi.mjs',source.replace(JSON.stringify(fs.readFileSync('src/python/worker.js','utf8')),JSON.stringify("delete WebAssembly.Suspending;delete WebAssembly.promising;\n"+fs.readFileSync('src/python/worker.js','utf8'))));
}
const server=http.createServer((request,response)=>{
 const url=new URL(request.url,'http://local.test'),p=url.pathname;
 if(p==='/seed.html'||p==='/harness.html'){response.writeHead(200,{'Content-Type':'text/html'});response.end('<!doctype html><title>Own isolated Python test</title>');return;}
 if(modules.has(p)){response.writeHead(200,{'Content-Type':'text/javascript'});response.end(modules.get(p));return;}
 const file=p.startsWith(prefix)?p.slice(prefix.length)||'index.html':null,bytes=current.get(file);
 if(!bytes){response.writeHead(404);response.end();return;}
 const mime=file.endsWith('.mjs')||file.endsWith('.js')?'text/javascript':file.endsWith('.wasm')?'application/wasm':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':file.endsWith('.webmanifest')?'application/manifest+json':file.endsWith('.svg')?'image/svg+xml':file.endsWith('.png')?'image/png':'application/octet-stream';
 response.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-store'});response.end(bytes);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port,base=origin+prefix;
const launch=(mobile=false,folder=profile,extra={})=>chromium.launchPersistentContext(folder,{channel:'msedge',headless:true,serviceWorkers:'allow',acceptDownloads:true,viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile,...extra});
let context,page;const checks=[],errors=[],external=new Set(),timings={};
const watch=()=>{page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(origin+'/'))external.add(r.url());});};
const state=()=>page.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('ege-local-center',1);r.onsuccess=()=>{const db=r.result,q=db.transaction('progress','readonly').objectStore('progress').get('current');q.onsuccess=()=>{resolve(q.result);db.close();};q.onerror=()=>reject(q.error);};}));
const readyKit=()=>page.getByText('Полный учебный комплект сохранён:',{exact:false}).waitFor({timeout:30000});
const readyPython=()=>page.getByText('Python 3.14.2 готов',{exact:true}).waitFor({timeout:30000});
const go=async route=>{await page.goto(base+'#'+route);await page.getByRole('heading',{level:1}).waitFor();};
async function run(code){await readyPython();await page.getByLabel('Код Python',{exact:true}).fill(code);await page.getByRole('button',{name:'Запустить',exact:true}).click();await readyPython();return {out:await page.getByLabel('Вывод stdout',{exact:true}).textContent(),err:await page.getByLabel('Ошибки Python',{exact:true}).textContent()};}
async function imported(text){await page.locator('input[type=file]').setInputFiles({name:'own-backup.json',mimeType:'application/json',buffer:Buffer.from(text)});await page.getByRole('dialog').waitFor();await page.getByLabel('Понимаю, что импорт заменит текущий прогресс').check();await page.getByRole('button',{name:'Заменить данные',exact:true}).click();await page.getByText('Данные восстановлены из резервной копии.',{exact:false}).waitFor();}
function pass(s){checks.push(s);console.log('PASS '+s);}
const {questions,taxonomy}=checkContentBank(),skills=taxonomy.skills,q=questions.find(q=>q.id==='p2');
let stable=recordAttempt(emptyState('stage3a-control'),q,'12',false,'test','old-wrong',new Date('2026-10-05T09:00:00Z'));
stable.topics.percent.note='Own migration control';
stable=beginReview(stable,selectReview(stable,questions,skills,5).items,5,'all','old-session');stable=showReviewQuestion(stable,'old-session');stable=answerReview(stable,'old-session','120',true,'old-adaptive-answer');
for(const [tag,name] of [['v0.3.0','stage3-backup'],['v0.2.0','stage2-backup']]){
 const source=execFileSync('git',['show',tag+':src/domain/backup.ts'],{encoding:'utf8'});
 fs.writeFileSync(fixtures+'/'+name+'.mjs',ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);
}
const backup3=(await import(pathToFileURL(fixtures+'/stage3-backup.mjs'))).serializeBackup(stable);
fs.writeFileSync(fixtures+'/stage2-progress.mjs',ts.transpileModule(execFileSync('git',['show','v0.2.0:src/domain/progress.ts'],{encoding:'utf8'}),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);
const stage2=await import(pathToFileURL(fixtures+'/stage2-progress.mjs')),oldQuestion={...q,subtopic:null,difficulty:'unspecified',requires:[],related:[]};delete oldQuestion.skills;delete oldQuestion.remediates;
const legacy=stage2.recordAttempt(stage2.emptyState('stage2-control'),oldQuestion,'12',false,'test','old-stage2',new Date('2026-10-05T09:00:00Z'));
const backup2=(await import(pathToFileURL(fixtures+'/stage2-backup.mjs'))).serializeBackup(legacy);
try{
 context=await launch();page=context.pages()[0];watch();await page.goto(origin+'/seed.html');await page.evaluate(data=>new Promise((resolve,reject)=>{const r=indexedDB.open('ege-local-center',1);r.onupgradeneeded=()=>r.result.createObjectStore('progress');r.onsuccess=()=>{const db=r.result,tx=db.transaction('progress','readwrite');tx.objectStore('progress').put(data,'current');tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);};}),stable);
 await go('settings');await readyKit();assert.deepEqual(await state(),stable);
 await context.close();context=await launch();page=context.pages()[0];watch();await go('settings');await readyKit();await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
 current=updated;await context.setOffline(true);await context.setOffline(false);await page.reload();
 await page.getByText('Новая версия готова.',{exact:false}).waitFor({timeout:30000});assert.deepEqual(await state(),stable);
 await context.close();context=await launch();await context.setOffline(true);page=context.pages()[0];watch();await go('settings');await readyKit();await page.getByText('Версия 0.3.1-dev',{exact:true}).waitFor();assert.deepEqual(await state(),stable);
 const inventory=JSON.parse(updated.get('offline-inventory.json'));assert.ok(inventory.files.some(f=>f.path.endsWith('pyodide.asm.wasm')));
 const cached=await page.evaluate(async()=>{const names=await caches.keys();let bytes=0,items=0;for(const name of names){const cache=await caches.open(name);for(const req of await cache.keys()){items++;bytes+=(await(await cache.match(req)).arrayBuffer()).byteLength;}}return {bytes,items};});
 pass('Stage 3A→3A.1 SW waits for complete runtime, activates cold offline, and preserves attempts/errors/notes/Adaptive Review exactly');
 const start=performance.now();await go('python-playground');await readyPython();timings.desktopColdMs=performance.now()-start;
 const cases=[['hello','print("Hello")','Hello\n'],['variables','a=5\nb=7\nprint(a+b)','12\n'],['for','for i in range(5):\n    print(i)','0\n1\n2\n3\n4\n'],['list','nums=[3,1,5]\nprint(max(nums))','5\n'],['dictionary','player={"hp":100}\nplayer["hp"]-=25\nprint(player["hp"])','75\n'],['function','def square(x):\n    return x*x\n\nprint(square(6))','36\n'],['unicode','print("Привет, мир")','Привет, мир\n'],['stdlib','import math, json, random, itertools, statistics\nprint(math.sqrt(16))\nprint(json.loads("[1,2]")[1])','4.0\n2\n'],['partial stdout','print("часть",end="")','часть']];
 for(const [name,code,out] of cases){const actual=await run(code);assert.equal(actual.out,out,name);assert.equal(actual.err,'Ошибок нет.',name);pass('Real Python offline: '+name);}
 for(const [name,code] of [['SyntaxError','if True print(1)'],['NameError','print(unknown_variable)'],['ZeroDivisionError','print(1/0)'],['function exception','def broken():\n    return 1/0\nbroken()']]){const actual=await run(code);assert.ok(actual.err.includes(name==='function exception'?'ZeroDivisionError':name));assert.ok(actual.err.includes('playground.py'));pass('Real traceback with source line: '+name);}
 await readyPython();await page.getByLabel('Код Python').fill('name=input("Как тебя зовут? ")\nprint("Привет,",name)');await page.getByRole('button',{name:'Запустить',exact:true}).click();await page.getByLabel('Как тебя зовут? ',{exact:true}).fill('Аня');await page.getByRole('button',{name:'Передать ввод',exact:true}).click();await readyPython();assert.equal(await page.getByLabel('Вывод stdout').textContent(),'Привет, Аня\n');
 pass('Interactive input() suspends Python, accepts Unicode and resumes without SharedArrayBuffer');
 await page.getByLabel('Код Python').fill('input()');await page.getByRole('button',{name:'Запустить',exact:true}).click();await page.getByRole('button',{name:'Завершить ввод (EOF)',exact:true}).click();await readyPython();assert.ok((await page.getByLabel('Ошибки Python').textContent()).includes('EOFError'));pass('Interactive EOF produces a real EOFError');
 await page.getByLabel('Отвечать на input() во время выполнения').uncheck();await page.getByLabel('Предварительный stdin — одна строка на каждый input()').fill('Иван\n7');const stdinRun=await run('name=input("Имя: ")\nn=int(input("Число: "))\nprint(name,n+1)');assert.equal(stdinRun.out,'Имя: Число: Иван 8\n');
 pass('Prefilled stdin handles sequential input calls and prompts');
 const eof=await run('input()\ninput()\ninput()');assert.ok(eof.err.includes('EOFError'));pass('Missing stdin produces the real EOFError');
 await page.getByLabel('Код Python').fill('while True:\n    pass');await page.getByRole('button',{name:'Запустить',exact:true}).click();await page.getByRole('button',{name:'Остановить',exact:true}).click();await readyPython();assert.equal((await run('print(42)')).out,'42\n');pass('Manual stop terminates an infinite Worker and clean replacement runs again');
 await page.getByLabel('Код Python').fill('while True:\n    pass');await page.getByRole('button',{name:'Запустить',exact:true}).click();await page.getByText('Достигнут лимит времени выполнения.',{exact:true}).waitFor({timeout:15000});await readyPython();assert.equal((await run('print(43)')).out,'43\n');pass('Ten-second timeout keeps UI responsive and recovers the runner');
 const stress=await run('for i in range(100000):\n    print("x"*50)');assert.ok(stress.out.length<=65536);pass('Excessive stdout is bounded and cannot flood the UI indefinitely');
 const privateCheck=await run('import js\nprint(hasattr(js,"document"))\nprint(hasattr(js,"indexedDB"))\nprint(hasattr(js,"fetch"))');assert.equal(privateCheck.out,'False\nFalse\nFalse\n');
 const opaqueCheck=await run('from _playground_input import read\ng=read.constructor("return globalThis")()\nprint(g.location.origin)\ntry:\n    g.indexedDB.open("ege-local-center")\nexcept Exception as e:\n    print("Storage blocked")');assert.ok(opaqueCheck.out.includes('null\nStorage blocked\n'));pass('Python has no app DOM/API bridge; even JS reflection remains opaque and cannot access app IndexedDB');
 assert.deepEqual(await state(),stable);pass('Playground execution, errors and timeouts do not alter learning progress or error bank');
 await page.getByRole('button',{name:'Очистить вывод'}).click();assert.equal(await page.getByLabel('Вывод stdout').textContent(),'Здесь появится вывод print().');
 await run('print("Сохранённый код")');await page.getByText('Код сохранён на этом устройстве.',{exact:true}).waitFor();await context.close();context=await launch(true);await context.setOffline(true);page=context.pages()[0];watch();const mobileStart=performance.now();await go('python-playground');await readyPython();timings.mobileColdMs=performance.now()-mobileStart;assert.equal(await page.getByLabel('Код Python').inputValue(),'print("Сохранённый код")');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.getByLabel('Код Python').fill('if True:');await page.getByLabel('Код Python').press('End');await page.getByLabel('Код Python').press('Enter');await page.getByLabel('Код Python').press('Tab');await page.getByLabel('Код Python').press('Shift+Tab');assert.equal(await page.getByLabel('Код Python').inputValue(),'if True:\n    ');
 await page.getByRole('button',{name:'Вставить (',exact:true}).click();assert.ok((await page.getByLabel('Код Python').inputValue()).endsWith('('));
 await page.getByLabel('Код Python').fill('print('+JSON.stringify('Длинная строка'.repeat(100))+')\n'+Array.from({length:40},(_,i)=>'# Строка '+i).join('\n'));assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await context.setOffline(false);await page.setViewportSize({width:390,height:450});await page.getByLabel('Код Python').focus();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.setViewportSize({width:390,height:844});await context.setOffline(true);await run('print("Привет, Android")');await page.screenshot({path:'outputs/playground-mobile.png',fullPage:true});
 pass('390 px, reduced keyboard-height viewport, long code, Tab/Shift+Tab/Enter/mobile keys and cold draft persistence pass');
 assert.equal((await run('total=0\ni=0\nwhile i<3:\n    if i==1:\n        total+=10\n    elif i==2:\n        total+=20\n    else:\n        total+=1\n    i+=1\ndef pair(x):\n    return (x,x+1)\ntry:\n    int("x")\nexcept ValueError:\n    print(total,pair(2),float("1.5"),bool(1))')).out,'31 (2, 3) 1.5 True\n');await run('print("Привет, Android")');pass('while/if/elif/else/tuple/float/bool/try-except execute with real Python semantics');
 await go('settings');await imported(backup2);assert.equal((await state()).schemaVersion,2);await imported(backup3);assert.deepEqual(await state(),stable);await go('python-playground');await readyPython();assert.equal(await page.getByLabel('Код Python').inputValue(),'print("Привет, Android")');pass('Genuine Stage 2 and Stage 3A backups import; isolated draft survives progress replacement');
 // Test-only harness serves transpiled source; expected answers are never transmitted to the worker.
 await context.setOffline(false);await page.goto(origin+'/harness.html');
 const graded=await page.evaluate(async()=>{const {gradePython}=await import('/harness/grading.mjs');return {output:await gradePython('print(2+3)',{type:'write-program',expectedOutput:'5'}),fn:await gradePython('def double(x):\n    return x*2',{type:'write-function',functionName:'double',hiddenTests:[{args:[2],expectedReturn:4},{args:[-3],expectedReturn:-6}]}),wrong:await gradePython('def double(x):\n    return x+1',{type:'write-function',functionName:'double',hiddenTests:[{args:[2],expectedReturn:4}]})};});assert.ok(graded.output.every(r=>r.passed));assert.ok(graded.fn.every(r=>r.passed));assert.ok(graded.wrong.every(r=>!r.passed));pass('The same isolated runner grades stdout and hidden function calls; wrong functions fail');
 const paused=await page.evaluate(async()=>{const {PythonRunner}=await import('/harness/runner.mjs');return await new Promise(resolve=>{let stdout='';const r=new PythonRunner(e=>{if(e.type==='ready')r.run({code:'print(input())',stdin:'',interactive:true,timeout:100});else if(e.type==='input')setTimeout(()=>r.input('Миша'),250);else if(e.type==='stdout')stdout+=e.text;else if(['done','load-error','terminated'].includes(e.type)){r.dispose();resolve({stdout,type:e.type});}});r.initialize();});});assert.deepEqual(paused,{stdout:'Миша\n',type:'done'});pass('Execution timeout pauses while the user waits to supply input');
 const none=await page.evaluate(async()=>{const {gradePython}=await import('/harness/grading.mjs');return gradePython('def nothing():\n    return None',{type:'write-function',functionName:'nothing',hiddenTests:[{args:[],expectedReturn:null}]});});assert.ok(none.every(r=>r.passed));pass('Function checking handles Python None as JSON null');
 await go('settings');await readyKit();await page.evaluate(async()=>{window._testRunner=(await import('/harness/runner-nojspi.mjs')).PythonRunner;});await context.setOffline(true);
 const fallback=await page.evaluate(()=>new Promise(resolve=>{let out='',interactive;const r=new window._testRunner(e=>{if(e.type==='ready'){interactive=e.interactive;r.run({code:'print(input())',stdin:'Ольга',interactive:false});}else if(e.type==='stdout')out+=e.text;else if(['done','load-error','terminated'].includes(e.type)){r.dispose();resolve({out,interactive,type:e.type,error:e.text});}});r.initialize();}));assert.deepEqual(fallback,{out:'Ольга\n',interactive:false,type:'done',error:undefined});pass('Simulated absence of JSPI still runs real Python/input offline using prefilled stdin');
 assert.deepEqual(errors,[]);assert.equal(external.size,0);
 fs.writeFileSync('outputs/PLAYGROUND-BROWSER-CHECKS.json',JSON.stringify({checks,timings,cached,errors,externalRequests:[...external],profile},null,2));
}finally{if(context)await context.close();await new Promise(r=>server.close(r));}
