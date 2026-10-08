// Static literal reader. Never imports, evals, or executes the reference bundle.
import fs from 'node:fs';
import crypto from 'node:crypto';
import ts from 'typescript';

const input = 'work/reference/reference-page.txt';
const source = ts.createSourceFile(input, fs.readFileSync(input, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
if (source.parseDiagnostics.length) throw new Error('Reference parse failed');
const declarations = new Map();
function walk(node, visit) { visit(node); ts.forEachChild(node, child => walk(child, visit)); }
walk(source, node => { if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) declarations.set(node.name.text, node.initializer); });
function literal(node) {
  if (!node) return undefined;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isPrefixUnaryExpression(node)) {
    const value = literal(node.operand);
    if (node.operator === ts.SyntaxKind.ExclamationToken) return !value;
    if (node.operator === ts.SyntaxKind.MinusToken && typeof value === 'number') return -value;
  }
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(literal);
  if (ts.isObjectLiteralExpression(node)) return Object.fromEntries(node.properties.map(p => {
    if (!ts.isPropertyAssignment(p)) throw new Error('Nonliteral property rejected');
    const key = ts.isIdentifier(p.name) ? p.name.text : literal(p.name);
    return [key, literal(p.initializer)];
  }));
  throw new Error(`Nonliteral expression rejected: ${ts.SyntaxKind[node.kind]}`);
}
const topics = declarations.get('Pm').elements.flatMap(spread => {
  const call = spread.expression;
  if (!ts.isCallExpression(call) || call.expression.getText(source) !== 'Nm') throw new Error('Topic structure changed');
  const subject = literal(call.arguments[0]);
  return literal(call.arguments[1]).map(([id,title,live,minutes,description]) => ({id,subject,title,live:!!live,minutes:minutes ?? null,description:description ?? null}));
});
const python = literal(declarations.get('v_'));
function readQuestion(call) {
  const [topic,id,prompt,answer,hint,solution,extra = {}] = call.arguments.map(literal);
  return {topic,id,prompt,answer,hint,solution,principle:hint,kind:'number',...extra};
}
const questions = literalQuestionArray(declarations.get('Im'));
function literalQuestionArray(node) {
  if (!ts.isArrayLiteralExpression(node)) throw new Error('Question structure changed');
  return node.elements.map(readQuestion);
}
for (const [topic,item] of Object.entries(python)) questions.push({topic,id:topic+'-q',prompt:item.challenge,answer:item.answer,hint:item.hint,solution:item.solution,principle:item.hint,kind:item.options?'choice':'number',...(item.options?{options:item.options}:{})});
walk(source,node => {
  if (ts.isCallExpression(node) && node.expression.getText(source)==='y_.push') {
    for (const call of node.arguments) questions.push(readQuestion(call));
  }
});
if (topics.length !== 67 || Object.keys(python).length !== 13 || new Set(questions.map(q=>q.id)).size !== questions.length) throw new Error('Content invariant failed');
const metadata = {url:'https://ege-2027-radisonbe.sonberadi.chatgpt.site',asset:'/_next/static/chunks/page-Dih35UfA.js',retrievedOn:'2026-10-08',sha256:crypto.createHash('sha256').update(fs.readFileSync(input)).digest('hex'),method:'Static literal extraction; no reference JavaScript executed'};
let theoryFunction;
let bridges;
walk(source,node=>{
  if(ts.isFunctionDeclaration(node)&&node.name?.text==='P_') theoryFunction=node;
  if(ts.isVariableDeclaration(node)&&node.initializer&&ts.isElementAccessExpression(node.initializer)&&node.initializer.expression.getText(source).startsWith('{binary:{algorithm:')) bridges=literal(node.initializer.expression);
});
// Decode a small whitelist of presentation expressions into inert content nodes.
// This is not JavaScript evaluation: assignments, arbitrary calls and property access are rejected.
const allowedTags = new Set(['div','span','p','h2','h3','h4','b','strong','small','pre','code','ol','ul','li','sup','em','section','br']);
function template(node,env){
  if(ts.isParenthesizedExpression(node)) return template(node.expression,env);
  if(ts.isIdentifier(node)) {if(Object.hasOwn(env,node.text))return env[node.text];throw new Error('Unknown template identifier '+node.text);}
  if(ts.isArrayLiteralExpression(node))return node.elements.map(n=>template(n,env));
  if(ts.isConditionalExpression(node))return template(template(node.condition,env)?node.whenTrue:node.whenFalse,env);
  if(ts.isBinaryExpression(node)) {
    if(node.operatorToken.kind===ts.SyntaxKind.EqualsEqualsEqualsToken)return template(node.left,env)===template(node.right,env);
    if(node.operatorToken.kind===ts.SyntaxKind.BarBarToken)return template(node.left,env)||template(node.right,env);
    throw new Error('Template operator rejected');
  }
  if(ts.isElementAccessExpression(node)) {const value=template(node.expression,env),key=template(node.argumentExpression,env);if(!Object.hasOwn(value,key))throw new Error('Unknown template key');return value[key];}
  if(ts.isPropertyAccessExpression(node)) {const value=template(node.expression,env);if(!Object.hasOwn(value,node.name.text))throw new Error('Unknown template property');return value[node.name.text];}
  if(ts.isCallExpression(node)) {
    const name=node.expression.getText(source);
    if(name==='(0,M.jsx)'||name==='(0,M.jsxs)') {
      const tagNode=node.arguments[0];
      const rawTag=ts.isIdentifier(tagNode)?tagNode.text:ts.isPropertyAccessExpression(tagNode)?tagNode.getText(source):literal(tagNode);
      if(rawTag==='C')return {tag:'span',className:'content-arrow',children:['→']};
      const tag=rawTag==='Q'?'section':rawTag==='M.Fragment'?'div':rawTag;
      if(!allowedTags.has(tag))throw new Error('Template tag rejected '+tag);
      const props=node.arguments[1];
      const result={tag,className:rawTag==='Q'?'panel':'',children:[]};
      if(!ts.isObjectLiteralExpression(props))throw new Error('Template props rejected');
      for(const prop of props.properties){
        const key=ts.isIdentifier(prop.name)?prop.name.text:literal(prop.name);
        if(key==='className')result.className += ' '+template(prop.initializer,env);
        if(key==='children'){const value=template(prop.initializer,env);result.children=(Array.isArray(value)?value:[value]).flat(Infinity);}
      }
      return result;
    }
    if(ts.isPropertyAccessExpression(node.expression)&&node.expression.name.text==='map') {
      const values=template(node.expression.expression,env),arrow=node.arguments[0];
      if(!Array.isArray(values)||!ts.isArrowFunction(arrow)||ts.isBlock(arrow.body))throw new Error('Template map rejected');
      return values.map(value=>{
        const next={...env};const binding=arrow.parameters[0].name;
        if(ts.isIdentifier(binding))next[binding.text]=value;
        else if(ts.isArrayBindingPattern(binding))binding.elements.forEach((b,index)=>{if(!ts.isBindingElement(b)||!ts.isIdentifier(b.name))throw new Error('Binding rejected');next[b.name.text]=value[index];});
        else throw new Error('Binding rejected');
        return template(arrow.body,next);
      });
    }
    throw new Error('Template call rejected '+name);
  }
  return literal(node);
}
const theories={};
const finalReturn=theoryFunction.body.statements.findLast(s=>ts.isReturnStatement(s));
const pythonReturn=theoryFunction.body.statements[0].thenStatement.statements.find(s=>ts.isReturnStatement(s));
const lookup=Object.fromEntries(topics.map(t=>[t.id,t]));
for(const topic of topics.filter(t=>t.live)) theories[topic.id]=template(python[topic.id]?pythonReturn.expression:finalReturn.expression,{e:topic.id,t:python[topic.id],Fm:lookup});
const sentences=literal(declarations.get('x_'));
fs.mkdirSync('src/data',{recursive:true});
fs.writeFileSync('src/data/reference.json',JSON.stringify({metadata,topics,python,questions,theories,sentences,bridges},null,2)+'\n');
const css = fs.readFileSync('work/reference/reference-style.txt','utf8');
const start = css.indexOf('*{box-sizing:border-box}html{scroll-behavior:smooth}');
const root = css.indexOf(':root{--background:#f4f6f8');
const dark = css.indexOf('.dark{--background:#121d23',root);
const darkEnd = css.indexOf('}',dark)+1;
if (start<0||root<start||dark<root) throw new Error('Stylesheet structure changed');
fs.mkdirSync('src/styles',{recursive:true});
const selected = css.slice(start,root)+css.slice(root,darkEnd);
if (/@import|url\s*\(/i.test(selected)) throw new Error('External stylesheet resource rejected');
fs.writeFileSync('src/styles/reference.css','/* Visual styles transferred from the public reference. Provenance: src/data/reference.json. */\n'+selected+'\n');
console.log(JSON.stringify({topics:topics.length,live:topics.filter(t=>t.live).length,questions:questions.length,pythonLessons:Object.keys(python).length,stylesBytes:selected.length,metadata},null,2));
