// ————————————————————————————————————————————————————————————
// Item explorer — sample distribution per item, with optional
// user-answer markers once the scale has been completed.
// ————————————————————————————————————————————————————————————
(function() {
  const root = document.getElementById('items-root');
  if (!root) return;
  const items = window.WCHS_ITEMS.map((it, i) => ({ ...it, idx: i }));
  const data = window.WCHS_DATA;
  let userAnswers = null; // null | number[10]

  // Display in scale order (1–10), not sorted by agreement.
  const sorted = items.slice();

  // Pre-compute densities once (expensive enough to cache).
  const densities = items.map((_, idx) => {
    const vals = data.people.map(p => p.i[idx]).filter(v => v != null);
    const grid = 80;
    const dens = kde(vals, 1, 100, grid, 6);
    const maxD = Math.max(...dens) || 1;
    return { dens, maxD, grid };
  });

  function buildPath(idx, W, H) {
    const { dens, maxD, grid } = densities[idx];
    let path = '';
    for (let i = 0; i < grid; i++) {
      const x = (i / (grid - 1)) * W;
      const y = H - (dens[i] / maxD) * H;
      path += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
    }
    const area = path + ` L${W},${H} L0,${H} Z`;
    return { path, area };
  }

  function render() {
    const W = 480, H = 90;
    const hasUser = !!userAnswers;
    const rows = sorted.map((item) => {
      const { path, area } = buildPath(item.idx, W, H);
      const meanX = ((item.m - 1) / 99) * W;
      const sdLo = Math.max(1, item.m - item.sd);
      const sdHi = Math.min(100, item.m + item.sd);
      const sdLoX = ((sdLo - 1) / 99) * W;
      const sdHiX = ((sdHi - 1) / 99) * W;
      const sdY = H + 8;
      const userVal = hasUser ? userAnswers[item.idx] : null;
      const userX = hasUser ? ((userVal - 1) / 99) * W : null;

      const userMarker = hasUser ? `
        <line x1="${userX}" y1="-12" x2="${userX}" y2="${H + 2}" stroke="${PAL.accent}" stroke-width="1.75"/>
        <text x="${userX}" y="-15" text-anchor="middle" font-size="11" font-weight="600" fill="${PAL.accent}" font-family="ui-sans-serif,system-ui,sans-serif" letter-spacing="0.02em">You</text>
      ` : '';

      const userCell = hasUser
        ? `<div class="you" title="Your answer">${userVal}</div>`
        : '';

      // tiny axis ticks at 1 / 50 / 100
      const tickY = sdY + 6;
      const tx1 = 0, tx50 = ((50 - 1) / 99) * W, tx100 = W;
      const axis = `
        <line x1="${tx1}" y1="${tickY - 3}" x2="${tx1}" y2="${tickY}" stroke="${PAL.line2}"/>
        <line x1="${tx50}" y1="${tickY - 3}" x2="${tx50}" y2="${tickY}" stroke="${PAL.line2}"/>
        <line x1="${tx100}" y1="${tickY - 3}" x2="${tx100}" y2="${tickY}" stroke="${PAL.line2}"/>
        <text x="${tx1}" y="${tickY + 14}" text-anchor="start" font-size="13" fill="${PAL.muted}" font-family="ui-sans-serif,system-ui,sans-serif">1 = strongly disagree</text>
        <text x="${tx50}" y="${tickY + 14}" text-anchor="middle" font-size="13" fill="${PAL.muted}" font-family="ui-sans-serif,system-ui,sans-serif">50</text>
        <text x="${tx100}" y="${tickY + 14}" text-anchor="end" font-size="13" fill="${PAL.muted}" font-family="ui-sans-serif,system-ui,sans-serif">100 = strongly agree</text>
      `;

      return `
        <div class="item-bar-row${hasUser ? ' has-user' : ''}">
          <div class="n">${String(item.idx + 1).padStart(2, '0')}</div>
          <div class="t">${item.t}</div>
          <div class="bar-cell">
            <svg viewBox="0 ${-18} ${W} ${H + 60}" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;display:block;overflow:visible">
              <line x1="0" y1="${H}" x2="${W}" y2="${H}" stroke="${PAL.line2}" stroke-width="1"/>
              <path d="${area}" fill="${PAL.accentSoft}"/>
              <path d="${path}" fill="none" stroke="${PAL.accent}" stroke-width="1.5"/>
              <line x1="${sdLoX}" y1="${sdY}" x2="${sdHiX}" y2="${sdY}" stroke="${PAL.muted}" stroke-width="1.75"/>
              <line x1="${sdLoX}" y1="${sdY - 4}" x2="${sdLoX}" y2="${sdY + 4}" stroke="${PAL.muted}" stroke-width="1.75"/>
              <line x1="${sdHiX}" y1="${sdY - 4}" x2="${sdHiX}" y2="${sdY + 4}" stroke="${PAL.muted}" stroke-width="1.75"/>
              <line x1="${meanX}" y1="-2" x2="${meanX}" y2="${H + 2}" stroke="${PAL.ink}" stroke-width="1.5"/>
              <circle cx="${meanX}" cy="${sdY}" r="3.5" fill="${PAL.ink}"/>
              ${axis}
              ${userMarker}
            </svg>
          </div>
          <div class="stats">${item.m.toFixed(0)}</div>
          ${userCell}
        </div>
      `;
    }).join('');

    const youLegend = hasUser
      ? `<span style="display:inline-flex; align-items:center; color:${PAL.accent}; font-weight:600">"You" marker = your answer</span>`
      : '';

    const subtitle = hasUser
      ? `Curve = sample's response distribution. Black line = sample mean. Grey bar below = mean ± 1 SD. Orange marker = your answer.`
      : `Curve shows the sample's response distribution. Vertical black line = sample mean. Grey bar below = mean ± 1 Standard Deviation (SD).`;

    const headerRow = `
      <div class="item-bar-row item-bar-header${hasUser ? ' has-user' : ''}">
        <div class="n"></div>
        <div class="t">Item</div>
        <div class="bar-cell" style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.08em;font-weight:600;align-self:center;height:auto">Distribution &amp; mean</div>
        <div class="stats" style="color:var(--muted);font-family:var(--sans);font-size:11px;letter-spacing:0.08em;text-transform:uppercase;font-weight:600">Mean</div>
        ${hasUser ? '<div class="you" style="color:var(--accent);font-family:var(--sans);font-size:11px;letter-spacing:0.08em;text-transform:uppercase;font-weight:600">You</div>' : ''}
      </div>
    `;

    root.innerHTML = `
      <div class="chart-card" style="padding:0">
        <div style="padding:22px 26px 14px; border-bottom:1px solid var(--line); display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:12px">
          <div>
            <div class="chart-title">Item-by-item distribution</div>
            <div class="chart-subtitle">${subtitle}</div>
          </div>
          <div style="display:flex; gap:16px; font-size:12px; color:var(--ink-dim); align-items:center; flex-wrap:wrap">
            <span style="display:inline-flex; align-items:center"><span style="display:inline-block; width:16px; height:2px; background:${PAL.accent}; margin-right:6px"></span>Sample density</span>
            <span style="display:inline-flex; align-items:center"><span style="display:inline-block; width:1px; height:12px; background:${PAL.ink}; margin-right:6px"></span>Mean</span>
            <span style="display:inline-flex; align-items:center"><span style="display:inline-block; width:16px; height:2px; background:${PAL.muted}; margin-right:6px"></span>±1 SD</span>
            ${youLegend}
          </div>
        </div>
        <div class="items-layout${hasUser ? ' has-user' : ''}">${headerRow}${rows}</div>
      </div>
    `;
  }

  window.addEventListener('wchs:score', (e) => {
    userAnswers = e.detail ? e.detail.items.slice() : null;
    render();
  });

  render();
})();
