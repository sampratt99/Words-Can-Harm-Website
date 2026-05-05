// ————————————————————————————————————————————————————————————
// Demographic explorer — light theme
// ————————————————————————————————————————————————————————————
(function() {
  const root = document.getElementById('demo-root');
  if (!root) return;

  const data = window.WCHS_DATA;
  const people = data.people;
  const allScores = people.map(p => p.w);
  const wholeMean = allScores.reduce((a, b) => a + b, 0) / allScores.length;

  const state = {
    gender: 'all',
    race: 'all',
    age: 'all',
    ideology: 'all',
    split: null,
  };

  function filter() {
    return people.filter(p => {
      if (state.gender === 'female' && p.g !== 1) return false;
      if (state.gender === 'male' && p.g !== 0) return false;
      if (state.race !== 'all' && p.r !== state.race) return false;
      if (state.age !== 'all') {
        const a = p.age; if (a == null) return false;
        if (state.age === '18-29' && !(a >= 18 && a <= 29)) return false;
        if (state.age === '30-44' && !(a >= 30 && a <= 44)) return false;
        if (state.age === '45-59' && !(a >= 45 && a <= 59)) return false;
        if (state.age === '60+' && a < 60) return false;
      }
      if (state.ideology !== 'all') {
        const pi = p.pi; if (pi == null) return false;
        if (state.ideology === 'lib' && pi < 5) return false;
        if (state.ideology === 'mod' && pi !== 4) return false;
        if (state.ideology === 'cons' && pi > 3) return false;
      }
      return true;
    });
  }

  root.innerHTML = `
    <div class="demo-app">
      <div class="demo-filters" id="filters"></div>
      <div id="demo-main"></div>
    </div>
  `;

  function renderFilters() {
    const el = document.getElementById('filters');
    el.innerHTML = `
      <div class="filter-block">
        <div class="fb-label">Gender</div>
        <div class="fb-chips" data-f="gender">
          ${chip('all', 'All', state.gender)}${chip('female', 'Female', state.gender)}${chip('male', 'Male', state.gender)}
        </div>
      </div>
      <div class="filter-block">
        <div class="fb-label">Race</div>
        <div class="fb-chips" data-f="race">
          ${chip('all', 'All', state.race)}${chip('white', 'White', state.race)}${chip('black', 'Black', state.race)}${chip('asian', 'Asian', state.race)}${chip('hispanic', 'Hispanic', state.race)}
        </div>
      </div>
      <div class="filter-block">
        <div class="fb-label">Age</div>
        <div class="fb-chips" data-f="age">
          ${chip('all', 'All', state.age)}${chip('18-29', '18–29', state.age)}${chip('30-44', '30–44', state.age)}${chip('45-59', '45–59', state.age)}${chip('60+', '60+', state.age)}
        </div>
      </div>
      <div class="filter-block">
        <div class="fb-label">Political ideology</div>
        <div class="fb-chips" data-f="ideology">
          ${chip('all', 'All', state.ideology)}${chip('lib', 'Liberal', state.ideology)}${chip('mod', 'Moderate', state.ideology)}${chip('cons', 'Conservative', state.ideology)}
        </div>
      </div>
      <div class="filter-block">
        <div class="fb-label">Split distribution by</div>
        <div class="fb-chips" data-f="split">
          ${chip('null', 'None', state.split == null ? 'null' : state.split)}${chip('ideology', 'Ideology', state.split)}${chip('gender', 'Gender', state.split)}${chip('race', 'Race', state.split)}
        </div>
      </div>
    `;
    el.querySelectorAll('.fb-chips').forEach(grp => {
      const field = grp.dataset.f;
      grp.addEventListener('click', (e) => {
        const b = e.target.closest('.chip');
        if (!b) return;
        if (field === 'split') state.split = b.dataset.v === 'null' ? null : b.dataset.v;
        else state[field] = b.dataset.v;
        renderFilters(); renderMain();
      });
    });
  }

  function chip(v, label, current) {
    return `<button class="chip${current === v ? ' active' : ''}" data-v="${v}">${label}</button>`;
  }

  function densPath(vals, w, h, pad, maxD, bw) {
    const grid = 160;
    const d = kde(vals, 1, 100, grid, bw);
    const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    let line = '';
    for (let i = 0; i < grid; i++) {
      const x = pad.l + (i / (grid - 1)) * iw;
      const y = pad.t + ih - (d[i] / maxD) * ih;
      line += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
    }
    return { line, area: line + `L${pad.l + iw},${pad.t + ih} L${pad.l},${pad.t + ih} Z` };
  }

  function renderMain() {
    const el = document.getElementById('demo-main');
    const filtered = filter();
    const scores = filtered.map(p => p.w);
    const n = scores.length;
    const mean = n ? scores.reduce((a, b) => a + b, 0) / n : null;
    const sorted = scores.slice().sort((a, b) => a - b);
    const med = n ? sorted[Math.floor(n / 2)] : null;
    const delta = mean != null ? mean - wholeMean : null;

    let layers = [];
    if (state.split === 'ideology') {
      layers = [
        { name: 'Liberal',      color: PAL.liberal,       scores: filtered.filter(p => p.pi != null && p.pi >= 5).map(p => p.w) },
        { name: 'Moderate',     color: PAL.moderate,      scores: filtered.filter(p => p.pi === 4).map(p => p.w) },
        { name: 'Conservative', color: PAL.conservative,  scores: filtered.filter(p => p.pi != null && p.pi <= 3).map(p => p.w) },
      ];
    } else if (state.split === 'gender') {
      layers = [
        { name: 'Female', color: PAL.female, scores: filtered.filter(p => p.g === 1).map(p => p.w) },
        { name: 'Male',   color: PAL.male,   scores: filtered.filter(p => p.g === 0).map(p => p.w) },
      ];
    } else if (state.split === 'race') {
      layers = [
        { name: 'White',    color: PAL.race_white    || PAL.muted,        scores: filtered.filter(p => p.r === 'white').map(p => p.w) },
        { name: 'Black',    color: PAL.race_black    || PAL.accent,       scores: filtered.filter(p => p.r === 'black').map(p => p.w) },
        { name: 'Asian',    color: PAL.race_asian    || PAL.liberal,      scores: filtered.filter(p => p.r === 'asian').map(p => p.w) },
        { name: 'Hispanic', color: PAL.race_hispanic || PAL.conservative, scores: filtered.filter(p => p.r === 'hispanic').map(p => p.w) },
      ];
    } else {
      layers = [{ name: 'Selection', color: PAL.accent, scores }];
    }

    const w = 720, h = 300;
    const pad = { t: 30, r: 24, b: 52, l: 24 };
    const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;

    let maxD = 0;
    const baseD = kde(allScores, 1, 100, 160, 4);
    maxD = Math.max(maxD, ...baseD);
    const layerDens = layers.map(l => l.scores.length > 5 ? kde(l.scores, 1, 100, 160, 4.5) : null);
    layerDens.forEach(d => { if (d) maxD = Math.max(maxD, ...d); });

    const basePath = densPath(allScores, w, h, pad, maxD, 4).line;
    let layerSvg = '';
    layers.forEach((layer) => {
      if (layer.scores.length < 5) return;
      const { line, area } = densPath(layer.scores, w, h, pad, maxD, 4.5);
      layerSvg += `<path d="${area}" fill="${layer.color}" fill-opacity="${state.split ? 0.14 : 0.20}"/>`;
      layerSvg += `<path d="${line}" fill="none" stroke="${layer.color}" stroke-width="${state.split ? 1.6 : 2}"/>`;
    });

    let ticks = '';
    [1, 25, 50, 75, 100].forEach(v => {
      const x = pad.l + ((v - 1) / 99) * iw;
      ticks += `<line x1="${x}" y1="${pad.t + ih}" x2="${x}" y2="${pad.t + ih + 4}" stroke="${PAL.line2}"/>`;
      ticks += `<text x="${x}" y="${pad.t + ih + 20}" text-anchor="middle" font-size="11" fill="${PAL.muted}">${v}</text>`;
    });

    let meansSvg = '';
    if (!state.split && mean != null) {
      const mx = pad.l + ((mean - 1) / 99) * iw;
      meansSvg += `<line x1="${mx}" y1="${pad.t + 12}" x2="${mx}" y2="${pad.t + ih}" stroke="${PAL.accent}" stroke-width="1.5"/>`;
      meansSvg += `<text x="${mx}" y="${pad.t + 4}" text-anchor="middle" font-size="11" fill="${PAL.accent}" font-weight="600">mean ${mean.toFixed(1)}</text>`;
    }

    // HTML legend (above chart) — for split mode
    let legendHTML = '';
    if (state.split) {
      legendHTML = `<div class="cs-legend" style="margin-bottom:10px">
        ${layers.filter(l => l.scores.length >= 5).map(l =>
          `<span><span class="sw" style="background:${l.color}"></span>${l.name} <span style="color:var(--muted);font-variant-numeric:tabular-nums">(n=${l.scores.length})</span></span>`
        ).join('')}
        <span style="color:var(--muted);margin-left:auto;font-size:11.5px">Grey dashed = full sample baseline</span>
      </div>`;
    } else {
      legendHTML = `<div class="cs-legend" style="margin-bottom:10px">
        <span><span class="sw" style="background:${PAL.accent}"></span>Current selection</span>
        <span style="color:var(--muted)"><span class="sw" style="background:${PAL.muted};opacity:0.5"></span>Full sample baseline (N = 956)</span>
      </div>`;
    }

    const nTotal = people.length;

    el.innerHTML = `
      <div class="demo-stats">
        <div class="demo-stat">
          <div class="ds-label">Respondents</div>
          <div class="ds-value">${n.toLocaleString()}</div>
          <div class="ds-sub">of ${nTotal.toLocaleString()}</div>
        </div>
        <div class="demo-stat">
          <div class="ds-label">Mean score</div>
          <div class="ds-value accent">${mean != null ? mean.toFixed(1) : '—'}</div>
          <div class="ds-sub ${delta > 0 ? 'pos' : delta < 0 ? 'neg' : ''}">${delta != null ? (delta >= 0 ? '+' : '') + delta.toFixed(1) + ' vs. full sample' : ''}</div>
        </div>
        <div class="demo-stat">
          <div class="ds-label">Median</div>
          <div class="ds-value">${med != null ? med.toFixed(0) : '—'}</div>
          <div class="ds-sub">50th percentile</div>
        </div>
        <div class="demo-stat">
          <div class="ds-label">Full sample mean</div>
          <div class="ds-value">${wholeMean.toFixed(1)}</div>
          <div class="ds-sub">reference</div>
        </div>
      </div>
      <div class="chart-card">
        <div class="chart-header">
          <div>
            <div class="chart-title">Score distribution for the selected group</div>
            <div class="chart-subtitle">${subtitleText(state)}</div>
          </div>
          <div class="chart-n">n = ${n.toLocaleString()}</div>
        </div>
        <div class="chart-body">
          ${legendHTML}
          <div class="demo-chart-wrap">
            <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;display:block">
              <path d="${basePath}" fill="none" stroke="${PAL.muted}" stroke-width="1" stroke-dasharray="3 4" opacity="0.55"/>
              ${layerSvg}
              <line x1="${pad.l}" y1="${pad.t + ih}" x2="${pad.l + iw}" y2="${pad.t + ih}" stroke="${PAL.line3}"/>
              ${ticks}
              ${meansSvg}
              <text x="${pad.l + iw / 2}" y="${h - 6}" text-anchor="middle" font-size="11" fill="${PAL.muted}">WCHS score  (1 = strongly disagree  →  100 = strongly agree)</text>
            </svg>
          </div>
        </div>
        <div class="chart-source">
          <strong>Source</strong> · Pratt et al. (2026) dataset, N = 956. Densities estimated with a Gaussian kernel (bandwidth 4.5).
        </div>
      </div>
    `;
  }

  function subtitleText(s) {
    const parts = [];
    if (s.gender !== 'all') parts.push(s.gender);
    if (s.race !== 'all') parts.push({white:'White',black:'Black',asian:'Asian',hispanic:'Hispanic'}[s.race]);
    if (s.age !== 'all') parts.push('age ' + s.age);
    if (s.ideology !== 'all') parts.push({lib:'liberal',mod:'moderate',cons:'conservative'}[s.ideology]);
    let base = parts.length ? `Filtered to: ${parts.join(', ')}.` : 'Full sample shown.';
    if (s.split) base += ` Split by ${s.split}.`;
    return base;
  }

  renderFilters();
  renderMain();
})();
