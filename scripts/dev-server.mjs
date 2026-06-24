// Zero-dependency local dev server; routes /api/* to the same handlers Vercel uses.

import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
// Pass "dist" to serve the built (obfuscated) site.
const SERVE_DIR = process.argv[2] || 'public';
const PUBLIC_DIR = path.join(ROOT, SERVE_DIR);
const API_DIR = path.join(ROOT, 'api');
const START_PORT = Number(process.env.PORT) || 3000;
const MAX_PORT_TRIES = 10;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

const handlerCache = new Map();

async function loadHandler(name) {
  if (handlerCache.has(name)) return handlerCache.get(name);
  const file = path.join(API_DIR, `${name}.js`);
  try {
    await stat(file);
  } catch {
    handlerCache.set(name, null);
    return null;
  }
  const mod = await import(pathToFileURL(file).href);
  handlerCache.set(name, mod.default || null);
  return mod.default || null;
}

async function serveApi(req, res, pathname) {
  const name = pathname.slice('/api/'.length);
  if (!/^[a-z0-9-]+$/i.test(name)) {
    res.writeHead(404).end('Not found');
    return;
  }
  const handler = await loadHandler(name);
  if (!handler) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not_found' }));
    return;
  }
  try {
    await handler(req, res);
  } catch (err) {
    console.error(`[api/${name}]`, err);
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'internal_error' }));
  }
}

// Does not emulate vercel.json cleanUrls/trailingSlash; serves literal paths so
// in-app URLs must stay canonical (no .html, no trailing slash) to match production.
async function serveStatic(req, res, pathname) {
  const rel = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const filePath = path.join(PUBLIC_DIR, rel);
  // Block path traversal outside PUBLIC_DIR; trailing separator stops prefix-sharing siblings.
  if (filePath !== PUBLIC_DIR && !filePath.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  try {
    const data = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  } catch {
    // SPA fallback to index.html for unknown non-asset routes.
    if (!path.extname(rel)) {
      try {
        const html = await readFile(path.join(PUBLIC_DIR, 'index.html'));
        res.writeHead(200, { 'Content-Type': MIME['.html'] });
        res.end(html);
        return;
      } catch { /* fall through */ }
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
}

const server = http.createServer((req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  if (pathname.startsWith('/api/')) serveApi(req, res, pathname);
  else serveStatic(req, res, pathname);
});

// If the port is taken, walk up to the next free one instead of crashing.
let port = START_PORT;
let attempts = 0;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE' && attempts < MAX_PORT_TRIES) {
    attempts += 1;
    const next = port + 1;
    console.warn(`Port ${port} is in use, trying ${next}...`);
    port = next;
    setTimeout(() => server.listen(port), 150);
  } else {
    console.error(err.code === 'EADDRINUSE'
      ? `Could not find a free port in ${START_PORT}-${port}. Set PORT to an open port and retry.`
      : (err.message || String(err)));
    process.exit(1);
  }
});

server.listen(port, () => {
  console.log(`worldle dev server  ->  http://localhost:${port}`);
});
