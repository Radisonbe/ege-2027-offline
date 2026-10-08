import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { assertNoPrivateInputs, checkPublication, isPrivatePath } from './content-policy.mjs';

const root = process.cwd();
assertNoPrivateInputs(root);
checkPublication(JSON.parse(fs.readFileSync('sources/publication.json', 'utf8')), root);
// .gitignore cannot undo an earlier commit or a forced add.
const current = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const candidates = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
for (const file of candidates) assertNoPersonalFile(file);
function assertNoPersonalFile(file) {
  // A renamed package outside the designated directories is still private.
  if (/\.json$/i.test(file) && fs.existsSync(file)) {
    const value = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (['ege-private-learning-package', 'ege-progress-backup','ege-python-playground-backup'].includes(value?.format) || value?.distribution === 'private-import' || (value?.schemaVersion===1&&typeof value.code==='string'&&typeof value.stdin==='string'&&typeof value.updatedAt==='string')) throw new Error('Personal JSON exists among Git candidates: ' + file);
  }
}
const history = execFileSync('git', ['log', '--all', '--format=', '--name-only'], { encoding: 'utf8' }).split(/\r?\n/).filter(Boolean);
for (const file of [...current, ...history]) if (isPrivatePath(file)) throw new Error('Private path exists in Git/history: ' + file);
console.log('Public content check passed. This check does not authorize publishing.');
