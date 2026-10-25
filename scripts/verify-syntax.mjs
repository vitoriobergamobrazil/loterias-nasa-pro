import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const filesToCheck = [];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', '.git', '__pycache__', '.temp'].includes(entry.name)) {
        walk(full);
      }
    } else if (entry.name.endsWith('.js') || entry.name.endsWith('.mjs')) {
      filesToCheck.push(full);
    }
  }
}

walk('js');
walk('scripts');
filesToCheck.push('sw.js');

let ok = 0;
let errors = 0;

for (const file of filesToCheck) {
  try {
    execFileSync('node', ['--check', file], { stdio: 'pipe' });
    ok++;
  } catch (err) {
    console.error(`Syntax error in ${file}:`, err.message);
    errors++;
  }
}

console.log(`✅ ${ok} JavaScript files checked and validated.`);
if (errors > 0) {
  console.error(`❌ ${errors} files failed syntax check!`);
  process.exit(1);
}
