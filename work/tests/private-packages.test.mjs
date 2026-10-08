import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePrivatePackage, preparePrivateImport, MAX_PRIVATE_PACKAGE_BYTES } from '../../src/domain/private-packages.ts';

// Original technical fixture, not an addition to the learning bank.
const question = { id:'check', subject:'python', topic:'local', subtopic:null, difficulty:'unspecified', origin:'custom', source:'Local test fixture', sourceYear:null, sourceType:'training', examTaskType:null, answerType:'text', prompt:'Technical validation fixture', answer:'ok', hint:'', explanation:'', solution:'', principle:'', version:1, requires:[], related:[] };
const fixture = () => ({ format:'ege-private-learning-package', packageVersion:1, id:'local-test', title:'Technical fixture', source:'Local', topics:[{id:'local', subject:'python', title:'Local fixture'}], lessons:[{topic:'local',title:'Fixture', paragraphs:['<script>inert text</script>']}], questions:[{...question}] });
const parse = value => parsePrivatePackage(JSON.stringify(value));
test('Private package is validated and forcibly marked private-import', () => {
  const input = fixture(), stored = preparePrivateImport(JSON.stringify(input), new Date('2026-10-08T12:00:00.000Z'));
  assert.deepEqual(parse(input), input);
  assert.equal(stored.distribution, 'private-import');
  assert.equal(stored.importedAt, '2026-10-08T12:00:00.000Z');
  assert.equal(stored.lessons[0].paragraphs[0], '<script>inert text</script>');
});
test('Corrupt JSON, future schema and prototype keys are rejected', () => {
  assert.throws(() => parsePrivatePackage('{'));
  assert.throws(() => parse({...fixture(), packageVersion:2}));
  assert.throws(() => parsePrivatePackage(JSON.stringify(fixture()).replace('"id":"local-test"','"__proto__":{},"id":"local-test"')));
});
test('Unknown fields, executable/resource fields and public labels are rejected', () => {
  for(const extra of [{distribution:'public'}, {assets:[]}, {html:'<b>hello</b>'}, {script:'alert(1)'}]) assert.throws(() => parse({...fixture(), ...extra}));
});
test('Broken links and duplicate identities cannot enter private storage', () => {
  const a=fixture(); a.questions[0].topic='absent'; assert.throws(() => parse(a));
  const b=fixture(); b.questions.push({...question}); assert.throws(() => parse(b));
  const c=fixture(); c.questions[0].subject='math'; assert.throws(() => parse(c));
  const d=fixture(); d.questions[0].requires=['absent']; assert.throws(() => parse(d));
  const e=fixture(); e.topics.push({...e.topics[0]}); assert.throws(() => parse(e));
});
test('Invalid question answers and oversized private files are rejected', () => {
  const input=fixture(); input.questions[0].answerType='choice'; input.questions[0].options=['x']; assert.throws(() => parse(input));
  assert.throws(() => parsePrivatePackage(' '.repeat(MAX_PRIVATE_PACKAGE_BYTES + 1)));
});
