// Company register: dashboard and settings.
import { get, patch } from '../api.js';
import { esc, fmt, tile, statusPill, riskBadge, meter, emptyState, toast, saveFile, pageHead, stamp, regno } from '../ui.js';
import { lineChart, columnChart, statusBar } from '../charts.js';
import { isAdmin, state } from '../app.js';

const SECTIONS = [['summary', 'Summary'], ['program', 'Program'], ['exceptions', 'Exceptions'], ['departments', 'Departments'], ['phishing', 'Phishing']];

function monthCell(m, canOpen) {
  const lead = m.items[0];
  const extra = m.items.slice(1).map((x) => x.code).join(' + ');
  const total = m.items.reduce((s, x) => s + x.assigned, 0);
  const done = m.items.reduce((s, x) => s + x.completed, 0);
  const open = m.items.reduce((s, x) => s + x.overdue, 0);
  const pctv = total ? Math.round((done / total) * 100) : null;
  const tag = m.state === 'scheduled' ? fmt.short(m.release)
    : m.state === 'open' ? `Due ${fmt.short(m.due)}`
      : open ? `${open} overdue` : 'Evidenced';
  const detail = `Month ${m.month}: ${m.items.map((x) => `${x.code} ${x.title}`).join('; ')}. Released ${fmt.date(m.release)}, due ${fmt.date(m.due)}. ${m.state === 'scheduled' ? 'Not released yet.' : `${done} of ${total} complete${open ? `, ${open} overdue` : ''}.`}`;
  const inner = `<span class="m">M${String(m.month).padStart(2, '0')}</span><span class="code">${esc(lead?.code || '')}</span>
    <span class="pctv">${m.state === 'scheduled' ? 'Scheduled' : pctv === null ? '–' : `${pctv}%`}</span>
    <span class="stack" style="gap:6px">${m.state !== 'scheduled' ? `<span class="bar"><i style="width:${pctv ?? 0}%"></i></span>` : ''}${extra ? `<span class="extra">+ ${esc(extra)}</span>` : ''}${m.state === 'closed' ? stamp(tag, !!open) : `<span class="extra" style="color:var(--muted)">${esc(tag)}</span>`}</span>`;
  const attrs = `class="mcol ${m.state}" data-detail="${esc(detail)}" aria-label="${esc(detail)}"`;
  return canOpen && lead ? `<a href="#/courses/${esc(lead.course_id)}" ${attrs}>${inner}</a>` : `<div tabindex="0" ${attrs}>${inner}</div>`;
}

export async function dashboard({ query, go }) {
  const dept = query.department || '';
  const d = await get(`/api/dashboard${dept ? `?department=${encodeURIComponent(dept)}` : ''}`);
  const k = d.kpis;
  const p = d.program;
  const next = p.upcoming[0];
  const clickDelta = k.baseline_click_rate !== null && k.click_rate_90d !== null ? k.click_rate_90d - k.baseline_click_rate : null;
  const current = d.program_ledger.find((m) => m.state === 'open');
  const html = `<div class="page">
    ${pageHead({
      title: esc(d.tenant.name),
      meta: [d.tenant.register_no ? `Register ${esc(d.tenant.register_no)}` : 'Compliance register', p.started ? `Year ${p.cycle} · month ${p.month} of 12` : 'Not started', `${esc(fmt.plan(d.tenant.plan))} plan`, dept || !isAdmin() ? esc(d.scope) : ''],
      sub: next ? `Next release: <b>${esc(next.code)} ${esc(next.title)}</b> on ${fmt.date(next.release)}.` : '',
      actions: `${isAdmin() ? `<select class="input" data-dept aria-label="Filter by department" style="width:auto"><option value="">All departments</option>${d.departments.map((x) => `<option ${x === dept ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>` : ''}
        <button class="btn" data-export>Export CSV</button>${isAdmin() ? '<a class="btn btn-primary" href="#/reports/evidence">Evidence pack</a>' : ''}`,
    })}
    <nav class="tabs no-print" aria-label="Register sections">${SECTIONS.map(([id, label], i) => `<a href="#" data-tab="${id}" ${i === 0 ? 'aria-current="true"' : ''}><span>0${i + 1}</span>${label}</a>`).join('')}</nav>

    <section class="card" id="sec-summary"><div class="card-head"><span class="no">01</span><h2>Summary</h2><p>${k.employees} active employees</p></div>
      <div class="tiles">
        ${tile('Compliance rate', fmt.pct(k.compliance_rate), `${d.status_counts.compliant + d.status_counts.at_risk} of ${k.employees} with nothing overdue`, 'hero')}
        ${tile('Training completion', fmt.pct(k.training_completion), 'of modules due so far')}
        ${tile('Average quiz score', k.avg_score === null ? '–' : `${k.avg_score}<small>%</small>`, `pass mark ${state.tenant?.settings?.pass_mark ?? 80}%`)}
        ${tile('Phishing click rate', fmt.pct(k.click_rate_90d, 1), clickDelta === null ? 'last 90 days' : `<span class="${clickDelta <= 0 ? 'delta-good' : 'delta-bad'}">${clickDelta <= 0 ? '−' : '+'}${Math.abs(clickDelta).toFixed(1)} pts</span> vs ${fmt.pct(k.baseline_click_rate, 1)} baseline`)}
        ${tile('Report rate', fmt.pct(k.report_rate_90d, 1), 'last 90 days · target 60%')}
        ${tile('Overdue modules', fmt.num(k.overdue), `${k.due_soon} due in 7 days`)}
      </div>
      <div style="margin-top:18px">${statusBar([
        { label: 'Compliant', value: d.status_counts.compliant, color: 'var(--brand)' },
        { label: 'At risk (due within 7 days)', value: d.status_counts.at_risk, color: 'var(--mist)' },
        { label: 'Non-compliant (overdue)', value: d.status_counts.non_compliant, color: 'var(--crit)' },
      ])}</div>
    </section>

    <section class="card" id="sec-program"><div class="card-head"><span class="no">02</span><h2>Program ledger, year ${Math.max(1, p.cycle)}</h2><p>Completion of each month's release${current ? `. Month ${current.month} is open until ${fmt.date(current.due)}` : ''}</p></div>
      <div class="ledger12">${d.program_ledger.map((m) => monthCell(m, isAdmin())).join('')}</div>
      <p class="ledger-key" data-ledger-detail aria-live="polite">Point at a month to see its release, due date and completion.</p>
    </section>

    <div class="grid">
      <section class="card span-7" id="sec-exceptions"><div class="card-head"><span class="no">03</span><h2>Exceptions</h2><p>Overdue training or high human-risk score</p><a class="right" href="#/employees?status=non_compliant">All non-compliant</a></div>
        ${d.attention.length ? `<div class="table-wrap"><table class="data"><thead><tr><th>No.</th><th>Employee</th><th>Status</th><th class="r">Overdue</th><th class="r">Phishing fails</th><th>Risk</th></tr></thead><tbody>
          ${d.attention.map((r, i) => `<tr class="link" data-emp="${esc(r.id)}" tabindex="0"><td class="regno">${regno('X', i)}</td><td><div class="cell-main">${esc(r.name)}</div><div class="cell-sub">${esc(r.department)}</div></td><td>${statusPill(r.training.status)}</td><td class="r">${r.training.overdue}</td><td class="r">${r.phishing.clicked}${r.repeat_clicker ? '<div class="cell-sub" style="color:var(--crit-ink)">repeat clicker</div>' : ''}</td><td>${riskBadge(r.risk, r.risk_band)}</td></tr>`).join('')}
        </tbody></table></div>` : emptyState('No exceptions. Everyone is up to date and no one is high risk.')}</section>
      <section class="card span-5" id="sec-departments"><div class="card-head"><span class="no">04</span><h2>Departments</h2><p>Click rate over 180 days</p></div>
        <div class="table-wrap"><table class="data"><thead><tr><th>Department</th><th class="r">People</th><th>Compliance</th><th class="r">Clicks</th></tr></thead><tbody>
        ${d.by_department.map((x) => `<tr class="${isAdmin() ? 'link' : ''}" data-dept-row="${esc(x.department)}"><td class="cell-main">${esc(x.department)}</td><td class="r">${x.employees}</td><td style="min-width:130px">${meter(x.compliance_rate)}</td><td class="r">${fmt.pct(x.click_rate, 1)}</td></tr>`).join('')}
        </tbody></table></div></section>
      <section class="card span-7" id="sec-phishing"><div class="card-head"><span class="no">05</span><h2>Phishing simulations</h2><p>Clicked vs reported, each campaign</p>
        <div class="legend right"><span><i class="key" style="background:var(--s2)"></i>Clicked</span><span><i class="key" style="background:var(--s1)"></i>Reported</span></div></div>
        ${d.phishing_trend.length ? '<div data-chart="phish"></div>' : emptyState('No simulations yet. Start with an unannounced baseline test.')}</section>
      <section class="card span-5"><div class="card-head"><h2>On-time completion</h2><p>By the month modules fell due; line marks 90%</p></div>
        ${d.completion_trend.length ? '<div data-chart="ontime"></div>' : emptyState('Nothing has fallen due yet.')}</section>
    </div>
  </div>`;
  return {
    title: 'Register', html,
    mount(root) {
      const ph = root.querySelector('[data-chart=phish]');
      if (ph) lineChart(ph, {
        labels: d.phishing_trend.map((c) => c.sent_at), xFmt: (v) => fmt.short(v),
        tipTitle: (i) => `${d.phishing_trend[i].name} · ${fmt.short(d.phishing_trend[i].sent_at)}`,
        series: [
          { name: 'Clicked', color: 'var(--s2)', values: d.phishing_trend.map((c) => c.click_rate) },
          { name: 'Reported', color: 'var(--s1)', values: d.phishing_trend.map((c) => c.report_rate) },
        ],
      });
      const ot = root.querySelector('[data-chart=ontime]');
      if (ot) columnChart(ot, {
        labels: d.completion_trend.map((t) => t.month), values: d.completion_trend.map((t) => t.on_time), xFmt: fmt.month, target: { value: 90 },
        tip: (i) => `<b>${fmt.month(d.completion_trend[i].month)}</b><div>${fmt.pct(d.completion_trend[i].on_time, 1)} on time</div><div>${d.completion_trend[i].due} modules due</div>`,
      });
      // Program ledger: the focused or hovered month writes its record into the detail line.
      const detail = root.querySelector('[data-ledger-detail]');
      const resting = detail.textContent;
      root.querySelectorAll('.mcol').forEach((c) => {
        const show = () => { detail.textContent = c.dataset.detail; };
        c.addEventListener('pointerenter', show);
        c.addEventListener('focus', show);
        c.addEventListener('pointerleave', () => { detail.textContent = resting; });
      });
      // Binder tabs scroll to their section and follow the reader.
      const tabs = [...root.querySelectorAll('[data-tab]')];
      const mark = (id) => tabs.forEach((t) => (t.dataset.tab === id ? t.setAttribute('aria-current', 'true') : t.removeAttribute('aria-current')));
      tabs.forEach((t) => t.addEventListener('click', (e) => {
        e.preventDefault();
        root.querySelector(`#sec-${t.dataset.tab}`).scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
        mark(t.dataset.tab);
      }));
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) mark(en.target.id.replace('sec-', '')); }), { rootMargin: '-20% 0px -70% 0px' });
        SECTIONS.forEach(([id]) => io.observe(root.querySelector(`#sec-${id}`)));
      }
      root.querySelector('[data-dept]')?.addEventListener('change', (e) => go(`/dashboard${e.target.value ? `?department=${encodeURIComponent(e.target.value)}` : ''}`));
      root.querySelector('[data-export]').addEventListener('click', async () => saveFile((await get('/api/reports/compliance.csv')).__file));
      root.querySelectorAll('[data-emp]').forEach((tr) => {
        tr.addEventListener('click', () => go(`/employees/${tr.dataset.emp}`));
        tr.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(`/employees/${tr.dataset.emp}`); });
      });
      if (isAdmin()) root.querySelectorAll('[data-dept-row]').forEach((tr) => tr.addEventListener('click', () => go(`/dashboard?department=${encodeURIComponent(tr.dataset.deptRow)}`)));
    },
  };
}

export async function settings({ refresh }) {
  const [t, log] = await Promise.all([get('/api/tenant'), get('/api/audit')]);
  const s = t.settings;
  const html = `<div class="page">
    ${pageHead({ title: 'Settings', meta: [esc(t.name), `${esc(fmt.plan(t.plan))} plan`, `Started ${fmt.date(t.program_start)}`], sub: 'Program rules for this company. Changes apply to new releases and quizzes.' })}
    <div class="grid">
      <form class="card span-5 stack" data-form novalidate>
        <div class="card-head" style="margin:0"><h2>Program rules</h2></div>
        <div class="field"><label for="s-pass">Quiz pass mark (%)</label><input class="input" id="s-pass" name="pass_mark" type="number" min="50" max="100" value="${s.pass_mark}"></div>
        <div class="field"><label for="s-due">Days to complete each module</label><input class="input" id="s-due" name="due_days" type="number" min="7" max="90" value="${s.due_days}"><span class="hint">Counted from the monthly release date.</span></div>
        <div class="field"><label for="s-onb">Days for new starters to finish Security Essentials</label><input class="input" id="s-onb" name="onboarding_days" type="number" min="1" max="30" value="${s.onboarding_days}"></div>
        <div class="notice"><b>${esc(fmt.plan(t.plan))} plan.</b> ${t.plan === 'essentials' ? 'Role-based tracks are not included on this plan.' : 'Role-based tracks release in months 3 and 9.'} TechCatalyst manages the plan and program start date.</div>
        <p class="error" data-err role="alert" hidden></p>
        <div><button class="btn btn-primary" type="submit">Save settings</button></div>
      </form>
      <section class="card span-7"><div class="card-head"><h2>Activity log</h2><p>Last 200 events</p></div>
        <div class="table-wrap" style="max-height:560px;overflow:auto"><table class="data"><thead><tr><th>When</th><th>Who</th><th>What</th></tr></thead><tbody>
        ${log.map((e) => `<tr><td class="regno">${fmt.date(e.created_at)}</td><td>${esc(e.actor_name)}</td><td><span class="mono">${esc(e.action)}</span><div class="cell-sub">${esc(e.detail)}</div></td></tr>`).join('') || `<tr><td colspan="3">${emptyState('No activity yet.')}</td></tr>`}
        </tbody></table></div></section>
    </div>
  </div>`;
  return {
    title: 'Settings', html,
    mount(root) {
      const form = root.querySelector('[data-form]');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const err = form.querySelector('[data-err]'); err.hidden = true;
        const btn = form.querySelector('[type=submit]'); btn.disabled = true;
        try {
          await patch('/api/tenant/settings', { pass_mark: form.pass_mark.value, due_days: form.due_days.value, onboarding_days: form.onboarding_days.value });
          state.tenant = await get('/api/tenant');
          toast('Settings saved'); refresh();
        } catch (ex) { err.textContent = ex.message; err.hidden = false; } finally { btn.disabled = false; }
      });
    },
  };
}
