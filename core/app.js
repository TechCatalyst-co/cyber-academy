// The LMS API. Transport-agnostic: the Node server and the browser demo both
// call app.handle({ method, path, query, headers, body }) and get back
// { status, body } or { status, file }.
import { TABLES, ROLES, PLANS, TRACKS, OUTCOMES } from './schema.js';
import { scopedStore, HttpError } from './tenancy.js';
import { planAssignments, settingsOf, DEFAULT_SETTINGS, courseAvailable, programPosition } from './scheduler.js';
import { assignmentState, trainingSummary, phishingSummary, riskScore, riskBand, isRepeatClicker } from './compliance.js';
import { tenantDashboard, platformOverview, employeeRows, enrichResults, evidencePack, learners } from './analytics.js';
import { newId, iso, addDays, slugify, isEmail, parseCSV, toCSV, pct } from './util.js';
import { buildCatalog, CATALOG_VERSION, PHISHING_TEMPLATES } from '../content/catalog.js';

const WORDS = ['amber', 'birch', 'cobalt', 'delta', 'ember', 'fjord', 'granite', 'harbor', 'indigo', 'juniper', 'kestrel', 'lantern', 'meadow', 'nickel', 'orchid', 'pepper', 'quartz', 'raven', 'saffron', 'timber', 'umber', 'violet', 'willow', 'zephyr'];

export function generatePassword() {
  const buf = new Uint32Array(4);
  globalThis.crypto.getRandomValues(buf);
  const w = (i) => WORDS[buf[i] % WORDS.length];
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  return `${cap(w(0))}-${w(1)}-${w(2)}-${1000 + (buf[3] % 9000)}`;
}

function publicUser(u) {
  if (!u) return null;
  const { password_hash, ...rest } = u;
  return rest;
}

const str = (v, max = 120) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) && !isNaN(new Date(v).getTime());

export function createApp({ store, auth, now = () => new Date(), logger = console, brand = 'Cyber Academy', demo = false, loginLimit = { max: 8, windowMs: 15 * 60 * 1000 } }) {
  const routes = [];
  const lastSync = new Map();
  const loginFails = new Map();

  function add(method, path, opts, handler) {
    const keys = [];
    const re = new RegExp('^' + path.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '$');
    routes.push({ method, re, keys, opts, handler });
  }

  // ---------- helpers ----------
  async function audit(ctx, action, detail = '') {
    await store.insert('audit_log', {
      id: newId(), tenant_id: ctx.tenant?.id || null, actor_id: ctx.user?.id || null,
      actor_name: ctx.user?.name || 'system', action, detail: String(detail).slice(0, 500), created_at: iso(now()),
    });
  }

  // Register numbers: each client's position in the provider's register, by date added.
  async function registerNumbers() {
    const all = await store.list('tenants', {}, { orderBy: 'created_at' });
    return new Map(all.map((t, i) => [t.id, `C-${String(i + 1).padStart(3, '0')}`]));
  }

  async function coursesFor(tenant) {
    const global = await store.list('courses', { tenant_id: null });
    const own = tenant ? await store.list('courses', { tenant_id: tenant.id }) : [];
    return [...global, ...own].filter((c) => c.active).sort((a, b) => a.sort - b.sort);
  }

  async function syncTenant(tenant, force = false) {
    const t = now().getTime();
    if (!force && lastSync.get(tenant.id) > t - 60000) return 0;
    lastSync.set(tenant.id, t);
    const db = scopedStore(store, tenant.id);
    const [users, courses, existing] = await Promise.all([db.list('users'), coursesFor(tenant), db.list('assignments')]);
    const rows = planAssignments({ tenant, users, courses, existing, now: now() });
    if (rows.length) await db.insertMany('assignments', rows);
    return rows.length;
  }

  async function tenantData(ctx, { attempts = false } = {}) {
    const db = ctx.db;
    const [users, assignments, courses, campaigns, results] = await Promise.all([
      db.list('users'), db.list('assignments'), coursesFor(ctx.tenant), db.list('phishing_campaigns'), db.list('phishing_results'),
    ]);
    const out = { tenant: ctx.tenant, users, assignments, courses, campaigns, results, now: now() };
    if (attempts) out.attempts = await db.list('quiz_attempts');
    return out;
  }

  function requireAdmin(ctx) {
    if (!ctx.isAdmin) throw new HttpError(403, 'Only company administrators can do this.');
  }

  function canSeeUser(ctx, u) {
    if (ctx.isAdmin) return true;
    if (u.id === ctx.user.id) return true;
    return ctx.user.role === 'manager' && (u.department || 'Unassigned') === (ctx.user.department || 'Unassigned');
  }

  async function uniqueSlug(name) {
    const base = slugify(name);
    let slug = base, i = 2;
    while ((await store.list('tenants', { slug })).length) slug = `${base}-${i++}`;
    return slug;
  }

  function validateEmployee(body, partial = false) {
    const out = {};
    if (!partial || body.name !== undefined) {
      out.name = str(body.name, 100);
      if (!out.name) throw new HttpError(400, 'Enter the employee\'s name.');
    }
    if (!partial || body.email !== undefined) {
      out.email = str(body.email, 254).toLowerCase();
      if (!isEmail(out.email)) throw new HttpError(400, `"${body.email || ''}" is not a valid email address.`);
    }
    if (body.department !== undefined) out.department = str(body.department, 60) || null;
    if (body.job_title !== undefined) out.job_title = str(body.job_title, 80) || null;
    if (body.role !== undefined || !partial) {
      out.role = body.role || 'employee';
      if (!['company_admin', 'manager', 'employee'].includes(out.role)) throw new HttpError(400, 'Role must be company_admin, manager or employee.');
    }
    if (body.tracks !== undefined) {
      const list = Array.isArray(body.tracks) ? body.tracks : String(body.tracks).split(/[;|]/);
      out.tracks = [...new Set(list.map((t) => String(t).trim().toLowerCase()).filter(Boolean))];
      const bad = out.tracks.filter((t) => !(t in TRACKS));
      if (bad.length) throw new HttpError(400, `Unknown role track: ${bad.join(', ')}. Use ${Object.keys(TRACKS).join(', ')}.`);
    }
    if (body.hire_date !== undefined && body.hire_date !== null && body.hire_date !== '') {
      if (!isDate(body.hire_date)) throw new HttpError(400, 'Hire date must be in YYYY-MM-DD format.');
      out.hire_date = body.hire_date.slice(0, 10);
    }
    if (body.status !== undefined) {
      if (!['active', 'inactive'].includes(body.status)) throw new HttpError(400, 'Status must be active or inactive.');
      out.status = body.status;
    }
    return out;
  }

  async function createUser(ctx, data, password) {
    const exists = await store.list('users', { email: data.email });
    if (exists.length) throw new HttpError(409, `${data.email} already has an account.`);
    const user = await store.insert('users', {
      id: newId(), tenant_id: ctx.tenant.id, email: data.email, name: data.name,
      password_hash: await auth.hash(password), role: data.role || 'employee',
      department: data.department || null, job_title: data.job_title || null, tracks: data.tracks || [],
      hire_date: data.hire_date || null, status: 'active', must_change_password: 1, last_login: null, created_at: iso(now()),
    });
    return user;
  }

  function courseForLearner(course) {
    return { ...course, quiz: (course.quiz || []).map(({ answer, explain, ...q }) => q) };
  }

  // ---------- auth ----------
  add('GET', '/api/health', { public: true }, async () => {
    try { await store.ping?.(); } catch { throw new HttpError(503, 'The database is not reachable.'); }
    return { ok: true, database: store.kind, time: iso(now()) };
  });
  add('GET', '/api/config', { public: true }, async () => ({ brand, demo, tracks: TRACKS }));

  add('POST', '/api/auth/login', { public: true }, async (ctx, p, body) => {
    const email = str(body.email, 254).toLowerCase();
    const key = email;
    const f = loginFails.get(key);
    const t = now().getTime();
    if (f && f.count >= loginLimit.max && t - f.first < loginLimit.windowMs) {
      throw new HttpError(429, 'Too many failed sign-in attempts. Wait 15 minutes and try again.');
    }
    const [user] = await store.list('users', { email });
    const ok = user && user.status === 'active' && (await auth.verify(String(body.password || ''), user.password_hash));
    if (!ok) {
      const cur = f && t - f.first < loginLimit.windowMs ? f : { count: 0, first: t };
      cur.count++;
      loginFails.set(key, cur);
      throw new HttpError(401, 'That email and password do not match an active account.');
    }
    loginFails.delete(key);
    let tenant = null;
    if (user.tenant_id) {
      tenant = await store.get('tenants', user.tenant_id);
      if (!tenant || tenant.status !== 'active') throw new HttpError(403, 'Your company\'s account is paused. Contact your training provider.');
      await syncTenant(tenant);
    }
    await store.update('users', user.id, { last_login: iso(now()) });
    const token = await auth.sign({ sub: user.id, role: user.role, tid: user.tenant_id || null });
    await audit({ user, tenant }, 'auth.login', user.email);
    return { token, user: publicUser(user), tenant };
  });

  add('GET', '/api/auth/me', {}, async (ctx) => {
    const tenant = ctx.user.tenant_id ? await store.get('tenants', ctx.user.tenant_id) : null;
    return { user: publicUser(ctx.user), tenant };
  });

  add('POST', '/api/auth/password', {}, async (ctx, p, body) => {
    const next = String(body.next || '');
    if (next.length < 10) throw new HttpError(400, 'Use at least 10 characters. A passphrase of three or four words works well.');
    if (!(await auth.verify(String(body.current || ''), ctx.user.password_hash))) throw new HttpError(400, 'Your current password is not correct.');
    await store.update('users', ctx.user.id, { password_hash: await auth.hash(next), must_change_password: 0 });
    await audit(ctx, 'auth.password_changed', ctx.user.email);
    return { ok: true };
  });

  // ---------- provider (platform) ----------
  add('GET', '/api/platform/overview', { platform: true }, async () => {
    const tenants = await store.list('tenants');
    for (const t of tenants) await syncTenant(t);
    const [users, assignments, campaigns, results, courses] = await Promise.all([
      store.list('users'), store.list('assignments'),
      store.list('phishing_campaigns'), store.list('phishing_results'), coursesFor(null),
    ]);
    const ov = platformOverview({ tenants, users: users.filter((u) => u.tenant_id), assignments, campaigns, results, courses, now: now() });
    const reg = await registerNumbers();
    ov.companies.forEach((c) => { c.register_no = reg.get(c.id); });
    return ov;
  });

  add('GET', '/api/tenants', { platform: true }, async () => {
    const tenants = await store.list('tenants', {}, { orderBy: 'name' });
    const users = await store.list('users');
    const reg = await registerNumbers();
    return tenants.map((t) => ({ ...t, register_no: reg.get(t.id), employees: users.filter((u) => u.tenant_id === t.id && u.status === 'active').length }));
  });

  add('POST', '/api/tenants', { platform: true }, async (ctx, p, body) => {
    const name = str(body.name, 100);
    if (!name) throw new HttpError(400, 'Enter the company name.');
    const plan = body.plan || 'professional';
    if (!PLANS.includes(plan)) throw new HttpError(400, 'Plan must be essentials, professional or premium.');
    const start = body.program_start || iso(now()).slice(0, 10);
    if (!isDate(start)) throw new HttpError(400, 'Program start must be a date (YYYY-MM-DD).');
    const admin = validateEmployee({ name: body.admin_name, email: body.admin_email, role: 'company_admin' });
    if ((await store.list('users', { email: admin.email })).length) throw new HttpError(409, `${admin.email} already has an account.`);
    const tenant = await store.insert('tenants', {
      id: newId(), name, slug: await uniqueSlug(name), industry: str(body.industry, 60) || null, plan, status: 'active',
      program_start: new Date(start).toISOString(), contact_name: admin.name, contact_email: admin.email,
      settings: { ...DEFAULT_SETTINGS, departments: [] }, created_at: iso(now()),
    });
    const password = body.admin_password && String(body.admin_password).length >= 10 ? String(body.admin_password) : generatePassword();
    const user = await createUser({ ...ctx, tenant }, { ...admin, department: 'Management', tracks: ['leadership'] }, password);
    await syncTenant(tenant, true);
    await audit({ ...ctx, tenant }, 'tenant.created', `${name} (${plan}) with admin ${admin.email}`);
    return { tenant, admin: publicUser(user), temp_password: password };
  });

  add('GET', '/api/tenants/:id', { platform: true }, async (ctx, p) => {
    const tenant = await store.get('tenants', p.id);
    if (!tenant) throw new HttpError(404, 'Company not found.');
    const c = { ...ctx, tenant, db: scopedStore(store, tenant.id) };
    await syncTenant(tenant);
    return { tenant, dashboard: tenantDashboard(await tenantData(c)) };
  });

  add('PATCH', '/api/tenants/:id', { platform: true }, async (ctx, p, body) => {
    const tenant = await store.get('tenants', p.id);
    if (!tenant) throw new HttpError(404, 'Company not found.');
    const patch = {};
    if (body.name !== undefined) { patch.name = str(body.name, 100); if (!patch.name) throw new HttpError(400, 'Enter the company name.'); }
    if (body.industry !== undefined) patch.industry = str(body.industry, 60) || null;
    if (body.plan !== undefined) { if (!PLANS.includes(body.plan)) throw new HttpError(400, 'Unknown plan.'); patch.plan = body.plan; }
    if (body.status !== undefined) { if (!['active', 'paused'].includes(body.status)) throw new HttpError(400, 'Status must be active or paused.'); patch.status = body.status; }
    if (body.program_start !== undefined) { if (!isDate(body.program_start)) throw new HttpError(400, 'Program start must be a date.'); patch.program_start = new Date(body.program_start).toISOString(); }
    const updated = await store.update('tenants', tenant.id, patch);
    await syncTenant(updated, true);
    await audit({ ...ctx, tenant }, 'tenant.updated', JSON.stringify(patch));
    return updated;
  });

  // ---------- company (tenant) ----------
  add('GET', '/api/tenant', { tenant: true }, async (ctx) => ({ ...ctx.tenant, register_no: (await registerNumbers()).get(ctx.tenant.id), settings: settingsOf(ctx.tenant), program: programPosition(ctx.tenant, now()) }));

  add('PATCH', '/api/tenant/settings', { tenant: true }, async (ctx, p, body) => {
    requireAdmin(ctx);
    const s = settingsOf(ctx.tenant);
    if (body.pass_mark !== undefined) { const v = Number(body.pass_mark); if (!(v >= 50 && v <= 100)) throw new HttpError(400, 'Pass mark must be between 50 and 100.'); s.pass_mark = Math.round(v); }
    if (body.due_days !== undefined) { const v = Number(body.due_days); if (!(v >= 7 && v <= 90)) throw new HttpError(400, 'Days to complete must be between 7 and 90.'); s.due_days = Math.round(v); }
    if (body.onboarding_days !== undefined) { const v = Number(body.onboarding_days); if (!(v >= 1 && v <= 30)) throw new HttpError(400, 'New-hire window must be between 1 and 30 days.'); s.onboarding_days = Math.round(v); }
    const updated = await store.update('tenants', ctx.tenant.id, { settings: s });
    await audit(ctx, 'settings.updated', JSON.stringify(s));
    return { ...updated, settings: settingsOf(updated) };
  });

  add('GET', '/api/dashboard', { tenant: true }, async (ctx, p, b, q) => {
    if (!ctx.isAdmin && ctx.user.role !== 'manager') throw new HttpError(403, 'Only administrators and managers can see the dashboard.');
    await syncTenant(ctx.tenant);
    const department = ctx.isAdmin ? (q.department || null) : (ctx.user.department || 'Unassigned');
    const data = await tenantData(ctx);
    const dash = tenantDashboard({ ...data, department });
    dash.tenant.register_no = (await registerNumbers()).get(ctx.tenant.id);
    dash.departments = [...new Set(learners(data.users).map((u) => u.department || 'Unassigned'))].sort();
    return dash;
  });

  add('GET', '/api/employees', { tenant: true }, async (ctx, p, b, q) => {
    if (!ctx.isAdmin && ctx.user.role !== 'manager') throw new HttpError(403, 'Only administrators and managers can see employee records.');
    const data = await tenantData(ctx);
    let users = data.users;
    if (!ctx.isAdmin) users = users.filter((u) => canSeeUser(ctx, u));
    if (q.include_inactive !== '1') users = users.filter((u) => u.status === 'active');
    let rows = employeeRows({ tenant: ctx.tenant, users, assignments: data.assignments, results: enrichResults(data.results, data.campaigns), now: now() });
    if (q.department) rows = rows.filter((r) => r.department === q.department);
    if (q.status) rows = rows.filter((r) => r.training.status === q.status);
    if (q.q) { const s = q.q.toLowerCase(); rows = rows.filter((r) => r.name.toLowerCase().includes(s) || r.email.includes(s)); }
    return rows.sort((a, b) => a.name.localeCompare(b.name));
  });

  add('POST', '/api/employees', { tenant: true }, async (ctx, p, body) => {
    requireAdmin(ctx);
    const data = validateEmployee(body);
    const password = generatePassword();
    const user = await createUser(ctx, data, password);
    await syncTenant(ctx.tenant, true);
    await audit(ctx, 'employee.created', user.email);
    return { user: publicUser(user), temp_password: password };
  });

  add('POST', '/api/employees/import', { tenant: true }, async (ctx, p, body) => {
    requireAdmin(ctx);
    const rows = parseCSV(String(body.csv || ''));
    if (!rows.length) throw new HttpError(400, 'Paste CSV with a header row: name,email,department,job_title,role,tracks,hire_date');
    if (rows.length > 2000) throw new HttpError(400, 'Import up to 2,000 people at a time.');
    const created = [], errors = [];
    for (const [i, r] of rows.entries()) {
      try {
        const data = validateEmployee({ ...r, role: r.role || 'employee', tracks: r.tracks || [] });
        const password = generatePassword();
        const u = await createUser(ctx, data, password);
        created.push({ email: u.email, name: u.name, temp_password: password });
      } catch (e) {
        errors.push({ row: i + 2, email: r.email || '', error: e.message });
      }
    }
    await syncTenant(ctx.tenant, true);
    await audit(ctx, 'employee.imported', `${created.length} created, ${errors.length} skipped`);
    return { created, errors };
  });

  add('GET', '/api/employees/:id', { tenant: true }, async (ctx, p) => {
    const user = await ctx.db.get('users', p.id);
    if (!user || !canSeeUser(ctx, user)) throw new HttpError(404, 'Employee not found.');
    const [assignments, attempts, results, campaigns, courses] = await Promise.all([
      ctx.db.list('assignments', { user_id: user.id }), ctx.db.list('quiz_attempts', { user_id: user.id }),
      ctx.db.list('phishing_results', { user_id: user.id }), ctx.db.list('phishing_campaigns'), coursesFor(ctx.tenant),
    ]);
    const cById = new Map(courses.map((c) => [c.id, c]));
    const s = settingsOf(ctx.tenant);
    const enriched = enrichResults(results, campaigns);
    const training = trainingSummary(assignments, now(), s.due_soon_days);
    const campaignById = new Map(campaigns.map((c) => [c.id, c]));
    return {
      user: publicUser(user),
      training,
      phishing: phishingSummary(enriched, now()),
      risk: riskScore(training, enriched, now()),
      risk_band: riskBand(riskScore(training, enriched, now())),
      repeat_clicker: isRepeatClicker(enriched, now()),
      assignments: assignments.map((a) => ({
        ...a, state: assignmentState(a, now(), s.due_soon_days),
        course: { id: a.course_id, code: cById.get(a.course_id)?.code, title: cById.get(a.course_id)?.title, category: cById.get(a.course_id)?.category },
      })).sort((a, b) => (a.due_at < b.due_at ? 1 : -1)),
      attempts: attempts.map((x) => ({ id: x.id, assignment_id: x.assignment_id, course_title: cById.get(x.course_id)?.title, score: x.score, passed: !!x.passed, created_at: x.created_at }))
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
      phishing_results: enriched.filter((r) => r.outcome !== 'pending').map((r) => ({
        id: r.id, campaign: campaignById.get(r.campaign_id)?.name, channel: r.channel, sent_at: r.sent_at, outcome: r.outcome,
      })).sort((a, b) => (a.sent_at < b.sent_at ? 1 : -1)),
    };
  });

  add('PATCH', '/api/employees/:id', { tenant: true }, async (ctx, p, body) => {
    requireAdmin(ctx);
    const user = await ctx.db.get('users', p.id);
    if (!user) throw new HttpError(404, 'Employee not found.');
    const patch = validateEmployee(body, true);
    delete patch.email;
    if (user.id === ctx.user.id && (patch.status === 'inactive' || (patch.role && patch.role !== 'company_admin'))) {
      throw new HttpError(400, 'You cannot deactivate or demote your own account.');
    }
    const updated = await ctx.db.update('users', user.id, patch);
    await syncTenant(ctx.tenant, true);
    await audit(ctx, 'employee.updated', `${user.email}: ${Object.keys(patch).join(', ')}`);
    return publicUser(updated);
  });

  add('POST', '/api/employees/:id/reset-password', { tenant: true }, async (ctx, p) => {
    requireAdmin(ctx);
    const user = await ctx.db.get('users', p.id);
    if (!user) throw new HttpError(404, 'Employee not found.');
    const password = generatePassword();
    await ctx.db.update('users', user.id, { password_hash: await auth.hash(password), must_change_password: 1 });
    await audit(ctx, 'employee.password_reset', user.email);
    return { temp_password: password };
  });

  // ---------- courses & assignments ----------
  add('GET', '/api/courses', { tenant: true }, async (ctx) => {
    const courses = await coursesFor(ctx.tenant);
    return courses.map(({ lessons, quiz, ...c }) => ({ ...c, lesson_count: lessons.length, question_count: quiz.length, available: courseAvailable(c, ctx.tenant) }));
  });

  add('GET', '/api/courses/:id', { tenant: true }, async (ctx, p) => {
    if (!ctx.isAdmin && ctx.user.role !== 'manager') throw new HttpError(403, 'Open your courses from My training.');
    const c = (await coursesFor(ctx.tenant)).find((x) => x.id === p.id);
    if (!c) throw new HttpError(404, 'Course not found.');
    return c;
  });

  add('POST', '/api/assignments', { tenant: true }, async (ctx, p, body) => {
    requireAdmin(ctx);
    const c = (await coursesFor(ctx.tenant)).find((x) => x.id === body.course_id);
    if (!c) throw new HttpError(404, 'Course not found.');
    if (!isDate(body.due_at)) throw new HttpError(400, 'Choose a due date.');
    const ids = Array.isArray(body.user_ids) ? body.user_ids : [];
    const users = (await ctx.db.list('users', { id: ids })).filter((u) => u.status === 'active');
    if (!users.length) throw new HttpError(400, 'Choose at least one active employee.');
    const rows = users.map((u) => ({
      id: newId(), user_id: u.id, course_id: c.id, cycle: 0, source: 'manual', released_at: iso(now()),
      due_at: new Date(body.due_at).toISOString(), status: 'assigned', started_at: null, completed_at: null, score: null, attempts: 0,
    }));
    await ctx.db.insertMany('assignments', rows);
    await audit(ctx, 'assignment.created', `${c.code} to ${rows.length} people`);
    return { created: rows.length };
  });

  add('PATCH', '/api/assignments/:id', { tenant: true }, async (ctx, p, body) => {
    requireAdmin(ctx);
    const a = await ctx.db.get('assignments', p.id);
    if (!a) throw new HttpError(404, 'Assignment not found.');
    const patch = {};
    if (body.due_at !== undefined) { if (!isDate(body.due_at)) throw new HttpError(400, 'Choose a valid due date.'); patch.due_at = new Date(body.due_at).toISOString(); }
    if (body.status !== undefined) {
      if (!['excused', 'assigned'].includes(body.status)) throw new HttpError(400, 'You can only excuse or reinstate an assignment.');
      if (a.status === 'completed') throw new HttpError(400, 'This assignment is already complete.');
      patch.status = body.status === 'assigned' ? (a.started_at ? 'in_progress' : 'assigned') : 'excused';
    }
    const updated = await ctx.db.update('assignments', a.id, patch);
    await audit(ctx, 'assignment.updated', `${a.id}: ${JSON.stringify(patch)}${body.reason ? ` (${str(body.reason, 200)})` : ''}`);
    return updated;
  });

  // ---------- learner ----------
  add('GET', '/api/me/training', { tenant: true }, async (ctx) => {
    await syncTenant(ctx.tenant);
    const [assignments, courses] = await Promise.all([ctx.db.list('assignments', { user_id: ctx.user.id }), coursesFor(ctx.tenant)]);
    const cById = new Map(courses.map((c) => [c.id, c]));
    const s = settingsOf(ctx.tenant);
    return {
      summary: trainingSummary(assignments, now(), s.due_soon_days),
      pass_mark: s.pass_mark,
      assignments: assignments.filter((a) => a.status !== 'excused').map((a) => {
        const c = cById.get(a.course_id);
        return { ...a, state: assignmentState(a, now(), s.due_soon_days), course: c ? { id: c.id, code: c.code, title: c.title, summary: c.summary, category: c.category, duration_min: c.duration_min, lesson_count: c.lessons.length, question_count: c.quiz.length } : null };
      }).sort((a, b) => (a.due_at < b.due_at ? -1 : 1)),
    };
  });

  add('GET', '/api/me/assignments/:id', { tenant: true }, async (ctx, p) => {
    let a = await ctx.db.get('assignments', p.id);
    if (!a || a.user_id !== ctx.user.id || a.status === 'excused') throw new HttpError(404, 'Assignment not found.');
    const c = (await coursesFor(ctx.tenant)).find((x) => x.id === a.course_id);
    if (!c) throw new HttpError(404, 'This course is no longer available.');
    if (a.status === 'assigned') a = await ctx.db.update('assignments', a.id, { status: 'in_progress', started_at: iso(now()) });
    const s = settingsOf(ctx.tenant);
    return { assignment: { ...a, state: assignmentState(a, now(), s.due_soon_days) }, course: courseForLearner(c), pass_mark: c.pass_mark || s.pass_mark };
  });

  add('POST', '/api/me/assignments/:id/submit', { tenant: true }, async (ctx, p, body) => {
    const a = await ctx.db.get('assignments', p.id);
    if (!a || a.user_id !== ctx.user.id || a.status === 'excused') throw new HttpError(404, 'Assignment not found.');
    const c = (await coursesFor(ctx.tenant)).find((x) => x.id === a.course_id);
    if (!c) throw new HttpError(404, 'This course is no longer available.');
    const answers = body.answers && typeof body.answers === 'object' ? body.answers : {};
    const missing = c.quiz.filter((q) => answers[q.id] === undefined || answers[q.id] === null);
    if (missing.length) throw new HttpError(400, `Answer all ${c.quiz.length} questions before submitting (${missing.length} left).`);
    const graded = c.quiz.map((q) => ({ id: q.id, correct: Number(answers[q.id]) === q.answer, answer: q.answer, explain: q.explain }));
    const correct = graded.filter((g) => g.correct).length;
    const score = Math.round((correct / c.quiz.length) * 100);
    const passMark = c.pass_mark || settingsOf(ctx.tenant).pass_mark;
    const passed = score >= passMark;
    await ctx.db.insert('quiz_attempts', {
      id: newId(), user_id: ctx.user.id, assignment_id: a.id, course_id: c.id, score, passed: passed ? 1 : 0,
      answers, created_at: iso(now()),
    });
    const patch = { attempts: (a.attempts || 0) + 1 };
    if (!a.started_at) patch.started_at = iso(now());
    if (passed && a.status !== 'completed') Object.assign(patch, { status: 'completed', completed_at: iso(now()), score });
    else if (passed) patch.score = Math.max(a.score || 0, score);
    else if (a.status !== 'completed') patch.status = 'in_progress';
    const updated = await ctx.db.update('assignments', a.id, patch);
    if (passed && a.status !== 'completed') await audit(ctx, 'course.completed', `${c.code} with ${score}%`);
    return {
      score, passed, pass_mark: passMark, correct, total: c.quiz.length, assignment: updated,
      // Correct answers are only revealed after a pass, so retakes stay meaningful.
      results: graded.map((g) => (passed ? g : { id: g.id, correct: g.correct })),
    };
  });

  add('GET', '/api/certificates/:id', { tenant: true }, async (ctx, p) => {
    const a = await ctx.db.get('assignments', p.id);
    if (!a || a.status !== 'completed') throw new HttpError(404, 'Certificate not found.');
    const user = await ctx.db.get('users', a.user_id);
    if (!user || !canSeeUser(ctx, user)) throw new HttpError(404, 'Certificate not found.');
    const c = (await coursesFor(ctx.tenant)).find((x) => x.id === a.course_id);
    return {
      certificate_no: `${ctx.tenant.slug.toUpperCase().slice(0, 6)}-${a.id.slice(0, 8).toUpperCase()}`,
      employee: user.name, company: ctx.tenant.name, course: c?.title, code: c?.code, category: c?.category,
      completed_at: a.completed_at, score: a.score, duration_min: c?.duration_min,
    };
  });

  // ---------- phishing ----------
  add('GET', '/api/phishing/templates', { tenant: true }, async () => PHISHING_TEMPLATES);

  add('GET', '/api/phishing/campaigns', { tenant: true }, async (ctx) => {
    if (!ctx.isAdmin && ctx.user.role !== 'manager') throw new HttpError(403, 'Only administrators and managers can see phishing results.');
    const [campaigns, results] = await Promise.all([ctx.db.list('phishing_campaigns'), ctx.db.list('phishing_results')]);
    return campaigns.map((c) => {
      const list = results.filter((r) => r.campaign_id === c.id);
      return { ...c, targeted: list.length, pending: list.filter((r) => r.outcome === 'pending').length, ...phishingSummary(list, now()) };
    }).sort((a, b) => (a.sent_at < b.sent_at ? 1 : -1));
  });

  add('POST', '/api/phishing/campaigns', { tenant: true }, async (ctx, p, body) => {
    requireAdmin(ctx);
    const name = str(body.name, 100);
    if (!name) throw new HttpError(400, 'Name the campaign.');
    const channel = body.channel || 'email';
    if (!['email', 'sms', 'voice', 'qr'].includes(channel)) throw new HttpError(400, 'Channel must be email, sms, voice or qr.');
    const difficulty = body.difficulty || 'medium';
    if (!['easy', 'medium', 'hard'].includes(difficulty)) throw new HttpError(400, 'Difficulty must be easy, medium or hard.');
    const sent = body.sent_at && isDate(body.sent_at) ? new Date(body.sent_at) : now();
    let users = learners(await ctx.db.list('users'));
    if (body.department) users = users.filter((u) => (u.department || 'Unassigned') === body.department);
    if (!users.length) throw new HttpError(400, 'No active employees match that audience.');
    const campaign = await ctx.db.insert('phishing_campaigns', {
      id: newId(), name, template: str(body.template, 40) || null, channel, difficulty, sent_at: iso(sent),
      status: sent <= now() ? 'running' : 'scheduled', created_at: iso(now()),
    });
    await ctx.db.insertMany('phishing_results', users.map((u) => ({ id: newId(), campaign_id: campaign.id, user_id: u.id, outcome: 'pending', event_at: null })));
    await audit(ctx, 'phishing.campaign_created', `${name} to ${users.length} people`);
    return { ...campaign, targeted: users.length };
  });

  add('GET', '/api/phishing/campaigns/:id', { tenant: true }, async (ctx, p) => {
    if (!ctx.isAdmin && ctx.user.role !== 'manager') throw new HttpError(403, 'Only administrators and managers can see phishing results.');
    const c = await ctx.db.get('phishing_campaigns', p.id);
    if (!c) throw new HttpError(404, 'Campaign not found.');
    const [results, users] = await Promise.all([ctx.db.list('phishing_results', { campaign_id: c.id }), ctx.db.list('users')]);
    const uById = new Map(users.map((u) => [u.id, u]));
    let rows = results.map((r) => ({ ...r, name: uById.get(r.user_id)?.name, email: uById.get(r.user_id)?.email, department: uById.get(r.user_id)?.department || 'Unassigned' }));
    if (!ctx.isAdmin) rows = rows.filter((r) => r.department === (ctx.user.department || 'Unassigned'));
    return { campaign: { ...c, ...phishingSummary(rows, now()), targeted: rows.length }, results: rows.sort((a, b) => (a.name || '').localeCompare(b.name || '')) };
  });

  add('PATCH', '/api/phishing/campaigns/:id', { tenant: true }, async (ctx, p, body) => {
    requireAdmin(ctx);
    const c = await ctx.db.get('phishing_campaigns', p.id);
    if (!c) throw new HttpError(404, 'Campaign not found.');
    if (body.status !== 'closed') throw new HttpError(400, 'Campaigns can only be closed.');
    const pending = await ctx.db.list('phishing_results', { campaign_id: c.id, outcome: 'pending' });
    for (const r of pending) await ctx.db.update('phishing_results', r.id, { outcome: 'ignored', event_at: iso(now()) });
    const updated = await ctx.db.update('phishing_campaigns', c.id, { status: 'closed' });
    await audit(ctx, 'phishing.campaign_closed', `${c.name}: ${pending.length} marked no action`);
    return updated;
  });

  add('PATCH', '/api/phishing/results/:id', { tenant: true }, async (ctx, p, body) => {
    requireAdmin(ctx);
    if (!OUTCOMES.includes(body.outcome)) throw new HttpError(400, `Outcome must be one of ${OUTCOMES.join(', ')}.`);
    const r = await ctx.db.get('phishing_results', p.id);
    if (!r) throw new HttpError(404, 'Result not found.');
    return ctx.db.update('phishing_results', r.id, { outcome: body.outcome, event_at: iso(now()) });
  });

  add('POST', '/api/phishing/campaigns/:id/import', { tenant: true }, async (ctx, p, body) => {
    requireAdmin(ctx);
    const c = await ctx.db.get('phishing_campaigns', p.id);
    if (!c) throw new HttpError(404, 'Campaign not found.');
    const rows = parseCSV(String(body.csv || ''));
    if (!rows.length) throw new HttpError(400, 'Paste CSV with a header row: email,outcome');
    const [results, users] = await Promise.all([ctx.db.list('phishing_results', { campaign_id: c.id }), ctx.db.list('users')]);
    const uByEmail = new Map(users.map((u) => [u.email, u]));
    let updated = 0; const errors = [];
    for (const [i, r] of rows.entries()) {
      const u = uByEmail.get((r.email || '').toLowerCase());
      const outcome = (r.outcome || '').toLowerCase();
      const res = u && results.find((x) => x.user_id === u.id);
      if (!res) { errors.push({ row: i + 2, error: `${r.email || 'Blank email'} was not in this campaign.` }); continue; }
      if (!OUTCOMES.includes(outcome)) { errors.push({ row: i + 2, error: `Unknown outcome "${r.outcome}".` }); continue; }
      await ctx.db.update('phishing_results', res.id, { outcome, event_at: iso(now()) });
      updated++;
    }
    await audit(ctx, 'phishing.results_imported', `${c.name}: ${updated} updated`);
    return { updated, errors };
  });

  // ---------- reports ----------
  function reportScope(ctx, users) {
    return ctx.isAdmin ? users : users.filter((u) => canSeeUser(ctx, u));
  }

  add('GET', '/api/reports/compliance.csv', { tenant: true }, async (ctx) => {
    if (!ctx.isAdmin && ctx.user.role !== 'manager') throw new HttpError(403, 'Only administrators and managers can export reports.');
    const data = await tenantData(ctx);
    const rows = employeeRows({ tenant: ctx.tenant, users: reportScope(ctx, learners(data.users)), assignments: data.assignments, results: enrichResults(data.results, data.campaigns), now: now() });
    const text = toCSV(rows.sort((a, b) => a.name.localeCompare(b.name)), [
      { label: 'Name', key: 'name' }, { label: 'Email', key: 'email' }, { label: 'Department', key: 'department' },
      { label: 'Job title', key: 'job_title' }, { label: 'Role', key: 'role' },
      { label: 'Compliance status', value: (r) => r.training.status.replace('_', '-') },
      { label: 'Modules due', value: (r) => r.training.required }, { label: 'Modules completed', value: (r) => r.training.completed },
      { label: 'Overdue', value: (r) => r.training.overdue }, { label: 'Due soon', value: (r) => r.training.due_soon },
      { label: 'Completion %', value: (r) => r.training.completion }, { label: 'Average quiz score', value: (r) => r.training.avg_score },
      { label: 'Last completed', value: (r) => r.training.last_completed?.slice(0, 10) },
      { label: 'Phishing tests', value: (r) => r.phishing.delivered }, { label: 'Phishing failures', value: (r) => r.phishing.clicked },
      { label: 'Phishing reports', value: (r) => r.phishing.reported }, { label: 'Click rate %', value: (r) => r.phishing.click_rate },
      { label: 'Repeat clicker', value: (r) => (r.repeat_clicker ? 'yes' : 'no') }, { label: 'Risk score', key: 'risk' },
    ]);
    await audit(ctx, 'report.exported', 'compliance.csv');
    return { __file: { name: `${ctx.tenant.slug}-compliance-${iso(now()).slice(0, 10)}.csv`, type: 'text/csv', text } };
  });

  add('GET', '/api/reports/training.csv', { tenant: true }, async (ctx) => {
    if (!ctx.isAdmin && ctx.user.role !== 'manager') throw new HttpError(403, 'Only administrators and managers can export reports.');
    const data = await tenantData(ctx);
    const users = new Map(reportScope(ctx, data.users).map((u) => [u.id, u]));
    const courses = new Map(data.courses.map((c) => [c.id, c]));
    const s = settingsOf(ctx.tenant);
    const rows = data.assignments.filter((a) => users.has(a.user_id)).sort((a, b) => (a.due_at < b.due_at ? -1 : 1));
    const text = toCSV(rows, [
      { label: 'Employee', value: (a) => users.get(a.user_id)?.name }, { label: 'Email', value: (a) => users.get(a.user_id)?.email },
      { label: 'Department', value: (a) => users.get(a.user_id)?.department },
      { label: 'Course code', value: (a) => courses.get(a.course_id)?.code }, { label: 'Course', value: (a) => courses.get(a.course_id)?.title },
      { label: 'Source', key: 'source' }, { label: 'Released', value: (a) => a.released_at?.slice(0, 10) }, { label: 'Due', value: (a) => a.due_at?.slice(0, 10) },
      { label: 'State', value: (a) => assignmentState(a, now(), s.due_soon_days) }, { label: 'Completed', value: (a) => a.completed_at?.slice(0, 10) },
      { label: 'Score', key: 'score' }, { label: 'Attempts', key: 'attempts' },
    ]);
    await audit(ctx, 'report.exported', 'training.csv');
    return { __file: { name: `${ctx.tenant.slug}-training-records-${iso(now()).slice(0, 10)}.csv`, type: 'text/csv', text } };
  });

  add('GET', '/api/reports/phishing.csv', { tenant: true }, async (ctx) => {
    requireAdmin(ctx);
    const data = await tenantData(ctx);
    const users = new Map(data.users.map((u) => [u.id, u]));
    const rows = enrichResults(data.results, data.campaigns).sort((a, b) => (a.sent_at < b.sent_at ? -1 : 1));
    const camp = new Map(data.campaigns.map((c) => [c.id, c]));
    const text = toCSV(rows, [
      { label: 'Campaign', value: (r) => camp.get(r.campaign_id)?.name }, { label: 'Channel', key: 'channel' },
      { label: 'Sent', value: (r) => r.sent_at?.slice(0, 10) }, { label: 'Employee', value: (r) => users.get(r.user_id)?.name },
      { label: 'Email', value: (r) => users.get(r.user_id)?.email }, { label: 'Department', value: (r) => users.get(r.user_id)?.department },
      { label: 'Outcome', key: 'outcome' },
    ]);
    await audit(ctx, 'report.exported', 'phishing.csv');
    return { __file: { name: `${ctx.tenant.slug}-phishing-${iso(now()).slice(0, 10)}.csv`, type: 'text/csv', text } };
  });

  add('GET', '/api/reports/evidence', { tenant: true }, async (ctx) => {
    requireAdmin(ctx);
    await syncTenant(ctx.tenant);
    const pack = evidencePack(await tenantData(ctx));
    pack.tenant.register_no = (await registerNumbers()).get(ctx.tenant.id);
    await audit(ctx, 'report.exported', 'evidence pack');
    return pack;
  });

  add('GET', '/api/audit', { tenant: true }, async (ctx) => {
    requireAdmin(ctx);
    return ctx.db.list('audit_log', {}, { orderBy: 'created_at', desc: true, limit: 200 });
  });

  // ---------- dispatch ----------
  async function handle(req) {
    const method = (req.method || 'GET').toUpperCase();
    const path = req.path.replace(/\/+$/, '') || '/';
    let match = null, allowed = false;
    for (const r of routes) {
      const m = r.re.exec(path);
      if (!m) continue;
      allowed = true;
      if (r.method !== method) continue;
      match = { r, params: Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])) };
      break;
    }
    if (!match) return allowed ? { status: 405, body: { error: 'Method not allowed.' } } : { status: 404, body: { error: 'Not found.' } };
    const { r, params } = match;
    const headers = Object.fromEntries(Object.entries(req.headers || {}).map(([k, v]) => [k.toLowerCase(), v]));
    const ctx = { now: now() };
    try {
      if (!r.opts.public) {
        const token = (headers.authorization || '').replace(/^Bearer\s+/i, '');
        const payload = token ? await auth.verifyToken(token) : null;
        const user = payload ? await store.get('users', payload.sub) : null;
        if (!user || user.status !== 'active') throw new HttpError(401, 'Your session has ended. Sign in again.');
        ctx.user = user;
        ctx.isPlatform = user.role === 'platform_admin';
        if (r.opts.platform && !ctx.isPlatform) throw new HttpError(403, 'Only provider staff can do this.');
        if (r.opts.tenant) {
          const tid = ctx.isPlatform ? headers['x-tenant-id'] : user.tenant_id;
          if (!tid) throw new HttpError(400, 'Choose a company first.');
          const tenant = await store.get('tenants', tid);
          if (!tenant) throw new HttpError(404, 'Company not found.');
          if (!ctx.isPlatform && tenant.status !== 'active') throw new HttpError(403, 'Your company\'s account is paused.');
          ctx.tenant = tenant;
          ctx.db = scopedStore(store, tenant.id);
          ctx.isAdmin = ctx.isPlatform || user.role === 'company_admin';
        }
      }
      const result = await r.handler(ctx, params, req.body || {}, req.query || {});
      if (result && result.__file) return { status: 200, file: result.__file };
      return { status: 200, body: result };
    } catch (e) {
      if (e instanceof HttpError) return { status: e.status, body: { error: e.message, ...(e.extra || {}) } };
      if (e.code === 'UNIQUE') return { status: 409, body: { error: 'That record already exists.' } };
      logger.error?.(e);
      return { status: 500, body: { error: 'Something went wrong on our side. Try again, and contact support if it keeps happening.' } };
    }
  }

  // Installs or upgrades the provider course catalog.
  async function ensureCatalog() {
    const existing = await store.list('courses', { tenant_id: null });
    const byCode = new Map(existing.map((c) => [c.code, c]));
    for (const c of buildCatalog()) {
      const cur = byCode.get(c.code);
      if (!cur) await store.insert('courses', { ...c, id: `course-${c.code.toLowerCase()}`, tenant_id: null, version: CATALOG_VERSION, active: 1, created_at: iso(now()) });
      else if ((cur.version || 0) < CATALOG_VERSION) await store.update('courses', cur.id, { ...c, version: CATALOG_VERSION });
    }
  }

  return { handle, ensureCatalog, syncTenant, routes };
}

export { TABLES, ROLES };
