// Provider views: portfolio overview across all client companies, and client management.
import { get, post, patch } from '../api.js';
import { esc, fmt, tile, statusPill, pill, modal, toast, meter, emptyState, copyText, pageHead, regno } from '../ui.js';
import { lineChart, hbars } from '../charts.js';
import { actAs } from '../app.js';

const planPill = (p) => pill(p === 'premium' ? 'accent' : 'neutral', fmt.plan(p), '');

export async function overview() {
  const d = await get('/api/platform/overview');
  const k = d.kpis;
  const html = `<div class="page">
    ${pageHead({ title: 'Client overview', meta: ['TechCatalyst portfolio', `${k.companies} active clients`, `${fmt.num(k.employees)} employees`], sub: 'How every client program is performing, weakest compliance first.', actions: '<button class="btn btn-primary" data-add>Add client</button>' })}
    <div class="tiles">
      ${tile('Employee compliance', `${fmt.pct(k.compliance_rate)}`, `across ${fmt.num(k.employees)} enrolled employees`, 'hero')}
      ${tile('Active clients', fmt.num(k.companies), `${d.plan_mix.map((p) => `${p.companies} ${fmt.plan(p.plan)}`).join(' · ')}`)}
      ${tile('Training completion', fmt.pct(k.training_completion), 'of modules that are due')}
      ${tile('Phishing click rate', fmt.pct(k.click_rate_90d, 1), 'last 90 days, all clients')}
      ${tile('Overdue modules', fmt.num(k.overdue), `${k.high_risk} high-risk employees`)}
      ${tile('Est. monthly revenue', fmt.money(k.mrr), 'at list price per seat')}
    </div>
    <div class="grid">
      <section class="card span-7"><div class="card-head"><h2>Phishing, all clients</h2><p>Share of simulations clicked vs reported, by month</p>
        <div class="legend right"><span><i class="key" style="background:var(--s2)"></i>Clicked</span><span><i class="key" style="background:var(--s1)"></i>Reported</span></div></div>
        <div data-chart="trend"></div></section>
      <section class="card span-5"><div class="card-head"><h2>Compliance by client</h2><p>Employees with nothing overdue; line marks 90%</p></div>
        ${hbars(d.companies.slice().sort((a, b) => (b.compliance_rate ?? 0) - (a.compliance_rate ?? 0)).map((c) => ({ name: c.name, value: c.compliance_rate })), { target: 90 })}
      </section>
      <section class="card span-12"><div class="card-head"><h2>Client register</h2><p>Select a client to open its workspace</p></div>
        <div class="table-wrap"><table class="data"><thead><tr><th>No.</th><th>Client</th><th>Plan</th><th class="r">Employees</th><th>Program</th><th>Compliance</th><th class="r">Overdue</th><th class="r">Clicked 90d</th><th class="r">Reported 90d</th></tr></thead><tbody>
        ${d.companies.map((c, i) => `<tr class="link" data-tenant="${esc(c.id)}" tabindex="0">
          <td class="regno">${esc(c.register_no ?? regno('C', i))}</td><td><div class="cell-main">${esc(c.name)}</div><div class="cell-sub">${esc(c.industry || '')}${c.status !== 'active' ? ' · <b>Paused</b>' : ''}</div></td>
          <td>${planPill(c.plan)}</td><td class="r">${fmt.num(c.employees)}</td>
          <td class="nowrap">${c.program_cycle ? `Y${c.program_cycle} · M${c.program_month}` : 'Not started'}</td>
          <td style="min-width:120px">${meter(c.compliance_rate)}</td>
          <td class="r">${c.overdue ? `<b style="color:var(--crit-ink)">${c.overdue}</b>` : '0'}</td>
          <td class="r">${fmt.pct(c.click_rate_90d, 1)}<div class="cell-sub">baseline ${fmt.pct(c.baseline_click_rate, 1)}</div></td><td class="r">${fmt.pct(c.report_rate_90d, 1)}</td></tr>`).join('')}
        </tbody></table></div></section>
    </div>
  </div>`;
  return {
    title: 'Client overview', html,
    mount(root) {
      lineChart(root.querySelector('[data-chart=trend]'), {
        labels: d.phishing_trend.map((t) => t.month), xFmt: fmt.month, tipTitle: (i) => `${fmt.month(d.phishing_trend[i].month)} · ${d.phishing_trend[i].delivered} simulations`,
        series: [
          { name: 'Clicked', color: 'var(--s2)', values: d.phishing_trend.map((t) => t.click_rate) },
          { name: 'Reported', color: 'var(--s1)', values: d.phishing_trend.map((t) => t.report_rate) },
        ],
      });
      bindRows(root);
      root.querySelector('[data-add]').addEventListener('click', () => addClient());
    },
  };
}

function bindRows(root) {
  root.querySelectorAll('[data-tenant]').forEach((tr) => {
    const open = () => actAs(tr.dataset.tenant);
    tr.addEventListener('click', open);
    tr.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(); });
  });
}

export async function clients({ refresh }) {
  const list = await get('/api/tenants');
  const html = `<div class="page">
    ${pageHead({ title: 'Clients', meta: ['TechCatalyst portfolio', `${list.length} companies`], sub: 'Add a client to create its workspace and first administrator.', actions: '<button class="btn btn-primary" data-add>Add client</button>' })}
    <section class="card"><div class="table-wrap"><table class="data"><thead><tr><th>No.</th><th>Company</th><th>Industry</th><th>Plan</th><th class="r">Active employees</th><th>Program start</th><th>Contact</th><th>Status</th><th></th></tr></thead><tbody>
      ${list.length ? list.map((t, i) => `<tr>
        <td class="regno">${esc(t.register_no ?? regno('C', i))}</td><td class="cell-main">${esc(t.name)}</td><td>${esc(t.industry || '–')}</td><td>${planPill(t.plan)}</td><td class="r">${t.employees}</td>
        <td>${fmt.date(t.program_start)}</td><td><div>${esc(t.contact_name || '')}</div><div class="cell-sub">${esc(t.contact_email || '')}</div></td>
        <td>${t.status === 'active' ? pill('good', 'Active') : pill('neutral', 'Paused', '')}</td>
        <td class="r"><div class="row" style="justify-content:flex-end;flex-wrap:nowrap"><button class="btn btn-sm" data-edit="${esc(t.id)}">Edit</button><button class="btn btn-sm btn-primary" data-open="${esc(t.id)}">Open</button></div></td></tr>`).join('') : `<tr><td colspan="9">${emptyState('No clients yet. Add your first client to create its workspace.')}</td></tr>`}
    </tbody></table></div></section>
  </div>`;
  return {
    title: 'Clients', html,
    mount(root) {
      root.querySelector('[data-add]').addEventListener('click', () => addClient(refresh));
      root.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => actAs(b.dataset.open)));
      root.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => editClient(list.find((t) => t.id === b.dataset.edit), refresh)));
    },
  };
}

const planOptions = (sel) => ['essentials', 'professional', 'premium'].map((p) => `<option value="${p}" ${p === sel ? 'selected' : ''}>${fmt.plan(p)}</option>`).join('');

function addClient(after) {
  const today = new Date().toISOString().slice(0, 10);
  modal({
    title: 'Add a client company', submitLabel: 'Create client',
    body: `<div class="form-grid">
      <div class="field full"><label for="c-name">Company name</label><input class="input" id="c-name" name="name" required maxlength="100"></div>
      <div class="field"><label for="c-ind">Industry</label><input class="input" id="c-ind" name="industry" placeholder="e.g. Healthcare" maxlength="60"></div>
      <div class="field"><label for="c-plan">Plan</label><select class="input" id="c-plan" name="plan">${planOptions('professional')}</select><span class="hint">Role-based tracks need Professional or Premium.</span></div>
      <div class="field"><label for="c-start">Program start</label><input class="input" id="c-start" name="program_start" type="date" value="${today}"><span class="hint">Module 1 releases on this date.</span></div>
      <div class="field"></div>
      <div class="field"><label for="c-an">Client administrator</label><input class="input" id="c-an" name="admin_name" placeholder="Full name" required></div>
      <div class="field"><label for="c-ae">Administrator email</label><input class="input" id="c-ae" name="admin_email" type="email" required></div>
    </div>`,
    async onSubmit(data, { form }) {
      const res = await post('/api/tenants', data);
      form.querySelector('.modal-body').innerHTML = `<p><b>${esc(res.tenant.name)}</b> is ready. Send the administrator their sign-in details:</p>
        <div class="notice stack" style="gap:6px"><div>Email: <span class="secret">${esc(res.admin.email)}</span></div><div>Temporary password: <span class="secret" data-pw>${esc(res.temp_password)}</span></div><div class="muted" style="font-size:.8rem">They will be asked to choose a new password. This password is not shown again.</div></div>
        <div><button type="button" class="btn" data-copy>Copy details</button></div>`;
      form.querySelector('[data-copy]').addEventListener('click', () => copyText(`Sign in: ${location.origin}\nEmail: ${res.admin.email}\nTemporary password: ${res.temp_password}`, form.querySelector('[data-pw]')));
      form.querySelector('.modal-foot').innerHTML = `<button type="button" class="btn btn-primary" data-open>Open ${esc(res.tenant.name)}</button>`;
      form.querySelector('[data-open]').addEventListener('click', () => { form.parentElement.remove(); actAs(res.tenant.id); });
      after?.();
      return true;
    },
  });
}

function editClient(t, after) {
  modal({
    title: `Edit ${t.name}`, submitLabel: 'Save changes',
    body: `<div class="form-grid">
      <div class="field full"><label for="e-name">Company name</label><input class="input" id="e-name" name="name" value="${esc(t.name)}" required></div>
      <div class="field"><label for="e-ind">Industry</label><input class="input" id="e-ind" name="industry" value="${esc(t.industry || '')}"></div>
      <div class="field"><label for="e-plan">Plan</label><select class="input" id="e-plan" name="plan">${planOptions(t.plan)}</select></div>
      <div class="field"><label for="e-start">Program start</label><input class="input" id="e-start" name="program_start" type="date" value="${t.program_start.slice(0, 10)}"><span class="hint">Changing this moves every future release.</span></div>
      <div class="field"><label for="e-status">Status</label><select class="input" id="e-status" name="status"><option value="active" ${t.status === 'active' ? 'selected' : ''}>Active</option><option value="paused" ${t.status === 'paused' ? 'selected' : ''}>Paused (blocks sign-in)</option></select></div>
    </div>`,
    async onSubmit(data) {
      await patch(`/api/tenants/${t.id}`, data);
      toast('Client updated');
      after?.();
    },
  });
}

export { statusPill };
