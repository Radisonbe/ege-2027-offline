// Integration checks run in a separate Chromium profile; never use the user's browser data.
// Usage: node work/tests/browser-checks.mjs <bundled-node-modules> [local-production-url]
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const { chromium } = createRequire(pathToFileURL(path.join(process.argv[2], '_runtime.js')))('playwright');
const origin = process.argv[3] ?? 'http://127.0.0.1:4180';
const runId = new Date().toISOString().replace(/[:.]/g,'-');
const profile = path.resolve('work/browser-profile-' + runId);
const results = [], failures = [], external = new Set();
const launch = () => chromium.launchPersistentContext(profile, {channel:'msedge',headless:true,viewport:{width:1440,height:1000},acceptDownloads:true,serviceWorkers:'allow'});
let context, page;
async function check(name, action) { await action(); results.push(name); console.log('PASS ' + name); }
function watch(page) {
  page.on('pageerror', error => failures.push(error.message));
  page.on('request', request => { if (/^https?:/.test(request.url()) && !request.url().startsWith(origin)) external.add(request.url()); });
}
async function getState(target = page) {
  return target.evaluate(() => new Promise((resolve,reject) => {
    const request = indexedDB.open('ege-local-center',1);
    request.onsuccess = () => { const db = request.result, value = db.transaction('progress','readonly').objectStore('progress').get('current'); value.onsuccess = () => { resolve(value.result); db.close(); }; value.onerror = () => reject(value.error); };
  }));
}
async function keys(target = page) {
  return target.evaluate(() => new Promise(resolve => {
    const request = indexedDB.open('ege-local-center',1); request.onsuccess = () => { const db=request.result,r=db.transaction('progress','readonly').objectStore('progress').getAllKeys(); r.onsuccess=()=>{resolve(r.result);db.close();}; };
  }));
}
async function saved(predicate) {
  for (let i=0;i<50;i++) { const s=await getState(); if (predicate(s)) return s; await new Promise(resolve=>setTimeout(resolve,50)); }
  throw new Error('Progress was not durably saved');
}
async function go(route) { await page.goto(origin + '/#' + route); await page.getByRole('heading',{level:1}).waitFor(); }
async function ready() { await page.getByText('Полный учебный комплект сохранён:',{exact:false}).waitFor({timeout:15000}); }
async function input(answer) { await page.getByRole('textbox',{name:'Твой ответ',exact:true}).fill(answer); await page.getByRole('button',{name:'Проверить ответ',exact:true}).click(); }
async function importText(text) { await page.locator('input[type=file]').setInputFiles({name:'progress.json',mimeType:'application/json',buffer:Buffer.from(text)}); }
try {
  context = await launch(); page = context.pages()[0]; watch(page);
  await check('Online first load fully precaches all 8 resources and installable manifest has required icons', async () => {
    await go('settings'); await ready();
    const inventory = JSON.parse(fs.readFileSync('dist/offline-inventory.json','utf8'));
    const cache = await page.evaluate(async () => { const names=(await caches.keys()).filter(n=>n.startsWith('ege-offline:')); const c=await caches.open(names[0]); return (await c.keys()).map(r=>new URL(r.url).pathname.slice(1)); });
    assert.deepEqual(cache.sort(),inventory.files.map(f=>f.path).sort());
    const cdp = await context.newCDPSession(page); const errors=await cdp.send('Page.getInstallabilityErrors'); assert.deepEqual(errors.installabilityErrors,[]); await cdp.detach();
  });
  await check('Entire browser restarts offline; a previously unopened filled topic is available', async () => {
    await context.close(); context=await launch(); await context.setOffline(true); page=context.pages()[0];watch(page);
    const response = await page.goto(origin + '/#home'); assert.equal(response.fromServiceWorker(),true);
    await page.getByRole('heading',{level:1}).waitFor(); assert.ok(await page.getByText('Офлайн',{exact:true}).isVisible());
    await go('topic/percent'); await page.getByText('Сначала назови целое',{exact:true}).waitFor();
  });
  await check('Invalid answer format creates no attempt; wrong and corrected answers, hint and solution work offline', async () => {
    await page.getByRole('tab',{name:'Мини-тест'}).click(); await input('па');
    await page.getByRole('alert').filter({hasText:'попытка пока не учитывается'}).waitFor(); assert.equal(await getState(),undefined);
    await input('12'); await page.getByText('Подсказка:',{exact:true}).waitFor(); await saved(s=>s?.attempts.length===1);
    await page.getByRole('button',{name:'Показать полное решение'}).click(); await page.getByText('Разбор решения',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Попробовать ещё раз',exact:true}).click(); await input('120'); await saved(s=>s?.attempts.length===2);
    await page.getByRole('button',{name:'Следующий вопрос'}).click(); await input('920'); await saved(s=>s?.attempts.length===3);
    await page.getByRole('textbox',{name:'Моя заметка по теме'}).fill('Офлайн-заметка для проверки'); await saved(s=>s?.topics.percent.note==='Офлайн-заметка для проверки');
  });
  const offlineState = await getState();
  await check('Another full offline browser restart retains IndexedDB attempts, errors, note, history and reviews', async () => {
    await context.close(); context=await launch();await context.setOffline(true);page=context.pages()[0];watch(page);
    await go('progress'); assert.deepEqual(await getState(),offlineState);
    assert.equal(offlineState.attempts.length,3);assert.equal(offlineState.errors.length,1);assert.equal(offlineState.attempts.filter(a=>a.correct).length,2);
  });
  await check('All 67 pages and all 19 filled modules open offline; errors, review and short sessions render', async () => {
    const data=JSON.parse(fs.readFileSync('src/data/reference.json','utf8'));
    for (const topic of data.topics) { await go('topic/'+topic.id); assert.equal(await page.getByRole('heading',{level:1}).textContent(),topic.title); if (topic.live) await page.getByRole('tab',{name:'Мини-тест'}).waitFor(); else await page.getByText('План · урок ещё не добавлен',{exact:true}).waitFor(); }
    for (const route of ['errors','review','easy','session','progress']) await go(route);
    assert.equal(external.size,0); assert.deepEqual(await getState(),offlineState);
  });
  await check('Mobile home, subject, mini-test, settings and import dialog do not overflow at 390 px', async () => {
    await page.setViewportSize({width:390,height:844});
    for (const route of ['home','math','topic/py-variables','settings']) {
      await go(route); if (route.startsWith('topic/')) await page.getByRole('tab',{name:'Мини-тест'}).click();
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), 'Overflow in ' + route);
    }
    await page.screenshot({path:'outputs/stage2-mobile-offline.png'}); await page.setViewportSize({width:1440,height:1000});
  });
  await context.setOffline(false); await go('settings');
  let backup, text;
  await check('Network restoration and UI JSON export contain the complete user state but no learning bank', async () => {
    assert.ok(await page.getByText('Онлайн',{exact:true}).isVisible());
    const event=page.waitForEvent('download');await page.getByRole('button',{name:'Экспортировать JSON',exact:true}).click();const download=await event;
    await download.saveAs('outputs/stage2-test-progress.json');text=fs.readFileSync('outputs/stage2-test-progress.json','utf8');backup=JSON.parse(text);
    assert.deepEqual(backup.data,JSON.parse(JSON.stringify(offlineState))); assert.equal(backup.data.schemaVersion,1);assert.equal(backup.backupVersion,1);assert.equal(backup.format,'ege-progress-backup');assert.equal(backup.questions,undefined);
  });
  await go('topic/percent');await page.getByRole('textbox',{name:'Моя заметка по теме'}).fill('Изменённые тестовые данные');
  await saved(s=>s?.topics.percent.note==='Изменённые тестовые данные');await go('settings');const changed=await getState();
  await check('Corrupt import, unsupported schema and canceled valid import leave current IndexedDB untouched', async () => {
    await importText('{');await page.getByText('Не удалось прочитать JSON.',{exact:false}).waitFor();assert.deepEqual(await getState(),changed);
    const bad=structuredClone(backup);bad.data.schemaVersion=7;await importText(JSON.stringify(bad));await page.getByText('Версия схемы данных пока не поддерживается.',{exact:false}).waitFor();assert.deepEqual(await getState(),changed);
    await importText(text);await page.getByRole('dialog').waitFor();assert.equal(await page.getByRole('button',{name:'Заменить данные',exact:true}).isDisabled(),true);
    await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'outputs/stage2-mobile-import.png'});await page.getByRole('button',{name:'Отмена',exact:true}).click();await page.setViewportSize({width:1440,height:1000});assert.deepEqual(await getState(),changed);
  });
  await check('A failed IndexedDB import transaction rolls back both replacement and recovery-copy writes', async () => {
    const beforeKeys=await keys();await importText(text);await page.getByLabel('Понимаю, что импорт заменит текущий прогресс').check();
    await page.evaluate(()=>{window.savedPut=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(value,key){if(key==='current')throw new DOMException('Test quota','QuotaExceededError');return window.savedPut.call(this,value,key);};});
    await page.getByRole('button',{name:'Заменить данные',exact:true}).click();await page.getByText('Не удалось сохранить импорт.',{exact:false}).waitFor();
    await page.evaluate(()=>{IDBObjectStore.prototype.put=window.savedPut;delete window.savedPut;});
    assert.deepEqual(await getState(),changed);assert.deepEqual(await keys(),beforeKeys);
  });
  await check('Confirmed import restores the exported state exactly and saves a unique pre-import rollback copy', async () => {
    await page.getByRole('button',{name:'Заменить данные',exact:true}).click();await page.getByText('Данные восстановлены из резервной копии.',{exact:false}).waitFor();
    assert.deepEqual(await getState(),backup.data);assert.ok((await keys()).some(k=>String(k).startsWith('before-import:')));
    await page.reload();await ready();assert.deepEqual(await getState(),backup.data);await page.screenshot({path:'outputs/stage2-desktop-settings.png'});
  });
  await check('Offline import and export continue to work without contacting any external service', async () => {
    await context.setOffline(true);await importText(text);await page.getByLabel('Понимаю, что импорт заменит текущий прогресс').check();await page.getByRole('button',{name:'Заменить данные',exact:true}).click();await page.getByText('Данные восстановлены из резервной копии.',{exact:false}).waitFor();
    const event=page.waitForEvent('download');await page.getByRole('button',{name:'Экспортировать JSON',exact:true}).click();const download=await event;await download.saveAs('outputs/stage2-test-progress-offline.json');
    assert.deepEqual(JSON.parse(fs.readFileSync('outputs/stage2-test-progress-offline.json','utf8')).data,backup.data);assert.equal(external.size,0);
  });
  assert.deepEqual(failures,[]); await context.close(); context=undefined;
  fs.writeFileSync('outputs/STAGE-2-BROWSER-CHECKS.json',JSON.stringify({passed:results,errors:failures,externalRequests:[...external],profile},null,2));
} finally { if(context) await context.close(); }
