// Training catalog and course preview for administrators.
import { get, post } from '../api.js';
import { esc, fmt, pill, md, modal, toast, pageHead, icons } from '../ui.js';
import { isAdmin, state } from '../app.js';

const GROUPS = [
  ['onboarding', 'New starters', 'Assigned automatically to anyone hired after the program starts, due within their first week.'],
  ['core', 'Monthly core modules', 'One module released each month to every employee.'],
  ['refresher', 'Six-month refreshers', 'Every employee completes a recap and 15-question knowledge check in months 6 and 12.'],
  ['role', 'Role-based tracks', 'Extra training for higher-risk roles, released in months 3 and 9. Professional and Premium plans.'],
];

function when(c) {
  if (c.schedule?.onboarding) return 'First week';
  const m = c.schedule?.months || [];
  return m.length ? `Month ${m.join(' & ')}` : 'On demand';
}

export async function catalog() {
  const courses = await get('/api/courses');
  const html = `<div class="page">
    ${pageHead({ title: 'Training catalog', meta: ['Curriculum register', `${courses.length} courses`, '12-month cycle'], sub: 'Releases and due dates are assigned automatically from each company\'s program start date.' })}
    ${GROUPS.map(([cat, title, note]) => {
      const list = courses.filter((c) => c.category === cat);
      if (!list.length) return '';
      return `<section class="card"><div class="card-head"><h2>${esc(title)}</h2><p>${esc(note)}</p></div>
        <div class="table-wrap"><table class="data"><thead><tr><th>Code</th><th>Course</th><th>Released</th><th class="r">Minutes</th><th class="r">Questions</th><th></th></tr></thead><tbody>
        ${list.map((c) => `<tr class="link" data-course="${esc(c.id)}" tabindex="0">
          <td class="regno" style="color:var(--brand-ink)">${esc(c.code)}</td>
          <td><div class="cell-main">${esc(c.title)}</div><div class="cell-sub">${esc(c.summary)}</div>${c.track ? `<div style="margin-top:4px">${pill('accent', state.config.tracks?.[c.track] || c.track, '')}</div>` : ''}</td>
          <td class="nowrap">${esc(when(c))}</td><td class="r">${c.duration_min}</td><td class="r">${c.question_count}</td>
          <td class="r nowrap">${c.available ? `<a class="btn btn-sm" href="#/courses/${esc(c.id)}">Preview</a>` : pill('neutral', 'Not on this plan', '')}</td></tr>`).join('')}
        </tbody></table></div></section>`;
    }).join('')}
  </div>`;
  return { title: 'Training catalog', html, mount(root) {
    root.querySelectorAll('[data-course]').forEach((tr) => {
      const open = () => { location.hash = `/courses/${tr.dataset.course}`; };
      tr.addEventListener('click', (e) => { if (!e.target.closest('a')) open(); });
      tr.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(); });
    });
  } };
}

export async function detail({ params }) {
  const c = await get(`/api/courses/${params.id}`);
  const html = `<div class="page">
    ${pageHead({ crumb: { href: '/courses', label: 'Training catalog' }, title: esc(c.title), meta: [esc(c.code), esc(fmt.cat(c.category)), `${c.duration_min} min`, `${c.quiz.length} questions`], sub: esc(c.summary), actions: isAdmin() ? '<button class="btn btn-primary" data-assign>Assign to people</button>' : '' })}
    <div class="grid">
      <div class="span-7 stack">
        ${c.lessons.map((l, i) => `<article class="lesson ${l.kind === 'scenario' ? 'scenario' : l.kind === 'action' ? 'action' : ''}"><h2>${esc(l.title)}</h2><p class="meta"><span>${l.kind === 'scenario' ? 'Scenario' : l.kind === 'action' ? 'Action' : l.kind === 'takeaways' ? 'Summary' : `Lesson ${i + 1}`}</span></p><div class="lesson-body">${md(l.body)}</div></article>`).join('')}
      </div>
      <section class="card span-5 stack" style="align-self:start"><div class="card-head" style="margin:0"><h2>Knowledge check</h2><p>${c.quiz.length} questions · answer key visible to administrators only</p></div>
        ${c.quiz.map((q, i) => `<div class="q"><div class="q-title">${i + 1}. ${esc(q.q)}</div>
          ${q.options.map((o, j) => `<div class="opt ${j === q.answer ? 'right' : ''}" style="cursor:default">${j === q.answer ? icons.check.replace('<svg', '<svg class="ic" style="color:var(--good-ink)"') : '<span style="width:16px;flex:none"></span>'}<span>${esc(o)}</span></div>`).join('')}
          <div class="explain">${esc(q.explain)}</div></div>`).join('')}
      </section>
    </div>
  </div>`;
  return {
    title: c.title, html,
    mount(root) {
      root.querySelector('[data-assign]')?.addEventListener('click', async () => {
        const people = await get('/api/employees');
        const due = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
        modal({
          title: `Assign ${c.code}`, submitLabel: 'Assign', wide: true,
          body: `<p class="ink2">Assign this course outside the normal schedule, for example as coaching after a failed phishing test.</p>
            <div class="field"><label for="a-d">Due date</label><input class="input" id="a-d" name="due_at" type="date" value="${due}" style="max-width:220px"></div>
            <div class="field"><span class="label">People (${people.length})</span>
              <div class="row"><button type="button" class="btn btn-sm" data-all>Select all</button><button type="button" class="btn btn-sm" data-risk>Select high and medium risk</button></div>
              <div class="checks" style="max-height:280px;overflow:auto">${people.map((p) => `<label class="check"><input type="checkbox" name="user_ids" value="${esc(p.id)}" data-band="${p.risk_band}">${esc(p.name)} <span class="muted">· ${esc(p.department)}</span></label>`).join('')}</div></div>`,
          async onSubmit(data) {
            if (!data.user_ids?.length) throw new Error('Choose at least one person.');
            const res = await post('/api/assignments', { course_id: c.id, due_at: data.due_at, user_ids: data.user_ids });
            toast(`Assigned to ${res.created} ${res.created === 1 ? 'person' : 'people'}`);
          },
        }).el.addEventListener('click', (e) => {
          const f = e.target.closest('form');
          if (e.target.matches('[data-all]')) f.querySelectorAll('[name=user_ids]').forEach((x) => { x.checked = true; });
          if (e.target.matches('[data-risk]')) f.querySelectorAll('[name=user_ids]').forEach((x) => { x.checked = x.dataset.band !== 'low'; });
        });
      });
    },
  };
}
