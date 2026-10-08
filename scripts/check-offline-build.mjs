import fs from 'node:fs';
import path from 'node:path';
import {digest,createWorker} from './pwa-plugin.mjs';
const directory=path.resolve(process.argv[2]??'dist');
const inventory=JSON.parse(fs.readFileSync(path.join(directory,'offline-inventory.json')));
const build=fs.readFileSync(path.join(directory,'index.html'),'utf8').match(/<meta name="ege-build" content="([^"]+)"/)[1];
const seen=new Set();
for(const file of inventory.files){if(seen.has(file.path)||file.path.includes('..')||path.isAbsolute(file.path))throw Error('Invalid inventory path');seen.add(file.path);if(digest(fs.readFileSync(path.join(directory,file.path)))!==file.sha256)throw Error('Final build differs from offline inventory: '+file.path);}
const expected=createWorker(inventory.files,fs.readFileSync('scripts/sw-template.js','utf8'),build);
if(inventory.version!==expected.version||fs.readFileSync(path.join(directory,'sw.js'),'utf8')!==expected.source)throw Error('Service Worker does not match final inventory');
for(const required of ['pyodide.mjs','pyodide.asm.mjs','pyodide.asm.wasm','python_stdlib.zip','pyodide-lock.json'])if(!seen.has('python-runtime/314.0.7/'+required))throw Error('Python runtime missing from complete offline kit: '+required);
console.log('Final offline inventory valid: '+seen.size+' resources, including all Python runtime files');
