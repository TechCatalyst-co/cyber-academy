// Reports: CSV exports and the insurer/auditor evidence pack.
import { get } from '../api.js';
import { esc, fmt, statusPill, saveFile, tile, emptyState, pageHead, asset, regno, stamp, icons } from '../ui.js';
import { isAdmin, state } from '../app.js';

export async function index() {
  const items = [
    ['compliance.csv', 'Employee compliance', 'One row per employee: status, modules due and completed, overdue, quiz average, phishing results and risk score.', true],
    ['training.csv', 'Training records', 'Every assignment with release and due dates, completion date, score and attempts. The detailed audit trail.', true],
    ['phishing.csv', 'Phishing results', 'Every simulation sent and each person\'s outcome.', false],
  ].filter((x) => x[3] || isAdmin());
  const html = `<div class="page">
    ${pageHead({ title: 'Reports', meta: ['Evidence', esc(state.tenant?.name || '')], sub: 'Exports for managers, auditors and cyber insurers.', actions: isAdmin() ? '<a class="btn btn-primary" href="#/reports/evidence">Open evidence pack</a>' : '' })}
    <section class="card"><div class="table-wrap"><table class="data"><thead><tr><th>No.</th><th>Report</th><th>Format</th><th></th></tr></thead><tbody>
      ${isAdmin() ? `<tr><td class="regno">${regno('R', 0)}</td><td><div class="cell-main">Compliance evidence pack</div><div class="cell-sub">Headline results, completion by course, the phishing record and every employee's status, ready to print for an insurance renewal or audit.</div></td><td class="mono">Printable page</td><td class="r"><a class="btn btn-sm" href="#/reports/evidence">Open</a></td></tr>` : ''}
      ${items.map(([file, title, text], i) => `<tr><td class="regno">${regno('R', i + (isAdmin() ? 1 : 0))}</td><td><div class="cell-main">${esc(title)}</div><div class="cell-sub">${esc(text)}</div></td><td class="mono">${esc(file)}</td><td class="r"><button class="btn btn-sm" data-file="${file}">Export</button></td></tr>`).join('')}
    </tbody></table></div></section>
  </div>`;
  return {
    title: 'Reports', html,
    mount(root) {
      root.querySelectorAll('[data-file]').forEach((b) => b.addEventListener('click', async () => {
        b.disabled = true;
        try { saveFile((await get(`/api/reports/${b.dataset.file}`)).__file); } finally { b.disabled = false; }
      }));
    },
  };
}

export async function evidence() {
  const p = await get('/api/reports/evidence');
  const k = p.kpis;
  const canPrint = !globalThis.__LMS_LOCAL__;
  const html = `<div class="page">
    <div class="crumb no-print"><a href="#/reports">${icons.left.replace('<svg', '<svg class="ic" style="vertical-align:-3px"')} Reports</a></div>
    <div class="cert" style="max-width:none;border-radius:6px"><div class="cert-band"><img src="${asset('tc-logo-white.png')}" alt="TechCatalyst"><span>${esc(state.config.brand)} · evidence pack</span></div></div>
    ${pageHead({
      title: esc(p.tenant.name),
      meta: ['Security awareness training record', `Generated ${fmt.date(p.generated_at)}`, `Program year ${p.program.cycle}, month ${p.program.month}`, `${esc(fmt.plan(p.tenant.plan))} plan`],
      sub: `Program started ${fmt.date(p.tenant.program_start)}. Prepared by TechCatalyst ${esc(state.config.brand)}.`,
      actions: canPrint ? '<button class="btn btn-primary" data-print>Print or save as PDF</button>' : '',
    })}
    <div class="tiles">
      ${tile('Compliance rate', fmt.pct(k.compliance_rate), 'employees with nothing overdue', 'hero')}
      ${tile('Employees enrolled', String(k.employees))}
      ${tile('Training completion', fmt.pct(k.training_completion))}
      ${tile('Average quiz score', k.avg_score === null ? '–' : `${k.avg_score}%`)}
      ${tile('Phishing click rate', fmt.pct(k.click_rate_90d, 1), `baseline ${fmt.pct(k.baseline_click_rate, 1)}`)}
      ${tile('Report rate', fmt.pct(k.report_rate_90d, 1), 'last 90 days')}
    </div>
    <section class="card"><div class="card-head"><span class="no">01</span><h2>Program scope</h2></div><p class="ink2" style="max-width:80ch">Monthly security awareness modules, each with a knowledge check (pass mark ${state.tenant?.settings?.pass_mark ?? 80}%); a refresher and 15-question assessment every six months; onboarding training for new starters within their first week${p.tenant.plan !== 'essentials' ? '; role-based training for leadership, finance, HR, IT, remote and customer-facing staff' : ''}; and monthly phishing simulations with just-in-time coaching. Records are kept per employee with dates and scores.</p></section>
    <section class="card"><div class="card-head"><span class="no">02</span><h2>Completion by course</h2></div><div class="table-wrap"><table class="data"><thead><tr><th>Code</th><th>Course</th><th class="r">Assigned</th><th class="r">Completed</th><th class="r">Completion of due</th><th class="r">Avg score</th></tr></thead><tbody>
      ${p.courses.map((c) => `<tr><td class="regno" style="color:var(--brand-ink)">${esc(c.code)}</td><td>${esc(c.title)}</td><td class="r">${c.assigned}</td><td class="r">${c.completed}</td><td class="r">${fmt.pct(c.completion)}</td><td class="r">${c.avg_score ?? '–'}</td></tr>`).join('') || `<tr><td colspan="6">${emptyState('No courses released yet.')}</td></tr>`}
    </tbody></table></div></section>
    <section class="card"><div class="card-head"><span class="no">03</span><h2>Phishing simulations</h2></div><div class="table-wrap"><table class="data"><thead><tr><th>Campaign</th><th>Sent</th><th class="r">Delivered</th><th class="r">Clicked</th><th class="r">Entered data</th><th class="r">Reported</th></tr></thead><tbody>
      ${p.phishing.map((c) => `<tr><td>${esc(c.name)}</td><td class="num">${fmt.date(c.sent_at)}</td><td class="r">${c.delivered}</td><td class="r">${fmt.pct(c.click_rate, 1)}</td><td class="r">${fmt.pct(c.submit_rate, 1)}</td><td class="r">${fmt.pct(c.report_rate, 1)}</td></tr>`).join('') || `<tr><td colspan="6">${emptyState('No simulations yet.')}</td></tr>`}
    </tbody></table></div></section>
    <section class="card"><div class="card-head"><span class="no">04</span><h2>Employee register</h2><p>${p.employees.length} active employees</p></div><div class="table-wrap"><table class="data"><thead><tr><th>No.</th><th>Employee</th><th>Department</th><th>Status</th><th class="r">Completed / due</th><th>Last evidence</th><th class="r">Avg score</th></tr></thead><tbody>
      ${p.employees.map((e, i) => `<tr><td class="regno">${regno('E', i)}</td><td>${esc(e.name)}</td><td>${esc(e.department)}</td><td>${statusPill(e.training.status)}</td><td class="r">${e.training.completed} / ${e.training.required}</td><td>${e.training.last_completed ? stamp(fmt.short(e.training.last_completed)) : '–'}</td><td class="r">${e.training.avg_score ?? '–'}</td></tr>`).join('')}
    </tbody></table></div></section>
    <section class="card"><div class="card-head"><span class="no">05</span><h2>Attestation</h2><p>Generated by ${esc(state.user?.name || 'an administrator')} on ${fmt.date(p.generated_at)}. Sign after reviewing this record${p.tenant.register_no ? `, register ${esc(p.tenant.register_no)}` : ''}.</p></div>
      <div class="attest"><div><span class="k">Prepared by (TechCatalyst)</span><span class="line"></span><span class="muted" style="font-size:.8rem">Name and title, ${esc(state.config.brand)} program team</span></div><div><span class="k">Reviewed by (${esc(p.tenant.name)})</span><span class="line"></span><span class="muted" style="font-size:.8rem">Name and title</span></div><div><span class="k">Date</span><span class="line"></span><span class="muted" style="font-size:.8rem">YYYY-MM-DD</span></div></div></section>
  </div>`;
  return { title: 'Evidence pack', html, mount(root) { root.querySelector('[data-print]')?.addEventListener('click', () => window.print()); } };
}
