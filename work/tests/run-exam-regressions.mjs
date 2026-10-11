// Complete local regression runner. Own profiles/fixtures only; no installed user PWA.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {spawn} from 'node:child_process';
const [runtime,build,old,relative,previous]=process.argv.slice(2);
if(!previous)throw Error('Usage: runtime build old relative previous-reviewed-build');
const root=path.resolve(relative);
const server=http.createServer((req,res)=>{
 const name=new URL(req.url,'http://local.test').pathname.slice(1)||'index.html',file=path.join(root,name);
 if(name.includes('..')||!fs.existsSync(file)){res.writeHead(404);res.end();return;}
 const mime=name.endsWith('.html')?'text/html':name.endsWith('.js')||name.endsWith('.mjs')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.wasm')?'application/wasm':name.endsWith('.webmanifest')?'application/manifest+json':name.endsWith('.png')?'image/png':name.endsWith('.svg')?'image/svg+xml':'application/octet-stream';
 res.writeHead(200,{'Content-Type':mime});res.end(fs.readFileSync(file));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url='http://127.0.0.1:'+server.address().port;
const names=fs.readdirSync('work/tests').filter(n=>/browser.*\.mjs$/.test(n)||n==='update-checks.mjs').sort();
const results=[],stamp=Date.now();let cursor=0;
async function worker(){while(cursor<names.length){
 const name=names[cursor++];let args=[build,old];
 if(name==='browser-checks.mjs')args=[url,relative];
 if(name==='study-flow-layout-browser.mjs')args=[url+'/'];
 if(name==='update-checks.mjs')args=[relative];
 if(name==='private-packages-browser.mjs')args=[];
 if(name==='exam-review-browser.mjs')args=[build,previous];
 console.log('START '+name);
 const log=path.join('outputs','exam-review-'+stamp+'-'+name+'.log'),out=fs.createWriteStream(log);
 const child=spawn(process.execPath,['work/tests/'+name,runtime,...args],{stdio:['ignore','pipe','pipe'],windowsHide:true});let text='';
 for(const stream of [child.stdout,child.stderr])stream.on('data',data=>{out.write(data);text+=data.toString();});
 const code=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',resolve);});out.end();
 results.push({name,code,groups:(text.match(/^PASS /gm)||[]).length,log});
 fs.writeFileSync('outputs/EXAM-REVIEW-REGRESSIONS.json',JSON.stringify({total:names.length,results},null,2));
 console.log('DONE '+JSON.stringify(results.at(-1)));if(code)console.log(text.slice(-3500));
}}
try{await Promise.all([worker(),worker(),worker()]);console.log('SUMMARY '+JSON.stringify({passed:results.filter(r=>r.code===0).length,suites:names.length,groups:results.reduce((s,r)=>s+r.groups,0)}));process.exitCode=results.every(r=>r.code===0)?0:1;}
finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
