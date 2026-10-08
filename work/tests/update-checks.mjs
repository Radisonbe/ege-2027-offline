import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { createWorker, digest } from '../../scripts/pwa-plugin.mjs';
const { chromium } = createRequire(pathToFileURL(path.join(process.argv[2], '_runtime.js')))('playwright');
const inventory = JSON.parse(fs.readFileSync('dist/offline-inventory.json','utf8'));
const template = fs.readFileSync('scripts/sw-template.js','utf8');
function release(name) {
  const resources = new Map(inventory.files.map(file => [file.path,fs.readFileSync(path.join('dist',file.path))]));
  const buildId=digest(name).slice(0,20);
  resources.set('index.html',Buffer.from(resources.get('index.html').toString().replace(/(<meta name="ege-build" content=")[^"]+/, '$1' + buildId).replace('</head>',`<meta name="test-release" content="${name}"></head>`)));
  const worker=createWorker([...resources].map(([path,bytes])=>({path,sha256:digest(bytes)})),template,buildId);
  resources.set('sw.js',Buffer.from(worker.source));
  return {name,resources,worker};
}
const a=release('A'), b=release('B'), broken=release('incomplete'); let current=a;
const server = http.createServer((request,response) => {
  const name=new URL(request.url,'http://local.test').pathname.slice('/study/'.length) || 'index.html';
  const bytes=current.resources.get(name);
  if (!request.url.startsWith('/study/') || !bytes || (current===broken && name==='icons/icon-192.png')) {response.writeHead(404);response.end('missing');return;}
  const mime=name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.html')?'text/html':name.endsWith('.webmanifest')?'application/manifest+json':name.endsWith('.svg')?'image/svg+xml':'image/png';
  response.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-store'});response.end(bytes);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}/study/`;
const profile=path.resolve('work/update-profile-'+new Date().toISOString().replace(/[:.]/g,'-'));
const launch=()=>chromium.launchPersistentContext(profile,{channel:'msedge',headless:true,serviceWorkers:'allow'});
let context;const results=[];
const ready=page=>page.getByText('Полный учебный комплект сохранён:',{exact:false}).waitFor({timeout:15000});
async function state(page) {return page.evaluate(()=>new Promise(resolve=>{const r=indexedDB.open('ege-local-center',1);r.onsuccess=()=>{const db=r.result,v=db.transaction('progress','readonly').objectStore('progress').get('current');v.onsuccess=()=>{resolve(v.result);db.close();};};}));}
try {
  context=await launch();let page=context.pages()[0];await page.goto(origin+'#settings');await ready(page);
  await page.goto(origin+'#topic/py-variables');await page.getByRole('textbox',{name:'Моя заметка по теме'}).fill('История сохраняется при обновлении');
  for(let i=0;i<50;i++){if((await state(page))?.topics['py-variables'].note==='История сохраняется при обновлении')break;await new Promise(resolve=>setTimeout(resolve,50));}
  const before=await state(page);assert.equal(before.topics['py-variables'].note,'История сохраняется при обновлении');
  const second=await context.newPage();await second.goto(origin+'#settings');await ready(second);
  current=b;
  await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});
  await page.waitForFunction(async()=>Boolean((await navigator.serviceWorker.getRegistration()).waiting));
  await second.getByText('Новая версия готова.',{exact:false}).waitFor();
  for(const tab of [page,second]){assert.equal(await tab.locator('meta[name=test-release]').getAttribute('content'),'A');await tab.reload();assert.equal(await tab.locator('meta[name=test-release]').getAttribute('content'),'A');}
  assert.deepEqual(await state(page),before);results.push('Two open windows stay on release A while complete B waits; reloading never mixes releases');
  current=broken;
  const failed=await page.evaluate(async()=>{
    const r=await navigator.serviceWorker.getRegistration();
    return new Promise(async(resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('Expected install failure was not observed')),15000);
      r.addEventListener('updatefound',()=>{const w=r.installing;w.addEventListener('statechange',()=>{if(w.state==='redundant'){clearTimeout(timer);resolve(true);}});},{once:true});
      try{await r.update();}catch(error){clearTimeout(timer);reject(error);}
    });
  });
  assert.equal(failed,true);assert.equal(await page.locator('meta[name=test-release]').getAttribute('content'),'A');assert.deepEqual(await state(page),before);
  results.push('Incomplete update is refused and existing complete release and progress stay available');
  current=b;await page.close();await second.close();await context.close();context=await launch();page=context.pages()[0];
  await page.goto(origin+'#settings');await ready(page);assert.equal(await page.locator('meta[name=test-release]').getAttribute('content'),'B');assert.deepEqual(await state(page),before);
  results.push('Release B activates only after all windows close and a new browser starts; IndexedDB is unchanged');
  await context.close();context=await launch();await context.setOffline(true);page=context.pages()[0];const response=await page.goto(origin+'#settings');await ready(page);
  assert.equal(response.fromServiceWorker(),true);assert.equal(await page.locator('meta[name=test-release]').getAttribute('content'),'B');assert.deepEqual(await state(page),before);
  const cacheKeys=await page.evaluate(()=>caches.keys());assert.equal(cacheKeys.filter(k=>k.startsWith('ege-offline:')).length,1);
  results.push('Updated release boots offline under a subdirectory; only its resource cache remains');
  fs.writeFileSync('outputs/STAGE-2-UPDATE-CHECKS.json',JSON.stringify({passed:results,profile},null,2));results.forEach(name=>console.log('PASS '+name));
} finally {if(context)await context.close();await new Promise(resolve=>server.close(resolve));}
