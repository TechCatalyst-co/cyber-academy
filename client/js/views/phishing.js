// Phishing simulation campaigns and per-person results.
import { get, post, patch } from '../api.js';
import { esc, fmt, pill, outcomePill, modal, toast, emptyState, tile, saveFile, pageHead, regno } from '../ui.js';
import { isAdmin } from '../app.js';

const statusPill = (s) => ({ running: pill('accent', 'Collecting results', ''), scheduled: pill('neutral', 'Scheduled', ''), closed: pill('neutral', 'Closed', '') }[s] || s);

export async function list({ go }) {
  const [camps, templates] = await Promise.all([get('/api/phishing/campaigns'), get('/api/phishing/templates')]);
  const done = camps.filter((c) => c.delivered);
  const last = done[0];
  const html = `<div class="page">
    ${pageHead({ title: 'Phishing tests', meta: ['Simulation register', `${camps.length} campaigns`], sub: 'Record each simulation, then log who clicked, entered data or reported it. Results feed compliance and risk scores.', actions: isAdmin() ? '<button class="btn" data-export>Export results CSV</button><button class="btn btn-primary" data-new>New campaign</button>' : '' })}
    ${last ? `<div class="tiles">
      ${tile('Latest click rate', fmt.pct(last.click_rate, 1), esc(last.name))}
      ${tile('Latest report rate', fmt.pct(last.report_rate, 1), 'target 60% or more')}
      ${tile('Entered data', fmt.pct(last.submit_rate, 1), 'credentials or personal details')}
      ${tile('Campaigns run', String(camps.length), `${camps.reduce((s, c) => s + c.delivered, 0)} simulations delivered`)}
    </div>` : ''}
    <section class="card"><div class="table-wrap"><table class="data"><thead><tr><th>No.</th><th>Campaign</th><th>Channel</th><th>Difficulty</th><th>Sent</th><th>Status</th><th class="r">Targeted</th><th class="r">Clicked</th><th class="r">Entered data</th><th class="r">Reported</th></tr></thead><tbody>
    ${camps.length ? camps.map((c, i) => `<tr class="link" data-id="${esc(c.id)}" tabindex="0"><td class="regno">${regno('P', camps.length - 1 - i)}</td><td class="cell-main">${esc(c.name)}</td><td>${esc(fmt.channel(c.channel))}</td><td>${esc(c.difficulty)}</td><td class="num">${fmt.date(c.sent_at)}</td><td>${statusPill(c.status)}${c.pending ? `<div class="cell-sub">${c.pending} awaiting result</div>` : ''}</td>
      <td class="r">${c.targeted}</td><td class="r">${fmt.pct(c.click_rate, 1)}</td><td class="r">${fmt.pct(c.submit_rate, 1)}</td><td class="r">${fmt.pct(c.report_rate, 1)}</td></tr>`).join('') : `<tr><td colspan="10">${emptyState('No campaigns yet. Start with an unannounced baseline test.')}</td></tr>`}
    </tbody></table></div></section>
  </div>`;
  return {
    title: 'Phishing tests', html,
    mount(root) {
      root.querySelectorAll('[data-id]').forEach((tr) => {
        tr.addEventListener('click', () => go(`/phishing/${tr.dataset.id}`));
        tr.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(`/phishing/${tr.dataset.id}`); });
      });
      root.querySelector('[data-export]')?.addEventListener('click', async () => saveFile((await get('/api/reports/phishing.csv')).__file));
      root.querySelector('[data-new]')?.addEventListener('click', async () => {
        const dash = await get('/api/dashboard');
        const today = new Date().toISOString().slice(0, 10);
        const m = modal({
          title: 'New phishing campaign', submitLabel: 'Create campaign',
          body: `<div class="form-grid">
            <div class="field full"><label for="p-t">Theme from the program calendar</label><select class="input" id="p-t" name="template">${templates.map((t) => `<option value="${esc(t.key)}" data-name="${esc(t.name)}" data-channel="${t.channel}" data-difficulty="${t.difficulty}">Month ${t.month}: ${esc(t.name)}</option>`).join('')}</select></div>
            <div class="field full"><label for="p-n">Campaign name</label><input class="input" id="p-n" name="name" value="${esc(templates[0].name)}" required></div>
            <div class="field"><label for="p-c">Channel</label><select class="input" id="p-c" name="channel">${['email', 'sms', 'voice', 'qr'].map((c) => `<option value="${c}">${fmt.channel(c)}</option>`).join('')}</select></div>
            <div class="field"><label for="p-d">Difficulty</label><select class="input" id="p-d" name="difficulty">${['easy', 'medium', 'hard'].map((c) => `<option ${c === templates[0].difficulty ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
            <div class="field"><label for="p-s">Send date</label><input class="input" id="p-s" name="sent_at" type="date" value="${today}"></div>
            <div class="field"><label for="p-a">Audience</label><select class="input" id="p-a" name="department"><option value="">Everyone</option>${dash.departments.map((x) => `<option>${esc(x)}</option>`).join('')}</select></div>
          </div><p class="muted" style="font-size:.82rem">Send the simulation from your phishing platform, then record outcomes here or import them as CSV. Make sure the client has signed the phishing authorization letter.</p>`,
          async onSubmit(data) { const c = await post('/api/phishing/campaigns', data); toast(`Campaign created for ${c.targeted} people`); go(`/phishing/${c.id}`); },
        });
        const f = m.form;
        f.template.addEventListener('change', () => {
          const o = f.template.selectedOptions[0];
          f.name.value = o.dataset.name; f.channel.value = o.dataset.channel; f.difficulty.value = o.dataset.difficulty;
        });
      });
    },
  };
}

export async function detail({ params, refresh }) {
  const { campaign: c, results } = await get(`/api/phishing/campaigns/${params.id}`);
  const opts = ['pending', 'ignored', 'clicked', 'submitted', 'reported'];
  const label = { pending: 'Waiting', ignored: 'No action', clicked: 'Clicked', submitted: 'Entered data', reported: 'Reported' };
  const html = `<div class="page">
    ${pageHead({ crumb: { href: '/phishing', label: 'Phishing tests' }, title: esc(c.name), meta: [esc(fmt.channel(c.channel)), `${esc(c.difficulty)} difficulty`, `Sent ${fmt.date(c.sent_at)}`], sub: statusPill(c.status), actions: isAdmin() ? `<button class="btn" data-import>Import results</button>${c.status !== 'closed' ? '<button class="btn" data-close>Close campaign</button>' : ''}` : '' })}
    <div class="tiles">
      ${tile('Targeted', String(c.targeted))}
      ${tile('Clicked', fmt.pct(c.click_rate, 1), `${c.clicked} people`)}
      ${tile('Entered data', fmt.pct(c.submit_rate, 1), `${c.submitted} people`)}
      ${tile('Reported', fmt.pct(c.report_rate, 1), `${c.reported} people`)}
    </div>
    <section class="card"><div class="table-wrap"><table class="data"><thead><tr><th>Employee</th><th>Department</th><th>Outcome</th>${isAdmin() ? '<th>Change</th>' : ''}</tr></thead><tbody>
      ${results.map((r) => `<tr><td><div class="cell-main">${esc(r.name)}</div><div class="cell-sub">${esc(r.email)}</div></td><td>${esc(r.department)}</td><td>${outcomePill(r.outcome)}</td>
        ${isAdmin() ? `<td><select class="input" style="width:auto;padding:4px 8px" data-result="${esc(r.id)}" aria-label="Outcome for ${esc(r.name)}">${opts.map((o) => `<option value="${o}" ${o === r.outcome ? 'selected' : ''}>${label[o]}</option>`).join('')}</select></td>` : ''}</tr>`).join('')}
    </tbody></table></div></section>
  </div>`;
  return {
    title: c.name, html,
    mount(root) {
      root.querySelectorAll('[data-result]').forEach((s) => s.addEventListener('change', async () => {
        try { await patch(`/api/phishing/results/${s.dataset.result}`, { outcome: s.value }); toast('Result saved'); refresh(); } catch (e) { toast(e.message); }
      }));
      root.querySelector('[data-close]')?.addEventListener('click', () => modal({
        title: 'Close campaign', submitLabel: 'Close campaign',
        body: `<p>Anyone still marked "Waiting" will be recorded as <b>No action</b>. You can still change individual results afterwards.</p>`,
        async onSubmit() { await patch(`/api/phishing/campaigns/${c.id}`, { status: 'closed' }); toast('Campaign closed'); refresh(); },
      }));
      root.querySelector('[data-import]')?.addEventListener('click', () => modal({
        title: 'Import results', submitLabel: 'Import',
        body: `<p class="ink2">Paste the export from your phishing platform with two columns: <span class="mono">email,outcome</span>. Outcomes: ignored, clicked, submitted, reported.</p>
          <div class="field"><label for="csv">CSV</label><textarea class="input" id="csv" name="csv" placeholder="email,outcome&#10;${esc(results[0]?.email || 'name@company.com')},reported"></textarea></div>`,
        async onSubmit(data) {
          const res = await post(`/api/phishing/campaigns/${c.id}/import`, { csv: data.csv });
          toast(`${res.updated} results updated${res.errors.length ? `, ${res.errors.length} rows skipped` : ''}`);
          refresh();
        },
      }));
    },
  };
}
