import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const PRIVATE_DIRECTORIES = new Set(['private-packages', 'personal-materials', 'local-data', 'user-data', 'imports', 'backups']);
export const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
export function isPrivatePath(file) {
  const parts = file.replaceAll('\\', '/').split('/');
  return parts.some(part => PRIVATE_DIRECTORIES.has(part.toLowerCase())) || /(?:\.private-(?:package|progress)|^ege-(?:progress|backup)-.*)\.json$/i.test(parts.at(-1));
}
export function assertBuildInput(file) {
  const clean = file.split('?')[0];
  if (isPrivatePath(clean)) throw new Error('Private content cannot enter a build: ' + clean);
  if (/\.json$/i.test(clean) && fs.existsSync(clean)) {
    const value = JSON.parse(fs.readFileSync(clean, 'utf8'));
    if (['ege-private-learning-package', 'ege-progress-backup'].includes(value?.format) || value?.distribution === 'private-import') throw new Error('Personal JSON cannot enter a build: ' + clean);
  }
}
export function assertNoPrivateInputs(root) {
  function walk(directory) {
    if (!fs.existsSync(directory)) return;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error('Linked build inputs must be reviewed: ' + file);
      assertBuildInput(file);
      if (entry.isDirectory()) walk(file);
    }
  }
  for (const directory of ['src', 'public']) walk(path.join(root, directory));
}
export function checkPublication(registry, root) {
  if (registry.schemaVersion !== 1 || !Array.isArray(registry.entries)) throw new Error('Unsupported source registry');
  for (const entry of registry.entries) {
    if (!['project-authored', 'project-generated', 'licensed', 'explicit-permission'].includes(entry.clearance) || !entry.evidence?.trim()) throw new Error('Publication rights unresolved: ' + entry.id);
    if (entry.clearance === 'licensed' && !entry.license?.trim()) throw new Error('Missing licence: ' + entry.id);
    for (const file of entry.files) {
      const resolved = path.resolve(root, file.path), relative = path.relative(root, resolved);
      if (relative.startsWith('..') || path.isAbsolute(relative) || isPrivatePath(relative)) throw new Error('Invalid source path: ' + file.path);
      const bytes = fs.readFileSync(resolved);
      if (!['lf', 'binary'].includes(file.normalization)) throw new Error('Invalid hash normalization: ' + file.path);
      const normalized = file.normalization === 'lf' ? bytes.toString('utf8').replaceAll('\r\n', '\n') : bytes;
      if (sha256(normalized) !== file.sha256) throw new Error('Content changed since provenance review: ' + file.path);
    }
  }
  for (const required of ['src/data/reference.json', 'src/styles/reference.css', 'src/components/Practices.tsx', 'src/components/GraphLab.tsx', 'src/components/ui.tsx', 'public/icon.svg', 'public/THIRD_PARTY_NOTICES.txt']) {
    if (!registry.entries.some(entry => entry.files.some(file => file.path === required))) throw new Error('Source review missing: ' + required);
  }
  const reviewed = new Set(registry.entries.flatMap(entry => entry.files.map(file => file.path)));
  function checkDirectory(directory, onlyJson = false) {
    if (!fs.existsSync(directory)) return;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) checkDirectory(file, onlyJson);
      else if ((!onlyJson || /\.json$/i.test(file)) && !reviewed.has(path.relative(root, file).replaceAll('\\', '/'))) throw new Error('Public resource not reviewed: ' + file);
    }
  }
  checkDirectory(path.join(root, 'public'));
  checkDirectory(path.join(root, 'src/data'), true);
}
