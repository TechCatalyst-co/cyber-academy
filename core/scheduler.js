// Program scheduler: turns each client's 12-month program calendar into
// per-employee assignments. Safe to run repeatedly; it only adds what is missing.
import { PLAN_RANK } from './schema.js';
import { addDays, addMonths, iso, monthsBetween, newId, DAY } from './util.js';

export const DEFAULT_SETTINGS = {
  pass_mark: 80,          // % needed to pass a quiz
  due_days: 30,           // days to complete each monthly module
  onboarding_days: 7,     // days for new hires to finish Security Essentials
  due_soon_days: 7,       // window that flags an assignment as "due soon"
  departments: [],
};

export function settingsOf(tenant) {
  return { ...DEFAULT_SETTINGS, ...(tenant?.settings || {}) };
}

// Where a client is in its program: cycle = program year (1-based), month = 1..12.
export function programPosition(tenant, now = new Date()) {
  const start = new Date(tenant.program_start);
  if (now < start) return { cycle: 0, month: 0, started: false, start };
  const m = monthsBetween(start, now);
  return { cycle: Math.floor(m / 12) + 1, month: (m % 12) + 1, started: true, start };
}

export function releaseDate(tenant, cycle, month) {
  return addMonths(new Date(tenant.program_start), (cycle - 1) * 12 + (month - 1));
}

export function courseAvailable(course, tenant) {
  return !course.min_plan || PLAN_RANK[tenant.plan] >= PLAN_RANK[course.min_plan];
}

function appliesTo(course, user) {
  if (course.category !== 'role') return true;
  return Array.isArray(user.tracks) && user.tracks.includes(course.track);
}

function joinDate(user) {
  return new Date(user.hire_date || user.created_at);
}

// Returns the assignment rows that should exist but don't yet.
export function planAssignments({ tenant, users, courses, existing, now = new Date() }) {
  if (tenant.status !== 'active') return [];
  const s = settingsOf(tenant);
  const start = new Date(tenant.program_start);
  const pos = programPosition(tenant, now);
  const have = new Set(existing.filter((a) => a.source !== 'manual').map((a) => `${a.user_id}|${a.course_id}|${a.cycle}`));
  const scheduled = courses.filter((c) => c.active && c.schedule?.months?.length && courseAvailable(c, tenant));
  const onboarding = courses.filter((c) => c.active && c.schedule?.onboarding && courseAvailable(c, tenant));
  const out = [];

  for (const u of users) {
    if (u.status !== 'active' || u.role === 'platform_admin') continue;
    const joined = joinDate(u);
    // Staff who join after launch get the new-hire bundle first.
    if (joined.getTime() > start.getTime() + DAY && joined <= now) {
      for (const c of onboarding) {
        if (have.has(`${u.id}|${c.id}|0`)) continue;
        out.push(row(tenant, u, c, 0, 'onboarding', joined, addDays(joined, s.onboarding_days)));
      }
    }
    for (let cycle = 1; cycle <= pos.cycle; cycle++) {
      for (const c of scheduled) {
        if (!appliesTo(c, u)) continue;
        for (const m of c.schedule.months) {
          const rel = releaseDate(tenant, cycle, m);
          if (rel > now) continue;
          // Join the cycle from the next release after the hire date.
          if (rel.getTime() < joined.getTime() - DAY) continue;
          // Courses released more than once a year get a distinct cycle key per release.
          const stored = c.schedule.months.length > 1 ? cycle * 100 + m : cycle;
          const key = `${u.id}|${c.id}|${stored}`;
          if (have.has(key)) continue;
          have.add(key);
          out.push(row(tenant, u, c, stored, 'schedule', rel, addDays(rel, s.due_days)));
        }
      }
    }
  }
  return out;
}

function row(tenant, u, c, cycle, source, released, due) {
  return {
    id: newId(),
    tenant_id: tenant.id,
    user_id: u.id,
    course_id: c.id,
    cycle,
    source,
    released_at: iso(released),
    due_at: iso(due),
    status: 'assigned',
    started_at: null,
    completed_at: null,
    score: null,
    attempts: 0,
  };
}

// The upcoming releases for the program calendar view.
export function upcomingReleases(tenant, courses, now = new Date(), count = 4) {
  const pos = programPosition(tenant, now);
  const list = [];
  const scheduled = courses.filter((c) => c.active && c.schedule?.months?.length && courseAvailable(c, tenant));
  for (let cycle = Math.max(1, pos.cycle); cycle <= Math.max(1, pos.cycle) + 1; cycle++) {
    for (const c of scheduled) for (const m of c.schedule.months) {
      const rel = releaseDate(tenant, cycle, m);
      if (rel > now) list.push({ course_id: c.id, code: c.code, title: c.title, category: c.category, track: c.track, release: iso(rel), cycle, month: m });
    }
  }
  return list.sort((a, b) => (a.release < b.release ? -1 : 1)).slice(0, count);
}
