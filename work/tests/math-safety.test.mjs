import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';import ts from 'typescript';
import {createElement} from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import {mathParts} from '../../src/domain/math-text.ts';
const url=p=>pathToFileURL(path.resolve(p)).href;
async function component(file,dependencies={}){
 const compiled=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const code=compiled.replace(/from ["']([^"']+)["']/g,(all,name)=>'from '+JSON.stringify(dependencies[name]??url(name==='react'?'node_modules/react/index.js':name==='react/jsx-runtime'?'node_modules/react/jsx-runtime.js':'src/domain/math-text.ts')));
 const moduleURL='data:text/javascript;base64,'+Buffer.from(code).toString('base64');return{exports:await import(moduleURL),url:moduleURL};
}
const math=await component('src/components/MathText.tsx'),{Content}= (await component('src/components/ui.tsx',{'./MathText':math.url})).exports;
const {MathText}=math.exports;
test('URLs with query fractions, file paths and explicitly marked inline code remain literal',()=>{
 for(const text of ['https://example.test/?ratio=1/2&power=2^3','file:///tmp/?value=1/2','www.example.test/?x=1/2','C:\\lessons\\value=1/2.txt','F:/lessons/value=1/2.txt','./data/ratio=1/2.txt','/tmp/ratio=1/2.txt','lessons/ratio=1/2.txt','\\\\server\\share\\ratio=1/2','`x / y`'])assert.deepEqual(mathParts(text),[{kind:'text',raw:text}],text);
 const mixed='Дробь 1/2, ссылка https://example.test/?x=1/3, затем 3/4.';assert.deepEqual(mathParts(mixed).filter(p=>p.kind==='fraction').map(p=>p.raw),['1/2','3/4']);assert.equal(mathParts(mixed).map(p=>p.raw).join(''),mixed);
});
test('Real React math renderer escapes HTML and attribute payloads rather than creating executable markup',()=>{
 const payload='<img src=x onerror="window.__mathExecuted=1"> & <script>window.__mathExecuted=2</script> 1/2';
 const html=renderToStaticMarkup(createElement(MathText,{children:payload}));assert.ok(html.includes('&lt;img'));assert.ok(html.includes('&lt;script'));assert.ok(html.includes('&amp;'));assert.ok(html.includes('math-fraction'));assert.ok(!/<(?:img|script)\b/i.test(html));
 const raw=renderToStaticMarkup(createElement(MathText,{enabled:false,children:payload}));assert.ok(!raw.includes('math-fraction'));assert.ok(raw.endsWith('1/2'));
});
test('Actual Content leaves code tags, Python programs and disabled user text unformatted',()=>{
 for(const node of [{tag:'code',children:['x = 1/2']},{tag:'pre',children:['print(1/2)']},{tag:'pre',children:['def f(x):\n    return x / 2']}]){const html=renderToStaticMarkup(createElement(Content,{node,math:true}));assert.ok(!html.includes('data-math-kind'));assert.ok(html.includes('/'));}
 const normal=renderToStaticMarkup(createElement(Content,{node:{tag:'p',children:['a/b']},math:true}));assert.ok(normal.includes('math-fraction'));
});
