// ————————————————————————————————————————————————————————————
// Take-the-scale — compact layout, all 10 items visible in viewport
// ————————————————————————————————————————————————————————————
(function() {
  const root = document.getElementById('scale-root');
  if (!root) return;

  const items = window.WCHS_ITEMS;
  const STORAGE = 'wchs_answers_v3';

  let answers = new Array(10).fill(null);
  try {
    const saved = localStorage.getItem(STORAGE);
    if (saved) answers = JSON.parse(saved);
  } catch (e) {}

  function save() { try { localStorage.setItem(STORAGE, JSON.stringify(answers)); } catch (e) {} }

  function render() {
    root.innerHTML = `
      <div class="scale-app">
        <div class="scale-items" id="s-list"></div>
        <div class="scale-panel">
          <div class="panel-card progress-card">
            <div class="p-label">Progress</div>
            <div class="prog-count"><span id="p-num">0</span><span class="of"> / 10</span></div>
            <div class="prog-bar"><div class="prog-bar-fill" id="p-fill"></div></div>
          </div>
          <div class="panel-card running-score-card">
            <div class="p-label">Running score</div>
            <div class="rs-value" id="rs-v"><span class="rs-locked">—</span></div>
            <div class="rs-pctl" id="rs-p"></div>
            <div class="rs-dist" id="rs-dist"></div>
          </div>
          <button class="cta-btn" id="see-score" disabled>See your full score ↓</button>
          <button class="reset-btn" id="reset-btn">Reset answers</button>
        </div>
      </div>
    `;

    const list = document.getElementById('s-list');
    items.forEach((item, i) => {
      const row = document.createElement('div');
      row.className = 'scale-item-compact' + (answers[i] != null ? ' answered' : '');
      row.dataset.idx = i;
      const v = answers[i];
      const pct = v != null ? ((v - 1) / 99) * 100 : 0;
      row.innerHTML = `
        <div class="num">${String(i + 1).padStart(2, '0')}</div>
        <div class="text">${item.t}</div>
        <div class="slider-col" data-slider-idx="${i}">
          <div class="track">
            <div class="tick" style="left:25%"></div>
            <div class="tick" style="left:50%"></div>
            <div class="tick" style="left:75%"></div>
            <div class="fill" style="width:${pct}%"></div>
            <div class="handle" style="left:${pct}%"></div>
          </div>
          <div class="anchors">
            <span>Strongly<br>disagree</span>
            <span>Somewhat<br>disagree</span>
            <span>Neither</span>
            <span>Somewhat<br>agree</span>
            <span>Strongly<br>agree</span>
          </div>
        </div>
        <div class="value">${v != null ? v : '<span class="placeholder">—</span>'}</div>
      `;
      list.appendChild(row);
    });

    attachSliders();
    updatePanel();
    document.getElementById('reset-btn').addEventListener('click', () => {
      answers = new Array(10).fill(null);
      save();
      render();
      dispatchScore(null);
    });
    document.getElementById('see-score').addEventListener('click', () => {
      const el = document.getElementById('dashboard-root');
      if (el) {
        const top = el.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  }

  function attachSliders() {
    document.querySelectorAll('.slider-col').forEach(col => {
      const idx = +col.dataset.sliderIdx;
      const onMove = (e) => {
        const rect = col.querySelector('.track').getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const v = Math.round(1 + pct * 99);
        setAnswer(idx, v);
      };
      const down = (e) => {
        e.preventDefault();
        onMove(e);
        const move = (ev) => onMove(ev);
        const up = () => {
          window.removeEventListener('mousemove', move);
          window.removeEventListener('touchmove', move);
          window.removeEventListener('mouseup', up);
          window.removeEventListener('touchend', up);
        };
        window.addEventListener('mousemove', move);
        window.addEventListener('touchmove', move);
        window.addEventListener('mouseup', up);
        window.addEventListener('touchend', up);
      };
      col.addEventListener('mousedown', down);
      col.addEventListener('touchstart', down, { passive: false });
    });
  }

  function setAnswer(i, v) {
    answers[i] = v;
    save();
    // update just that row — no re-render
    const row = document.querySelector(`.scale-item-compact[data-idx="${i}"]`);
    if (row) {
      row.classList.add('answered');
      const pct = ((v - 1) / 99) * 100;
      row.querySelector('.fill').style.width = pct + '%';
      const h = row.querySelector('.handle');
      h.style.left = pct + '%';
      row.querySelector('.value').textContent = v;
    }
    updatePanel();
  }

  function updatePanel() {
    const done = answers.filter(a => a != null).length;
    document.getElementById('p-num').textContent = done;
    document.getElementById('p-fill').style.width = (done / 10 * 100) + '%';

    const rsV = document.getElementById('rs-v');
    const rsP = document.getElementById('rs-p');
    const btn = document.getElementById('see-score');

    if (done > 0) {
      const vals = answers.filter(a => a != null);
      const score = vals.reduce((a, b) => a + b, 0) / vals.length;
      rsV.innerHTML = score.toFixed(1);

      if (done === 10 && window.WCHS_DATA) {
        btn.disabled = false;
        const sorted = window.WCHS_DATA.people.map(p => p.w).sort((a, b) => a - b);
        const pct = percentile(sorted, score);
        rsP.innerHTML = `higher than <strong>${Math.round(pct)}%</strong> of the 956-person sample`;
        dispatchScore(score);
        drawMiniDist(score);
      } else {
        btn.disabled = true;
        rsP.innerHTML = `based on ${done} item${done > 1 ? 's' : ''} so far`;
        document.getElementById('rs-dist').innerHTML = '';
      }
    } else {
      rsV.innerHTML = '<span class="rs-locked">—</span>';
      rsP.innerHTML = 'Answer all 10 items to see your score';
      btn.disabled = true;
      document.getElementById('rs-dist').innerHTML = '';
      dispatchScore(null);
    }
  }

  function drawMiniDist(score) {
    const el = document.getElementById('rs-dist');
    if (!window.WCHS_DATA) return;
    const all = window.WCHS_DATA.people.map(p => p.w);
    const grid = 80;
    const dens = kde(all, 1, 100, grid, 5);
    const maxD = Math.max(...dens);
    const w = 320, h = 56;
    const pad = { t: 4, r: 4, b: 4, l: 4 };
    const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;

    let path = '';
    for (let i = 0; i < grid; i++) {
      const x = pad.l + (i / (grid - 1)) * iw;
      const y = pad.t + ih - (dens[i] / maxD) * ih;
      path += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
    }
    const area = path + `L${pad.l + iw},${pad.t + ih} L${pad.l},${pad.t + ih} Z`;
    const ux = pad.l + ((score - 1) / 99) * iw;

    el.innerHTML = `
      <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;display:block">
        <path d="${area}" fill="${PAL.line2}" fill-opacity="0.35"/>
        <path d="${path}" fill="none" stroke="${PAL.muted}" stroke-width="1"/>
        <line x1="${ux}" y1="${pad.t}" x2="${ux}" y2="${pad.t + ih}" stroke="${PAL.accent}" stroke-width="2"/>
        <circle cx="${ux}" cy="${pad.t}" r="3.5" fill="${PAL.accent}"/>
      </svg>
    `;
  }

  function dispatchScore(score) {
    window.dispatchEvent(new CustomEvent('wchs:score', {
      detail: score != null ? { score, items: answers.slice() } : null
    }));
  }

  render();

  // If we loaded complete answers from storage, dispatch on boot
  if (answers.filter(a => a != null).length === 10) {
    setTimeout(() => {
      const vals = answers.filter(a => a != null);
      const score = vals.reduce((a, b) => a + b, 0) / vals.length;
      dispatchScore(score);
    }, 50);
  }
})();
