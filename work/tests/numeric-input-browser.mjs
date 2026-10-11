import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { emptyState, recordAttempt } from '../../src/domain/progress.ts';
import { parseBackup, serializeBackup } from '../../src/domain/backup.ts';
import { checkContentBank } from '../../scripts/content-bank.mjs';
const { chromium } = createRequire(pathToFileURL(path.join(process.argv[2], '_runtime.js')))('playwright');
const build = path.resolve(process.argv[3]), prefix = '/ege-2027-offline/';
const profile = path.resolve('work/numeric-profile-' + Date.now());
const server = http.createServer((req, res) => {
  const name = new URL(req.url, 'http://local.test').pathname.slice(prefix.length) || 'index.html';
  if (req.url === '/seed.html') { res.writeHead(200, {'Content-Type':'text/html'}); res.end('<title>Isolated test fixture</title>'); return; }
  const file = path.join(build, name);
  if (name.includes('..') || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  const type = name.endsWith('.html') ? 'text/html' : name.endsWith('.js') || name.endsWith('.mjs') ? 'text/javascript' : name.endsWith('.css') ? 'text/css' : name.endsWith('.wasm') ? 'application/wasm' : name.endsWith('.svg') ? 'image/svg+xml' : 'application/octet-stream';
  res.writeHead(200, {'Content-Type':type}); res.end(fs.readFileSync(file));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const host = 'http://127.0.0.1:' + server.address().port, base = host + prefix;
const launch = () => chromium.launchPersistentContext(profile, {channel:'msedge',headless:true,serviceWorkers:'allow',viewport:{width:390,height:844},isMobile:true,hasTouch:true});
let context, page;
const errors = [], external = new Set(), checks = [];
const pass = name => { checks.push(name); console.log('PASS ' + name); };
const watch = () => {
  page.on('pageerror',e => errors.push(e.message));
  page.on('request',r => {if (/^https?:/.test(r.url()) && !r.url().startsWith(host+'/')) external.add(r.url());});
};
const state = () => page.evaluate(() => new Promise(resolve => {
  const r = indexedDB.open('ege-local-center',1);
  r.onsuccess = () => {const db = r.result, q = db.transaction('progress').objectStore('progress').get('current'); q.onsuccess = () => {db.close();resolve(q.result);};};
}));
async function saved(predicate) {
  for(let i=0;i<300;i++){const s=await state();if(predicate(s))return s;await new Promise(r=>setTimeout(r,25));}
  throw Error('Expected persisted numeric answer');
}
async function insert(field, text, start, end=start, keyboard=false) {
  await field.fill(text); await field.focus();
  await field.evaluate((el,range)=>el.setSelectionRange(...range),[start,end]);
  const key = page.getByRole('button',{name:'Вставить дробную черту',exact:true});
  await key.scrollIntoViewIfNeeded();
  const before = await page.evaluate(()=>({x:scrollX,y:scrollY}));
  if(keyboard){await key.focus();await key.press('Enter');}else await key.tap();
  await page.waitForFunction(()=>document.activeElement?.tagName==='INPUT');
  const value = await field.inputValue();
  assert.deepEqual(await field.evaluate(el=>[el.selectionStart,el.selectionEnd]),[start+1,start+1]);
  assert.deepEqual(await page.evaluate(()=>({x:scrollX,y:scrollY})),before);
  assert.equal(await field.getAttribute('inputmode'),'decimal');
  return value;
}
try {
  const q = checkContentBank().questions.find(q=>q.id==='f6');
  assert.equal(q.answer,'-0.25');
  const initial = recordAttempt(emptyState('numeric-test'),q,'0',false,'test','own-fixture-error');
  context = await launch(); page=context.pages()[0];watch();
  await page.goto(host+'/seed.html');
  await page.evaluate(s=>new Promise(resolve=>{
    const r=indexedDB.open('ege-local-center',1);
    r.onupgradeneeded=()=>r.result.createObjectStore('progress');
    r.onsuccess=()=>{const db=r.result,tx=db.transaction('progress','readwrite');tx.objectStore('progress').put(s,'current');tx.oncomplete=()=>{db.close();resolve();};};
  }),initial);
  await page.goto(base+'#settings');
  await page.getByText('Полный учебный комплект сохранён:',{exact:false}).waitFor({timeout:90000});
  await page.goto(base+'#errors');
  await page.getByRole('button',{name:'Попробовать снова',exact:true}).click();
  let field = page.getByLabel('Твой ответ',{exact:true});
  for(const width of [320,360,390,1100]) {
    await page.setViewportSize({width,height:844});
    for(const dark of [false,true]) {
      await page.evaluate(d=>document.documentElement.classList.toggle('dark',d),dark);
      assert.equal(await insert(field,'14',1),'1/4');
      assert.equal(await insert(field,'-14',2),'-1/4');
      assert.equal(await insert(field,'1 replace 4',1,10),'1/4');
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),width+' overflow');
      const bounds=await page.getByRole('button',{name:'Вставить дробную черту',exact:true}).boundingBox();
      assert.ok(bounds.width>=44 && bounds.height>=44);
    }
  }
  assert.equal(await insert(field,'14',1,1,true),'1/4');
  await page.setViewportSize({width:390,height:420});
  assert.equal(await insert(field,'14',1),'1/4');
  await page.screenshot({path:'outputs/numeric-input-mobile.png',fullPage:true});
  pass('Cursor insertion, selection replacement, touch/keyboard focus, no page scroll jump, decimal keyboard, 320/360/390/desktop and both themes');
  const check=page.getByRole('button',{name:'Проверить ответ',exact:true});
  await field.fill('1'.repeat(300)); await field.focus();
  await field.evaluate(el=>el.setSelectionRange(150,150));
  await page.getByRole('button',{name:'Вставить дробную черту',exact:true}).tap();
  assert.equal(await field.inputValue(),'1'.repeat(300));
  assert.deepEqual(await field.evaluate(el=>[el.selectionStart,el.selectionEnd]),[150,150]);
  assert.equal(await insert(field,'1'.repeat(300),150,151),'1'.repeat(150)+'/'+'1'.repeat(149));
  for(const bad of ['1/0','0/0','1//4','text','1,2,3']) {
    await field.fill(bad);await check.click();await page.getByRole('alert').waitFor();
    assert.equal((await state()).attempts.length,initial.attempts.length);
    assert.equal((await state()).errors.length,initial.errors.length);
  }
  assert.equal(await insert(field,'14',1),'1/4'); await check.click();
  await saved(s=>s.attempts.length===2);
  assert.equal((await state()).attempts.at(-1).answer,'1/4');
  assert.equal(await page.getByRole('button',{name:'Вставить дробную черту',exact:true}).isDisabled(),true);
  await page.getByRole('button',{name:'Попробовать ещё раз',exact:true}).click();
  assert.equal(await insert(field,'-14',2),'-1/4');await check.click();
  const corrected=await saved(s=>s.attempts.at(-1)?.correct);
  assert.equal(corrected.attempts.at(-1).answer,'-1/4');
  assert.deepEqual(parseBackup(serializeBackup(corrected)).data,corrected);
  const originalCard=page.locator('.error-card').filter({has:page.getByText('Мой ответ: 0',{exact:true})});
  await originalCard.getByRole('button',{name:'Попробовать снова',exact:true}).click();
  await originalCard.getByRole('button',{name:'Попробовать снова',exact:true}).click();
  field=page.getByLabel('Твой ответ',{exact:true});await field.fill('-0,25');await check.click();
  await saved(s=>s.attempts.length===corrected.attempts.length+1 && s.attempts.at(-1).correct);
  pass('Malformed fractions and zero denominator do not score; signed fraction and decimal comma grade correctly; raw answer and historical error survive backup');
  await page.goto(base+'#topic/fractions');await page.getByRole('tab',{name:'Практика',exact:true}).click();
  field=page.getByLabel('Твой ответ',{exact:true});await field.waitFor();
  const beforePractice=await state();assert.equal(await insert(field,'14',1),'1/4');await check.click();
  await saved(s=>(s.training?.length??0)>(beforePractice.training?.length??0));
  assert.deepEqual((await state()).attempts,beforePractice.attempts);
  assert.deepEqual((await state()).errors,beforePractice.errors);
  pass('Shared practice input records training without changing independent attempts or error bank');
  await page.getByRole('tab',{name:'Мини-тест',exact:true}).click();
  field=page.getByLabel('Твой ответ',{exact:true});await field.waitFor();
  assert.equal(await insert(field,'14',1),'1/4');
  pass('Independent mini-test uses the same fraction key');
  await page.goto(base+'#exam');await page.getByLabel('Выбрать №4',{exact:true}).check();
  await page.getByLabel('Количество экзаменационных заданий').fill('1');
  await page.getByRole('button',{name:'Начать экзаменационную тренировку',exact:true}).click();
  field=page.getByLabel('Ответ экзаменационного задания');await field.waitFor();
  assert.equal(await insert(field,'14',1),'1/4');await saved(s=>s.exam?.sessions.at(-1).items[0].answer==='1/4');
  await check.click();await page.getByRole('alert').waitFor();
  assert.equal((await state()).exam.sessions.at(-1).items[0].attempts.length,0);
  await page.getByText('Запись через / перед проверкой переведи в десятичную.',{exact:false}).waitFor();
  const route=page.url();
  await context.close();context=await launch();await context.setOffline(true);page=context.pages()[0];watch();
  await page.goto(route);field=page.getByLabel('Ответ экзаменационного задания');await field.waitFor();
  assert.equal(await field.inputValue(),'1/4');
  assert.equal(await insert(field,'-14',2),'-1/4');
  const final=await saved(s=>s.exam.sessions.at(-1).items[0].answer==='-1/4');
  assert.deepEqual(parseBackup(serializeBackup(final)).data,final);
  const inv=JSON.parse(fs.readFileSync(path.join(build,'offline-inventory.json')));
  const cached=await page.evaluate(async()=>{const name=(await caches.keys()).find(n=>n.startsWith('ege-offline:'));return (await(await caches.open(name)).keys()).map(r=>new URL(r.url).pathname.slice('/ege-2027-offline/'.length));});
  assert.deepEqual(cached.sort(),inv.files.map(f=>f.path).sort());
  assert.deepEqual(errors,[]);assert.deepEqual([...external],[]);
  pass('Shared exam input, explicit unchanged exam format, saved draft, cold offline restart, full inventory and no external requests');
  console.log(JSON.stringify({passed:checks.length,errors,external:[...external]}));
} catch(e) { console.error('NUMERIC FAILURE',e); console.error('PAGE',await page?.locator('body').innerText().catch(()=>'')); throw e; } finally {await context?.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
