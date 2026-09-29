// Shared UI helpers: escaping, formatting, status pills, icons, modals, toasts.

export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const fmt = {
  pct: (v, d = 0) => (v === null || v === undefined ? '–' : `${Number(v).toFixed(d)}%`),
  num: (v) => (v === null || v === undefined ? '–' : Number(v).toLocaleString()),
  money: (v) => (v === null || v === undefined ? '–' : `$${Math.round(v).toLocaleString()}`),
  date: (v) => (v ? new Date(v).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '–'),
  short: (v) => (v ? new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '–'),
  month: (key) => { const [y, m] = key.split('-').map(Number); return new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString(undefined, { month: 'short', timeZone: 'UTC' }); },
  rel: (v) => {
    if (!v) return '–';
    const d = Math.round((new Date(v) - Date.now()) / 86400000);
    if (d === 0) return 'today';
    if (d === 1) return 'tomorrow';
    if (d === -1) return 'yesterday';
    return d > 0 ? `in ${d} days` : `${-d} days ago`;
  },
  initials: (name) => String(name || '?').replace(/[^\p{L}\s]/gu, '').split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase() || '?',
  plan: (p) => ({ essentials: 'Essentials', professional: 'Professional', premium: 'Premium' }[p] || p),
  role: (r) => ({ platform_admin: 'Provider admin', company_admin: 'Company admin', manager: 'Manager', employee: 'Employee' }[r] || r),
  cat: (c) => ({ core: 'Core module', refresher: 'Six-month refresher', onboarding: 'New starter', role: 'Role track' }[c] || c),
  channel: (c) => ({ email: 'Email', sms: 'SMS', voice: 'Voice call', qr: 'QR code' }[c] || c),
};

const I = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
export const icons = {
  check: I('<path d="M20 6 9 17l-5-5"/>'),
  alert: I('<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>'),
  x: I('<circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6"/>'),
  clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  minus: I('<path d="M5 12h14"/>'),
  grid: I('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
  building: I('<path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M16 9h2a2 2 0 0 1 2 2v10M8 7h4M8 11h4M8 15h4M3 21h18"/>'),
  users: I('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>'),
  book: I('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>'),
  hook: I('<path d="M4 4h16v12H5.2L4 17.2z"/><path d="m4 4 8 7 8-7"/>'),
  file: I('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>'),
  gear: I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  play: I('<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4z"/>'),
  award: I('<circle cx="12" cy="8" r="6"/><path d="M15.5 13 17 22l-5-3-5 3 1.5-9"/>'),
  download: I('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>'),
  plus: I('<path d="M12 5v14M5 12h14"/>'),
  upload: I('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>'),
  menu: I('<path d="M3 6h18M3 12h18M3 18h18"/>'),
  left: I('<path d="M19 12H5M12 19l-7-7 7-7"/>'),
  right: I('<path d="M5 12h14M12 5l7 7-7 7"/>'),
  close: I('<path d="M18 6 6 18M6 6l12 12"/>'),
  stamp: I('<path d="M5 21h14M6 17h12l-1-4H7zM9 13V9a3 3 0 1 1 6 0v4"/>'),
};

// Brand files: served from /brand in the app, inlined as data URIs in the demo build.
export function asset(name) {
  return globalThis.__LMS_ASSETS__?.[name] || `/brand/${name}`;
}

// Page header: the title, then the register line of facts about this page.
export function pageHead({ title, meta = [], sub = '', actions = '', crumb = null }) {
  return `${crumb ? `<div class="crumb no-print"><a href="#${crumb.href}">${icons.left.replace('<svg', '<svg class="ic" style="vertical-align:-3px"')} ${esc(crumb.label)}</a></div>` : ''}
  <header class="page-head"><div class="titles"><h1>${title}</h1>${meta.length ? `<p class="meta">${meta.filter(Boolean).map((m) => `<span>${m}</span>`).join('')}</p>` : ''}${sub ? `<p class="sub">${sub}</p>` : ''}</div>${actions ? `<div class="actions no-print">${actions}</div>` : ''}</header>`;
}

// Evidence stamp for completed, recorded items.
export function stamp(text, late = false) {
  return `<span class="stamp ${late ? 'late' : ''}">${esc(text)}</span>`;
}

// Register number: a stable, readable row index.
export const regno = (prefix, i) => `${prefix}-${String(i + 1).padStart(3, '0')}`;

export function pill(kind, label, icon) {
  const ic = icon ?? { good: icons.check, warn: icons.clock, crit: icons.alert, neutral: '', accent: '' }[kind];
  return `<span class="pill pill-${kind}">${ic || ''}${esc(label)}</span>`;
}

export function statusPill(status) {
  return {
    compliant: pill('good', 'Compliant'),
    at_risk: pill('warn', 'At risk'),
    non_compliant: pill('crit', 'Non-compliant'),
  }[status] || pill('neutral', status);
}

export function statePill(state) {
  return {
    completed: pill('good', 'Completed'),
    completed_late: pill('good', 'Completed late'),
    overdue: pill('crit', 'Overdue'),
    due_soon: pill('warn', 'Due soon'),
    open: pill('neutral', 'Open', icons.clock),
    excused: pill('neutral', 'Excused', icons.minus),
  }[state] || pill('neutral', state);
}

export function outcomePill(o) {
  return {
    reported: pill('good', 'Reported'),
    ignored: pill('neutral', 'No action', icons.minus),
    clicked: pill('warn', 'Clicked', icons.alert),
    submitted: pill('crit', 'Entered data'),
    pending: pill('neutral', 'Waiting', icons.clock),
  }[o] || pill('neutral', o);
}

export function riskBadge(score, band) {
  const color = band === 'high' ? 'var(--crit)' : band === 'medium' ? 'var(--warn)' : 'var(--good)';
  const label = band === 'high' ? 'High' : band === 'medium' ? 'Medium' : 'Low';
  return `<span class="risk" title="Human-risk score ${score}/100 (${label})"><span style="min-width:2ch;text-align:right">${score}</span><span class="risk-bar" aria-hidden="true"><i style="width:${Math.max(4, score)}%;background:${color}"></i></span><span class="sr-only"> ${label} risk</span></span>`;
}

export function meter(v) {
  return `<span class="row" style="gap:8px;flex-wrap:nowrap"><span class="meter" style="flex:1"><i style="width:${Math.max(0, Math.min(100, v ?? 0))}%"></i></span><span class="num" style="min-width:42px;text-align:right">${fmt.pct(v)}</span></span>`;
}

export function tile(label, value, note = '', cls = '') {
  return `<div class="tile ${cls}"><div class="tile-label">${esc(label)}</div><div class="tile-value">${value}</div>${note ? `<div class="tile-note">${note}</div>` : ''}</div>`;
}

export function toast(msg) {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// Modal dialog. Returns { el, close }. `onSubmit` receives the form data object.
export function modal({ title, body, submitLabel, onSubmit, cancelLabel = 'Cancel', wide = false }) {
  const back = document.createElement('div');
  back.className = 'modal-backdrop';
  back.innerHTML = `<form class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}" style="${wide ? 'width:min(860px,100%)' : ''}" novalidate>
    <div class="modal-head"><h2>${esc(title)}</h2><button type="button" class="x" data-close aria-label="Close">${icons.close.replace('<svg', '<svg width="18" height="18"')}</button></div>
    <div class="modal-body">${body}<p class="error" data-error hidden></p></div>
    <div class="modal-foot"><button type="button" class="btn" data-close>${esc(onSubmit ? cancelLabel : 'Close')}</button>${onSubmit ? `<button class="btn btn-primary" type="submit">${esc(submitLabel || 'Save')}</button>` : ''}</div>
  </form>`;
  const close = () => { back.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  back.addEventListener('click', (e) => { if (e.target === back || e.target.closest('[data-close]')) close(); });
  const form = back.querySelector('form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!onSubmit) return close();
    const err = form.querySelector('[data-error]');
    err.hidden = true;
    const data = {};
    for (const el of form.elements) {
      if (!el.name) continue;
      if (el.type === 'checkbox') { (data[el.name] ||= []); if (el.checked) data[el.name].push(el.value); }
      else if (el.type === 'radio') { if (el.checked) data[el.name] = el.value; }
      else data[el.name] = el.value;
    }
    const btn = form.querySelector('[type=submit]');
    btn.disabled = true;
    try {
      const keep = await onSubmit(data, { form, close });
      if (keep !== true) close();
    } catch (ex) {
      err.textContent = ex.message; err.hidden = false;
    } finally { btn.disabled = false; }
  });
  document.body.appendChild(back);
  setTimeout(() => form.querySelector('input:not([type=hidden]),select,textarea,[type=submit]')?.focus(), 30);
  return { el: back, close, form };
}

export async function copyText(text, fallbackEl) {
  try { await navigator.clipboard.writeText(text); toast('Copied'); }
  catch {
    if (fallbackEl) { const r = document.createRange(); r.selectNodeContents(fallbackEl); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    toast('Press Ctrl+C (or ⌘C) to copy the selected text');
  }
}

// Save a generated file. The demo cannot download files, so it shows the CSV to copy instead.
export function saveFile(file) {
  if (globalThis.__LMS_LOCAL__) {
    const rows = file.text.trim().split(/\r?\n/).length - 1;
    const m = modal({
      title: file.name, wide: true,
      body: `<p class="ink2">${rows} rows. Downloads are turned off in this demo, so copy the CSV below and paste it into Excel or Google Sheets. The installed app downloads the file directly.</p>
             <textarea class="input" readonly style="min-height:320px" data-csv>${esc(file.text)}</textarea>
             <div><button type="button" class="btn" data-copy>Copy CSV</button></div>`,
    });
    m.el.querySelector('[data-copy]').addEventListener('click', () => copyText(file.text, m.el.querySelector('[data-csv]')));
    return;
  }
  const url = URL.createObjectURL(new Blob([file.text], { type: file.type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: file.name });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Minimal markdown for lesson text: paragraphs, "- " bullets, "1. " lists, **bold**.
export function md(text) {
  const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  return String(text || '').split(/\n{2,}/).map((block) => {
    const lines = block.split('\n');
    const out = []; let list = null, type = null, para = [];
    const flushP = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; } };
    const flushL = () => { if (list) { out.push(`<${type}>${list.map((l) => `<li>${inline(l)}</li>`).join('')}</${type}>`); list = null; } };
    for (const l of lines) {
      const b = l.match(/^\s*-\s+(.*)/), n = l.match(/^\s*\d+\.\s+(.*)/);
      if (b || n) { flushP(); const t = b ? 'ul' : 'ol'; if (list && type !== t) flushL(); if (!list) { list = []; type = t; } list.push((b || n)[1]); }
      else { flushL(); if (l.trim()) para.push(l.trim()); }
    }
    flushP(); flushL();
    return out.join('');
  }).join('');
}

export function emptyState(text) {
  return `<div class="empty">${esc(text)}</div>`;
}
