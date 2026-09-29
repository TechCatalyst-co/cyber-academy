// App shell: session, navigation rail, hash router.
import { api, get, post, session, setUnauthorizedHandler } from './api.js';
import { esc, fmt, icons, toast, asset, passwordInput } from './ui.js';
import * as provider from './views/provider.js';
import * as company from './views/company.js';
import * as employees from './views/employees.js';
import * as courses from './views/courses.js';
import * as phishing from './views/phishing.js';
import * as reports from './views/reports.js';
import * as learner from './views/learner.js';
import * as account from './views/account.js';

export const state = { config: { brand: 'Cyber Academy', tracks: {} }, user: null, ownTenant: null, tenant: null, demoAccounts: null };

const ROUTES = [
  ['/provider', provider.overview, 'platform'],
  ['/clients', provider.clients, 'platform'],
  ['/dashboard', company.dashboard, 'staff'],
  ['/employees', employees.list, 'staff'],
  ['/employees/:id', employees.detail, 'staff'],
  ['/courses', courses.catalog, 'admin'],
  ['/courses/:id', courses.detail, 'staff'],
  ['/phishing', phishing.list, 'staff'],
  ['/phishing/:id', phishing.detail, 'staff'],
  ['/reports', reports.index, 'staff'],
  ['/reports/evidence', reports.evidence, 'admin'],
  ['/settings', company.settings, 'admin'],
  ['/learn', learner.home, 'learner'],
  ['/learn/:id', learner.player, 'learner'],
  ['/certificate/:id', learner.certificate, 'tenant'],
  ['/account', account.view, 'any'],
];

const role = () => state.user?.role;
export const isPlatform = () => role() === 'platform_admin';
export const isAdmin = () => isPlatform() || role() === 'company_admin';
export const isStaff = () => isAdmin() || role() === 'manager';

export function go(path) {
  if (location.hash === `#${path}`) route();
  else location.hash = path;
}

function homePath() {
  if (isPlatform()) return state.tenant ? '/dashboard' : '/provider';
  if (isStaff()) return '/dashboard';
  return '/learn';
}

export async function actAs(tenantId) {
  session.tenantId = tenantId || null;
  state.tenant = tenantId ? await get('/api/tenant') : null;
  go(tenantId ? '/dashboard' : '/provider');
}

function allowed(kind) {
  if (kind === 'any') return true;
  if (kind === 'platform') return isPlatform();
  if (!state.tenant) return false;
  if (kind === 'tenant') return true;
  if (kind === 'admin') return isAdmin();
  if (kind === 'staff') return isStaff();
  if (kind === 'learner') return !isPlatform();
  return false;
}

function navHtml(path) {
  const here = path.startsWith('/certificate/') && !isStaff() ? '/learn' : path;
  const link = (href, icon, label) => `<a href="#${href}" ${here === href || (href !== '/' && here.startsWith(href + '/')) ? 'aria-current="page"' : ''}>${icons[icon]}<span>${esc(label)}</span></a>`;
  let html = '';
  if (isPlatform()) {
    html += `<div class="nav-label">Provider</div>${link('/provider', 'grid', 'Client overview')}${link('/clients', 'building', 'Clients')}`;
  }
  if (state.tenant && isStaff()) {
    html += `<div class="nav-label">${isPlatform() ? 'Client workspace' : 'Company'}</div>`;
    html += link('/dashboard', 'grid', 'Dashboard') + link('/employees', 'users', 'Employees');
    if (isAdmin()) html += link('/courses', 'book', 'Training catalog');
    html += link('/phishing', 'hook', 'Phishing tests') + link('/reports', 'file', 'Reports');
    if (isAdmin()) html += link('/settings', 'gear', 'Settings');
  }
  if (state.tenant && !isPlatform()) html += `<div class="nav-label">My learning</div>${link('/learn', 'play', 'My training')}`;
  return html;
}

function shell(path, content) {
  const u = state.user;
  const ctx = state.tenant
    ? `<div class="ctx"><span class="ctx-name">${esc(state.tenant.name)}</span><span class="ctx-meta">${esc(fmt.plan(state.tenant.plan))}${state.tenant.program?.started ? ` · Y${state.tenant.program.cycle} · M${state.tenant.program.month} of 12` : ''}</span>${isPlatform() ? `<a href="#" data-exit>All clients</a>` : ''}</div>`
    : '';
  return `<div class="shell" id="shell">
    <aside class="rail" aria-label="Main navigation">
      <a class="brand" href="#/" aria-label="${esc(state.config.brand)} home"><img src="${asset('tc-logo-white.png')}" alt="TechCatalyst"><span class="product">${esc(state.config.brand)}</span></a>
      ${ctx}
      <nav class="nav">${navHtml(path)}</nav>
      <div class="rail-foot">
        <div class="who"><span class="avatar">${esc(fmt.initials(u.name))}</span><div style="min-width:0"><div class="who-name">${esc(u.name)}</div><div class="who-role">${esc(fmt.role(u.role))}</div></div></div>
        <div class="row" style="gap:6px"><a class="rail-btn" href="#/account" style="text-decoration:none">Account</a><button class="rail-btn" data-logout>Sign out</button></div>
      </div>
    </aside>
    <div style="min-width:0">
      <div class="topbar-mobile"><button data-menu aria-label="Open menu">${icons.menu.replace('<svg', '<svg width="18" height="18"')}</button><img src="${asset('tc-logo-white.png')}" alt="TechCatalyst"><b>${esc(state.config.brand)}</b></div>
      <main class="main" id="main">${state.config.demo ? `<div class="demo-banner no-print"><b>Demo workspace.</b> Every company and person here is fictional, and changes reset when you reload. Signed in as ${esc(u.name)}, ${esc(fmt.role(u.role))}. <button class="btn-link" data-logout>Switch account</button></div>` : ''}<div id="view">${content}</div></main>
    </div>
  </div>`;
}

let renderSeq = 0;
async function route() {
  const seq = ++renderSeq;
  const app = document.getElementById('app');
  const path = (location.hash.replace(/^#/, '') || '/').split('?')[0];
  if (!state.user) return renderLogin(app);
  if (path === '/' || path === '') return go(homePath());
  let match = null;
  for (const [pattern, fn, kind] of ROUTES) {
    const keys = [];
    const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '$');
    const m = re.exec(path);
    if (m) { match = { fn, kind, params: Object.fromEntries(keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])) }; break; }
  }
  if (!match || !allowed(match.kind)) return go(homePath());
  const query = Object.fromEntries(new URLSearchParams(location.hash.split('?')[1] || ''));
  if (!document.getElementById('view') || app.dataset.path !== path.split('/')[1] || app.dataset.tenant !== (state.tenant?.id || '')) {
    app.innerHTML = shell(path, '<div class="page"><p class="muted">Loading…</p></div>');
    bindShell(app);
  } else {
    app.querySelector('.nav').innerHTML = navHtml(path);
  }
  app.dataset.path = path.split('/')[1];
  app.dataset.tenant = state.tenant?.id || '';
  const view = document.getElementById('view');
  try {
    const out = await match.fn({ params: match.params, query, state, go, refresh: route });
    if (seq !== renderSeq) return;
    view.innerHTML = out.html;
    out.mount?.(view);
    document.title = `${out.title ? out.title + ' · ' : ''}${state.config.brand}`;
    window.scrollTo(0, 0);
  } catch (e) {
    if (seq !== renderSeq) return;
    view.innerHTML = `<div class="page"><div class="card"><h2>That page could not load</h2><p class="ink2" style="margin-top:6px">${esc(e.message)}</p><p style="margin-top:12px"><a href="#${homePath()}">Go to your home page</a></p></div></div>`;
  }
  document.getElementById('shell')?.classList.remove('nav-open');
}

function bindShell(app) {
  app.querySelectorAll('[data-logout]').forEach((b) => b.addEventListener('click', logout));
  app.querySelector('[data-exit]')?.addEventListener('click', (e) => { e.preventDefault(); actAs(null); });
  app.querySelector('[data-menu]')?.addEventListener('click', () => document.getElementById('shell').classList.toggle('nav-open'));
  app.querySelector('.shell').addEventListener('click', (e) => {
    const sh = document.getElementById('shell');
    if (sh.classList.contains('nav-open') && !e.target.closest('.rail') && !e.target.closest('[data-menu]')) sh.classList.remove('nav-open');
  });
}

function logout() {
  session.token = null; session.tenantId = null;
  state.user = null; state.tenant = null; state.ownTenant = null;
  go('/login');
}

async function loginWith(email, password) {
  const res = await post('/api/auth/login', { email, password });
  session.token = res.token;
  session.tenantId = null;
  state.user = res.user;
  state.tenant = res.tenant ? await get('/api/tenant') : null;
  go(homePath());
  if (res.user.must_change_password) toast('Please choose a new password in Account.');
}

function renderLogin(app) {
  document.title = `Sign in · ${state.config.brand}`;
  delete app.dataset.path;
  const demo = state.demoAccounts;
  app.innerHTML = `<div class="login">
    <section class="login-side">
      <img src="${asset('tc-logo-white.png')}" alt="TechCatalyst">
      <div class="stack" style="gap:18px">
        <h1>${esc(state.config.brand)}</h1>
        <p>Security awareness training, phishing simulations and compliance records for every employee, in one register your insurer and auditor can read.</p>
      </div>
      <div class="stack" style="gap:14px">
        <div class="login-facts"><div><b>12</b>monthly modules</div><div><b>2</b>refreshers a year</div><div><b>6</b>role tracks</div></div>
        <span class="tagline">Secure Software. Built Right.</span>
      </div>
    </section>
    <section class="login-main">
      <form class="login-box" id="login" novalidate>
        <div class="stack" style="gap:6px"><h2>Sign in</h2><p class="muted">Use the work email your administrator registered.</p></div>
        <div class="field"><label for="email">Work email</label><input class="input" id="email" name="email" type="email" autocomplete="username" required></div>
        <div class="field"><label for="password">Password</label>${passwordInput('id="password" name="password" autocomplete="current-password" required')}</div>
        <p class="error" id="login-error" role="alert" hidden></p>
        <button class="btn btn-primary" type="submit">Sign in</button>
        ${demo ? `<div class="stack" style="gap:10px;margin-top:10px"><h3>Try a demo account</h3><div class="demo-accounts">${demo.map((a) => `<button type="button" class="demo-acct" data-email="${esc(a.email)}"><span class="avatar">${esc(fmt.initials(a.role))}</span><span style="min-width:0"><b>${esc(a.role)}</b><div class="r">${esc(a.company)}</div></span><span class="go">${icons.right.replace('<svg', '<svg class="ic"')}</span></button>`).join('')}</div></div>` : ''}
      </form>
    </section>
  </div>`;
  const form = app.querySelector('#login');
  const err = app.querySelector('#login-error');
  const submit = async (email, password) => {
    err.hidden = true;
    try { await loginWith(email, password); } catch (e) { err.textContent = e.message; err.hidden = false; }
  };
  form.addEventListener('submit', (e) => { e.preventDefault(); submit(form.email.value.trim(), form.password.value); });
  app.querySelectorAll('[data-email]').forEach((b) => b.addEventListener('click', () => submit(b.dataset.email, state.demoPassword)));
}

export async function boot(opts = {}) {
  state.demoAccounts = opts.demoAccounts || null;
  state.demoPassword = opts.demoPassword || null;
  try { state.config = await get('/api/config'); } catch { /* use defaults */ }
  setUnauthorizedHandler(() => { if (state.user) { toast('Your session ended. Sign in again.'); logout(); } });
  if (session.token) {
    try {
      const me = await get('/api/auth/me');
      state.user = me.user;
      if (me.user.role === 'platform_admin') state.tenant = session.tenantId ? await get('/api/tenant') : null;
      else state.tenant = await get('/api/tenant');
    } catch { session.token = null; state.user = null; }
  }
  window.addEventListener('hashchange', route);
  route();
}

export { api };
