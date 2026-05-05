// ————————————————————————————————————————————————————————————
// Correlate explorer — light theme
// ————————————————————————————————————————————————————————————
(function() {
  const root = document.getElementById('corr-root');
  if (!root) return;
  const data = window.WCHS_DATA;
  const people = data.people;
  const correlates = window.WCHS_CORRELATES;
  const GROUP_LABELS = window.GROUP_LABELS;
  const META = window.CORR_META;

  const state = { selected: 'LWA_TDC', overlay: false };

  // Cohen-style effect-size interpretation for |r|.
  // Cutoffs: 0–0.1 trivial · 0.1–0.3 small · 0.3–0.5 medium · >0.5 large.
  // We bucket using the *displayed* value (|r| rounded to 2 dp) so the label
  // always agrees with the number on screen — e.g. r = -0.099 displays as
  // -0.10 and is therefore labelled Small, matching Race (-0.104).
  function effectSizeLabel(r) {
    if (r == null || isNaN(r)) return '';
    const a = Math.round(Math.abs(r) * 100) / 100;
    let mag;
    if (a < 0.1)       mag = 'Trivial';
    else if (a < 0.3)  mag = 'Small';
    else if (a < 0.5)  mag = 'Medium';
    else               mag = 'Large';
    if (mag === 'Trivial') return 'Trivial correlation';
    const dir = r >= 0 ? 'positive' : 'negative';
    return `${mag} ${dir} correlation`;
  }

  root.innerHTML = `
    <div class="corr-app">
      <div class="corr-list-wrap" id="c-list"></div>
      <div class="corr-stage-card" id="c-stage"></div>
    </div>
  `;

  function renderList() {
    const el = document.getElementById('c-list');
    const groups = [['social'], ['clinical'], ['personality'], ['demo']];
    let html = '';
    groups.forEach(([g]) => {
      html += `<div class="corr-group">${GROUP_LABELS[g]}</div>`;
      correlates.filter(c => c.group === g).sort((a, b) => Math.abs(b.r) - Math.abs(a.r)).forEach(c => {
        const half = Math.abs(c.r) * 50;
        const left = c.r >= 0 ? 50 : 50 - half;
        const color = c.r >= 0 ? PAL.accent : PAL.accent2;
        html += `
          <div class="corr-row${state.selected === c.key ? ' active' : ''}" data-k="${c.key}">
            <div class="lbl">${c.label}</div>
            <div class="bar">
              <div class="mid"></div>
              <div class="fill" style="left:${left}%;width:${Math.max(half, 0.8)}%;background:${color}"></div>
            </div>
            <div class="r">${fmtR(c.r)}</div>
          </div>
        `;
      });
    });
    el.innerHTML = html;
    el.querySelectorAll('.corr-row').forEach(r => {
      r.addEventListener('click', () => { state.selected = r.dataset.k; renderList(); renderStage(); });
    });
  }

  function renderStage() {
    const el = document.getElementById('c-stage');
    const cdef = correlates.find(c => c.key === state.selected);
    const meta = META[cdef.key];
    const xs = [], ys = [], ideology = [];
    people.forEach(p => {
      const x = p.c[cdef.key], y = p.w;
      if (x == null || y == null) return;
      xs.push(x); ys.push(y); ideology.push(p.pi);
    });
    const { r, n } = pearson(xs, ys);
    const reg = linreg(xs, ys);

    const w = 720, h = 400;
    const pad = { t: 20, r: 20, b: 54, l: 60 };
    const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    const xMin = meta.min, xMax = meta.max;
    const X = v => pad.l + ((v - xMin) / (xMax - xMin)) * iw;
    const Y = v => pad.t + ih - ((v - 1) / 99) * ih;

    const isCategorical = (xMax - xMin) <= 7;
    const jitter = isCategorical ? (xMax - xMin) * 0.035 : 0;

    let svg = `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;display:block">`;
    // horizontal gridlines
    [25, 50, 75, 100].forEach(v => {
      svg += `<line x1="${pad.l}" y1="${Y(v)}" x2="${pad.l + iw}" y2="${Y(v)}" stroke="${PAL.line}" stroke-width="1"/>`;
      svg += `<text x="${pad.l - 10}" y="${Y(v) + 3.5}" text-anchor="end" font-size="11" fill="${PAL.muted}">${v}</text>`;
    });
    // y=1 line
    svg += `<line x1="${pad.l}" y1="${Y(1)}" x2="${pad.l + iw}" y2="${Y(1)}" stroke="${PAL.line2}" stroke-width="1"/>`;
    svg += `<text x="${pad.l - 10}" y="${Y(1) + 3.5}" text-anchor="end" font-size="11" fill="${PAL.muted}">1</text>`;
    // x axis
    svg += `<line x1="${pad.l}" y1="${pad.t + ih}" x2="${pad.l + iw}" y2="${pad.t + ih}" stroke="${PAL.line3}"/>`;

    // x ticks
    let nT = 5;
    if (isCategorical) nT = Math.min(7, (xMax - xMin) + 1);
    for (let i = 0; i < nT; i++) {
      const v = xMin + (i / (nT - 1)) * (xMax - xMin);
      const x = X(v);
      svg += `<line x1="${x}" y1="${pad.t + ih}" x2="${x}" y2="${pad.t + ih + 4}" stroke="${PAL.line3}"/>`;
      const fmt = (xMax - xMin) <= 1 ? v.toFixed(1) : (Math.abs(v) >= 10 ? Math.round(v) : Math.round(v * 10) / 10);
      svg += `<text x="${x}" y="${pad.t + ih + 20}" text-anchor="middle" font-size="11" fill="${PAL.muted}">${fmt}</text>`;
    }

    // points
    for (let i = 0; i < xs.length; i++) {
      let xv = xs[i];
      if (jitter) { const hv = Math.sin(i * 12.9898) * 43758.5453; xv += ((hv - Math.floor(hv)) * 2 - 1) * jitter; }
      const cx = X(xv), cy = Y(ys[i]);
      let fill = PAL.accent, op = 0.24;
      if (state.overlay) {
        const pi = ideology[i];
        if (pi == null) { fill = PAL.muted; op = 0.1; }
        else if (pi >= 5) { fill = PAL.liberal; op = 0.32; }
        else if (pi <= 3) { fill = PAL.conservative; op = 0.32; }
        else { fill = PAL.moderate; op = 0.24; }
      }
      svg += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="2.2" fill="${fill}" fill-opacity="${op}"/>`;
    }

    // overall regression
    if (reg && !state.overlay) {
      const y1 = reg.slope * xMin + reg.intercept, y2 = reg.slope * xMax + reg.intercept;
      const cy1 = Math.max(pad.t, Math.min(pad.t + ih, Y(y1)));
      const cy2 = Math.max(pad.t, Math.min(pad.t + ih, Y(y2)));
      svg += `<line x1="${X(xMin)}" y1="${cy1}" x2="${X(xMax)}" y2="${cy2}" stroke="${PAL.ink}" stroke-width="2" stroke-linecap="round"/>`;
    }

    // overlay regression
    if (state.overlay) {
      [
        { color: PAL.liberal,      name: 'liberal',      filter: i => ideology[i] != null && ideology[i] >= 5 },
        { color: PAL.conservative, name: 'conservative', filter: i => ideology[i] != null && ideology[i] <= 3 },
      ].forEach(g => {
        const gx = [], gy = [];
        for (let i = 0; i < xs.length; i++) if (g.filter(i)) { gx.push(xs[i]); gy.push(ys[i]); }
        const gr = linreg(gx, gy);
        if (!gr) return;
        const y1 = gr.slope * xMin + gr.intercept, y2 = gr.slope * xMax + gr.intercept;
        const cy1 = Math.max(pad.t, Math.min(pad.t + ih, Y(y1)));
        const cy2 = Math.max(pad.t, Math.min(pad.t + ih, Y(y2)));
        svg += `<line x1="${X(xMin)}" y1="${cy1}" x2="${X(xMax)}" y2="${cy2}" stroke="${g.color}" stroke-width="2" stroke-linecap="round"/>`;
      });
    }

    // axis labels
    svg += `<text x="${pad.l + iw / 2}" y="${h - 6}" text-anchor="middle" font-size="12" fill="${PAL.inkDim}" font-weight="500">${esc(meta.xlabel)}</text>`;
    svg += `<text x="16" y="${pad.t + ih / 2}" transform="rotate(-90, 16, ${pad.t + ih / 2})" text-anchor="middle" font-size="12" fill="${PAL.inkDim}" font-weight="500">WCHS score →</text>`;
    svg += `</svg>`;

    const rClass = r >= 0 ? 'pos' : 'neg';

    // Legend
    let legendHTML = '';
    if (state.overlay) {
      legendHTML = `
        <div class="cs-legend" style="margin-top:4px">
          <span><span class="sw" style="background:${PAL.liberal}"></span>Liberals (ideology 5–7)</span>
          <span><span class="sw" style="background:${PAL.conservative}"></span>Conservatives (ideology 1–3)</span>
          <span><span class="sw" style="background:${PAL.moderate}"></span>Moderates (4)</span>
        </div>`;
    } else {
      legendHTML = `
        <div class="cs-legend" style="margin-top:4px">
          <span><span class="sw" style="background:${PAL.accent};opacity:0.5"></span>Individual respondents</span>
          <span><span class="sw" style="background:${PAL.ink}"></span>Regression line (least squares)</span>
        </div>`;
    }

    el.innerHTML = `
      <div class="cs-head">
        <div class="csl">
          <div class="ttl">${cdef.label}</div>
          <div class="sub">${cdef.desc}</div>
        </div>
        <div class="csr">
          <div class="big-r ${rClass}">${fmtR(r)}</div>
          <div class="r-lbl">Pearson r · n = ${n.toLocaleString()}</div>
          <div class="r-effect">${effectSizeLabel(r)}</div>
        </div>
      </div>
      <div class="cs-toggle">
        <button class="chip${state.overlay ? ' active' : ''}" id="ovr">Split by political ideology</button>
      </div>
      ${legendHTML}
      <div class="cs-plot" style="margin-top:10px">${svg}</div>
      <div class="chart-source" style="border-top:1px solid var(--line); margin-top:14px; padding-top:12px">
        <strong>Note</strong> · Each dot is one of the ${n.toLocaleString()} respondents from the nationally representative sample. The Y axis is the belief that words can harm (WCHS is scored 1&ndash;100, where higher scores indicate a stronger belief that words can harm).
      </div>
    `;
    document.getElementById('ovr').addEventListener('click', () => {
      state.overlay = !state.overlay; renderStage();
    });
  }

  renderList();
  renderStage();
})();
