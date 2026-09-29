// Builds the provider course catalog: 12 core modules, two six-month refreshers,
// the new-hire Security Essentials bundle and six role-based tracks.
import { CORE_MODULES } from './core-modules.js';
import { ROLE_TRACKS } from './role-tracks.js';
import { rng } from '../core/util.js';

export const CATALOG_VERSION = 1;

// Shuffle answer options deterministically so the correct answer's position varies.
function shuffleQuiz(quiz, seedText) {
  let seed = 0;
  for (const ch of seedText) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const r = rng(seed);
  return quiz.map((q) => {
    const order = q.options.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return { ...q, options: order.map((i) => q.options[i]), answer: order.indexOf(q.answer) };
  });
}

function pickQuestions(codes, perModule) {
  const out = [];
  codes.forEach((code, idx) => {
    const m = CORE_MODULES.find((x) => x.code === code);
    const n = Array.isArray(perModule) ? perModule[idx] : perModule;
    m.quiz.slice(0, n).forEach((q) => out.push({ ...q, id: `${code}-${q.id}`, from: m.title }));
  });
  return out;
}

function recapLesson(codes) {
  const parts = codes.map((code) => {
    const m = CORE_MODULES.find((x) => x.code === code);
    return `**${m.title}**\n${m.takeaways.map((t) => `- ${t}`).join('\n')}`;
  });
  return parts.join('\n\n');
}

const REFRESHERS = [
  {
    code: 'REF-A',
    title: 'Six-month refresher: email, accounts and money',
    summary: 'Recap of modules 1 to 6, the latest scams, and a 15-question knowledge check. Required every six months.',
    months: [6],
    modules: ['CORE-01', 'CORE-02', 'CORE-03', 'CORE-04', 'CORE-05', 'CORE-06'],
    per: [2, 3, 3, 2, 3, 2],
    update: `Scams keep changing. Patterns seen most often at small businesses recently:
- **QR code phishing** in emails and PDFs, aimed at phones that skip work security checks
- **MFA fatigue** and fake IT calls asking for codes
- **AI-written phishing** with perfect grammar and details taken from LinkedIn
- **Callback scams**: an email "invoice" with a phone number, where the "support agent" asks you to install remote-access software
- **Voice cloning** of owners and managers to push urgent payments

The defences have not changed: slow down, verify through a channel you already know, and report.`,
  },
  {
    code: 'REF-B',
    title: 'Six-month refresher: devices, data and response',
    summary: 'Recap of modules 7 to 12, the latest scams, and a 15-question knowledge check. Required every six months.',
    months: [12],
    modules: ['CORE-07', 'CORE-08', 'CORE-09', 'CORE-10', 'CORE-11', 'CORE-12'],
    per: [3, 3, 2, 3, 2, 2],
    update: `What to watch for over the next six months:
- **Data theft before encryption:** ransomware gangs now steal data first, so a quick report matters even if files still open
- **Deepfake video calls** used to approve payments or request access
- **Fake job offers and recruiters** delivering malware
- **Travel and holiday scams**: fake bookings, parcel notices and gift-card requests
- **AI tool leaks**: sensitive data pasted into unapproved chatbots

Keep using approved tools, verify unusual requests, and report quickly.`,
  },
];

export function buildCatalog() {
  const courses = [];
  let sort = 1;
  for (const m of CORE_MODULES) {
    courses.push({
      code: m.code, title: m.title, category: 'core', track: null, summary: m.summary,
      duration_min: m.duration_min, schedule: { months: [m.month] }, min_plan: null,
      lessons: [
        ...m.lessons.map((l) => ({ kind: 'lesson', ...l })),
        { kind: 'scenario', ...m.scenario },
        { kind: 'action', title: 'Your action this month', body: m.action },
        { kind: 'takeaways', title: 'Key takeaways', body: m.takeaways.map((t) => `- ${t}`).join('\n') },
      ],
      quiz: shuffleQuiz(m.quiz, m.code), pass_mark: null, sort: sort++,
    });
  }
  for (const r of REFRESHERS) {
    courses.push({
      code: r.code, title: r.title, category: 'refresher', track: null, summary: r.summary,
      duration_min: 35, schedule: { months: r.months }, min_plan: null,
      lessons: [
        { kind: 'lesson', title: 'Recap: what you learned', body: recapLesson(r.modules) },
        { kind: 'lesson', title: 'Threat update', body: r.update },
        { kind: 'lesson', title: 'How your company is doing', body: 'Your administrator shares the company\'s phishing results with each refresher: how many people clicked, how many reported, and which lures worked best. Watch for the lures that caught your colleagues; they will come round again.' },
        { kind: 'action', title: 'Your action', body: 'Pick the one habit from the recap you are least consistent with and practise it this week.' },
      ],
      quiz: shuffleQuiz(pickQuestions(r.modules, r.per), r.code), pass_mark: null, sort: 20 + sort++,
    });
  }
  const essentials = ['CORE-01', 'CORE-02', 'CORE-03', 'CORE-06'];
  const pick = (code, i) => CORE_MODULES.find((m) => m.code === code).lessons[i];
  courses.push({
    code: 'ONB-01', title: 'Security Essentials for new starters', category: 'onboarding', track: null,
    summary: 'The 30-minute starter course every new employee completes in their first week, then they join the monthly program.',
    duration_min: 30, schedule: { onboarding: true }, min_plan: null,
    lessons: [
      { kind: 'lesson', ...pick('CORE-01', 2) },
      { kind: 'lesson', ...pick('CORE-02', 1) },
      { kind: 'lesson', ...pick('CORE-02', 3) },
      { kind: 'lesson', ...pick('CORE-03', 1) },
      { kind: 'lesson', ...pick('CORE-03', 3) },
      { kind: 'lesson', ...pick('CORE-06', 1) },
      { kind: 'action', title: 'Your first-week checklist', body: '- Set up the company password manager\n- Turn on MFA for your email\n- Find the Report phishing button and save IT\'s phone number\n- Lock your screen whenever you step away' },
    ],
    quiz: shuffleQuiz(pickQuestions(essentials, 2), 'ONB-01'), pass_mark: null, sort: 0,
  });
  for (const t of ROLE_TRACKS) {
    courses.push({
      code: t.code, title: t.title, category: 'role', track: t.track, summary: t.summary,
      duration_min: t.duration_min, schedule: { months: [3, 9] }, min_plan: 'professional',
      lessons: t.lessons.map((l) => ({ kind: 'lesson', ...l })),
      quiz: shuffleQuiz(t.quiz, t.code), pass_mark: null, sort: 40 + sort++,
    });
  }
  return courses;
}

// Built-in phishing simulation themes, matching the delivery calendar.
export const PHISHING_TEMPLATES = [
  { key: 'baseline', name: 'Baseline: account verification', channel: 'email', difficulty: 'medium', month: 0 },
  { key: 'package', name: 'Package delivery notice', channel: 'email', difficulty: 'easy', month: 1 },
  { key: 'fileshare', name: 'Shared document', channel: 'email', difficulty: 'medium', month: 2 },
  { key: 'mfa-reset', name: 'Password expiry / MFA reset', channel: 'email', difficulty: 'medium', month: 3 },
  { key: 'smish', name: 'Smishing: delivery fee text', channel: 'sms', difficulty: 'medium', month: 4 },
  { key: 'invoice', name: 'Fake vendor invoice / CEO request', channel: 'email', difficulty: 'hard', month: 5 },
  { key: 'update', name: 'Fake software update', channel: 'email', difficulty: 'medium', month: 6 },
  { key: 'attachment', name: 'Malicious attachment', channel: 'email', difficulty: 'medium', month: 7 },
  { key: 'hr-benefits', name: 'HR policy / benefits update', channel: 'email', difficulty: 'hard', month: 8 },
  { key: 'qr', name: 'QR code parking notice', channel: 'qr', difficulty: 'hard', month: 9 },
  { key: 'vish', name: 'Vishing: IT helpdesk call', channel: 'voice', difficulty: 'hard', month: 10 },
  { key: 'social', name: 'LinkedIn / social network alert', channel: 'email', difficulty: 'hard', month: 11 },
  { key: 'holiday', name: 'Holiday gift-card request', channel: 'email', difficulty: 'hard', month: 12 },
];
