// Own isolated profiles and local static server. Never touch the user's installed PWA.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {createWorker,digest} from '../../scripts/pwa-plugin.mjs';
import {checkContentBank} from '../../scripts/content-bank.mjs';
import {parseBackup} from '../../src/domain/backup.ts';
const {chromium}=createRequire(pathToFileURL(path.join(process.argv[2],'_runtime.js')))('playwright');
const directory=path.resolve(process.argv[3]),runId=new Date().toISOString().replace(/[:.]/g,'-');
const fixtureDir=path.resolve('work/stage3a-fixtures-'+runId);fs.mkdirSync(fixtureDir,{recursive:true});fs.mkdirSync('outputs',{recursive:true});
// Execute only our own locally committed Stage 2 domain code to generate a genuine v1 backup.
for(const name of ['progress','backup']) {
  const source=execFileSync('git',['show','v0.2.0:src/domain/'+name+'.ts'],{encoding:'utf8'});
  fs.writeFileSync(path.join(fixtureDir,name+'.mjs'),ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);
}
const oldProgress=await import(pathToFileURL(path.join(fixtureDir,'progress.mjs')));
const oldBackup=await import(pathToFileURL(path.join(fixtureDir,'backup.mjs')));
const {questions}=checkContentBank(),byId=Object.fromEntries(questions.map(q=>[q.id,q]));
const oldQuestion={...byId.p2,subtopic:null,difficulty:'unspecified',requires:[],related:[]};delete oldQuestion.skills;delete oldQuestion.remediates;
let legacy=oldProgress.recordAttempt(oldProgress.emptyState('stage2-original'),oldQuestion,'12',false,'test','old-wrong',new Date('2026-10-06T09:00:00Z'));
legacy=oldProgress.recordAttempt(legacy,oldQuestion,'120',true,'test','old-correct',new Date('2026-10-07T09:00:00Z'));
for(const topic of new Set(questions.map(q=>q.topic)))legacy.topics[topic]={topic,status:'Уверенно',note:topic==='percent'?'Stage 2 note':'',last:'2026-09-01'};
const legacyText=oldBackup.serializeBackup(legacy,new Date('2026-10-08T10:00:00Z'));assert.equal(JSON.parse(legacyText).backupVersion,1);
const inventory=JSON.parse(fs.readFileSync(path.join(directory,'offline-inventory.json'),'utf8'));
const original=new Map([...inventory.files.map(f=>[f.path,fs.readFileSync(path.join(directory,f.path))]),['sw.js',fs.readFileSync(path.join(directory,'sw.js'))],['offline-inventory.json',fs.readFileSync(path.join(directory,'offline-inventory.json'))]]);
const updated=new Map(original),buildId=digest('stage3a-update-'+inventory.version).slice(0,20);
updated.set('index.html',Buffer.from(updated.get('index.html').toString().replace(/(<meta name="ege-build" content=")[^"]+/,'$1'+buildId)));
const next=createWorker(inventory.files.map(f=>({path:f.path,sha256:digest(updated.get(f.path))})),fs.readFileSync('scripts/sw-template.js','utf8'),buildId);
updated.set('sw.js',Buffer.from(next.source));updated.set('offline-inventory.json',Buffer.from(JSON.stringify({version:next.version,files:next.files})));
let current=original;
const prefix='/ege-2027-offline/';
const server=http.createServer((request,response)=>{
  const pathname=new URL(request.url,'http://local.test').pathname;
  if(pathname==='/seed.html'){response.writeHead(200,{'Content-Type':'text/html'});response.end('<!doctype html><title>Own isolated fixture</title>');return;}
  const file=pathname.startsWith(prefix)?pathname.slice(prefix.length)||'index.html':null,bytes=current.get(file);
  if(!bytes){response.writeHead(404);response.end();return;}
  const mime=file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':file.endsWith('.webmanifest')?'application/manifest+json':file.endsWith('.svg')?'image/svg+xml':file.endsWith('.png')?'image/png':'text/plain';
  response.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-store'});response.end(bytes);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const host=`http://127.0.0.1:${server.address().port}`,base=host+prefix,profile=path.resolve('work/stage3a-browser-profile-'+runId);
const launch=(mobile=false,folder=profile)=>chromium.launchPersistentContext(folder,{channel:'msedge',headless:true,serviceWorkers:'allow',acceptDownloads:true,viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile,...(mobile?{userAgent:'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'}:{})});
let context,page;const checks=[],errors=[],external=new Set();
const watch=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(host+'/'))external.add(r.url());});};
const ready=()=>page.getByText('Полный учебный комплект сохранён:',{exact:false}).waitFor({timeout:15000});
const state=()=>page.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('ege-local-center',1);r.onsuccess=()=>{const db=r.result,q=db.transaction('progress','readonly').objectStore('progress').get('current');q.onsuccess=()=>{resolve(q.result);db.close();};q.onerror=()=>reject(q.error);};}));
async function saved(predicate){for(let i=0;i<100;i++){const value=await state();if(predicate(value))return value;await new Promise(resolve=>setTimeout(resolve,30));}throw new Error('Expected durable state not saved');}
async function seed(){await page.goto(host+'/seed.html');await page.evaluate(data=>new Promise((resolve,reject)=>{const r=indexedDB.open('ege-local-center',1);r.onupgradeneeded=()=>r.result.createObjectStore('progress');r.onsuccess=()=>{const db=r.result,tx=db.transaction('progress','readwrite');tx.objectStore('progress').put(data,'current');tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);};}),legacy);}
const go=async route=>{await page.goto(base+'#'+route);await page.getByRole('heading',{level:1}).waitFor();};
async function answer(value){const s=await state(),session=s.adaptive.sessions.at(-1),q=session.items[session.index].question,count=s.attempts.length;if(q.answerType==='choice')await page.getByRole('radio',{name:value,exact:true}).check();else await page.getByRole('textbox',{name:'Твой ответ',exact:true}).fill(value);await page.getByRole('button',{name:'Проверить ответ',exact:true}).click();await saved(s=>s.attempts.length===count+1);}
async function nextQuestion(){const index=(await state()).adaptive.sessions.at(-1).index;await page.getByRole('button',{name:'Дальше',exact:true}).click();await saved(s=>s.adaptive.sessions.at(-1).index===index+1&&s.adaptive.sessions.at(-1).items[index+1].shownAt);}
async function completeRemaining(){let s=await state(),session=s.adaptive.sessions.at(-1);while(!session.completedAt){const q=session.items[session.index].question;if(session.items[session.index].correct===null){const count=s.attempts.length;await answer(q.answer);await saved(s=>s.attempts.length===count+1);}await page.getByRole('button',{name:session.index===session.items.length-1?'Завершить занятие':'Дальше',exact:true}).click();s=await saved(s=>s.adaptive.sessions.at(-1).completedAt||s.adaptive.sessions.at(-1).index>session.index);session=s.adaptive.sessions.at(-1);}await page.getByRole('heading',{name:'Занятие завершено',exact:true}).waitFor();return s;}
async function start(size,subject){await page.getByRole('combobox',{name:'Размер занятия'}).selectOption(String(size));await page.getByRole('combobox',{name:'Предмет повторения'}).selectOption(subject);const count=(await state()).adaptive.sessions.length;await page.getByRole('button',{name:'Начать повторение'}).click();const s=await saved(s=>s.adaptive.sessions.length===count+1&&s.adaptive.sessions.at(-1).items[0].shownAt);assert.equal(s.adaptive.sessions.at(-1).items.length,size);if(subject!=='all')assert.ok(s.adaptive.sessions.at(-1).items.every(i=>i.question.subject===subject));return s;}
async function importText(text){await page.locator('input[type=file]').setInputFiles({name:'own-progress.json',mimeType:'application/json',buffer:Buffer.from(text)});await page.getByRole('dialog').waitFor();await page.getByLabel('Понимаю, что импорт заменит текущий прогресс').check();await page.getByRole('button',{name:'Заменить данные',exact:true}).click();await page.getByText('Данные восстановлены из резервной копии.',{exact:false}).waitFor();}
function pass(text){checks.push(text);console.log('PASS '+text);}
try {
  context=await launch(false,profile+'-migration-failure');page=context.pages()[0];await seed();
  await page.addInitScript(()=>{const add=IDBObjectStore.prototype.add;IDBObjectStore.prototype.add=function(value,key){if(typeof key==='string'&&key.startsWith('before-migration:'))throw new DOMException('Own quota fixture','QuotaExceededError');return add.call(this,value,key);};});
  await go('settings');await page.getByRole('alert').waitFor();assert.deepEqual(await state(),legacy);await context.close();
  pass('Failed v1-to-v2 migration aborts atomically and retains the original Stage 2 document');
  context=await launch();page=context.pages()[0];watch(page);await seed();await go('settings');await ready();
  const migrated=await state(),expected={...legacy,schemaVersion:2,adaptive:{sessions:[],exposures:[]}};assert.deepEqual(migrated,expected);
  const rollback=await page.evaluate(()=>new Promise(resolve=>{const r=indexedDB.open('ege-local-center',1);r.onsuccess=()=>{const db=r.result,store=db.transaction('progress','readonly').objectStore('progress'),keys=store.getAllKeys();keys.onsuccess=()=>{const key=keys.result.find(k=>String(k).startsWith('before-migration:1-2:')),q=store.get(key);q.onsuccess=()=>{resolve(q.result);db.close();};};};}));assert.deepEqual(rollback,legacy);
  const cached=await page.evaluate(async()=>{const keys=(await caches.keys()).filter(k=>k.startsWith('ege-offline:'));return(await(await caches.open(keys[0])).keys()).length;});assert.equal(cached,inventory.files.length);
  const cdp=await context.newCDPSession(page);assert.deepEqual((await cdp.send('Page.getInstallabilityErrors')).installabilityErrors,[]);await cdp.detach();
  pass('Genuine Stage 2 document safely migrates, recovery copy is exact; all resources precached and installability passes');
  await context.close();context=await launch();await context.setOffline(true);page=context.pages()[0];watch(page);const cold=await page.goto(base+'#review-today');assert.equal(cold.fromServiceWorker(),true);await page.getByRole('heading',{name:'Повторение на сегодня',level:1}).waitFor();assert.equal(await page.getByRole('combobox',{name:'Размер занятия'}).inputValue(),'15');
  pass('Full cold browser restart offline opens the new mode with default 15 questions');
  for(const [size,subject] of [[5,'all'],[10,'math'],[15,'all']]) {
    let s=await start(size,subject);if(subject==='all')assert.ok(new Set(s.adaptive.sessions.at(-1).items.map(i=>i.question.subject)).size>1);
    if(size===5){
      await page.getByText('О задании',{exact:true}).click();await page.getByText('Сгенерированное тренировочное',{exact:true}).waitFor();
      await page.getByRole('button',{name:'Показать подсказку'}).click();await page.getByRole('button',{name:'Скрыть подсказку'}).click();
      const first=s.adaptive.sessions.at(-1).items[0].question;assert.equal(first.answerType,'number');const before=await state();await page.getByRole('textbox',{name:'Твой ответ',exact:true}).fill('па');await page.getByRole('button',{name:'Проверить ответ'}).click();await page.getByRole('alert').filter({hasText:'попытка пока не учитывается'}).waitFor();assert.deepEqual(await state(),before);
      const count=before.attempts.length;await answer('999999');await saved(s=>s.attempts.length===count+1);await page.getByRole('button',{name:'Показать полное решение'}).click();await page.getByText('Разбор решения',{exact:true}).waitFor();
      await page.getByRole('button',{name:'Попробовать ещё раз',exact:true}).click();await answer('999999');await saved(s=>s.attempts.length===count+2);
      await page.getByRole('button',{name:'Попробовать ещё раз',exact:true}).click();await answer(first.answer);s=await saved(s=>s.attempts.length===count+3);assert.equal(s.errors.length,legacy.errors.length+2);assert.equal(s.adaptive.sessions.at(-1).items[0].firstCorrect,false);assert.equal(s.adaptive.sessions.at(-1).items[0].correct,true);
      pass('Separate source/hint/solution controls work offline; invalid format writes nothing; repeated error then correction preserves all attempts');
    }
    s=await completeRemaining();await page.getByRole('heading',{name:'По предметам',exact:true}).waitFor();await page.getByRole('heading',{name:'По темам',exact:true}).waitFor();await page.getByRole('heading',{name:'По навыкам',exact:true}).waitFor();await page.getByRole('heading',{name:'Стоит повторить',exact:true}).waitFor();assert.ok(s.adaptive.sessions.at(-1).completedAt);
    if(size===15)await page.screenshot({path:'outputs/stage3a-desktop-result.png',fullPage:true});
    pass(`${size}-question ${subject==='all'?'mixed':'single-subject'} offline session finishes with subject/topic/skill breakdown and stored result`);
    await page.getByRole('button',{name:'Новое занятие'}).click();
  }
  await start(20,'python');for(let i=0;i<3;i++){const s=await state();await answer(s.adaptive.sessions.at(-1).items[s.adaptive.sessions.at(-1).index].question.answer);await nextQuestion();}
  const partial=await saved(s=>s.adaptive.sessions.at(-1).index===3&&s.adaptive.sessions.at(-1).items[3].shownAt);
  await context.close();context=await launch(true);await context.setOffline(true);page=context.pages()[0];watch(page);await go('review-today');assert.deepEqual(await state(),partial);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'outputs/stage3a-mobile-question.png',fullPage:true});
  pass('Android/Chromium emulation cold-resumes a 20-question Python session at the same step, without duplicate exposure or overflow');
  const finished=await completeRemaining();assert.equal(finished.adaptive.sessions.length,4);assert.ok(finished.adaptive.sessions.every(s=>s.completedAt));assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'outputs/stage3a-mobile-result.png',fullPage:true});
  pass('20-question mobile session completes offline; summary layout is usable at 390 px');
  await go('settings');const downloadEvent=page.waitForEvent('download');await page.getByRole('button',{name:'Экспортировать JSON',exact:true}).click();const download=await downloadEvent;const exported=fs.readFileSync(await download.path(),'utf8');assert.deepEqual(parseBackup(exported).data,finished);assert.equal(JSON.parse(exported).backupVersion,2);
  await importText(legacyText);assert.deepEqual(await state(),expected);await importText(exported);assert.deepEqual(await state(),finished);
  pass('UI imports the genuine Stage 2 backup offline and restores the new v2 backup including sessions, exposures and corrected attempts');
  await context.close();context=await launch(true);await context.setOffline(true);page=context.pages()[0];watch(page);await go('review-today');assert.deepEqual(await state(),finished);await page.getByRole('button',{name:/20 вопросов · Итог/}).click();await page.getByRole('heading',{name:'Занятие завершено',exact:true}).waitFor();
  pass('Full application closure preserves completed results; the saved session summary reopens offline');
  current=updated;await context.setOffline(false);await go('settings');await ready();await page.waitForFunction(async()=>Boolean((await navigator.serviceWorker.getRegistration()).waiting),{timeout:20000});await page.getByText('Новая версия готова.',{exact:false}).waitFor();assert.deepEqual(await state(),finished);
  await context.close();context=await launch(true);await context.setOffline(true);page=context.pages()[0];watch(page);await go('settings');await ready();assert.equal(await page.locator('meta[name=ege-build]').getAttribute('content'),buildId);assert.deepEqual(await state(),finished);
  assert.deepEqual(errors,[]);assert.equal(external.size,0);
  pass('Online event automatically prepares a new complete PWA version; cold activation offline preserves all Stage 3 history');
  fs.writeFileSync('outputs/STAGE3A-BROWSER-CHECKS.json',JSON.stringify({checks,profile,errors,externalRequests:[...external],sessions:finished.adaptive.sessions.length,attempts:finished.attempts.length,exposures:finished.adaptive.exposures.length},null,2));
} finally {if(context)await context.close();await new Promise(resolve=>server.close(resolve));}
