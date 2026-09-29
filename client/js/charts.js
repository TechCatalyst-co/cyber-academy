// Hand-rolled SVG charts: thin marks, recessive grid, hover tooltips, theme tokens.
import { esc } from './ui.js';

function niceMax(v, pct) {
  if (pct) return v > 60 ? 100 : v > 40 ? 60 : v > 20 ? 40 : 20;
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

function mount(el, render) {
  el.classList.add('chart');
  let last = 0;
  const draw = () => {
    const w = Math.round(el.clientWidth || 600);
    if (w === last) return;
    last = w;
    render(w);
  };
  draw();
  if ('ResizeObserver' in window) new ResizeObserver(draw).observe(el);
}

function tipEl(el) {
  let t = el.querySelector('.tip');
  if (!t) { t = document.createElement('div'); t.className = 'tip'; t.hidden = true; el.appendChild(t); }
  return t;
}

// Line chart: labels on x, one or more series of values (null = gap).
export function lineChart(el, { labels, series, pct = true, height = 220, yFmt = (v) => `${Math.round(v)}%`, xFmt = (l) => l, target = null, tipTitle = (i) => labels[i] }) {
  mount(el, (W) => {
    const m = { l: 40, r: 44, t: 14, b: 26 };
    const H = height;
    const all = series.flatMap((s) => s.values).filter((v) => v !== null && v !== undefined);
    const max = niceMax(Math.max(...all, target?.value || 0, 1), pct);
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const x = (i) => m.l + (labels.length === 1 ? iw / 2 : (i * iw) / (labels.length - 1));
    const y = (v) => m.t + ih - (v / max) * ih;
    const ticks = [0, max / 4, max / 2, (3 * max) / 4, max];
    const every = Math.ceil(labels.length / Math.max(2, Math.floor(iw / 64)));
    let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(series.map((s) => s.name).join(' and '))} chart">`;
    for (const t of ticks) svg += `<line class="gridline" x1="${m.l}" x2="${W - m.r}" y1="${y(t)}" y2="${y(t)}"/><text x="${m.l - 8}" y="${y(t) + 4}" text-anchor="end">${esc(yFmt(t))}</text>`;
    labels.forEach((l, i) => { if (i % every === 0 || i === labels.length - 1) svg += `<text x="${x(i)}" y="${H - 6}" text-anchor="middle">${esc(xFmt(l))}</text>`; });
    if (target) svg += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(target.value)}" y2="${y(target.value)}" stroke="var(--ink-2)" stroke-width="1" stroke-dasharray="0"/><text x="${W - m.r + 4}" y="${y(target.value) + 4}" class="lbl">${esc(target.label)}</text>`;
    for (const s of series) {
      let d = '', pen = false;
      s.values.forEach((v, i) => { if (v === null || v === undefined) { pen = false; return; } d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`; pen = true; });
      if (s.area) {
        const idx = s.values.map((v, i) => (v === null ? null : i)).filter((i) => i !== null);
        if (idx.length > 1) svg += `<path d="${d}L${x(idx.at(-1))},${y(0)}L${x(idx[0])},${y(0)}Z" fill="${s.color}" opacity=".1"/>`;
      }
      svg += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
      const li = s.values.map((v, i) => (v === null || v === undefined ? -1 : i)).filter((i) => i >= 0).at(-1);
      if (li !== undefined) svg += `<circle cx="${x(li)}" cy="${y(s.values[li])}" r="4" fill="${s.color}" stroke="var(--paper)" stroke-width="2"/><text x="${x(li) + 8}" y="${y(s.values[li]) + 4}" class="lbl">${esc(yFmt(s.values[li]))}</text>`;
    }
    svg += `<line data-cross class="axis" x1="0" x2="0" y1="${m.t}" y2="${m.t + ih}" visibility="hidden"/>`;
    svg += `<g data-dots></g><rect data-hit x="${m.l - 10}" y="0" width="${iw + 20}" height="${H}" fill="transparent"/></svg>`;
    el.innerHTML = svg;
    const tip = tipEl(el);
    const hit = el.querySelector('[data-hit]'), cross = el.querySelector('[data-cross]'), dots = el.querySelector('[data-dots]');
    const move = (ev) => {
      const r = el.querySelector('svg').getBoundingClientRect();
      const px = ((ev.clientX - r.left) / r.width) * W;
      const i = Math.max(0, Math.min(labels.length - 1, Math.round(((px - m.l) / iw) * (labels.length - 1))));
      cross.setAttribute('x1', x(i)); cross.setAttribute('x2', x(i)); cross.setAttribute('visibility', 'visible');
      dots.innerHTML = series.map((s) => (s.values[i] === null || s.values[i] === undefined ? '' : `<circle cx="${x(i)}" cy="${y(s.values[i])}" r="4.5" fill="${s.color}" stroke="var(--paper)" stroke-width="2"/>`)).join('');
      tip.innerHTML = `<b>${esc(tipTitle(i))}</b>` + series.map((s) => `<div><span class="k" style="background:${s.color}"></span>${esc(s.name)}: <b>${s.values[i] === null || s.values[i] === undefined ? '–' : esc(yFmt(s.values[i]))}</b></div>`).join('');
      tip.hidden = false;
      tip.style.left = `${(x(i) / W) * r.width}px`;
      tip.style.top = `${(y(Math.max(...series.map((s) => s.values[i] ?? 0))) / H) * r.height}px`;
    };
    hit.addEventListener('pointermove', move);
    hit.addEventListener('pointerleave', () => { tip.hidden = true; cross.setAttribute('visibility', 'hidden'); dots.innerHTML = ''; });
  });
}

// Column chart: one series; last column labelled, tooltip on every column.
export function columnChart(el, { labels, values, color = 'var(--s1)', pct = true, height = 200, yFmt = (v) => `${Math.round(v)}%`, xFmt = (l) => l, tip = (i) => `${labels[i]}: ${yFmt(values[i])}`, target = null }) {
  mount(el, (W) => {
    const m = { l: 40, r: 12, t: 18, b: 26 };
    const H = height, iw = W - m.l - m.r, ih = H - m.t - m.b;
    const max = niceMax(Math.max(...values.map((v) => v ?? 0), target?.value || 0, 1), pct);
    const band = iw / Math.max(1, labels.length);
    const bw = Math.min(24, band * 0.6);
    const y = (v) => m.t + ih - (v / max) * ih;
    const ticks = [0, max / 2, max];
    let svg = `<svg viewBox="0 0 ${W} ${H}" role="img">`;
    for (const t of ticks) svg += `<line class="gridline" x1="${m.l}" x2="${W - m.r}" y1="${y(t)}" y2="${y(t)}"/><text x="${m.l - 8}" y="${y(t) + 4}" text-anchor="end">${esc(yFmt(t))}</text>`;
    if (target) svg += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(target.value)}" y2="${y(target.value)}" stroke="var(--ink-2)" stroke-width="1"/>`;
    const every = Math.ceil(labels.length / Math.max(2, Math.floor(iw / 44)));
    values.forEach((v, i) => {
      const cx = m.l + band * i + band / 2;
      if (v !== null && v !== undefined) {
        const top = y(v), x0 = cx - bw / 2, rr = Math.min(4, (y(0) - top) / 2);
        svg += `<path d="M${x0},${y(0)}V${top + rr}Q${x0},${top} ${x0 + rr},${top}H${x0 + bw - rr}Q${x0 + bw},${top} ${x0 + bw},${top + rr}V${y(0)}Z" fill="${color}"/>`;
        if (i === values.length - 1) svg += `<text x="${cx}" y="${top - 6}" text-anchor="middle" class="lbl">${esc(yFmt(v))}</text>`;
      }
      if (i % every === 0 || i === labels.length - 1) svg += `<text x="${cx}" y="${H - 6}" text-anchor="middle">${esc(xFmt(labels[i]))}</text>`;
      svg += `<rect data-i="${i}" x="${m.l + band * i}" y="${m.t}" width="${band}" height="${ih}" fill="transparent"/>`;
    });
    svg += `<line class="axis" x1="${m.l}" x2="${W - m.r}" y1="${y(0)}" y2="${y(0)}"/></svg>`;
    el.innerHTML = svg;
    const t = tipEl(el);
    el.querySelectorAll('[data-i]').forEach((rect) => {
      rect.addEventListener('pointerenter', () => {
        const i = Number(rect.dataset.i);
        const r = el.querySelector('svg').getBoundingClientRect();
        t.innerHTML = tip(i); t.hidden = false;
        t.style.left = `${((m.l + band * i + band / 2) / W) * r.width}px`;
        t.style.top = `${(y(values[i] ?? 0) / H) * r.height}px`;
      });
      rect.addEventListener('pointerleave', () => { t.hidden = true; });
    });
  });
}

// Horizontal bars in HTML (reads well at any width). items: [{ name, value, color?, note? }]
export function hbars(items, { max = 100, fmtV = (v) => (v === null ? '–' : `${Math.round(v)}%`), target = null, color = 'var(--s1)' } = {}) {
  return `<div class="hbars">${items.map((it) => `
    <div class="hbar" title="${esc(it.note || '')}">
      <span class="name">${esc(it.name)}</span>
      <span class="track">${it.value === null ? '' : `<span class="fill" style="display:block;width:${Math.max(1, (it.value / max) * 100)}%;background:${it.color || color}"></span>`}${target !== null ? `<span class="target" style="left:${(target / max) * 100}%" aria-hidden="true"></span>` : ''}</span>
      <span class="val">${fmtV(it.value)}</span>
    </div>`).join('')}</div>`;
}

// Parts of a whole as one segmented bar with a 2px surface gap.
export function statusBar(parts) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  return `<div class="statusbar" role="img" aria-label="${esc(parts.map((p) => `${p.label} ${p.value}`).join(', '))}">${parts.filter((p) => p.value > 0).map((p) => `<span style="width:${(p.value / total) * 100}%;background:${p.color}" title="${esc(`${p.label}: ${p.value}`)}"></span>`).join('')}</div>
  <div class="legend" style="margin-top:10px">${parts.map((p) => `<span><i class="sq" style="background:${p.color}"></i>${esc(p.label)} <b class="num">${p.value}</b></span>`).join('')}</div>`;
}

export function scoreRing(score, passed) {
  const r = 36, c = 2 * Math.PI * r, v = Math.max(0, Math.min(100, score));
  const col = passed ? 'var(--good)' : 'var(--crit)';
  return `<svg class="score-ring" viewBox="0 0 88 88" role="img" aria-label="Score ${v}%"><circle cx="44" cy="44" r="${r}" fill="none" stroke="var(--tint)" stroke-width="8"/><circle cx="44" cy="44" r="${r}" fill="none" stroke="${col}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${(v / 100) * c} ${c}" transform="rotate(-90 44 44)"/><text x="44" y="50" text-anchor="middle" style="font:700 19px var(--font);fill:var(--ink)">${v}%</text></svg>`;
}

