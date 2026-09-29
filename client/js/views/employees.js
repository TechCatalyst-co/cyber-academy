// Employee compliance list and per-employee record.
import { get, post, patch } from '../api.js';
import { esc, fmt, tile, statusPill, statePill, outcomePill, riskBadge, meter, modal, toast, emptyState, saveFile, copyText, pill, pageHead, stamp, regno } from '../ui.js';
import { isAdmin, state } from '../app.js';

const trackOptions = (selected = []) => Object.entries(state.config.tracks || {}).map(([k, label]) =>
  `<label class="check"><input type="checkbox" name="tracks" value="${k}" ${selected.includes(k) ? 'checked' : ''}>${esc(label)}</label>`).join('');

export async function list({ query, go }) {
  const qs = new URLSearchParams();
  for (const k of ['q', 'department', 'status']) if (query[k]) qs.set(k, query[k]);
  if (query.include_inactive) qs.set('include_inactive', '1');
  const [rows, dash] = await Promise.all([get(`/api/employees?${qs}`), get('/api/dashboard')]);
  const departments = dash.departments;
  const html = `<div class="page">
    ${pageHead({ title: 'Employees', meta: ['Employee register', esc(state.tenant?.name || ''), `${rows.length} ${rows.length === 1 ? 'person' : 'people'} shown`], sub: 'Status updates automatically as each module falls due.', actions: `<button class="btn" data-export>Export CSV</button>${isAdmin() ? '<button class="btn" data-import>Import CSV</button><button class="btn btn-primary" data-add>Add employee</button>' : ''}` })}
    <form class="filters" data-filters>
      <div class="field" style="flex:1;min-width:200px"><label for="f-q">Search</label><input class="input" id="f-q" name="q" value="${esc(query.q || '')}" placeholder="Name or email"></div>
      <div class="field"><label for="f-d">Department</label><select class="input" id="f-d" name="department"><option value="">All</option>${departments.map((x) => `<option ${x === query.department ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></div>
      <div class="field"><label for="f-s">Status</label><select class="input" id="f-s" name="status"><option value="">All</option>
        ${[['compliant', 'Compliant'], ['at_risk', 'At risk'], ['non_compliant', 'Non-compliant']].map(([v, l]) => `<option value="${v}" ${v === query.status ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <label class="check" style="margin-bottom:2px"><input type="checkbox" name="include_inactive" value="1" ${query.include_inactive ? 'checked' : ''}>Include former staff</label>
      <button class="btn" type="submit">Apply</button>
    </form>
    <section class="card"><div class="table-wrap"><table class="data"><thead><tr>
      <th>No.</th><th>Employee</th><th>Department</th><th>Status</th><th>Completion</th><th class="r">Overdue</th><th class="r">Avg score</th><th class="r">Phishing</th><th>Risk</th></tr></thead><tbody>
      ${rows.length ? rows.map((r, i) => `<tr class="link" data-id="${esc(r.id)}" tabindex="0">
        <td class="regno">${regno('E', i)}</td><td><div class="cell-main">${esc(r.name)}${r.status === 'inactive' ? ' <span class="pill pill-neutral">Former</span>' : ''}</div><div class="cell-sub">${esc(r.email)}</div></td>
        <td class="nowrap">${esc(r.department)}<div class="cell-sub">${esc(r.job_title || '')}</div></td>
        <td>${statusPill(r.training.status)}</td>
        <td style="min-width:110px">${meter(r.training.completion)}<div class="cell-sub">${r.training.completed} of ${r.training.required} due</div></td>
        <td class="r">${r.training.overdue ? `<b style="color:var(--crit-ink)">${r.training.overdue}</b>` : '0'}</td>
        <td class="r">${r.training.avg_score ?? '–'}</td>
        <td class="r" title="Failed / tests received">${r.phishing.clicked} / ${r.phishing.delivered}${r.repeat_clicker ? '<div class="cell-sub" style="color:var(--crit-ink)">repeat clicker</div>' : ''}</td>
        <td>${riskBadge(r.risk, r.risk_band)}</td></tr>`).join('') : `<tr><td colspan="9">${emptyState('No employees match these filters. Clear the search or choose All.')}</td></tr>`}
    </tbody></table></div></section>
    <p class="footnote">Risk score (0–100): +15 per overdue module, +12 per failed phishing test in the last 180 days (+8 if data was entered), +10 if average quiz score is under 80, −10 for reporting a simulation.</p>
  </div>`;
  return {
    title: 'Employees', html,
    mount(root) {
      const f = root.querySelector('[data-filters]');
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        const p = new URLSearchParams();
        if (f.q.value.trim()) p.set('q', f.q.value.trim());
        if (f.department.value) p.set('department', f.department.value);
        if (f.status.value) p.set('status', f.status.value);
        if (f.include_inactive.checked) p.set('include_inactive', '1');
        go(`/employees${p.toString() ? `?${p}` : ''}`);
      });
      f.department.addEventListener('change', () => f.requestSubmit());
      f.status.addEventListener('change', () => f.requestSubmit());
      root.querySelectorAll('[data-id]').forEach((tr) => {
        tr.addEventListener('click', () => go(`/employees/${tr.dataset.id}`));
        tr.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(`/employees/${tr.dataset.id}`); });
      });
      root.querySelector('[data-export]').addEventListener('click', async () => saveFile((await get('/api/reports/compliance.csv')).__file));
      root.querySelector('[data-add]')?.addEventListener('click', () => addEmployee(departments, () => go('/employees')));
      root.querySelector('[data-import]')?.addEventListener('click', () => importEmployees(() => go('/employees')));
    },
  };
}

function employeeFields(u = {}, departments = [], isNew = true) {
  return `<div class="form-grid">
    <div class="field"><label for="u-name">Full name</label><input class="input" id="u-name" name="name" value="${esc(u.name || '')}" required></div>
    ${isNew ? `<div class="field"><label for="u-email">Work email</label><input class="input" id="u-email" name="email" type="email" required></div>` : `<div class="field"><span class="label">Work email</span><span class="input" style="background:var(--tint)">${esc(u.email)}</span></div>`}
    <div class="field"><label for="u-dept">Department</label><input class="input" id="u-dept" name="department" list="dept-list" value="${esc(u.department || '')}"><datalist id="dept-list">${departments.map((d) => `<option value="${esc(d)}">`).join('')}</datalist></div>
    <div class="field"><label for="u-title">Job title</label><input class="input" id="u-title" name="job_title" value="${esc(u.job_title || '')}"></div>
    <div class="field"><label for="u-role">Access</label><select class="input" id="u-role" name="role">
      ${[['employee', 'Employee: takes training'], ['manager', 'Manager: sees their department'], ['company_admin', 'Administrator: manages everything']].map(([v, l]) => `<option value="${v}" ${v === (u.role || 'employee') ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    <div class="field"><label for="u-hire">Hire date</label><input class="input" id="u-hire" name="hire_date" type="date" value="${esc(u.hire_date || '')}"><span class="hint">Starters hired after launch get Security Essentials first.</span></div>
    <div class="field full"><span class="label">Role-based tracks</span><div class="checks">${trackOptions(u.tracks || [])}</div><span class="hint">${state.tenant?.plan === 'essentials' ? 'Tracks are saved but only assigned on Professional and Premium plans.' : 'Assigned in program months 3 and 9.'}</span></div>
    ${isNew ? '' : `<div class="field"><label for="u-status">Employment</label><select class="input" id="u-status" name="status"><option value="active" ${u.status === 'active' ? 'selected' : ''}>Active</option><option value="inactive" ${u.status === 'inactive' ? 'selected' : ''}>Left the company</option></select></div>`}
  </div>`;
}

function showPassword(form, email, pw, done) {
  form.querySelector('.modal-body').innerHTML = `<div class="notice stack" style="gap:6px"><div>Email: <span class="secret">${esc(email)}</span></div><div>Temporary password: <span class="secret" data-pw>${esc(pw)}</span></div><div class="muted" style="font-size:.8rem">Share this securely. It is not shown again, and they must change it at first sign-in.</div></div><div><button type="button" class="btn" data-copy>Copy</button></div>`;
  form.querySelector('[data-copy]').addEventListener('click', () => copyText(`Email: ${email}\nTemporary password: ${pw}`, form.querySelector('[data-pw]')));
  form.querySelector('.modal-foot').innerHTML = '<button type="button" class="btn btn-primary" data-close>Done</button>';
  form.querySelector('[data-close]').addEventListener('click', () => { form.parentElement.remove(); done?.(); });
}

function addEmployee(departments, done) {
  modal({
    title: 'Add an employee', submitLabel: 'Add employee', body: employeeFields({}, departments, true),
    async onSubmit(data, { form }) {
      const res = await post('/api/employees', data);
      toast(`${res.user.name} added and enrolled`);
      showPassword(form, res.user.email, res.temp_password, done);
      return true;
    },
  });
}

function importEmployees(done) {
  const sample = 'name,email,department,job_title,role,tracks,hire_date\nAlex Rivera,alex.rivera@example.com,Finance,AP Specialist,employee,finance,2024-03-11\nJo Chen,jo.chen@example.com,Operations,Ops Manager,manager,leadership;remote,2021-09-01';
  modal({
    title: 'Import employees from CSV', submitLabel: 'Import', wide: true,
    body: `<p class="ink2">Paste rows exported from your HR system or a spreadsheet. The first row must be the header. Roles: employee, manager, company_admin. Separate multiple tracks with semicolons (${Object.keys(state.config.tracks || {}).join(', ')}).</p>
      <div class="field"><label for="csv">CSV</label><textarea class="input" id="csv" name="csv" placeholder="${esc(sample)}"></textarea></div>
      <div><button type="button" class="btn btn-sm" data-sample>Insert example rows</button></div>`,
    async onSubmit(data, { form }) {
      const res = await post('/api/employees/import', { csv: data.csv });
      form.querySelector('.modal-body').innerHTML = `<p><b>${res.created.length}</b> added, <b>${res.errors.length}</b> skipped.</p>
        ${res.errors.length ? `<div class="notice"><b>Skipped rows</b><ul style="margin:6px 0 0;padding-left:18px">${res.errors.map((e) => `<li>Row ${e.row}: ${esc(e.error)}</li>`).join('')}</ul></div>` : ''}
        ${res.created.length ? `<div class="field"><span class="label">Temporary passwords (shown once)</span><textarea class="input" readonly data-out>${esc('email,temporary_password\n' + res.created.map((c) => `${c.email},${c.temp_password}`).join('\n'))}</textarea></div><div><button type="button" class="btn" data-copy>Copy passwords</button></div>` : ''}`;
      form.querySelector('[data-copy]')?.addEventListener('click', () => copyText(form.querySelector('[data-out]').value, form.querySelector('[data-out]')));
      form.querySelector('.modal-foot').innerHTML = '<button type="button" class="btn btn-primary" data-done>Done</button>';
      form.querySelector('[data-done]').addEventListener('click', () => { form.parentElement.remove(); done?.(); });
      return true;
    },
  }).el.querySelector('[data-sample]').addEventListener('click', (e) => { e.target.closest('form').csv.value = sample; });
}

export async function detail({ params, go, refresh }) {
  const [d, catalog] = await Promise.all([get(`/api/employees/${params.id}`), isAdmin() ? get('/api/courses') : Promise.resolve([])]);
  const u = d.user, t = d.training, p = d.phishing;
  const html = `<div class="page">
    ${pageHead({
      crumb: { href: '/employees', label: 'Employees' },
      title: esc(u.name),
      meta: ['Employee record', esc(u.department || 'No department'), esc(u.job_title || ''), esc(u.email)],
      sub: `<span class="row" style="gap:6px">${statusPill(t.status)}${u.status === 'inactive' ? pill('neutral', 'Left the company', '') : ''}${pill('neutral', fmt.role(u.role), '')}${(u.tracks || []).map((k) => pill('accent', state.config.tracks?.[k] || k, '')).join('')}</span>`,
      actions: isAdmin() ? '<button class="btn" data-reset>Reset password</button><button class="btn" data-assign>Assign a course</button><button class="btn btn-primary" data-edit>Edit</button>' : '',
    })}
    <div class="tiles">
      ${tile('Training completion', fmt.pct(t.completion), `${t.completed} of ${t.required} modules due`)}
      ${tile('Overdue', String(t.overdue), `${t.due_soon} due within 7 days`)}
      ${tile('Average quiz score', t.avg_score === null ? '–' : `${t.avg_score}<small>%</small>`, `${d.attempts.length} quiz attempts`)}
      ${tile('Phishing tests failed', `${p.clicked}<small> of ${p.delivered}</small>`, `${p.submitted} entered data${d.repeat_clicker ? ' · <b style="color:var(--crit-ink)">repeat clicker</b>' : ''}`)}
      ${tile('Simulations reported', String(p.reported), p.report_rate === null ? 'no tests yet' : `${fmt.pct(p.report_rate)} report rate`)}
      ${tile('Human-risk score', riskBadge(d.risk, d.risk_band), `${d.risk_band} risk`)}
    </div>
    <section class="card"><div class="card-head"><h2>Training record</h2><p>${d.assignments.length} assignments, newest due date first</p></div>
      <div class="table-wrap"><table class="data"><thead><tr><th>Course</th><th>Type</th><th>Due</th><th>Status</th><th>Evidence</th><th class="r">Score</th><th class="r">Attempts</th><th></th></tr></thead><tbody>
      ${d.assignments.length ? d.assignments.map((a) => `<tr>
        <td><span class="code">${esc(a.course.code || '')}</span><div class="cell-main">${esc(a.course.title || 'Removed course')}</div></td>
        <td>${esc(fmt.cat(a.course.category))}${a.source === 'manual' ? '<div class="cell-sub">assigned manually</div>' : ''}</td>
        <td class="num">${fmt.date(a.due_at)}</td><td>${statePill(a.state)}</td><td>${a.completed_at ? stamp(`Evidenced ${fmt.short(a.completed_at)}`, a.state === 'completed_late') : '<span class="muted">–</span>'}</td>
        <td class="r">${a.score ?? '–'}</td><td class="r">${a.attempts}</td>
        <td class="r"><div class="row" style="justify-content:flex-end;flex-wrap:nowrap;gap:6px">
          ${a.status === 'completed' ? `<a class="btn btn-sm" href="#/certificate/${esc(a.id)}">Certificate</a>` : ''}
          ${isAdmin() && a.status !== 'completed' ? `<button class="btn btn-sm" data-manage="${esc(a.id)}">Manage</button>` : ''}</div></td></tr>`).join('') : `<tr><td colspan="8">${emptyState('No training assigned yet.')}</td></tr>`}
      </tbody></table></div></section>
    <div class="grid">
      <section class="card span-7"><div class="card-head"><h2>Phishing simulations</h2></div>
        <div class="table-wrap"><table class="data"><thead><tr><th>Campaign</th><th>Channel</th><th>Sent</th><th>Result</th></tr></thead><tbody>
        ${d.phishing_results.length ? d.phishing_results.map((r) => `<tr><td class="cell-main">${esc(r.campaign)}</td><td>${esc(fmt.channel(r.channel))}</td><td class="num">${fmt.date(r.sent_at)}</td><td>${outcomePill(r.outcome)}</td></tr>`).join('') : `<tr><td colspan="4">${emptyState('No simulations yet.')}</td></tr>`}
        </tbody></table></div></section>
      <section class="card span-5"><div class="card-head"><h2>Quiz attempts</h2></div>
        <div class="table-wrap" style="max-height:420px;overflow:auto"><table class="data"><thead><tr><th>Course</th><th>Date</th><th class="r">Score</th></tr></thead><tbody>
        ${d.attempts.length ? d.attempts.map((x) => `<tr><td>${esc(x.course_title)}</td><td class="num">${fmt.short(x.created_at)}</td><td class="r">${x.score}% ${x.passed ? '' : '<span class="pill pill-crit">Fail</span>'}</td></tr>`).join('') : `<tr><td colspan="3">${emptyState('No attempts yet.')}</td></tr>`}
        </tbody></table></div></section>
    </div>
  </div>`;
  return {
    title: u.name, html,
    mount(root) {
      if (!isAdmin()) return;
      root.querySelector('[data-edit]').addEventListener('click', async () => {
        const dash = await get('/api/dashboard');
        modal({
          title: `Edit ${u.name}`, submitLabel: 'Save changes', body: employeeFields(u, dash.departments, false),
          async onSubmit(data) { await patch(`/api/employees/${u.id}`, data); toast('Employee updated'); refresh(); },
        });
      });
      root.querySelector('[data-reset]').addEventListener('click', () => modal({
        title: 'Reset password', submitLabel: 'Reset password',
        body: `<p>Create a new temporary password for <b>${esc(u.name)}</b>? Their current password stops working immediately.</p>`,
        async onSubmit(_, { form }) { const res = await post(`/api/employees/${u.id}/reset-password`); showPassword(form, u.email, res.temp_password); return true; },
      }));
      root.querySelector('[data-assign]').addEventListener('click', () => {
        const due = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
        modal({
          title: `Assign a course to ${u.name}`, submitLabel: 'Assign',
          body: `<div class="field"><label for="a-c">Course</label><select class="input" id="a-c" name="course_id">${catalog.filter((c) => c.available).map((c) => `<option value="${esc(c.id)}">${esc(c.code)} · ${esc(c.title)}</option>`).join('')}</select><span class="hint">Useful as follow-up coaching after a failed phishing test.</span></div>
                 <div class="field"><label for="a-d">Due date</label><input class="input" id="a-d" name="due_at" type="date" value="${due}"></div>`,
          async onSubmit(data) { await post('/api/assignments', { ...data, user_ids: [u.id] }); toast('Course assigned'); refresh(); },
        });
      });
      root.querySelectorAll('[data-manage]').forEach((b) => b.addEventListener('click', () => {
        const a = d.assignments.find((x) => x.id === b.dataset.manage);
        modal({
          title: a.course.title, submitLabel: 'Save',
          body: `<div class="field"><label for="m-due">Due date</label><input class="input" id="m-due" name="due_at" type="date" value="${a.due_at.slice(0, 10)}"></div>
            <div class="field"><span class="label">Requirement</span>
              <label class="check"><input type="radio" name="status" value="assigned" ${a.status !== 'excused' ? 'checked' : ''}>Required</label>
              <label class="check"><input type="radio" name="status" value="excused" ${a.status === 'excused' ? 'checked' : ''}>Excused (for example, extended leave). Not counted in compliance.</label></div>
            <div class="field"><label for="m-r">Reason (saved in the activity log)</label><input class="input" id="m-r" name="reason" maxlength="200"></div>`,
          async onSubmit(data) { await patch(`/api/assignments/${a.id}`, data); toast('Assignment updated'); refresh(); },
        });
      }));
    },
  };
}
