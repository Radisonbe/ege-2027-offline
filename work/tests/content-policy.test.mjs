import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { isPrivatePath, assertNoPrivateInputs, assertBuildInput, checkPublication, sha256 } from '../../scripts/content-policy.mjs';

function temporaryRoot() { fs.mkdirSync('work/policy-fixtures',{recursive:true}); return fs.mkdtempSync('work/policy-fixtures/check-'); }
test('All designated private paths and exported progress filenames are classified', () => {
  for(const file of ['private-packages/a.json','public/imports/a.json','src/personal-materials/x.ts','local-data/a.json','user-data/x','backups/a','x.private-package.json','x.private-progress.json','ege-progress-2026.json','ege-backup-2026.json']) assert.equal(isPrivatePath(file),true,file);
  assert.equal(isPrivatePath('src/domain/private-packages.ts'),false);
  assert.equal(isPrivatePath('src/data/reference.json'),false);
});
test('Private folder in public cannot enter a build even when Git ignores it', () => {
  const root=temporaryRoot(); fs.mkdirSync(path.join(root,'public/private-packages'),{recursive:true});
  fs.writeFileSync(path.join(root,'public/private-packages/file.json'),'{}');
  assert.throws(() => assertNoPrivateInputs(root),/Private content/);
});
test('Renamed private packages and progress backups are detected by their format', () => {
  const root=temporaryRoot(); fs.mkdirSync(path.join(root,'src'),{recursive:true});
  for(const format of ['ege-private-learning-package','ege-progress-backup']) {
    for (const name of ['ordinary.json', 'ordinary.JSON']) {
      const file=path.join(root,'src',name); fs.writeFileSync(file,JSON.stringify({format}));
      assert.throws(() => assertBuildInput(file),/Personal JSON/);
    }
  }
});
test('Unresolved origin, missing licence and changed reviewed content block publication', () => {
  const root=temporaryRoot(), file=path.join(root,'sample.txt'); fs.writeFileSync(file,'reviewed');
  const entry={id:'fixture',clearance:'unverified',evidence:'Pending',files:[{path:'sample.txt',normalization:'lf',sha256:sha256('reviewed')}]};
  assert.throws(() => checkPublication({schemaVersion:1,entries:[entry]},root),/rights unresolved/);
  assert.throws(() => checkPublication({schemaVersion:1,entries:[{...entry,clearance:'licensed'}]},root),/Missing licence/);
  fs.writeFileSync(file,'changed');
  assert.throws(() => checkPublication({schemaVersion:1,entries:[{...entry,clearance:'project-generated'}]},root),/changed since/);
});
