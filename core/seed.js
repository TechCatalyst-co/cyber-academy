// Demo data: five fictional client companies at different stages of the program,
// with realistic training and phishing history. Deterministic for a given date.
import { planAssignments, settingsOf, DEFAULT_SETTINGS } from './scheduler.js';
import { PHISHING_TEMPLATES } from '../content/catalog.js';
import { addDays, addMonths, iso, newId, rng, DAY } from './util.js';

export const DEMO_PASSWORD = 'Demo-Password-2026';

const FIRST = ['Ava', 'Ben', 'Carmen', 'Dev', 'Elena', 'Felix', 'Grace', 'Hassan', 'Iris', 'Jonah', 'Keiko', 'Luis', 'Maya', 'Noah', 'Olivia', 'Priya', 'Quinn', 'Rosa', 'Samir', 'Tessa', 'Uma', 'Victor', 'Wen', 'Ximena', 'Yusuf', 'Zoe', 'Aaron', 'Bianca', 'Caleb', 'Dana', 'Ethan', 'Farah', 'Gabe', 'Hana', 'Isaac', 'Jade', 'Kofi', 'Lena', 'Marco', 'Nina', 'Omar', 'Paige', 'Rafael', 'Sofia', 'Theo', 'Valeria', 'Will', 'Yara'];
const LAST = ['Alvarez', 'Brooks', 'Chen', 'Duarte', 'Edwards', 'Fischer', 'Garcia', 'Hughes', 'Ibrahim', 'Jensen', 'Kim', 'Lopez', 'Mensah', 'Novak', 'Okafor', 'Patel', 'Quintero', 'Rossi', 'Sato', 'Turner', 'Ueda', 'Varga', 'Walsh', 'Xu', 'Young', 'Zimmerman', 'Baker', 'Castillo', 'Dubois', 'Evans', 'Flores', 'Gupta', 'Haddad', 'Ito', 'Keller', 'Larsen', 'Moreno', 'Nguyen', 'Ortiz', 'Price'];

const TRACK_BY_DEPT = {
  Management: ['leadership'], Partners: ['leadership'], Finance: ['finance'], Billing: ['finance'], Accounting: ['finance'],
  HR: ['hr'], IT: ['it'], 'Front desk': ['customer'], 'Customer service': ['customer'], 'Drivers & field': ['remote'],
  'Site crew': ['remote'], Development: [], Programs: [], Operations: [], Clinical: [], Office: [], 'Project management': ['remote'], Admin: [],
};

const TITLES = {
  Management: ['Managing Director', 'Operations Director', 'Practice Owner'], Partners: ['Partner'], Finance: ['Accountant', 'AP Specialist', 'Controller'],
  Billing: ['Billing Coordinator', 'Insurance Specialist'], Accounting: ['Staff Accountant', 'Senior Accountant', 'Tax Associate'],
  HR: ['HR Generalist', 'Recruiter'], IT: ['IT Administrator', 'Systems Technician'], 'Front desk': ['Receptionist', 'Patient Coordinator'],
  'Customer service': ['Customer Service Rep', 'Account Coordinator'], 'Drivers & field': ['Driver', 'Field Technician'],
  'Site crew': ['Site Supervisor', 'Carpenter', 'Electrician'], 'Project management': ['Project Manager', 'Estimator'],
  Office: ['Office Coordinator', 'Administrator'], Development: ['Grants Officer', 'Development Associate'], Programs: ['Program Coordinator', 'Case Worker'],
  Operations: ['Operations Coordinator', 'Dispatcher', 'Warehouse Lead'], Clinical: ['Dentist', 'Dental Hygienist', 'Dental Assistant'], Admin: ['Administrative Assistant'],
};

export const DEMO_TENANTS = [
  {
    key: 'harborview', name: 'Harborview Dental Group', industry: 'Healthcare', plan: 'professional', startMonthsAgo: 10, diligence: 0.9, baseline: 0.31,
    domain: 'harborviewdental.example', depts: { Clinical: 10, 'Front desk': 6, Billing: 4, Management: 2, IT: 1 },
    admin: { name: 'Dana Whitfield', dept: 'Management', title: 'Practice Manager' },
    employee: { name: 'Sam Ortiz', dept: 'Front desk', title: 'Patient Coordinator' },
  },
  {
    key: 'northwind', name: 'Northwind Freight & Logistics', industry: 'Transport & logistics', plan: 'premium', startMonthsAgo: 11, diligence: 0.87, baseline: 0.34,
    domain: 'northwindfreight.example', depts: { Operations: 13, 'Drivers & field': 11, 'Customer service': 7, Finance: 5, HR: 2, IT: 2, Management: 2 },
    admin: { name: 'Marcus Bell', dept: 'IT', title: 'IT Manager' },
    manager: { name: 'Priya Nair', dept: 'Operations', title: 'Operations Manager' },
  },
  {
    key: 'cedarpine', name: 'Cedar & Pine Accounting', industry: 'Professional services', plan: 'essentials', startMonthsAgo: 5, diligence: 0.74, baseline: 0.27,
    domain: 'cedarpinecpa.example', depts: { Accounting: 8, Admin: 3, Partners: 2 },
    admin: { name: 'Helen Price', dept: 'Admin', title: 'Office Manager' },
  },
  {
    key: 'summit', name: 'Summit Ridge Builders', industry: 'Construction', plan: 'professional', startMonthsAgo: 7, diligence: 0.52, baseline: 0.38,
    domain: 'summitridgebuild.example', depts: { 'Site crew': 9, 'Project management': 5, Office: 4, Finance: 2, Management: 1 },
    admin: { name: 'Tom Okafor', dept: 'Office', title: 'Office Administrator' },
  },
  {
    key: 'brightside', name: 'Brightside Community Services', industry: 'Nonprofit', plan: 'essentials', startMonthsAgo: 2, diligence: 0.7, baseline: 0.33,
    domain: 'brightsidecs.example', depts: { Programs: 6, Development: 3, Operations: 2 },
    admin: { name: 'Leah Moreno', dept: 'Operations', title: 'Operations Director' },
  },
];

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// passwordHash: a precomputed hash of DEMO_PASSWORD (hashing once keeps seeding fast).
export async function seedDemo({ store, app, passwordHash, now = new Date(), brandDomain = 'techcatalyst.example' }) {
  await app.ensureCatalog();
  const courses = (await store.list('courses', { tenant_id: null })).filter((c) => c.active);
  const r = rng(20260928);
  const accounts = [];
  const created = iso(addMonths(now, -12));

  const platformAdmin = {
    id: newId(), tenant_id: null, email: `admin@${brandDomain}`, name: 'Jordan Blake', password_hash: passwordHash,
    role: 'platform_admin', department: 'Provider', job_title: 'Program Director', tracks: [], hire_date: null,
    status: 'active', must_change_password: 0, last_login: null, created_at: created,
  };
  await store.insert('users', platformAdmin);
  accounts.push({ role: 'Provider admin', company: 'TechCatalyst program team', email: platformAdmin.email });

  const usedNames = new Set();
  const uniqueName = () => {
    for (;;) {
      const n = `${r.pick(FIRST)} ${r.pick(LAST)}`;
      if (!usedNames.has(n)) { usedNames.add(n); return n; }
    }
  };

  for (const t of DEMO_TENANTS) {
    usedNames.add(t.admin.name);
    if (t.employee) usedNames.add(t.employee.name);
    if (t.manager) usedNames.add(t.manager.name);
    const start = addDays(addMonths(now, -t.startMonthsAgo), -r.int(3, 12));
    const tenant = {
      id: newId(), name: t.name, slug: t.key, industry: t.industry, plan: t.plan, status: 'active',
      program_start: iso(start), contact_name: t.admin.name, contact_email: null,
      settings: { ...DEFAULT_SETTINGS, departments: Object.keys(t.depts) }, created_at: iso(addDays(start, -14)),
    };
    const email = (name) => `${name.toLowerCase().replace(/[^a-z ]/g, '').replace(/ /g, '.')}@${t.domain}`;
    tenant.contact_email = email(t.admin.name);
    await store.insert('tenants', tenant);

    const users = [];
    const trait = new Map();
    const mkUser = (name, dept, title, role, forceOld = false) => {
      const late = !forceOld && r.chance(0.14);
      const hire = late ? addDays(start, r.int(20, Math.max(25, Math.floor((now - start) / DAY) - 10))) : addDays(start, -r.int(120, 3000));
      const u = {
        id: newId(), tenant_id: tenant.id, email: email(name), name, password_hash: passwordHash, role,
        department: dept, job_title: title, tracks: TRACK_BY_DEPT[dept] || [], hire_date: iso(hire).slice(0, 10),
        status: 'active', must_change_password: 0, last_login: iso(addDays(now, -r.int(0, 20))), created_at: iso(start),
      };
      users.push(u);
      trait.set(u.id, {
        diligence: clamp(t.diligence + (r() - 0.62) * 0.5, 0.15, 0.99),
        suscept: r.chance(0.08) ? 2.6 + r() : 0.35 + r() * 1.3,
      });
      return u;
    };

    const admin = mkUser(t.admin.name, t.admin.dept, t.admin.title, 'company_admin', true);
    trait.get(admin.id).diligence = 0.97; trait.get(admin.id).suscept = 0.3;
    accounts.push({ role: 'Company admin', company: t.name, email: admin.email });
    if (t.manager) {
      const m = mkUser(t.manager.name, t.manager.dept, t.manager.title, 'manager', true);
      accounts.push({ role: 'Department manager', company: t.name, email: m.email });
    }
    let learner = null;
    if (t.employee) {
      const e = learner = mkUser(t.employee.name, t.employee.dept, t.employee.title, 'employee', true);
      trait.get(e.id).diligence = 0.85;
      accounts.push({ role: 'Employee (learner)', company: t.name, email: e.email });
    }
    for (const [dept, n] of Object.entries(t.depts)) {
      const already = users.filter((u) => u.department === dept).length;
      for (let i = already; i < n; i++) mkUser(uniqueName(), dept, r.pick(TITLES[dept] || ['Staff']), 'employee');
    }
    // One person left the company: inactive, kept for records.
    users[users.length - 1].status = 'inactive';
    await store.insertMany('users', users);

    // Training history.
    const s = settingsOf(tenant);
    const assignments = planAssignments({ tenant, users, courses, existing: [], now });
    const attempts = [];
    const courseById = new Map(courses.map((c) => [c.id, c]));
    for (const a of assignments) {
      const tr = trait.get(a.user_id);
      const rel = new Date(a.released_at), due = new Date(a.due_at);
      const window = Math.max(1, (due - rel) / DAY);
      let doneAt = null;
      if (due <= now) {
        const since = (now - due) / DAY;
        // Most people catch up after reminders; recent misses stay overdue.
        if (r.chance(tr.diligence)) doneAt = addDays(rel, r.int(1, Math.floor(window) - 1));
        else if (r.chance(since > 25 ? 0.93 * (0.5 + tr.diligence / 2) + 0.05 : 0.3)) doneAt = addDays(due, r.int(2, Math.max(2, Math.min(24, Math.floor(since) - 1))));
      } else {
        const elapsed = (now - rel) / (due - rel);
        if (r.chance(tr.diligence * clamp(elapsed * 1.1, 0, 0.95))) doneAt = addDays(rel, r.int(0, Math.max(0, Math.floor((now - rel) / DAY) - 1)));
      }
      if (doneAt && doneAt > now) doneAt = null;
      const c = courseById.get(a.course_id);
      const qn = c.quiz.length;
      const passScore = () => Math.round((Math.ceil((qn * s.pass_mark) / 100) + r.int(0, qn - Math.ceil((qn * s.pass_mark) / 100))) / qn * 100);
      if (doneAt) {
        const fails = r.chance(0.18 * (1.3 - tr.diligence)) ? 1 : 0;
        a.status = 'completed';
        a.started_at = iso(addDays(doneAt, -fails - (r.chance(0.3) ? 1 : 0)));
        a.completed_at = iso(doneAt);
        a.score = passScore();
        a.attempts = 1 + fails;
        if (fails) attempts.push({ id: newId(), tenant_id: tenant.id, user_id: a.user_id, assignment_id: a.id, course_id: a.course_id, score: Math.round(r.int(Math.floor(qn * 0.3), Math.ceil((qn * s.pass_mark) / 100) - 1) / qn * 100), passed: 0, answers: {}, created_at: iso(addDays(doneAt, -1)) });
        attempts.push({ id: newId(), tenant_id: tenant.id, user_id: a.user_id, assignment_id: a.id, course_id: a.course_id, score: a.score, passed: 1, answers: {}, created_at: a.completed_at });
      } else if (r.chance(0.3)) {
        a.status = 'in_progress';
        a.started_at = iso(addDays(rel, r.int(0, Math.max(0, Math.min(window, (now - rel) / DAY) - 1))));
        if (a.started_at > iso(now)) a.started_at = iso(now);
      }
    }
    // The demo learner always has this month's module waiting.
    if (learner) for (const a of assignments.filter((x) => x.user_id === learner.id && new Date(x.due_at) > now)) {
      Object.assign(a, { status: 'assigned', started_at: null, completed_at: null, score: null, attempts: 0 });
      for (let i = attempts.length - 1; i >= 0; i--) if (attempts[i].assignment_id === a.id) attempts.splice(i, 1);
    }
    // A few excused assignments (leave of absence).
    const onLeave = users.find((u) => u.role === 'employee' && u.status === 'active' && trait.get(u.id).diligence < 0.5);
    if (onLeave) for (const a of assignments.filter((x) => x.user_id === onLeave.id && x.status !== 'completed').slice(0, 1)) a.status = 'excused';
    await store.insertMany('assignments', assignments);
    await store.insertMany('quiz_attempts', attempts);

    // Phishing simulations: baseline at kickoff, then monthly themes from the calendar.
    const campaigns = [], results = [];
    const active = users;
    for (let m = 0; m <= 12; m++) {
      const sent = m === 0 ? addDays(start, -5) : addDays(addMonths(start, m - 1), 12);
      if (sent > addDays(now, -1)) break;
      const tpl = PHISHING_TEMPLATES.find((x) => x.month === m);
      const fresh = now - sent < 4 * DAY;
      const c = {
        id: newId(), tenant_id: tenant.id, name: m === 0 ? 'Baseline: account verification' : tpl.name, template: tpl.key,
        channel: tpl.channel, difficulty: tpl.difficulty, sent_at: iso(sent), status: fresh ? 'running' : 'closed', created_at: iso(addDays(sent, -3)),
      };
      campaigns.push(c);
      const hard = { easy: 0.75, medium: 1, hard: 1.25 }[c.difficulty];
      for (const u of active) {
        const hire = new Date(u.hire_date);
        if (hire > sent) continue;
        if (u.status === 'inactive' && m > 3) continue;
        const tr = trait.get(u.id);
        const learning = Math.exp(-m * (0.12 + 0.2 * t.diligence));
        const pClick = clamp(t.baseline * learning * tr.suscept * hard, 0.01, 0.85);
        const pReport = clamp(0.06 + m * 0.06 * (0.4 + tr.diligence), 0.04, 0.8);
        let outcome;
        if (fresh && r.chance(0.35)) outcome = 'pending';
        else if (r.chance(pClick)) outcome = r.chance(0.4) ? 'submitted' : 'clicked';
        else if (r.chance(pReport)) outcome = 'reported';
        else outcome = 'ignored';
        results.push({ id: newId(), tenant_id: tenant.id, campaign_id: c.id, user_id: u.id, outcome, event_at: outcome === 'pending' ? null : iso(addDays(sent, r() * 2)) });
      }
    }
    await store.insertMany('phishing_campaigns', campaigns);
    await store.insertMany('phishing_results', results);

    await store.insertMany('audit_log', [
      { id: newId(), tenant_id: tenant.id, actor_id: platformAdmin.id, actor_name: platformAdmin.name, action: 'tenant.created', detail: `${t.name} (${t.plan})`, created_at: tenant.created_at },
      { id: newId(), tenant_id: tenant.id, actor_id: admin.id, actor_name: admin.name, action: 'employee.imported', detail: `${users.length} created, 0 skipped`, created_at: iso(addDays(start, -7)) },
      ...campaigns.map((c) => ({ id: newId(), tenant_id: tenant.id, actor_id: platformAdmin.id, actor_name: platformAdmin.name, action: 'phishing.campaign_created', detail: `${c.name} to ${results.filter((r) => r.campaign_id === c.id).length} people`, created_at: c.created_at })),
    ]);
  }
  return accounts;
}
