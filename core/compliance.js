// Compliance and risk rules. Kept in one place so reports, dashboards and
// exports always agree on what "compliant" means.
import { DAY, pct } from './util.js';

export const STATE_LABELS = {
  completed: 'Completed',
  completed_late: 'Completed late',
  overdue: 'Overdue',
  due_soon: 'Due soon',
  open: 'Open',
  excused: 'Excused',
};

export const STATUS_LABELS = {
  compliant: 'Compliant',
  at_risk: 'At risk',
  non_compliant: 'Non-compliant',
};

export function assignmentState(a, now = new Date(), dueSoonDays = 7) {
  if (a.status === 'excused') return 'excused';
  if (a.status === 'completed') return a.completed_at <= a.due_at ? 'completed' : 'completed_late';
  const due = new Date(a.due_at).getTime();
  const t = now.getTime();
  if (due < t) return 'overdue';
  if (due - t <= dueSoonDays * DAY) return 'due_soon';
  return 'open';
}

// Summarises one employee's training record.
//  - required: assignments already due, plus any finished early
//  - status: non_compliant if anything is overdue, at_risk if something is due
//    within the warning window and unfinished, otherwise compliant
export function trainingSummary(assignments, now = new Date(), dueSoonDays = 7) {
  let required = 0, completed = 0, overdue = 0, dueSoon = 0, open = 0, onTime = 0, scoreSum = 0, scoreN = 0;
  let lastCompleted = null;
  for (const a of assignments) {
    const st = assignmentState(a, now, dueSoonDays);
    if (st === 'excused') continue;
    const done = st === 'completed' || st === 'completed_late';
    const isDue = new Date(a.due_at) <= now;
    if (isDue || done) required++;
    if (done) {
      completed++;
      if (st === 'completed') onTime++;
      if (a.score !== null && a.score !== undefined) { scoreSum += a.score; scoreN++; }
      if (!lastCompleted || a.completed_at > lastCompleted) lastCompleted = a.completed_at;
    }
    if (st === 'overdue') overdue++;
    if (st === 'due_soon') dueSoon++;
    if (st === 'open') open++;
  }
  const status = overdue > 0 ? 'non_compliant' : dueSoon > 0 ? 'at_risk' : 'compliant';
  return {
    required, completed, overdue, due_soon: dueSoon, open, on_time: onTime,
    completion: required ? pct(completed, required) : 100,
    avg_score: scoreN ? Math.round(scoreSum / scoreN) : null,
    last_completed: lastCompleted,
    status,
  };
}

export const FAILED = new Set(['clicked', 'submitted']);

export function phishingSummary(results, now = new Date(), windowDays = null) {
  const since = windowDays ? now.getTime() - windowDays * DAY : -Infinity;
  let delivered = 0, clicked = 0, submitted = 0, reported = 0;
  for (const r of results) {
    if (r.outcome === 'pending') continue;
    if (r.sent_at && new Date(r.sent_at).getTime() < since) continue;
    delivered++;
    if (FAILED.has(r.outcome)) clicked++;
    if (r.outcome === 'submitted') submitted++;
    if (r.outcome === 'reported') reported++;
  }
  return {
    delivered, clicked, submitted, reported,
    click_rate: delivered ? pct(clicked, delivered) : null,
    submit_rate: delivered ? pct(submitted, delivered) : null,
    report_rate: delivered ? pct(reported, delivered) : null,
  };
}

// Repeat clicker: 3 or more failed simulations in the last 180 days.
export function isRepeatClicker(results, now = new Date()) {
  const since = now.getTime() - 180 * DAY;
  return results.filter((r) => FAILED.has(r.outcome) && new Date(r.sent_at || r.event_at).getTime() >= since).length >= 3;
}

// Human-risk score, 0 (low) to 100 (high). Transparent on purpose so account
// managers can explain it to clients:
//   +15 per overdue module (max 45)
//   +12 per failed phishing test in the last 180 days, +8 more if credentials were entered (max 40)
//   +10 if the average quiz score is under 80
//   -10 if the person reported at least one simulation in the last 180 days
export function riskScore(training, results, now = new Date()) {
  const since = now.getTime() - 180 * DAY;
  const recent = results.filter((r) => new Date(r.sent_at || r.event_at || 0).getTime() >= since);
  const fails = recent.filter((r) => FAILED.has(r.outcome)).length;
  const subs = recent.filter((r) => r.outcome === 'submitted').length;
  const reports = recent.filter((r) => r.outcome === 'reported').length;
  let s = Math.min(45, training.overdue * 15) + Math.min(40, fails * 12 + subs * 8);
  if (training.avg_score !== null && training.avg_score < 80) s += 10;
  if (reports > 0) s -= 10;
  return Math.max(0, Math.min(100, s));
}

export function riskBand(score) {
  return score >= 50 ? 'high' : score >= 25 ? 'medium' : 'low';
}
