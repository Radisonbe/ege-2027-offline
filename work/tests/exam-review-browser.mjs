import {execFileSync} from 'node:child_process';import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';
import {emptyExam,startExam,editExam,answerExam,mapKey} from '../../src/domain/exam.ts';
import {emptyState,recordAttempt} from '../../src/domain/progress.ts';import {startTopicTest} from '../../src/domain/study-flow.ts';import {parseBackup,serializeBackup} from '../../src/domain/backup.ts';import {checkContentBank} from '../../scripts/content-bank.mjs';import {checkExamContent} from '../../scripts/check-exam-content.mjs';
const {chromium}=createRequire(pathToFileURL(path.join(process.argv[2],'_runtime.js')))('playwright');
const build=path.resolve(process.argv[3]),old=path.resolve(process.argv[4]),prefix='/ege-2027-offline/',profile=path.resolve('work/exam-review-profile-'+new Date().toISOString().replace(/[:.]/g,'-'));let directory=old;
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://local.test');if(url.pathname==='/seed.html'){res.writeHead(200,{'Content-Type':'text/html'});res.end('<title>Own isolated fixture</title>');return;}const file=url.pathname.startsWith(prefix)?url.pathname.slice(prefix.length)||'index.html':null;const p=file&&path.join(directory,file);if(!p||file.includes('..')||!fs.existsSync(p)){res.writeHead(404);res.end();return;}const mime=/\.(m?js)$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':file.endsWith('.wasm')?'application/wasm':file.endsWith('.webmanifest')?'application/manifest+json':file.endsWith('.svg')?'image/svg+xml':file.endsWith('.png')?'image/png':'application/octet-stream';res.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-store'});res.end(fs.readFileSync(p));});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const host='http://127.0.0.1:'+server.address().port,base=host+prefix;let context,page;const checks=[],errors=[],external=new Set();
const launch=()=>chromium.launchPersistentContext(profile,{channel:'msedge',headless:true,serviceWorkers:'allow',acceptDownloads:true,viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const watch=()=>{page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(host+'/'))external.add(r.url());});};
const go=route=>page.goto(base+'#'+route),ready=()=>page.getByText('Полный учебный комплект сохранён:',{exact:false}).waitFor({timeout:90000});
const state=()=>page.evaluate(()=>new Promise(resolve=>{const r=indexedDB.open('ege-local-center',1);r.onsuccess=()=>{const db=r.result,q=db.transaction('progress').objectStore('progress').get('current');q.onsuccess=()=>{db.close();resolve(q.result);};};}));
async function saved(predicate){for(let i=0;i<300;i++){const s=await state();if(predicate(s))return s;await new Promise(r=>setTimeout(r,25));}throw Error('Expected saved exam state');}
const latest=s=>s.exam.sessions.at(-1),task=(s,i=latest(s).index)=>s.exam.snapshots[latest(s).items[i].key];
const pass=name=>{checks.push(name);console.log('PASS '+name);};
try {
 const legacy = file => JSON.parse(execFileSync('git',['show','44de3f6:'+file],{encoding:'utf8'}));
 const oldMaps=legacy('src/data/exam/maps.json').exams,oldTasks=legacy('src/data/exam/tasks.json').tasks;
 const q=checkContentBank().questions.find(q=>q.id==='b1-python-23');
 let baseline=recordAttempt(emptyState('published-040'),q,'return 0',false,'test','own-040-error');
 baseline=startTopicTest(baseline,q.topic,[q],'own-active-mini-test');
 baseline.codeDrafts={[q.id]:{schemaVersion:1,questionVersion:q.version,code:'def double(x):\n    return x * 2',stdin:'',updatedAt:new Date().toISOString()}};
 baseline.exam=emptyExam();
 for(const m of oldMaps)baseline.exam=startExam(baseline.exam,m,oldTasks.filter(t=>t.question.subject===m.subject),'custom','legacy-'+m.subject,'old-'+m.subject);
 const exam=baseline.exam,s=exam.sessions[0];s.index=s.items.findIndex(i=>exam.snapshots[i.key].id==='exam27-math-4-faces');
 baseline.exam=answerExam(editExam(exam,s.id,s.index,'0'),s.id,s.index,'own-first-error');
 baseline.exam=answerExam(editExam(baseline.exam,s.id,s.index,'0.25'),s.id,s.index,'own-correction');
 baseline.exam.sessions[0].items[s.index].draft='Own preserved scratch work';
 const oldBackup=JSON.parse(JSON.stringify(baseline));
 const historicalBackup=JSON.parse(serializeBackup(oldBackup));historicalBackup.appVersion='0.4.0';
 context=await launch();page=context.pages()[0];watch();await page.goto(host+'/seed.html');
 await page.evaluate(s=>new Promise(resolve=>{const r=indexedDB.open('ege-local-center',1);r.onupgradeneeded=()=>r.result.createObjectStore('progress');r.onsuccess=()=>{const db=r.result,tx=db.transaction('progress','readwrite');tx.objectStore('progress').put(s,'current');tx.oncomplete=()=>{db.close();resolve();};};}),baseline);
 await go('settings');await ready();assert.deepEqual(await state(),baseline);
 directory=build;await page.evaluate(async()=>{await(await navigator.serviceWorker.getRegistration()).update();});
 await page.getByText('Новая версия готова.',{exact:false}).waitFor({timeout:90000});
 await context.close();context=await launch();await context.setOffline(true);page=context.pages()[0];watch();
 await go('exam/session/old-math');await page.getByLabel('Ответ экзаменационного задания').waitFor();
 assert.deepEqual(await state(),baseline);assert.match(await page.locator('.exam-prompt').innerText(),/восьмигранного кубика/);
 assert.equal(await page.getByRole('button',{name:'Вставить дробную черту',exact:true}).count(),0);
 assert.equal(await page.getByRole('button',{name:'Вставить минус',exact:true}).count(),1);
 assert.match(await page.getByRole('status').innerText(),/Первый ответ: ошибка/);
 for(const [subject,id]of [['russian','old-russian'],['informatics','old-informatics']]){
  await go('exam/session/'+id);await page.getByLabel('Ответ экзаменационного задания').waitFor();assert.deepEqual(await state(),baseline);
 }
 pass('Update from reviewed 44de3f6 activates cold offline; all 36 old snapshots, first error/correction, draft, active mini-test and 0.4.0 learning history remain exact');
 await go('exam');await page.getByLabel('Выбрать №4',{exact:true}).check();const positionCount=checkExamContent().tasks.filter(t=>t.positionId==='ege-math-2027-4').length;assert.ok(positionCount<=50);await page.getByLabel('Количество экзаменационных заданий').fill(String(positionCount));
 await page.getByRole('button',{name:'Начать экзаменационную тренировку',exact:true}).click();
 let next=await saved(s=>s.exam.sessions.length===4),session=next.exam.sessions.at(-1);
 assert.equal(next.exam.maps[session.mapKey].version,'project-2026-10-09.2');
 assert.equal(session.items.length,positionCount);
 const face=session.items.findIndex(i=>next.exam.snapshots[i.key].id==='exam27-math-4-faces');
 assert.ok(face>=0,'Reviewed face task is included in the complete position bank');
 await page.getByRole('button',{name:'К заданию '+(face+1),exact:true}).click();
 await saved(s=>s.exam.sessions.at(-1).index===face);assert.match(await page.locator('.exam-prompt').innerText(),/восьмигранной игральной кости/);
 next=await state();assert.equal(next.exam.snapshots[session.items[face].key].version,2);
 assert.deepEqual(next.exam.sessions.slice(0,3),baseline.exam.sessions);
 for(const width of [320,360,390,1100]){await page.setViewportSize({width,height:844});for(const dark of [false,true]){await page.evaluate(d=>{document.documentElement.classList.toggle('dark',d);document.documentElement.style.fontSize='125%';},dark);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}}
 await page.setViewportSize({width:390,height:420});await page.getByLabel('Ответ экзаменационного задания').fill('14');await page.getByLabel('Ответ экзаменационного задания').evaluate(el=>{el.focus();el.setSelectionRange(0,1);});
 await page.getByRole('button',{name:'Вставить минус',exact:true}).tap();assert.equal(await page.getByLabel('Ответ экзаменационного задания').inputValue(),'−4');
 await page.screenshot({path:'outputs/exam-review-mobile.png',fullPage:true});
 pass('New .2 maps and v2 tasks coexist with immutable old snapshots; navigation, 320/360/390/desktop, enlarged text, both themes and minus insertion work');
 const final=await saved(s=>s.exam.sessions.at(-1).items[face].answer==='−4');await go('settings');
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Экспортировать JSON',exact:true}).click();
 const text=fs.readFileSync(await(await download).path(),'utf8');assert.deepEqual(parseBackup(text).data,final);
 await page.locator('input[type=file]').setInputFiles({name:'own-old-exam.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(historicalBackup))});
 await page.getByLabel('Понимаю, что импорт заменит текущий прогресс').check();await page.getByRole('button',{name:'Заменить данные',exact:true}).click();await page.getByText('Данные восстановлены из резервной копии.',{exact:false}).waitFor();assert.deepEqual(await state(),baseline);
 await page.locator('input[type=file]').setInputFiles({name:'own-new-exam.json',mimeType:'application/json',buffer:Buffer.from(text)});await page.getByLabel('Понимаю, что импорт заменит текущий прогресс').check();await page.getByRole('button',{name:'Заменить данные',exact:true}).click();await page.getByText('Данные восстановлены из резервной копии.',{exact:false}).waitFor();assert.deepEqual(await state(),final);
 pass('New backup round-trips current and archived structures, attempts and unfinished answers');
 assert.deepEqual(errors,[]);assert.equal(external.size,0);
} finally {await context?.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
