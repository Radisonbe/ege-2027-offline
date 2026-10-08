import fs from 'node:fs';

// Format only the two project-owned stylesheets; preserve tokens and quoted content.
for (const file of ['src/styles/reference.css', 'src/styles/app.css']) {
  const input = fs.readFileSync(file, 'utf8');
  let buffer = '', depth = 0, parentheses = 0, quote = '', comment = false;
  const lines = [];
  const flush = () => { if (buffer.trim()) lines.push('  '.repeat(depth) + buffer.trim()); buffer = ''; };
  for (let i = 0; i < input.length; i++) {
    const char = input[i], next = input[i + 1];
    if (comment) { buffer += char; if (char === '*' && next === '/') { buffer += next; i++; comment = false; flush(); } continue; }
    if (quote) { buffer += char; if (char === '\\') { buffer += input[++i] ?? ''; } else if (char === quote) quote = ''; continue; }
    if (char === '/' && next === '*') { flush(); buffer += char + next; i++; comment = true; continue; }
    if (char === '"' || char === "'") { quote = char; buffer += char; continue; }
    if (char === '(') parentheses++;
    if (char === ')') parentheses--;
    if (parentheses === 0 && char === '{') { buffer += ' {'; flush(); depth++; }
    else if (parentheses === 0 && char === '}') { flush(); depth--; lines.push('  '.repeat(depth) + '}'); }
    else if (parentheses === 0 && char === ';') { buffer += char; flush(); }
    else buffer += char;
  }
  flush();
  if (depth || quote || comment) throw new Error('Unbalanced stylesheet: ' + file);
  fs.writeFileSync(file, lines.join('\n') + '\n');
}
