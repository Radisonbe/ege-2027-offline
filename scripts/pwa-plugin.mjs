import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { assertBuildInput, assertNoPrivateInputs } from './content-policy.mjs';
import { checkContentBank } from './content-bank.mjs';

export const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
export function createWorker(files, template, buildId = '') {
  const entries = [...files].sort((a, b) => a.path.localeCompare(b.path));
  if (!entries.some(entry => entry.path === 'index.html')) throw new Error('PWA entry HTML is missing');
  const version = digest(JSON.stringify(entries) + template + buildId).slice(0, 20);
  return { version, files: entries, source: template.replace('__PWA_VERSION__', JSON.stringify(version)).replace('__PWA_BUILD__', JSON.stringify(buildId || version)).replace('__PWA_FILES__', JSON.stringify(entries)) };
}

export function offlinePwa() {
  let config;
  return {
    name: 'ege-complete-offline-kit',
    apply: 'build', enforce: 'post',
    configResolved(value) { config = value; },
    buildStart() { assertNoPrivateInputs(config.root); checkContentBank(config.root); },
    load(id) { assertBuildInput(id); return null; },
    generateBundle(_options, bundle) {
      const files = new Map();
      for (const [fileName, output] of Object.entries(bundle)) {
        if (fileName.endsWith('.map')) continue;
        files.set(fileName, output.type === 'chunk' ? output.code : output.source);
      }
      function readPublic(directory, prefix = '') {
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
          const name = prefix + entry.name;
          if (entry.isSymbolicLink()) throw new Error('Public resource links are not allowed: ' + name);
          if (entry.isDirectory()) readPublic(path.join(directory, entry.name), name + '/');
          else files.set(name, fs.readFileSync(path.join(directory, entry.name)));
        }
      }
      readPublic(config.publicDir);
      const template = fs.readFileSync(path.join(config.root, 'scripts/sw-template.js'), 'utf8');
      const originalEntries = [...files].map(([name, bytes]) => ({ path: name, sha256: digest(bytes) })).sort((a,b) => a.path.localeCompare(b.path));
      const buildId = digest(JSON.stringify(originalEntries) + template).slice(0,20);
      const html = String(files.get('index.html')).replace('</head>', `<meta name="ege-build" content="${buildId}"></head>`);
      files.set('index.html', html); bundle['index.html'].source = html;
      const result = createWorker([...files].map(([name, bytes]) => ({ path: name, sha256: digest(bytes) })), template, buildId);
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: result.source });
      // Diagnostic inventory is not needed at runtime and contains no user data.
      this.emitFile({ type: 'asset', fileName: 'offline-inventory.json', source: JSON.stringify({ version: result.version, files: result.files }, null, 2) });
    },
  };
}
