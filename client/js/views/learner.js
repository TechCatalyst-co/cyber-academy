// Learner experience: my training, the course player with quiz, and certificates.
import { get, post } from '../api.js';
import { esc, fmt, statusPill, statePill, md, icons, emptyState, tile, pageHead, stamp, asset } from '../ui.js';
import { scoreRing } from '../charts.js';
import { state } from '../app.js';

export async function home({ go }) {
  const d = await get('/api/me/training');
  const todo = d.assignments.filter((a) => a.status !== 'completed').sort((a, b) => {
    const rank = { overdue: 0, due_soon: 1, open: 2 };
    return (rank[a.state] ?? 3) - (rank[b.state] ?? 3) || (a.due_at < b.due_at ? -1 : 1);
  });
  const done = d.assignments.filter((a) => a.status === 'completed').sort((a, b) => (a.completed_at < b.completed_at ? 1 : -1));
  const s = d.summary;
  const first = state.user.name.split(' ')[0];
  const html = `<div class="page">
    ${pageHead({
      title: todo.length ? `${esc(first)}, you have ${todo.length} ${todo.length === 1 ? 'course' : 'courses'} to finish` : `You're up to date, ${esc(first)}`,
      meta: ['My training record', esc(state.tenant?.name || ''), `${done.length} evidenced`],
      sub: 'A new module arrives each month, with a refresher every six months. Each takes 10 to 15 minutes.',
    })}
    <div class="tiles">
      ${tile('Status', statusPill(s.status), s.overdue ? `${s.overdue} overdue` : s.due_soon ? `${s.due_soon} due this week` : 'nothing overdue')}
      ${tile('Completed', `${s.completed}<small> of ${s.required} due</small>`, fmt.pct(s.completion))}
      ${tile('Average score', s.avg_score === null ? '–' : `${s.avg_score}<small>%</small>`, `pass mark ${d.pass_mark}%`)}
      ${tile('Certificates', String(done.length), done[0] ? `latest ${fmt.date(done[0].completed_at)}` : 'finish a course to earn one')}
    </div>
    <section class="card"><div class="card-head"><h2>To do</h2><p>Most urgent first</p></div>
      ${todo.length ? `<div class="table-wrap"><table class="data"><thead><tr><th>Code</th><th>Course</th><th>Status</th><th>Due</th><th></th></tr></thead><tbody>
        ${todo.map((a, i) => `<tr><td class="regno" style="color:var(--brand-ink)">${esc(a.course.code)}</td>
          <td><div class="cell-main" style="${i === 0 ? 'font-size:1.05rem' : ''}">${esc(a.course.title)}</div><div class="cell-sub">${esc(a.course.summary)} ${a.course.duration_min} min.</div></td>
          <td>${statePill(a.state)}</td><td class="nowrap">${fmt.date(a.due_at)}<div class="cell-sub">${fmt.rel(a.due_at)}</div></td>
          <td class="r"><button class="btn ${i === 0 ? 'btn-primary' : ''} btn-sm" data-go="${esc(a.id)}">${a.status === 'in_progress' ? 'Continue' : 'Start'}</button></td></tr>`).join('')}
      </tbody></table></div>` : emptyState('Nothing is due. Your next module appears here on its release date.')}
    </section>
    <section class="card"><div class="card-head"><h2>Completed</h2><p>Each completion is recorded with its date and score</p></div>
      ${done.length ? `<div class="table-wrap"><table class="data"><thead><tr><th>Code</th><th>Course</th><th>Evidence</th><th class="r">Score</th><th></th></tr></thead><tbody>
        ${done.map((a) => `<tr><td class="regno" style="color:var(--brand-ink)">${esc(a.course.code)}</td><td class="cell-main">${esc(a.course.title)}</td><td>${stamp(`Evidenced ${fmt.short(a.completed_at)}`, a.state === 'completed_late')}</td><td class="r">${a.score}%</td>
          <td class="r"><div class="row" style="justify-content:flex-end;flex-wrap:nowrap;gap:6px"><button class="btn btn-sm" data-go="${esc(a.id)}">Review</button><a class="btn btn-sm" href="#/certificate/${esc(a.id)}">Certificate</a></div></td></tr>`).join('')}
      </tbody></table></div>` : emptyState('Courses you finish are listed here with their certificates.')}
    </section>
  </div>`;
  return { title: 'My training', html, mount(root) { root.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => go(`/learn/${b.dataset.go}`))); } };
}

export async function player({ params, go }) {
  const { assignment: a, course: c, pass_mark: passMark } = await get(`/api/me/assignments/${params.id}`);
  const steps = [...c.lessons.map((l) => ({ kind: l.kind, title: l.title, body: l.body })), { kind: 'quiz', title: 'Knowledge check' }];
  let step = 0;
  const seen = new Set([0]);
  const answers = {};

  const html = `<div class="page">
    ${pageHead({
      crumb: { href: '/learn', label: 'My training' },
      title: esc(c.title),
      meta: [esc(c.code), esc(fmt.cat(c.category)), `${c.duration_min} min`, a.status === 'completed' ? `Evidenced ${fmt.date(a.completed_at)}` : `Due ${fmt.date(a.due_at)}`],
      sub: a.status === 'completed' ? `You completed this with ${a.score}%. Review it any time.` : `Read the lessons, then pass the ${c.quiz.length}-question check with ${passMark}% or more.`,
    })}
    <div class="player"><nav class="steps" aria-label="Course sections" data-steps></nav><div data-stage></div></div>
  </div>`;

  function renderSteps(root) {
    root.querySelector('[data-steps]').innerHTML = steps.map((s, i) => `<button type="button" data-step="${i}" ${i === step ? 'aria-current="step"' : ''} class="${seen.has(i) && i !== step ? 'done' : ''}"><span class="n">${seen.has(i) && i !== step ? icons.check.replace('<svg', '<svg class="ic" style="width:14px;height:14px"') : String(i + 1).padStart(2, '0')}</span><span>${esc(s.title)}</span></button>`).join('');
    root.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => show(root, Number(b.dataset.step))));
  }

  function show(root, i) {
    step = i; seen.add(i);
    renderSteps(root);
    const s = steps[i];
    const stage = root.querySelector('[data-stage]');
    if (s.kind === 'quiz') return renderQuiz(root, stage);
    const tag = { scenario: 'Scenario', action: 'Your action', takeaways: 'Summary' }[s.kind] || `Lesson ${i + 1} of ${steps.length - 1}`;
    stage.innerHTML = `<article class="lesson ${s.kind === 'scenario' ? 'scenario' : s.kind === 'action' ? 'action' : ''}"><div class="stack" style="gap:8px"><h2 tabindex="-1">${esc(s.title)}</h2><p class="meta"><span>${tag}</span></p></div><div class="lesson-body">${md(s.body)}</div>
      <div class="lesson-nav">${i > 0 ? `<button class="btn" data-prev>${icons.left}Back</button>` : '<span></span>'}<button class="btn btn-primary" data-next>${i === steps.length - 2 ? 'Go to knowledge check' : 'Next'}${icons.right}</button></div></article>`;
    stage.querySelector('[data-prev]')?.addEventListener('click', () => show(root, i - 1));
    stage.querySelector('[data-next]').addEventListener('click', () => show(root, i + 1));
    if (i > 0) stage.querySelector('h2').focus({ preventScroll: true });
  }

  function renderQuiz(root, stage, result = null) {
    const byId = result ? Object.fromEntries(result.results.map((r) => [r.id, r])) : {};
    stage.innerHTML = `<form class="lesson" data-quiz novalidate>
      <div class="stack" style="gap:8px"><h2>Knowledge check</h2><p class="meta"><span>${c.quiz.length} questions</span><span>Pass mark ${passMark}%</span></p></div>
      ${result ? `<div class="result" role="status">${scoreRing(result.score, result.passed)}<div class="stack" style="gap:6px"><h3 style="font-size:1.15rem">${result.passed ? 'Passed and recorded' : 'Not passed yet'}</h3>
        <p class="ink2">You answered ${result.correct} of ${result.total} correctly.${result.passed ? ' Explanations are shown under each question.' : ' Questions you got wrong are marked. Revisit the lessons, then retake the check.'}</p>
        <div class="row">${result.passed ? `<a class="btn btn-primary" href="#/certificate/${esc(a.id)}">View certificate</a><button type="button" class="btn" data-home>Back to my training</button>` : '<button type="button" class="btn btn-primary" data-retake>Retake the check</button><button type="button" class="btn" data-review>Review lessons</button>'}</div></div></div>` : ''}
      ${c.quiz.map((q, qi) => {
        const r = byId[q.id];
        return `<fieldset class="q ${r ? (r.correct ? 'is-right' : 'is-wrong') : ''}" style="margin:0"><legend>${qi + 1}. ${esc(q.q)}</legend>
          ${q.options.map((o, oi) => {
            const cls = r && result.passed ? (oi === r.answer ? 'right' : Number(answers[q.id]) === oi ? 'wrong' : '') : '';
            return `<label class="opt ${cls}"><input type="radio" name="${esc(q.id)}" value="${oi}" ${Number(answers[q.id]) === oi && answers[q.id] !== undefined ? 'checked' : ''} ${result ? 'disabled' : ''}><span>${esc(o)}</span></label>`;
          }).join('')}
          ${r && result.passed && r.explain ? `<div class="explain">${esc(r.explain)}</div>` : ''}${r && !result.passed ? `<div class="explain ${r.correct ? 'ok' : 'bad'}">${(r.correct ? icons.check : icons.x).replace('<svg', '<svg class="ic"')}${r.correct ? 'Correct' : 'Incorrect'}</div>` : ''}
        </fieldset>`;
      }).join('')}
      <p class="error" data-err hidden></p>
      ${result ? '' : `<div class="lesson-nav"><button type="button" class="btn" data-prev>${icons.left}Back</button><button class="btn btn-primary" type="submit">Submit answers</button></div>`}
    </form>`;
    const form = stage.querySelector('[data-quiz]');
    form.addEventListener('change', (e) => { if (e.target.type === 'radio') answers[e.target.name] = Number(e.target.value); });
    form.querySelector('[data-prev]')?.addEventListener('click', () => show(root, steps.length - 2));
    form.querySelector('[data-retake]')?.addEventListener('click', () => { for (const k of Object.keys(answers)) delete answers[k]; renderQuiz(root, stage); });
    form.querySelector('[data-review]')?.addEventListener('click', () => show(root, 0));
    form.querySelector('[data-home]')?.addEventListener('click', () => go('/learn'));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = form.querySelector('[data-err]'); err.hidden = true;
      const btn = form.querySelector('[type=submit]'); btn.disabled = true;
      try {
        const res = await post(`/api/me/assignments/${a.id}/submit`, { answers });
        renderQuiz(root, stage, res);
        stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (ex) { err.textContent = ex.message; err.hidden = false; btn.disabled = false; }
    });
  }

  return { title: c.title, html, mount(root) { show(root, 0); } };
}

export async function certificate({ params }) {
  const c = await get(`/api/certificates/${params.id}`);
  const canPrint = !globalThis.__LMS_LOCAL__;
  const html = `<div class="page">
    <div class="crumb no-print"><button type="button" class="btn-link" data-back style="text-decoration:none">${icons.left.replace('<svg', '<svg class="ic" style="vertical-align:-3px"')} Back</button></div>
    <article class="cert">
      <div class="cert-band"><img src="${asset('tc-logo-white.png')}" alt="TechCatalyst"><span>${esc(state.config.brand)}</span></div>
      <div class="cert-inner">
        <div class="ttl">Certificate of completion</div>
        <p style="color:#3D4859;margin-top:10px">This certifies that</p>
        <div class="cert-name">${esc(c.employee)}</div>
        <p style="color:#3D4859">of ${esc(c.company)} successfully completed</p>
        <div class="cert-course">${esc(c.code)} · ${esc(c.course)}</div>
        <div class="cert-meta">
          <div><span class="label">Completed</span>${fmt.date(c.completed_at)}</div>
          <div><span class="label">Score</span>${c.score}%</div>
          <div><span class="label">Course type</span>${esc(fmt.cat(c.category))} · ${c.duration_min} min</div>
        </div>
        <div class="row" style="justify-content:space-between;margin-top:18px">${stamp('Evidenced · ' + c.certificate_no)}<span style="font-family:var(--mono);font-size:.72rem;color:#586579;letter-spacing:.06em">SECURE SOFTWARE. BUILT RIGHT.</span></div>
      </div>
    </article>
    ${canPrint ? '<div class="no-print"><button class="btn btn-primary" data-print>Print or save as PDF</button></div>' : ''}
  </div>`;
  return { title: 'Certificate', html, mount(root) {
    root.querySelector('[data-print]')?.addEventListener('click', () => window.print());
    root.querySelector('[data-back]').addEventListener('click', () => history.back());
  } };
}
