// API tests: auth, tenant isolation, roles, scheduling, quiz grading, reports.
// Run with: npm test (in-memory store), TEST_STORE=mongo-adapter (MongoDB adapter on an
// in-process stand-in), or npm run test:mongo (MongoDB adapter against MONGODB_URI).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryStore } from '../core/store-memory.js';
import { createSqliteStore } from '../server/store-sqlite.js';
import { createMongoStore } from '../server/store-mongo.js';
import { createFakeMongoClient } from './fake-mongo.js';
import { createApp } from '../core/app.js';
import { createAuth } from '../core/auth.js';
import { seedDemo, DEMO_PASSWORD } from '../core/seed.js';
import { planAssignments } from '../core/scheduler.js';
import { trainingSummary } from '../core/compliance.js';
import { addDays, iso } from '../core/util.js';

let app, store;
const tokens = {};
const call = (method, path, token, body, headers = {}) => {
  const [p, qs] = path.split('?');
  return app.handle({ method, path: p, query: Object.fromEntries(new URLSearchParams(qs || '')), headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers }, body });
};
const login = async (email) => (await call('POST', '/api/auth/login', null, { email, password: DEMO_PASSWORD })).body.token;

let mongo = null;
async function makeStore() {
  const kind = process.env.TEST_STORE || 'memory';
  if (kind === 'memory') return createMemoryStore();
  if (kind === 'mongo-adapter') return createMongoStore({ client: createFakeMongoClient(), dbName: 'test' });
  if (kind === 'mongo') {
    if (!process.env.MONGODB_URI) throw new Error('Set MONGODB_URI to run the suite against MongoDB.');
    const dbName = process.env.MONGODB_TEST_DB || 'cyber_academy_test';
    if (!/test/.test(dbName)) throw new Error('The test database name must contain "test"; it is emptied by the suite.');
    mongo = await createMongoStore({ uri: process.env.MONGODB_URI, dbName });
    await mongo.dropAll();
    return mongo;
  }
  throw new Error(`Unknown TEST_STORE ${kind}`);
}

after(async () => {
  if (mongo) { await mongo.dropAll(); await mongo.close(); }
});

before(async () => {
  store = await makeStore();
  const auth = createAuth({ secret: 'test-secret-that-is-long-enough-1234567890', iterations: 1000 });
  app = createApp({ store, auth, logger: { error() {} } });
  await seedDemo({ store, app, passwordHash: await auth.hash(DEMO_PASSWORD) });
  tokens.provider = await login('admin@techcatalyst.example');
  tokens.dana = await login('dana.whitfield@harborviewdental.example');
  tokens.sam = await login('sam.ortiz@harborviewdental.example');
  tokens.marcus = await login('marcus.bell@northwindfreight.example');
  tokens.priya = await login('priya.nair@northwindfreight.example');
});

test('rejects bad passwords and unauthenticated requests', async () => {
  const r = await call('POST', '/api/auth/login', null, { email: 'dana.whitfield@harborviewdental.example', password: 'wrong' });
  assert.equal(r.status, 401);
  assert.equal((await call('GET', '/api/dashboard')).status, 401);
  assert.equal((await call('GET', '/api/dashboard', 'forged.token')).status, 401);
});

test('locks out after repeated failed logins', async () => {
  for (let i = 0; i < 8; i++) await call('POST', '/api/auth/login', null, { email: 'helen.price@cedarpinecpa.example', password: 'nope' });
  const r = await call('POST', '/api/auth/login', null, { email: 'helen.price@cedarpinecpa.example', password: DEMO_PASSWORD });
  assert.equal(r.status, 429);
});

test('company admin cannot read another company\'s employee', async () => {
  const nw = await call('GET', '/api/employees', tokens.marcus);
  assert.equal(nw.status, 200);
  const other = nw.body[0].id;
  const r = await call('GET', `/api/employees/${other}`, tokens.dana);
  assert.equal(r.status, 404);
  const p = await call('PATCH', `/api/employees/${other}`, tokens.dana, { name: 'Hacked' });
  assert.equal(p.status, 404);
});

test('tenant header is ignored for company users', async () => {
  const tenants = await store.list('tenants');
  const northwind = tenants.find((t) => t.slug === 'northwind');
  const r = await call('GET', '/api/dashboard', tokens.dana, null, { 'x-tenant-id': northwind.id });
  assert.equal(r.body.tenant.name, 'Harborview Dental Group');
});

test('provider can act inside any client with the tenant header', async () => {
  const tenants = await store.list('tenants');
  const nw = tenants.find((t) => t.slug === 'northwind');
  const r = await call('GET', '/api/dashboard', tokens.provider, null, { 'x-tenant-id': nw.id });
  assert.equal(r.status, 200);
  assert.equal(r.body.tenant.name, 'Northwind Freight & Logistics');
  assert.equal((await call('GET', '/api/dashboard', tokens.provider)).status, 400);
});

test('employees cannot use admin or provider endpoints', async () => {
  assert.equal((await call('GET', '/api/dashboard', tokens.sam)).status, 403);
  assert.equal((await call('GET', '/api/employees', tokens.sam)).status, 403);
  assert.equal((await call('POST', '/api/employees', tokens.sam, { name: 'X', email: 'x@y.example' })).status, 403);
  assert.equal((await call('GET', '/api/platform/overview', tokens.sam)).status, 403);
  assert.equal((await call('GET', '/api/platform/overview', tokens.dana)).status, 403);
});

test('managers only see their own department', async () => {
  const r = await call('GET', '/api/employees', tokens.priya);
  assert.equal(r.status, 200);
  assert.ok(r.body.length > 0);
  assert.ok(r.body.every((e) => e.department === 'Operations'));
  const d = await call('GET', '/api/dashboard?department=Finance', tokens.priya);
  assert.equal(d.body.scope, 'Operations');
});

test('platform overview covers every client', async () => {
  const r = await call('GET', '/api/platform/overview', tokens.provider);
  assert.equal(r.status, 200);
  assert.equal(r.body.companies.length, 5);
  assert.ok(r.body.kpis.employees > 90);
});

test('learner completes a course by passing the quiz', async () => {
  const me = await call('GET', '/api/me/training', tokens.sam);
  const a = me.body.assignments[0];
  const open = await call('GET', `/api/me/assignments/${a.id}`, tokens.sam);
  assert.equal(open.status, 200);
  assert.ok(open.body.course.quiz.every((q) => q.answer === undefined), 'answers must not be sent to learners');
  const course = await store.get('courses', a.course_id);
  const wrong = Object.fromEntries(course.quiz.map((q) => [q.id, (q.answer + 1) % q.options.length]));
  const fail = await call('POST', `/api/me/assignments/${a.id}/submit`, tokens.sam, { answers: wrong });
  assert.equal(fail.body.passed, false);
  assert.ok(fail.body.results.every((r) => r.answer === undefined), 'answers hidden after a fail');
  const right = Object.fromEntries(course.quiz.map((q) => [q.id, q.answer]));
  const pass = await call('POST', `/api/me/assignments/${a.id}/submit`, tokens.sam, { answers: right });
  assert.equal(pass.body.passed, true);
  assert.equal(pass.body.score, 100);
  const cert = await call('GET', `/api/certificates/${a.id}`, tokens.sam);
  assert.equal(cert.status, 200);
  assert.equal(cert.body.employee, 'Sam Ortiz');
});

test('learner cannot open someone else\'s assignment', async () => {
  const [other] = (await store.list('assignments')).filter((x) => x.user_id !== (JSON.parse(atob(tokens.sam.split('.')[0].replace(/-/g, '+').replace(/_/g, '/'))).sub));
  assert.equal((await call('GET', `/api/me/assignments/${other.id}`, tokens.sam)).status, 404);
});

test('new employee is enrolled and gets the new-starter course', async () => {
  const r = await call('POST', '/api/employees', tokens.dana, { name: 'Test Person', email: 'test.person@harborviewdental.example', department: 'Clinical', hire_date: iso(addDays(new Date(), -2)).slice(0, 10) });
  assert.equal(r.status, 200);
  assert.ok(r.body.temp_password.length >= 12);
  const detail = await call('GET', `/api/employees/${r.body.user.id}`, tokens.dana);
  assert.ok(detail.body.assignments.some((a) => a.course.code === 'ONB-01'));
  const dup = await call('POST', '/api/employees', tokens.dana, { name: 'Dup', email: 'test.person@harborviewdental.example' });
  assert.equal(dup.status, 409);
});

test('CSV import reports bad rows without failing the batch', async () => {
  const csv = 'name,email,department,role,tracks\nGood One,good.one@harborviewdental.example,Billing,employee,finance\nBad,not-an-email,Billing,employee,\nBad Track,bad.track@harborviewdental.example,IT,employee,astronaut';
  const r = await call('POST', '/api/employees/import', tokens.dana, { csv });
  assert.equal(r.body.created.length, 1);
  assert.equal(r.body.errors.length, 2);
});

test('compliance CSV is produced and neutralises formula injection', async () => {
  await call('POST', '/api/employees', tokens.dana, { name: '=HYPERLINK("x")', email: 'formula@harborviewdental.example' });
  const r = await call('GET', '/api/reports/compliance.csv', tokens.dana);
  assert.equal(r.status, 200);
  assert.match(r.file.text, /^Name,Email/);
  assert.ok(r.file.text.includes(`"'=HYPERLINK(""x"")"`));
});

test('phishing campaign lifecycle', async () => {
  const c = await call('POST', '/api/phishing/campaigns', tokens.dana, { name: 'Test campaign', channel: 'email', difficulty: 'hard' });
  assert.equal(c.status, 200);
  const d = await call('GET', `/api/phishing/campaigns/${c.body.id}`, tokens.dana);
  const target = d.body.results[0];
  await call('POST', `/api/phishing/campaigns/${c.body.id}/import`, tokens.dana, { csv: `email,outcome\n${target.email},submitted` });
  await call('PATCH', `/api/phishing/campaigns/${c.body.id}`, tokens.dana, { status: 'closed' });
  const after = await call('GET', `/api/phishing/campaigns/${c.body.id}`, tokens.dana);
  assert.equal(after.body.campaign.submitted, 1);
  assert.equal(after.body.results.filter((r) => r.outcome === 'pending').length, 0);
});

test('provider creates a client with an admin who can sign in', async () => {
  const r = await call('POST', '/api/tenants', tokens.provider, { name: 'Lakeside Vet Clinic', plan: 'essentials', admin_name: 'Rita Moss', admin_email: 'rita@lakeside.example' });
  assert.equal(r.status, 200);
  const l = await call('POST', '/api/auth/login', null, { email: 'rita@lakeside.example', password: r.body.temp_password });
  assert.equal(l.status, 200);
  assert.equal(l.body.tenant.name, 'Lakeside Vet Clinic');
  const training = await call('GET', '/api/me/training', l.body.token);
  assert.ok(training.body.assignments.some((a) => a.course.code === 'CORE-01'));
});

test('scheduler: essentials plan gets no role tracks; refreshers at months 6 and 12', () => {
  const now = new Date('2026-08-20T00:00:00Z');
  const tenant = { id: 't', plan: 'essentials', status: 'active', program_start: '2025-09-01T00:00:00Z', settings: {} };
  const users = [{ id: 'u', role: 'employee', status: 'active', tracks: ['finance'], hire_date: '2020-01-01', created_at: '2020-01-01' }];
  const courses = [
    { id: 'c1', active: 1, category: 'core', schedule: { months: [1] } },
    { id: 'r1', active: 1, category: 'refresher', schedule: { months: [6] } },
    { id: 'r2', active: 1, category: 'refresher', schedule: { months: [12] } },
    { id: 'f', active: 1, category: 'role', track: 'finance', schedule: { months: [3, 9] }, min_plan: 'professional' },
  ];
  const rows = planAssignments({ tenant, users, courses, existing: [], now });
  assert.deepEqual(rows.map((r) => r.course_id).sort(), ['c1', 'r1', 'r2']);
  const pro = planAssignments({ tenant: { ...tenant, plan: 'professional' }, users, courses, existing: [], now });
  assert.equal(pro.filter((r) => r.course_id === 'f').length, 2);
  assert.equal(planAssignments({ tenant, users, courses, existing: rows, now }).length, 0, 'idempotent');
});

test('compliance: overdue makes an employee non-compliant; excused does not count', () => {
  const now = new Date('2026-06-01T00:00:00Z');
  const a = [
    { status: 'completed', completed_at: '2026-01-10T00:00:00Z', due_at: '2026-01-31T00:00:00Z', score: 90 },
    { status: 'assigned', due_at: '2026-05-01T00:00:00Z' },
  ];
  assert.equal(trainingSummary(a, now).status, 'non_compliant');
  a[1].status = 'excused';
  assert.equal(trainingSummary(a, now).status, 'compliant');
});

test('SQLite adapter round-trips JSON columns and rejects unknown columns', async () => {
  const s = createSqliteStore(':memory:');
  await s.insert('tenants', { id: 't1', name: 'A', slug: 'a', plan: 'premium', status: 'active', program_start: iso(new Date()), settings: { pass_mark: 90 }, created_at: iso(new Date()) });
  const t = await s.get('tenants', 't1');
  assert.equal(t.settings.pass_mark, 90);
  await assert.rejects(() => s.list('tenants', { 'name; DROP TABLE tenants': 1 }));
  assert.equal((await s.list('tenants', { plan: ['premium', 'essentials'] })).length, 1);
  s.close();
});
