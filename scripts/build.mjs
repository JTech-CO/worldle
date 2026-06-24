// Production build: copy public/ -> dist/ and obfuscate the client JS.
//
// Local development still serves the readable public/ directory (npm run dev).
// Only the deployed site (Vercel serves dist/) ships obfuscated code, so view-
// source / Ctrl+U shows mangled output. This deters casual copying — it does not
// truly protect the code (the browser must still run it), and the public GitHub
// repo keeps the readable source for maintenance.
import { rm, cp, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JavaScriptObfuscator from 'javascript-obfuscator';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'public');
const OUT = path.join(ROOT, 'dist');

// Conservative options: enough to mangle names and hide strings, but no control-
// flow flattening or self-defending (those risk breaking ES modules / Three.js
// and hurt runtime perf). Static import specifiers are left intact, so the
// importmap ('three') and relative imports keep working.
const OBFUSCATOR_OPTIONS = {
  compact: true,
  target: 'browser',
  controlFlowFlattening: false,
  deadCodeInjection: false,
  selfDefending: false,
  simplify: true,
  identifierNamesGenerator: 'mangled-shuffled',
  numbersToExpressions: false,
  stringArray: true,
  stringArrayThreshold: 0.8,
  stringArrayEncoding: ['base64'],
  stringArrayRotate: true,
  stringArrayShuffle: true,
  splitStrings: false,
  transformObjectKeys: false,
  unicodeEscapeSequence: false,
};

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else out.push(full);
  }
  return out;
}

async function main() {
  await rm(OUT, { recursive: true, force: true });
  await cp(SRC, OUT, { recursive: true });

  const jsFiles = (await walk(path.join(OUT, 'js'))).filter((f) => f.endsWith('.js'));
  for (const file of jsFiles) {
    const code = await readFile(file, 'utf8');
    const obfuscated = JavaScriptObfuscator.obfuscate(code, OBFUSCATOR_OPTIONS).getObfuscatedCode();
    await writeFile(file, obfuscated, 'utf8');
  }
  console.log(`Built dist/ — obfuscated ${jsFiles.length} JS files.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
