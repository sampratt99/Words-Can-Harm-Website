// ————————————————————————————————————————————————————————————
// Your score hero — overall score + sample distribution
// (item-by-item breakdown lives in items.js)
// ————————————————————————————————————————————————————————————
(function() {
  const root = document.getElementById('dashboard-root');
  if (!root) return;

  function pctText(p) {
    const r = Math.round(p);
    if (r <= 1) return 'lower than almost everyone';
    if (r >= 99) return 'higher than almost everyone';
    return `higher than <strong>${r}%</strong> of respondents`;
  }

  // Absolute interpretation — anchored to the 1–100 score itself, NOT to
  // sample percentile. Cutoffs mirror the slider's agree/disagree anchors
  // so the interpretation feels consistent with how the items were rated.
  function interpret(s) {
    if (s <= 20) return {
      label: 'very weak',
      elab: "On average, you strongly disagreed with the statements — you don't see words as something that causes lasting psychological harm.",
    };
    if (s <= 40) return {
      label: 'weak',
      elab: 'On average, you disagreed with the statements — you tend to think words can sting in the moment, but rarely leave lasting damage on their own.',
    };
    if (s <= 60) return {
      label: 'moderate',
      elab: "On average, you neither strongly agreed nor disagreed with the statements — you think words can cause lasting psychological harm in some cases, but you don't see every harsh word as leaving a real mark.",
    };
    if (s <= 80) return {
      label: 'strong',
      elab: 'On average, you agreed with the statements — you see words as something that can leave real, enduring marks on people.',
    };
    return {
      label: 'very strong',
      elab: 'On average, you strongly agreed with the statements — you see words as something that can do serious, enduring psychological damage to people.',
    };
  }

  function renderDist(score) {
    const all = window.WCHS_DATA.people.map(p => p.w);
    const grid = 160;
    const dens = kde(all, 1, 100, grid, 4);
    const maxD = Math.max(...dens);
    const w = 640, h = 240;
    const pad = { t: 44, r: 24, b: 40, l: 24 };
    const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;

    let line = '';
    for (let i = 0; i < grid; i++) {
      const x = pad.l + (i / (grid - 1)) * iw;
      const y = pad.t + ih - (dens[i] / maxD) * ih;
      line += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
    }
    const area = line + `L${pad.l + iw},${pad.t + ih} L${pad.l},${pad.t + ih} Z`;

    const mean = window.WCHS_META.mean;
    const mx = pad.l + ((mean - 1) / 99) * iw;
    const ux = pad.l + ((score - 1) / 99) * iw;

    let ticks = '';
    [1, 25, 50, 75, 100].forEach(v => {
      const x = pad.l + ((v - 1) / 99) * iw;
      ticks += `<line x1="${x}" y1="${pad.t + ih}" x2="${x}" y2="${pad.t + ih + 4}" stroke="${PAL.line2}"/>`;
      ticks += `<text x="${x}" y="${pad.t + ih + 20}" text-anchor="middle" font-size="11" fill="${PAL.muted}">${v}</text>`;
    });

    const labelX = Math.max(pad.l + 40, Math.min(pad.l + iw - 40, ux));

    return `
      <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;display:block">
        <path d="${area}" fill="${PAL.bg2}"/>
        <path d="${line}" fill="none" stroke="${PAL.line3}" stroke-width="1.2"/>
        <line x1="${pad.l}" y1="${pad.t + ih}" x2="${pad.l + iw}" y2="${pad.t + ih}" stroke="${PAL.line3}"/>
        <line x1="${mx}" y1="${pad.t + 8}" x2="${mx}" y2="${pad.t + ih}" stroke="${PAL.muted}" stroke-dasharray="3 4" stroke-width="1"/>
        <text x="${mx}" y="${pad.t + 2}" text-anchor="middle" font-size="11" fill="${PAL.muted}">sample mean ${mean.toFixed(1)}</text>
        ${ticks}
        <line x1="${ux}" y1="${pad.t - 22}" x2="${ux}" y2="${pad.t + ih}" stroke="${PAL.accent}" stroke-width="2"/>
        <circle cx="${ux}" cy="${pad.t - 22}" r="5" fill="${PAL.accent}"/>
        <rect x="${labelX - 44}" y="${pad.t - 40}" width="88" height="18" fill="${PAL.accent}" rx="2"/>
        <text x="${labelX}" y="${pad.t - 27}" text-anchor="middle" font-size="11" font-weight="600" fill="#FFF" letter-spacing="0.02em">You · ${score.toFixed(1)}</text>
        <text x="${pad.l + iw / 2}" y="${h - 4}" text-anchor="middle" font-size="11" fill="${PAL.muted}">WCHS score  (1 = strongly disagree  →  100 = strongly agree)</text>
      </svg>
    `;
  }

  function render(score) {
    const sorted = window.WCHS_DATA.people.map(p => p.w).sort((a, b) => a - b);
    const pct = percentile(sorted, score);
    const interp = interpret(score);
    root.innerHTML = `
      <div class="dash-grid">
        <div class="score-hero">
          <div class="label">Your Words Can Harm Scale (WCHS) score</div>
          <div class="score">${score.toFixed(1)}<span class="unit"> / 100</span></div>
          <div class="percentile">${pctText(pct)} in the N = 956 sample.</div>
          <div class="interp"><strong>You have a ${interp.label} belief that words can harm.</strong> ${interp.elab}</div>
          <button class="score-share" id="score-share-btn" type="button" data-default="Share this dashboard">
            <span class="ss-icon" aria-hidden="true">↗</span>
            <span class="ss-label">Share this dashboard</span>
          </button>
        </div>
        <div class="chart-card" style="padding:20px 24px">
          <div class="chart-header">
            <div>
              <div class="chart-title">How you compare to others</div>
              <div class="chart-subtitle">Distribution of WCHS scores across the full 956-person sample</div>
            </div>
            <div class="chart-n">N = 956</div>
          </div>
          <div class="chart-body">${renderDist(score)}</div>
        </div>
      </div>
    `;
    wireShareButton();
  }

  // Share-this-dashboard button: native share if available, else clipboard copy.
  function wireShareButton() {
    const btn = document.getElementById('score-share-btn');
    if (!btn) return;
    const lbl = btn.querySelector('.ss-label');
    const icon = btn.querySelector('.ss-icon');
    const flash = (msg) => {
      const def = btn.dataset.default;
      lbl.textContent = msg;
      btn.classList.add('is-flashed');
      setTimeout(() => {
        lbl.textContent = def;
        btn.classList.remove('is-flashed');
      }, 1800);
    };
    if (!navigator.share) {
      lbl.textContent = 'Copy link';
      if (icon) icon.textContent = '⎘';
      btn.dataset.default = 'Copy link';
    }
    btn.addEventListener('click', async () => {
      const url = location.origin + location.pathname.replace(/[^/]*$/, '') + 'index.html';
      const payload = {
        title: 'Words Can Harm Scale: Interactive Data Dashboard',
        text: 'Take the 10-item Words Can Harm Scale (Pratt et al., 2026) and explore the data — who believes it, and what beliefs and traits it correlates with:',
        url,
      };
      if (navigator.share) {
        try { await navigator.share(payload); } catch {}
        return;
      }
      try {
        await navigator.clipboard.writeText(`${payload.text} ${payload.url}`);
        flash('Copied! ✓');
      } catch {
        flash('Press ⌘+C to copy');
      }
    });
  }

  // Hidden until score is available; items.js handles the per-item breakdown either way.
  root.style.display = 'none';

  window.addEventListener('wchs:score', (e) => {
    if (e.detail) {
      root.style.display = '';
      render(e.detail.score);
    } else {
      root.style.display = 'none';
      root.innerHTML = '';
    }
  });
})();
