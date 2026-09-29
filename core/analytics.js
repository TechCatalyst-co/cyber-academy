// Dashboard and report calculations. Pure functions over plain rows, so they
// run the same in the server and in the browser demo.
import { assignmentState, trainingSummary, phishingSummary, isRepeatClicker, riskScore, riskBand, FAILED } from './compliance.js';
import { programPosition, settingsOf, upcomingReleases, releaseDate, courseAvailable } from './scheduler.js';
import { addMonths, monthKey, pct, DAY } from './util.js';

// List prices per user per month (midpoints of the published tiers).
// Used only for the provider's revenue estimate; edit to match your price book.
export const LIST_PRICE = { essentials: 4, professional: 7.5, premium: 12.5 };

function groupBy(rows, key) {
  const m = new Map();
  for (const r of rows) {
    const k = typeof key === 'function' ? key(r) : r[key];
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(r);
  }
  return m;
}

export function enrichResults(results, campaigns) {
  const byId = new Map(campaigns.map((c) => [c.id, c]));
  return results.map((r) => ({ ...r, sent_at: byId.get(r.campaign_id)?.sent_at, channel: byId.get(r.campaign_id)?.channel }));
}

export function learners(users) {
  return users.filter((u) => u.role !== 'platform_admin' && u.status === 'active');
}

// One row per employee: training, phishing and risk.
export function employeeRows({ tenant, users, assignments, results, now }) {
  const s = settingsOf(tenant);
  const aBy = groupBy(assignments, 'user_id');
  const rBy = groupBy(results, 'user_id');
  return users.filter((u) => u.role !== 'platform_admin').map((u) => {
    const a = aBy.get(u.id) || [];
    const r = rBy.get(u.id) || [];
    const training = trainingSummary(a, now, s.due_soon_days);
    const phishing = phishingSummary(r, now);
    const risk = riskScore(training, r, now);
    return {
      id: u.id, name: u.name, email: u.email, department: u.department || 'Unassigned', job_title: u.job_title,
      role: u.role, tracks: u.tracks || [], hire_date: u.hire_date, status: u.status, last_login: u.last_login,
      training, phishing, repeat_clicker: isRepeatClicker(r, now), risk, risk_band: riskBand(risk),
    };
  });
}

function rate(rows, pred) {
  return rows.length ? pct(rows.filter(pred).length, rows.length) : null;
}

export function tenantDashboard({ tenant, users, assignments, courses, campaigns, results, now, department = null }) {
  const s = settingsOf(tenant);
  const enriched = enrichResults(results, campaigns);
  let scopeUsers = learners(users);
  if (department) scopeUsers = scopeUsers.filter((u) => (u.department || 'Unassigned') === department);
  const ids = new Set(scopeUsers.map((u) => u.id));
  const scopeA = assignments.filter((a) => ids.has(a.user_id));
  const scopeR = enriched.filter((r) => ids.has(r.user_id));
  const rows = employeeRows({ tenant, users: scopeUsers, assignments: scopeA, results: scopeR, now });

  const allTraining = trainingSummary(scopeA, now, s.due_soon_days);
  const recent = phishingSummary(scopeR, now, 90);
  const baseline = baselinePhishing(campaigns, scopeR);
  const statusCounts = { compliant: 0, at_risk: 0, non_compliant: 0 };
  for (const r of rows) statusCounts[r.training.status]++;

  const byDept = [...groupBy(rows, 'department')].map(([dept, list]) => {
    const inDept = new Set(list.map((l) => l.id));
    return {
      department: dept,
      employees: list.length,
      compliance_rate: rate(list, (r) => r.training.status !== 'non_compliant'),
      completion: avg(list.map((r) => r.training.completion)),
      click_rate: phishingSummary(scopeR.filter((x) => inDept.has(x.user_id)), now, 180).click_rate,
    };
  }).sort((a, b) => b.employees - a.employees);

  const courseById = new Map(courses.map((c) => [c.id, c]));
  const pos = programPosition(tenant, now);

  // On-time completion by the month assignments fell due (last 12 months).
  const trend = [];
  for (let i = 11; i >= 0; i--) {
    const m = monthKey(addMonths(now, -i));
    const due = scopeA.filter((a) => monthKey(a.due_at) === m && new Date(a.due_at) <= now && a.status !== 'excused');
    if (!due.length) continue;
    trend.push({ month: m, due: due.length, on_time: pct(due.filter((a) => a.status === 'completed' && a.completed_at <= a.due_at).length, due.length) });
  }

  const phishTrend = campaigns
    .filter((c) => new Date(c.sent_at) <= now)
    .sort((a, b) => (a.sent_at < b.sent_at ? -1 : 1))
    .map((c) => {
      const p = phishingSummary(scopeR.filter((r) => r.campaign_id === c.id), now);
      return { id: c.id, name: c.name, channel: c.channel, sent_at: c.sent_at, ...p };
    })
    .filter((c) => c.delivered > 0);

  // Progress on each course released in the current program year.
  const cycleA = scopeA.filter((a) => a.source !== 'manual' && (a.cycle === pos.cycle || Math.floor(a.cycle / 100) === pos.cycle || a.cycle === 0));
  const courseProgress = [...groupBy(cycleA, 'course_id')].map(([cid, list]) => {
    const c = courseById.get(cid);
    const live = list.filter((a) => a.status !== 'excused');
    return {
      course_id: cid, code: c?.code, title: c?.title, category: c?.category, sort: c?.sort ?? 99,
      assigned: live.length,
      completed: live.filter((a) => a.status === 'completed').length,
      overdue: live.filter((a) => assignmentState(a, now) === 'overdue').length,
      completion: pct(live.filter((a) => a.status === 'completed').length, live.length),
      due_at: list.reduce((m, a) => (a.due_at > m ? a.due_at : m), ''),
    };
  }).sort((a, b) => (a.due_at < b.due_at ? 1 : -1));

  // The program ledger: the 12 months of the current program year and what each released.
  const year = Math.max(1, pos.cycle);
  const ledger = [];
  for (let m = 1; m <= 12; m++) {
    const release = releaseDate(tenant, year, m);
    const due = new Date(release.getTime() + s.due_days * DAY);
    const items = courses.filter((c) => c.active && c.category !== 'role' && c.schedule?.months?.includes(m) && courseAvailable(c, tenant))
      .sort((a, b) => a.sort - b.sort)
      .map((c) => {
        const list = scopeA.filter((a) => a.course_id === c.id && a.cycle === year && a.status !== 'excused');
        const done = list.filter((a) => a.status === 'completed').length;
        return { course_id: c.id, code: c.code, title: c.title, category: c.category, assigned: list.length, completed: done, completion: list.length ? pct(done, list.length) : null, overdue: list.filter((a) => assignmentState(a, now) === 'overdue').length };
      });
    ledger.push({ month: m, release: release.toISOString(), due: due.toISOString(), state: release > now ? 'scheduled' : due > now ? 'open' : 'closed', items });
  }

  return {
    tenant: { id: tenant.id, name: tenant.name, plan: tenant.plan, industry: tenant.industry, program_start: tenant.program_start },
    program_ledger: ledger,
    scope: department || 'All departments',
    program: { ...pos, upcoming: upcomingReleases(tenant, courses, now, 3) },
    kpis: {
      employees: rows.length,
      compliance_rate: rate(rows, (r) => r.training.status !== 'non_compliant'),
      training_completion: allTraining.completion,
      avg_score: allTraining.avg_score,
      overdue: allTraining.overdue,
      due_soon: allTraining.due_soon,
      click_rate_90d: recent.click_rate,
      report_rate_90d: recent.report_rate,
      baseline_click_rate: baseline,
      repeat_clickers: rows.filter((r) => r.repeat_clicker).length,
      high_risk: rows.filter((r) => r.risk_band === 'high').length,
    },
    status_counts: statusCounts,
    by_department: byDept,
    completion_trend: trend,
    phishing_trend: phishTrend,
    course_progress: courseProgress.slice(0, 8),
    attention: rows
      .filter((r) => r.training.status === 'non_compliant' || r.risk_band === 'high')
      .sort((a, b) => b.risk - a.risk || b.training.overdue - a.training.overdue)
      .slice(0, 8),
  };
}

function avg(list) {
  const v = list.filter((x) => x !== null && x !== undefined);
  return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null;
}

function baselinePhishing(campaigns, enriched) {
  const first = [...campaigns].sort((a, b) => (a.sent_at < b.sent_at ? -1 : 1))[0];
  if (!first) return null;
  return phishingSummary(enriched.filter((r) => r.campaign_id === first.id)).click_rate;
}

export function platformOverview({ tenants, users, assignments, campaigns, results, courses, now }) {
  const uBy = groupBy(users, 'tenant_id');
  const aBy = groupBy(assignments, 'tenant_id');
  const cBy = groupBy(campaigns, 'tenant_id');
  const rBy = groupBy(results, 'tenant_id');
  const companies = tenants.map((t) => {
    const d = tenantDashboard({
      tenant: t, users: uBy.get(t.id) || [], assignments: aBy.get(t.id) || [], courses,
      campaigns: cBy.get(t.id) || [], results: rBy.get(t.id) || [], now,
    });
    const employees = d.kpis.employees;
    return {
      id: t.id, name: t.name, industry: t.industry, plan: t.plan, status: t.status,
      program_start: t.program_start, program_month: d.program.month, program_cycle: d.program.cycle,
      employees, ...d.kpis, status_counts: d.status_counts,
      mrr: t.status === 'active' ? Math.round(employees * LIST_PRICE[t.plan]) : 0,
    };
  });

  const active = companies.filter((c) => c.status === 'active');
  const totalEmployees = active.reduce((s, c) => s + c.employees, 0);
  const weighted = (k) => {
    const list = active.filter((c) => c[k] !== null);
    const n = list.reduce((s, c) => s + c.employees, 0);
    return n ? Math.round((list.reduce((s, c) => s + c[k] * c.employees, 0) / n) * 10) / 10 : null;
  };

  // Phishing click and report rate across all clients by month.
  const enriched = enrichResults(results, campaigns);
  const trend = [];
  for (let i = 11; i >= 0; i--) {
    const m = monthKey(addMonths(now, -i));
    const list = enriched.filter((r) => r.sent_at && monthKey(r.sent_at) === m && new Date(r.sent_at) <= now);
    const p = phishingSummary(list, now);
    if (p.delivered) trend.push({ month: m, click_rate: p.click_rate, report_rate: p.report_rate, delivered: p.delivered });
  }

  const planMix = ['essentials', 'professional', 'premium'].map((p) => ({
    plan: p,
    companies: active.filter((c) => c.plan === p).length,
    employees: active.filter((c) => c.plan === p).reduce((s, c) => s + c.employees, 0),
    mrr: active.filter((c) => c.plan === p).reduce((s, c) => s + c.mrr, 0),
  }));

  return {
    kpis: {
      companies: active.length,
      employees: totalEmployees,
      compliance_rate: weighted('compliance_rate'),
      training_completion: weighted('training_completion'),
      click_rate_90d: weighted('click_rate_90d'),
      report_rate_90d: weighted('report_rate_90d'),
      overdue: active.reduce((s, c) => s + c.overdue, 0),
      high_risk: active.reduce((s, c) => s + c.high_risk, 0),
      mrr: active.reduce((s, c) => s + c.mrr, 0),
    },
    companies: companies.sort((a, b) => (a.compliance_rate ?? 101) - (b.compliance_rate ?? 101)),
    phishing_trend: trend,
    plan_mix: planMix,
  };
}

// Evidence pack for insurers and auditors.
export function evidencePack({ tenant, users, assignments, courses, campaigns, results, now }) {
  const dash = tenantDashboard({ tenant, users, assignments, courses, campaigns, results, now });
  const enriched = enrichResults(results, campaigns);
  const rows = employeeRows({ tenant, users: learners(users), assignments, results: enriched, now });
  const courseById = new Map(courses.map((c) => [c.id, c]));
  const byCourse = [...groupBy(assignments.filter((a) => a.status !== 'excused'), 'course_id')].map(([cid, list]) => {
    const c = courseById.get(cid);
    const due = list.filter((a) => new Date(a.due_at) <= now || a.status === 'completed');
    return {
      code: c?.code, title: c?.title, category: c?.category, sort: c?.sort ?? 99,
      assigned: list.length, completed: list.filter((a) => a.status === 'completed').length,
      completion: pct(due.filter((a) => a.status === 'completed').length, due.length),
      avg_score: avg(list.filter((a) => a.score !== null).map((a) => a.score)),
    };
  }).sort((a, b) => a.sort - b.sort);
  return {
    generated_at: now.toISOString(),
    tenant: dash.tenant,
    program: dash.program,
    kpis: dash.kpis,
    status_counts: dash.status_counts,
    courses: byCourse,
    phishing: dash.phishing_trend,
    employees: rows.sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export { FAILED, DAY };
