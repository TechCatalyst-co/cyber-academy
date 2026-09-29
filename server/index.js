// HTTP server: serves the web client and the JSON API. No framework needed.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from './config.js';
import { createStore } from './store.js';
import { createApp } from '../core/app.js';
import { createAuth } from '../core/auth.js';
import { newId, iso } from '../core/util.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const clientDir = join(root, 'client');
const MAX_BODY = 2 * 1024 * 1024;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json', '.woff2': 'font/woff2',
};

function securityHeaders(cfg) {
  const h = {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'same-origin',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  };
  if (cfg.hsts) h['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  return h;
}

async function readBody(req) {
  return new Promise((resolveBody, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) { reject(Object.assign(new Error('Request too large'), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolveBody(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export async function start(cfg = loadConfig()) {
  const store = await createStore(cfg);
  const auth = createAuth({ secret: cfg.secret, iterations: cfg.pbkdf2Iterations, ttlSeconds: cfg.sessionHours * 3600 });
  const app = createApp({ store, auth, brand: cfg.brand });
  await app.ensureCatalog();

  // First run: create the provider admin from ADMIN_EMAIL / ADMIN_PASSWORD.
  const admins = await store.list('users', { role: 'platform_admin' });
  if (!admins.length) {
    if (cfg.adminEmail && cfg.adminPassword) {
      if (cfg.adminPassword.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters.');
      await store.insert('users', {
        id: newId(), tenant_id: null, email: cfg.adminEmail.toLowerCase(), name: cfg.adminName, password_hash: await auth.hash(cfg.adminPassword),
        role: 'platform_admin', department: 'Provider', job_title: 'Administrator', tracks: [], hire_date: null, status: 'active',
        must_change_password: 0, last_login: null, created_at: iso(new Date()),
      });
      console.log(`Created provider admin ${cfg.adminEmail}.`);
    } else {
      console.warn('No provider admin exists. Set ADMIN_EMAIL and ADMIN_PASSWORD and restart, or run "npm run seed" for demo data.');
    }
  }

  const headers = securityHeaders(cfg);
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    try {
      if (url.pathname.startsWith('/api/')) {
        let body = {};
        if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
          const raw = await readBody(req);
          if (raw) {
            if (!(req.headers['content-type'] || '').includes('application/json')) {
              res.writeHead(415, { ...headers, 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ error: 'Send JSON with Content-Type: application/json.' }));
            }
            try { body = JSON.parse(raw); } catch {
              res.writeHead(400, { ...headers, 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ error: 'The request body is not valid JSON.' }));
            }
          }
        }
        const out = await app.handle({ method: req.method, path: url.pathname, query: Object.fromEntries(url.searchParams), headers: req.headers, body });
        if (out.file) {
          res.writeHead(200, { ...headers, 'Content-Type': `${out.file.type}; charset=utf-8`, 'Content-Disposition': `attachment; filename="${out.file.name.replace(/[^\w.-]/g, '_')}"`, 'Cache-Control': 'no-store' });
          return res.end(out.file.text);
        }
        res.writeHead(out.status, { ...headers, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
        return res.end(JSON.stringify(out.body));
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, headers); return res.end(); }
      // Static files, with SPA fallback to index.html.
      let file = normalize(join(clientDir, decodeURIComponent(url.pathname)));
      if (!file.startsWith(clientDir)) { res.writeHead(403, headers); return res.end(); }
      let st = await stat(file).catch(() => null);
      if (!st || st.isDirectory()) { file = join(clientDir, 'index.html'); st = await stat(file); }
      const type = TYPES[extname(file)] || 'application/octet-stream';
      res.writeHead(200, { ...headers, 'Content-Type': type, 'Cache-Control': extname(file) === '.html' ? 'no-cache' : 'public, max-age=300' });
      if (req.method === 'HEAD') return res.end();
      res.end(await readFile(file));
    } catch (e) {
      const status = e.status || 500;
      if (status === 500) console.error(e);
      if (!res.headersSent) res.writeHead(status, { ...headers, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: status === 413 ? 'That upload is too large (2 MB limit).' : 'Server error.' }));
    }
  });
  await new Promise((r) => server.listen(cfg.port, cfg.host, r));
  console.log(`${cfg.brand} LMS running on http://localhost:${server.address().port}`);
  return { server, store, app };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  start().catch((e) => { console.error(e); process.exit(1); });
}
