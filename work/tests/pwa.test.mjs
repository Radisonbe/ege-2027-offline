import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import { createWorker, digest } from '../../scripts/pwa-plugin.mjs';

const template = fs.readFileSync(new URL('../../scripts/sw-template.js', import.meta.url), 'utf8');
function harness({broken = false, corrupt = false} = {}) {
  const contents = new Map([['index.html', '<html>new-release</html>'], ['assets/app.js', 'all 67 topics, 19 modules and questions'], ['icon.svg','icon']]);
  const files = [...contents].map(([path, text]) => ({path, sha256:digest(text)}));
  const generated = createWorker(files, template), scope = 'https://local.test/study/';
  const handlers = {}, stores = new Map(), fetches = [];
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map()); const entries = stores.get(name);
      return { async put(url, response) { entries.set(url, response); }, async match(url) { return entries.get(typeof url === 'string' ? url : url.url)?.clone(); } };
    }, async keys() { return [...stores.keys()]; }, async delete(name) { return stores.delete(name); }
  };
  let claims = 0;
  vm.runInNewContext(generated.source, {self:{registration:{scope}, addEventListener(type, handler) {handlers[type] = handler;}, clients:{async claim(){claims++;}}}, caches, URL, Request, Response, crypto:webcrypto, Uint8Array,
    async fetch(request) {
      fetches.push(request.url); const path = request.url.slice(scope.length);
      if (broken && path === 'assets/app.js') return new Response('missing', {status:404});
      return new Response(corrupt && path === 'index.html' ? 'different deployment' : contents.get(path));
    }});
  const run = type => new Promise((resolve, reject) => handlers[type]({waitUntil(promise){promise.then(resolve, reject);}}));
  const fetch = async (path, mode) => {
    let result; handlers.fetch({request:{method:'GET',url:new URL(path,scope).href,mode},respondWith(value){result=value;}}); return await result;
  };
  return {run,fetch,handlers,generated,stores,fetches,scope,get claims(){return claims;}};
}
test('Build inventory covers every supplied resource and changes version for resource or worker changes', () => {
  const files = [{path:'index.html',sha256:digest('html')},{path:'a.svg',sha256:digest('svg')}];
  const base = createWorker(files, template);
  assert.deepEqual(base.files.map(f => f.path), ['a.svg','index.html']);
  assert.equal(createWorker([...files].reverse(), template).version, base.version);
  assert.notEqual(createWorker([{...files[0],sha256:digest('new')},files[1]], template).version, base.version);
  assert.notEqual(createWorker(files, template + '\n// new worker behavior').version, base.version);
  assert.throws(() => createWorker([files[1]],template));
  assert.doesNotMatch(base.source, /self\.skipWaiting\s*\(/);
});
test('Whole bundle is fetched at install; all subsequent navigation and resources come from one cache', async () => {
  const h = harness(); await h.run('install'); assert.equal(h.fetches.length, 3); await h.run('activate');
  assert.equal(h.claims, 1);
  assert.match(await (await h.fetch('./#topic/unvisited','navigate')).text(), /new-release/);
  assert.match(await (await h.fetch('assets/app.js?any=1','cors')).text(), /all 67 topics/);
  assert.equal(h.fetches.length, 3);
});
test('Failed or inconsistent installations are rejected and leave no partially ready cache', async () => {
  for (const options of [{broken:true},{corrupt:true}]) {
    const h = harness(options); h.stores.set('another-app',new Map());
    await assert.rejects(h.run('install')); assert.deepEqual([...h.stores.keys()],['another-app']);
  }
});
test('Activation cleans only caches owned by this app scope and never touches IndexedDB', async () => {
  const h = harness(); h.stores.set('ege-offline:' + encodeURIComponent(h.scope) + ':old',new Map());
  h.stores.set('ege-offline:other-scope:old',new Map()); h.stores.set('unrelated',new Map());
  await h.run('install'); await h.run('activate');
  assert.ok(![...h.stores.keys()].some(k => k.endsWith(':old') && k.includes(encodeURIComponent(h.scope))));
  assert.ok(h.stores.has('unrelated')); assert.ok(h.stores.has('ege-offline:other-scope:old'));
  assert.doesNotMatch(template,/indexedDB|deleteDatabase/);
});
test('Readiness is based on all resources and a missing current-version asset cannot fall through to network', async () => {
  const h = harness(); await h.run('install');
  const inspect = () => new Promise(resolve => h.handlers.message({data:{type:'OFFLINE_STATUS'},ports:[{postMessage:resolve}],waitUntil(){}}));
  assert.equal((await inspect()).ready,true);
  [...h.stores.values()][0].delete(h.scope + 'assets/app.js');
  assert.equal((await inspect()).ready,false);
  assert.equal((await h.fetch('assets/app.js','cors')).status,503); assert.equal(h.fetches.length,3);
});
test('Unknown and external requests are not used to load learning resources', async () => {
  const h = harness(); await h.run('install');
  assert.equal(await h.fetch('unknown.json','cors'),undefined);
  let intercepted = false;
  h.handlers.fetch({request:{method:'GET',url:'https://external.test/font.woff',mode:'cors'},respondWith(){intercepted=true;}});
  assert.equal(intercepted,false);
});
