// Only synthetic progress in a fresh local browser profile. No owner PWA or user data.
import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';
import {emptyState} from '../../src/domain/progress.ts';
import {quickDefaults,startQuick,editQuick,moveQuick,selectQuick} from '../../src/domain/quick-practice.ts';
import {textContext,authorTextGroups} from '../../src/domain/text-context.ts';
import {checkContentBank} from '../../scripts/content-bank.mjs';
import {parseBackup} from '../../src/domain/backup.ts';
const {chromium}=createRequire(pathToFileURL(path.join(process.argv[2],'_runtime.js')))('playwright');
const directory=path.resolve(process.argv[3]),prefix='/ege-2027-offline/',profile=path.resolve('work/chat500-qa-profile-'+Date.now());
const server=http.createServer((req,res)=>{const name=new URL(req.url,'http://local.test').pathname,file=name.startsWith(prefix)?name.slice(prefix.length)||'index.html':null,p=file&&path.resolve(directory,file);if(!p||!p.startsWith(directory+path.sep)||!fs.existsSync(p)){res.writeHead(404);res.end();return;}const ext=path.extname(p),mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.wasm':'application/wasm','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml'}[ext]??'application/octet-stream';res.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-store'});res.end(fs.readFileSync(p));});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const host='http://127.0.0.1:'+server.address().port,base=host+prefix;
const launch=()=>chromium.launchPersistentContext(profile,{channel:'msedge',headless:true,serviceWorkers:'allow',acceptDownloads:true,viewport:{width:390,height:844},isMobile:true,hasTouch:true});
let context,page;const errors=[],external=new Set(),checks=[];
const watch=()=>{page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(host+'/'))external.add(r.url());});};
const state=()=>page.evaluate(()=>new Promise(resolve=>{const r=indexedDB.open('ege-local-center',1);r.onsuccess=()=>{const db=r.result,q=db.transaction('progress').objectStore('progress').get('current');q.onsuccess=()=>{db.close();resolve(q.result);};};}));
const seed=async s=>{await page.evaluate(s=>new Promise(resolve=>{const r=indexedDB.open('ege-local-center',1);r.onsuccess=()=>{const db=r.result,tx=db.transaction('progress','readwrite');tx.objectStore('progress').put(s,'current');tx.oncomplete=()=>{db.close();resolve();};};}),s);await page.goto(base+'#quick-practice');await page.reload();await page.getByRole('heading',{name:'Быстрая практика',exact:true}).waitFor();};
async function saved(predicate){for(let i=0;i<300;i++){const s=await state();if(predicate(s))return s;await new Promise(r=>setTimeout(r,30));}throw Error('QA fixture was not saved');}
const pass=s=>{checks.push(s);console.log('PASS '+s);};
try{
 const qa=JSON.parse(fs.readFileSync('sources/chat500-qa-review.json')),{questions,taxonomy}=checkContentBank(),topics=[{id:'text',subject:'russian',materialStatus:'ready'}],prefs={...quickDefaults(emptyState('0.5.0'),topics),subjects:['russian'],topics:['text'],count:10};
 context=await launch();page=context.pages()[0];watch();await page.goto(base+'#settings');await page.getByText('Полный учебный комплект сохранён:',{exact:false}).waitFor({timeout:90000});
 const c=qa.changes[0];let old=startQuick(emptyState('0.5.0'),prefs,[c.before],'old-qa');old=editQuick(old,'old-qa',c.before.answer);await seed(old);
 for(const option of JSON.parse(c.before.answer))assert.equal(await page.getByLabel(option,{exact:true}).isChecked(),true);
 await context.close();context=await launch();await context.setOffline(true);page=context.pages()[0];watch();await page.goto(base+'#quick-practice');
 for(const option of JSON.parse(c.before.answer))assert.equal(await page.getByLabel(option,{exact:true}).isChecked(),true);
 assert.deepEqual((await state()).quickPractice.snapshots[c.before.id+'@'+c.before.version],c.before);pass('Old answer and full old snapshot survive cold offline reopening after QA changes');
 for(const c of qa.changes.filter(c=>c.after.answerType==='multiple-choice')){
  const q=c.after;await seed(startQuick(emptyState('0.5.0'),prefs,[q],q.id));
  for(const width of [320,360,390]){await page.setViewportSize({width,height:844});for(const dark of [false,true]){await page.evaluate(d=>{document.documentElement.classList.toggle('dark',d);document.documentElement.style.fontSize='125%';},dark);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),q.id+' overflow '+width);}}
  for(const option of q.options)assert.equal(await page.getByLabel(option,{exact:true}).count(),1,q.id);
  for(const option of JSON.parse(q.answer))await page.getByLabel(option,{exact:true}).check();await page.getByRole('button',{name:'Проверить ответ',exact:true}).click();
  const s=await saved(s=>s.training?.length===1);assert.equal(s.training[0].correct,true,q.id);assert.equal(s.training[0].questionVersion,q.version);assert.equal(s.attempts.length,0);assert.notEqual(s.topics.text.status,'Уверенно');
  const event=page.waitForEvent('download');await page.goto(base+'#settings');await page.getByRole('button',{name:'Экспортировать JSON',exact:true}).click();const download=await event;assert.deepEqual(parseBackup(fs.readFileSync(await download.path(),'utf8')).data,s);
 }
 pass('All 15 revised multiple-choice keys pass in the phone UI and offline backup; source quotations fit 320/360/390 px in both themes with increased font');
 const bank=questions.filter(q=>authorTextGroups.flat().includes(q.id)),selection=selectQuick(emptyState('0.5.0'),bank,topics,taxonomy.skills,{...prefs,count:30},'browser-qa');
 assert.equal(new Set(selection.questions.slice(0,15).map(textContext)).size,15);assert.equal(selection.reusedTextQuestions,15);
 await seed(startQuick(emptyState('0.5.0'),{...prefs,count:30},selection.questions,'different-texts'));await page.getByRole('button',{name:'Завершить занятие',exact:true}).click();await page.getByText('Вопросы к одному исходному тексту по возможности разделяются.',{exact:false}).waitFor();pass('Text diversity is additive selection metadata; UI does not report repeated texts as independent method mastery');
 assert.deepEqual(errors,[]);assert.equal(external.size,0);fs.writeFileSync('outputs/CHAT500-QA-BROWSER.json',JSON.stringify({checks,errors,externalRequests:[...external]},null,2));
}finally{if(context)await context.close();await new Promise(r=>server.close(r));}
