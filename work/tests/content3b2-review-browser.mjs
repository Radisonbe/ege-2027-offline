// Only synthetic data in a new isolated profile; no owner progress is accessed.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {checkContentBank} from '../../scripts/content-bank.mjs';
import {emptyState} from '../../src/domain/progress.ts';
import {startTopicTest} from '../../src/domain/study-flow.ts';

const {chromium} = createRequire(pathToFileURL(path.join(process.argv[2], '_runtime.js')))('playwright');
const dir = path.resolve(process.argv[3]), prefix = '/ege-2027-offline/';
const profile = path.resolve('work/methodical-profile-' + new Date().toISOString().replace(/[:.]/g, '-'));
const bank = checkContentBank().questions;
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://local.test').pathname;
  if (pathname === '/seed.html') {res.writeHead(200, {'Content-Type':'text/html'}); res.end('<title>Own test fixture</title>'); return;}
  const file = pathname.startsWith(prefix) ? pathname.slice(prefix.length) || 'index.html' : null;
  if (!file || file.includes('..') || !fs.existsSync(path.join(dir, file))) {res.writeHead(404); res.end(); return;}
  const mime = /\.(js|mjs)$/.test(file) ? 'text/javascript' : file.endsWith('.wasm') ? 'application/wasm' : file.endsWith('.css') ? 'text/css' : file.endsWith('.html') ? 'text/html' : file.endsWith('.webmanifest') ? 'application/manifest+json' : file.endsWith('.svg') ? 'image/svg+xml' : file.endsWith('.png') ? 'image/png' : 'application/octet-stream';
  res.writeHead(200, {'Content-Type': mime}); res.end(fs.readFileSync(path.join(dir, file)));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const host = 'http://127.0.0.1:' + server.address().port, base = host + prefix;
const errors = [], external = new Set(); let context;
try {
  context = await chromium.launchPersistentContext(profile, {channel:'msedge', headless:true, serviceWorkers:'allow', viewport:{width:390,height:844}, isMobile:true, hasTouch:true});
  const page = context.pages()[0];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => {if (/^https?:/.test(r.url()) && !r.url().startsWith(host + '/')) external.add(r.url());});
  await page.goto(base + '#settings');
  await page.getByText('Полный учебный комплект сохранён:', {exact:false}).waitFor({timeout:90000});
  async function show(q) {
    const s = startTopicTest(emptyState('synthetic-review'), q.topic, [q], 'synthetic-control');
    await context.setOffline(false); await page.goto(host + '/seed.html');
    await page.evaluate(s => new Promise((resolve, reject) => {
      const r = indexedDB.open('ege-local-center', 1);
      r.onsuccess = () => {const db = r.result, tx = db.transaction('progress', 'readwrite'); tx.objectStore('progress').put(s, 'current'); tx.oncomplete = () => {db.close(); resolve();}; tx.onerror = () => reject(tx.error);};
    }), s);
    await context.setOffline(true); await page.goto(base + '#topic/' + q.topic);
    await page.getByRole('tab', {name:'Мини-тест',exact:true}).click();
    await page.locator('.question-prompt').waitFor();
    assert.equal(await page.locator('.question-prompt').textContent(), q.presentation?.statement ?? q.prompt);
  }
  const pronoun = bank.find(q => q.id === 'b2-russian-text-pronoun');
  await show(pronoun);
  await page.getByRole('radio', {name:'фотографию',exact:true}).check();
  await page.getByRole('button', {name:'Проверить ответ',exact:true}).click();
  await page.getByRole('button', {name:'Показать полное решение',exact:false}).click();
  await page.getByText(pronoun.explanation, {exact:true}).waitFor();
  console.log('PASS Unambiguous pronoun condition and correct answer render offline');
  const old = JSON.parse(execFileSync('git', ['show','2a540ae:src/data/banks/stage3b2-russian.json'], {encoding:'utf8'})).questions.find(q => q.id === pronoun.id);
  await show(old);
  assert.ok((await page.locator('.question-prompt').textContent()).includes('Лиза'));
  console.log('PASS Frozen previous-revision mini-test still displays its own original snapshot');
  for (const id of ['b2-python-py-file-roundtrip','b2-python-py-file-positive']) {
    const q = bank.find(q => q.id === id); await show(q);
    await page.getByText('Python готов · Запуск — эксперимент, проверка — учебный результат.', {exact:true}).waitFor({timeout:90000});
    assert.ok((await page.locator('.question-prompt').textContent()).includes('не проверяет факт использования файлов'));
    for (const width of [320,360,390,1100]) {
      await page.setViewportSize({width,height:844});
      for (const dark of [false,true]) {
        await page.evaluate(dark => document.documentElement.classList.toggle('dark', dark), dark);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), id + ' / ' + width);
      }
    }
  }
  console.log('PASS Both file conditions disclose stdout-only grading offline at 320/360/390/desktop in both themes');
  assert.deepEqual(errors, []); assert.equal(external.size, 0);
} finally {if (context) await context.close(); await new Promise(resolve => server.close(resolve));}
