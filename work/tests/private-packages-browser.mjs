import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const { chromium } = createRequire(pathToFileURL(path.join(process.argv[2], '_runtime.js')))('playwright');
const modules = ['src/storage/private-packages.ts','src/domain/private-packages.ts','src/domain/backup.ts','src/domain/progress.ts'];
const sources = new Map(modules.map(file => ['/'+file, ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText]));
const server=http.createServer((request,response)=>{
  const pathname=new URL(request.url,'http://local.test').pathname, text=sources.get(pathname);
  if(pathname==='/'){response.writeHead(200,{'Content-Type':'text/html'});response.end('<!doctype html><title>Isolated local package test</title>');}
  else if(text){response.writeHead(200,{'Content-Type':'text/javascript'});response.end(text);}
  else {response.writeHead(404);response.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
const profile=path.resolve('work/private-package-profile-'+new Date().toISOString().replace(/[:.]/g,'-'));
const launch=()=>chromium.launchPersistentContext(profile,{channel:'msedge',headless:true});
let context; const external=[], errors=[], checks=[];
const watch=page=>{page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(request.url().startsWith('http')&&!request.url().startsWith(origin+'/'))external.push(request.url());});};
try {
  context=await launch();let page=context.pages()[0];watch(page);await page.goto(origin);
  const before=await page.evaluate(async()=>{
    const {emptyState}=await import('/src/domain/progress.ts');
    const state=emptyState('private-package-fixture');
    await new Promise((resolve,reject)=>{const r=indexedDB.open('ege-local-center',1);r.onupgradeneeded=()=>r.result.createObjectStore('progress');r.onsuccess=()=>{const db=r.result,tx=db.transaction('progress','readwrite');tx.objectStore('progress').put(state,'current');tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);};});
    const api=await import('/src/storage/private-packages.ts');window.packageApi=api;return state;
  });
  await context.setOffline(true);
  const imported=await page.evaluate(async()=>{
    const pack={format:'ege-private-learning-package',packageVersion:1,id:'fixture',title:'Local technical fixture',source:'https://unvisited.invalid/never-fetch',topics:[{id:'local',subject:'python',title:'Local technical fixture'}],lessons:[{topic:'local',title:'Local',paragraphs:['PRIVATE_FIXTURE_DO_NOT_PUBLISH']}],questions:[]};
    await window.packageApi.importPrivatePackage(JSON.stringify(pack));
    const saved=await window.packageApi.loadPrivatePackages();
    let duplicate=false,invalid=false;
    try{await window.packageApi.importPrivatePackage(JSON.stringify({...pack,title:'Overwrite attempt'}));}catch{duplicate=true;}
    try{await window.packageApi.importPrivatePackage('{');}catch{invalid=true;}
    const after=await window.packageApi.loadPrivatePackages();
    return {saved,after,duplicate,invalid};
  });
  assert.equal(imported.saved[0].distribution,'private-import');
  assert.equal(imported.saved[0].lessons[0].paragraphs[0],'PRIVATE_FIXTURE_DO_NOT_PUBLISH');
  assert.equal(imported.duplicate,true);assert.equal(imported.invalid,true);assert.deepEqual(imported.after,imported.saved);
  checks.push('Import/read works offline, private-import is stored, corrupt/duplicate imports preserve existing packages');
  await context.close();context=await launch();page=context.pages()[0];watch(page);await page.goto(origin);
  await page.evaluate(async()=>{window.packageApi=await import('/src/storage/private-packages.ts');});
  await context.setOffline(true);
  const restored=await page.evaluate(async()=>{
    const progress=await new Promise((resolve,reject)=>{const r=indexedDB.open('ege-local-center',1);r.onsuccess=()=>{const db=r.result,v=db.transaction('progress','readonly').objectStore('progress').get('current');v.onsuccess=()=>{resolve(v.result);db.close();};v.onerror=()=>reject(v.error);};});
    return {packages:await window.packageApi.loadPrivatePackages(),progress};
  });
  assert.deepEqual(restored.packages,imported.saved);assert.deepEqual(restored.progress,before);assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
  checks.push('Full browser restart preserves private packages; progress DB is unchanged; zero external requests and script errors');
  fs.writeFileSync('outputs/PRIVATE-PACKAGES-CHECKS.json',JSON.stringify({profile,checks,errors,externalRequests:external},null,2));
  for(const check of checks)console.log('PASS '+check);
} finally {if(context)await context.close();await new Promise(resolve=>server.close(resolve));}
