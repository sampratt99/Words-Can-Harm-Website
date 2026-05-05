// ————————————————————————————————————————————————————————————
// "Your Words Can Harm" — Wrapped reveal (self-contained)
// Hero (intro) → 10 questions → score → percentile → top item →
// bottom item → your-10-items chart → social-beliefs findings →
// mental-health findings → outro
// ————————————————————————————————————————————————————————————

(function() {
  const STORAGE = 'wchs_answers_v3';
  const data = window.WCHS_DATA;
  const items = window.WCHS_ITEMS;
  const meta = window.WCHS_META;
  const correlates = window.WCHS_CORRELATES;

  let answers = new Array(10).fill(null);
  try { const s = localStorage.getItem(STORAGE); if (s) answers = JSON.parse(s); } catch {}
  function save() { try { localStorage.setItem(STORAGE, JSON.stringify(answers)); } catch {} }

  let cur = 0;

  function buildDeck() {
    const deck = [];
    deck.push({ kind: 'hero' });
    for (let i = 0; i < 10; i++) deck.push({ kind: 'q', i });
    deck.push({ kind: 'gate' });
    deck.push({ kind: 'big' });
    deck.push({ kind: 'pct' });
    deck.push({ kind: 'item-top' });
    deck.push({ kind: 'item-bot' });
    deck.push({ kind: 'share' });
    return deck;
  }
  let DECK = buildDeck();

  function renderDots() {
    const el = document.getElementById('dots');
    let html = '';
    for (let i = 0; i < DECK.length; i++) {
      const cls = i === cur ? 'active' : (i < cur ? 'done' : '');
      html += `<button class="dot ${cls}" data-i="${i}"></button>`;
    }
    el.innerHTML = html;
    el.querySelectorAll('.dot').forEach(b => {
      b.addEventListener('click', () => goTo(+b.dataset.i));
    });
  }

  function complete() { return answers.filter(a => a != null).length === 10; }
  function score() {
    if (!complete()) return null;
    return answers.reduce((a,b)=>a+b,0) / 10;
  }

  function goTo(i) {
    cur = Math.max(0, Math.min(DECK.length - 1, i));
    render();
  }
  function next() {
    const slide = DECK[cur];
    if (slide.kind === 'q' && answers[slide.i] == null) return;
    goTo(cur + 1);
  }
  function prev() { goTo(cur - 1); }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  });

  function variantFor(slide) {
    switch (slide.kind) {
      case 'hero': return 's-hero';
      case 'q': return 's-q';
      case 'gate': return 's-nudge';
      case 'big': return 's-bignum';
      case 'pct': return 's-pct';
      case 'item-top':
      case 'item-bot': return 's-item';
      case 'share': return 's-share';
    }
    return '';
  }

  // ————————————————— render
  function render() {
    const slide = DECK[cur];
    let html = '';
    switch (slide.kind) {
      case 'hero':           html = slideHero(); break;
      case 'q':              html = slideQ(slide.i); break;
      case 'gate':           html = slideGate(); break;
      case 'big':            html = slideBig(); break;
      case 'pct':            html = slidePct(); break;
      case 'item-top':       html = slideItem('top'); break;
      case 'item-bot':       html = slideItem('bot'); break;
      case 'share':          html = slideShare(); break;
    }
    document.getElementById('slide-stage').innerHTML =
      `<div class="slide active enter ${variantFor(slide)}">${html}</div>`;
    renderDots();
    attachSlideHandlers(slide);
    // Wire any "Next →" reveal buttons inside the slide
    document.querySelectorAll('#slide-stage [data-next]').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); next(); });
    });
  }

  function attachSlideHandlers(slide) {
    if (slide.kind === 'hero') {
      const startBtn = document.getElementById('start');
      // After completing all 10 Qs, jump to the score slide (skip the gate).
      if (startBtn) startBtn.addEventListener('click', () => goTo(complete() ? 12 : 1));
    }
    if (slide.kind === 'q') attachSlider(slide.i);
    if (slide.kind === 'gate') {
      const goBack = document.getElementById('go-back');
      if (goBack) goBack.addEventListener('click', () => {
        const idx = answers.findIndex(a => a == null);
        goTo(idx >= 0 ? 1 + idx : 1);
      });
    }
    if (slide.kind === 'share') {
      const restart = document.getElementById('restart');
      if (restart) restart.addEventListener('click', () => {
        answers = new Array(10).fill(null); save(); goTo(0);
      });
      const shareBtn = document.getElementById('share-action');
      if (shareBtn) {
        const lbl = shareBtn.querySelector('.sa-label');
        const icon = shareBtn.querySelector('.sa-icon');
        const flash = (msg, cls) => {
          lbl.textContent = msg;
          if (cls) shareBtn.classList.add(cls);
          setTimeout(() => {
            lbl.textContent = shareBtn.dataset.default;
            if (cls) shareBtn.classList.remove(cls);
          }, 1800);
        };
        // If the Web Share API isn't available, fall back to copy-link
        // and re-label the button so the affordance is honest.
        if (!navigator.share) {
          lbl.textContent = 'Copy link';
          if (icon) icon.textContent = '⎘';
          shareBtn.dataset.default = 'Copy link';
        }
        shareBtn.addEventListener('click', async () => {
          const payload = shareText();
          if (navigator.share) {
            try { await navigator.share(payload); } catch {}
            return;
          }
          // Fallback: copy to clipboard
          try {
            await navigator.clipboard.writeText(`${payload.text} ${payload.url}`);
            flash('Copied! ✓', 'copied');
          } catch {
            flash('Press ⌘+C to copy');
          }
        });
      }
    }
  }

  // ————————————————— SLIDE: hero (intro + context)
  function slideHero() {
    const isReturn = complete();
    if (isReturn) {
      return `
        <div class="preheader">A Words-Can-Harm reveal</div>
        <h1 class="h1">Welcome<br>back.</h1>
        <p class="sub">You answered all 10 questions before. Skip ahead to your reveal — or retake the scale from scratch.</p>
        <button class="cta-pill" id="start">See my reveal <span class="arr">→</span></button>
        <button class="cta-ghost" onclick="(function(){localStorage.removeItem('${STORAGE}'); location.reload();})()">Retake from scratch</button>
      `;
    }
    return `
        <div class="preheader">A reveal in 10 questions</div>
        <h1 class="h1">Can words<br>harm?</h1>
        <p class="sub">The <strong>Words Can Harm Scale</strong> measures how strongly a person believes that speech can cause lasting psychological damage. You'll read 10 statements and indicate your agreement with each on a sliding scale. Then we'll show you where you fall, based on what researchers found in a nationally representative survey of 956 US adults.</p>
        <ul class="hero-meta">
          <li><span class="hm-num">10</span><span class="hm-lbl">questions</span></li>
          <li><span class="hm-num">~2</span><span class="hm-lbl">minutes</span></li>
          <li><span class="hm-num">956</span><span class="hm-lbl">people compared</span></li>
        </ul>
        <button class="cta-pill" id="start">Start <span class="arr">→</span></button>
    `;
  }

  // ————————————————— SLIDE: question
  function slideQ(i) {
    const it = items[i];
    const v = answers[i];
    const pct = v != null ? ((v - 1) / 99) * 100 : 50;
    return `
        <div class="qheader">Question ${i+1} of 10</div>
        <p class="qtext">${it.t}</p>
        <div class="qcontrols">
          <div class="qval-display">
            <div class="qval-num" id="qv">${v != null ? v : '—'}</div>
            <div class="qval-lbl">${v != null ? labelFor(v) : 'drag the slider'}</div>
          </div>
          <div class="qslider" id="qs">
            <div class="qtrack"></div>
            <div class="qfill" style="width:${pct}%"></div>
            <div class="qhandle" style="left:${pct}%"></div>
          </div>
          <div class="qanchors">
            <span>Strongly<br>disagree</span>
            <span>Somewhat<br>disagree</span>
            <span>Neither</span>
            <span>Somewhat<br>agree</span>
            <span>Strongly<br>agree</span>
          </div>
          <div class="qpager">
            <button class="qprev" ${i === 0 ? 'disabled' : ''} onclick="document.getElementById('tap-prev').click()">← Back</button>
            <div class="qcounter">${i+1} / 10</div>
            <button class="qnext" id="qnext" ${v == null ? 'disabled' : ''}>${i === 9 ? 'See reveal →' : 'Next →'}</button>
          </div>
        </div>
    `;
  }

  function labelFor(v) {
    if (v <= 12) return 'strongly disagree';
    if (v <= 37) return 'somewhat disagree';
    if (v <= 62) return 'neither agree nor disagree';
    if (v <= 87) return 'somewhat agree';
    return 'strongly agree';
  }

  function attachSlider(i) {
    const slider = document.getElementById('qs');
    const numEl = document.getElementById('qv');
    const fillEl = slider.querySelector('.qfill');
    const handleEl = slider.querySelector('.qhandle');
    const nextBtn = document.getElementById('qnext');
    if (nextBtn) nextBtn.addEventListener('click', () => goTo(cur + 1));

    const onMove = e => {
      const r = slider.getBoundingClientRect();
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const pct = Math.max(0, Math.min(1, (cx - r.left) / r.width));
      const v = Math.round(1 + pct * 99);
      answers[i] = v; save();
      const visualPct = ((v - 1) / 99) * 100;
      fillEl.style.width = visualPct + '%';
      handleEl.style.left = visualPct + '%';
      numEl.textContent = v;
      slider.parentNode.querySelector('.qval-lbl').textContent = labelFor(v);
      if (nextBtn) nextBtn.disabled = false;
    };
    const down = e => {
      e.preventDefault(); onMove(e);
      const move = ev => onMove(ev);
      const up = () => {
        window.removeEventListener('mousemove', move);
        window.removeEventListener('touchmove', move);
        window.removeEventListener('mouseup', up);
        window.removeEventListener('touchend', up);
      };
      window.addEventListener('mousemove', move);
      window.addEventListener('touchmove', move, { passive: false });
      window.addEventListener('mouseup', up);
      window.addEventListener('touchend', up);
    };
    slider.addEventListener('mousedown', down);
    slider.addEventListener('touchstart', down, { passive: false });
  }

  // ————————————————— SLIDE: gate (incomplete nudge)
  function slideGate() {
    if (complete()) {
      setTimeout(() => goTo(cur + 1), 0);
      return '';
    }
    const done = answers.filter(a => a != null).length;
    return `
        <div class="preheader">Almost there</div>
        <h2 class="nh">You've answered ${done} of 10. Finish the rest to see your reveal.</h2>
        <p class="nb">The reveal is built from your answers — we need them all to show you where you land.</p>
        <button class="cta-pill" id="go-back">Finish the questions <span class="arr">→</span></button>
    `;
  }

  // ————————————————— SLIDE: big number
  function slideBig() {
    const s = score();
    const interp = interpretScore(s);
    return `
        <div class="label">Your Words-Can-Harm score</div>
        <div class="big">${s.toFixed(0)}</div>
        <div class="out-of">out of 100</div>
        <div class="interp">
          <div class="strength">You have a <strong>${interp.label}</strong> belief that words can harm.</div>
          <div class="elab">${interp.elab}</div>
        </div>
        <button class="reveal-next" data-next>See how you compare <span class="arr">→</span></button>
    `;
  }

  // Absolute interpretation — anchored to the 1–100 score itself, NOT to
  // sample percentile. Cutoffs mirror the slider's agree/disagree anchors
  // so the interpretation feels consistent with how the items were rated.
  // Comparison to others is reserved for the percentile slide that follows.
  function interpretScore(s) {
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

  // ————————————————— SLIDE: percentile + mini distribution
  function slidePct() {
    const s = score();
    const sorted = data.people.map(p => p.w).sort((a,b)=>a-b);
    const pct = Math.round(percentile(sorted, s));
    const tail = pct < 5  ? `Almost no one in the nationally representative sample scored as low as you.` :
                 pct < 25 ? `You're in the bottom quarter — among the most skeptical.` :
                 pct < 45 ? `You're below the average for the nationally representative sample.` :
                 pct < 55 ? `You're right in the middle of the sample.` :
                 pct < 75 ? `You're above the average for the nationally representative sample.` :
                 pct < 95 ? `You're in the top quarter — among the strongest believers.` :
                            `Almost no one in the nationally representative sample scored as high as you.`;

    const all = data.people.map(p => p.w);
    const grid = 80;
    const dens = kde(all, 1, 100, grid, 5);
    const maxD = Math.max(...dens);
    const w = 360, h = 60;
    let path = '';
    for (let i = 0; i < grid; i++) {
      const x = (i / (grid - 1)) * w;
      const y = h - (dens[i] / maxD) * (h - 4);
      path += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
    }
    const area = path + `L${w},${h} L0,${h} Z`;
    const ux = ((s - 1) / 99) * w;

    return `
        <div class="pre">In the nationally representative sample…</div>
        <h2 class="head">You scored higher than</h2>
        <div class="pct-num">${pct}%</div>
        <p class="tail">${tail}</p>
        <div class="distbar">
          <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
            <path d="${area}" fill="rgba(255,255,255,0.22)"/>
            <path d="${path}" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="1"/>
            <line x1="${ux}" y1="0" x2="${ux}" y2="${h}" stroke="#fff" stroke-width="3"/>
            <circle cx="${ux}" cy="6" r="5" fill="#fff"/>
          </svg>
        </div>
        <button class="reveal-next" data-next>Next <span class="arr">→</span></button>
    `;
  }

  // ————————————————— SLIDE: top/bottom item
  function slideItem(which) {
    let bestI = 0, val = which === 'top' ? -Infinity : Infinity;
    for (let i = 0; i < 10; i++) {
      const v = answers[i];
      if (v == null) continue;
      if (which === 'top' ? v > val : v < val) { val = v; bestI = i; }
    }
    const it = items[bestI];
    const lbl = which === 'top' ? "You agreed most with" : "You disagreed most with";

    return `
        <div class="lbl">${lbl}</div>
        <div class="quote-mark">"</div>
        <p class="qtxt">${it.t}</p>
        <div class="ans-box">
          <span class="lbl-s">You</span>
          <span class="v-you">${val}</span>
          <span class="lbl-s">Sample avg</span>
          <span class="v-them">${it.m.toFixed(0)}</span>
        </div>
        <button class="reveal-next" data-next>Next <span class="arr">→</span></button>
    `;
  }

  // ————————————————— SLIDE: share / outro
  function slideShare() {
    const s = score();
    const sorted = data.people.map(p => p.w).sort((a,b)=>a-b);
    const pct = Math.round(percentile(sorted, s));
    const interp = interpretScore(s);
    const N = data.people.length.toLocaleString();

    // Tiny inline distribution sparkline for the card
    const all = data.people.map(p => p.w);
    const grid = 60;
    const dens = kde(all, 1, 100, grid, 5);
    const maxD = Math.max(...dens);
    const w = 320, h = 36;
    let path = '';
    for (let i = 0; i < grid; i++) {
      const x = (i / (grid - 1)) * w;
      const y = h - (dens[i] / maxD) * (h - 3);
      path += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
    }
    const area = path + `L${w},${h} L0,${h} Z`;
    const ux = ((s - 1) / 99) * w;

    return `
        <div class="share-card-wrap">
          <div class="share-card" id="share-card">
            <div class="card-eyebrow card-eyebrow--single">
              <span class="card-mark">YOUR WORDS CAN HARM SCORE</span>
            </div>
            <div class="card-bignum">
              <div class="cb-score">${s.toFixed(0)}</div>
              <div class="cb-side">
                <div class="cb-out">/ 100</div>
                <div class="cb-strength">${interp.label}</div>
              </div>
            </div>
            <div class="card-headline">
              I have a <strong>${interp.label}</strong> belief that words can harm.
            </div>
            <div class="card-dist">
              <svg viewBox="0 0 ${w} ${h+10}" preserveAspectRatio="none" aria-hidden="true">
                <path d="${area}" fill="rgba(255,255,255,0.18)"/>
                <path d="${path}" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1"/>
                <line x1="${ux.toFixed(1)}" y1="0" x2="${ux.toFixed(1)}" y2="${h}" stroke="#fff" stroke-width="2.5"/>
                <circle cx="${ux.toFixed(1)}" cy="3" r="3.5" fill="#fff"/>
              </svg>
              <div class="card-dist-foot">
                <span class="card-pct"><strong>${pct}%</strong> scored lower than you</span>
              </div>
            </div>
            <div class="card-foot card-foot--single">
              <span class="card-foot-l">Pratt&nbsp;et&nbsp;al.&nbsp;(2026) &nbsp;·&nbsp; N&nbsp;=&nbsp;${N}</span>
            </div>
          </div>
          <div class="share-hint">↑ Screenshot to share</div>
        </div>

        <div class="share-actions">
          <button class="sa-btn sa-primary" id="share-action" data-default="Send to a friend">
            <span class="sa-icon" aria-hidden="true">↗</span>
            <span class="sa-label">Send to a friend</span>
          </button>
        </div>

        <div class="dig-deeper">
          <div class="dd-eyebrow">Want to dig deeper?</div>
          <p class="dd-lede">The full interactive data dashboard lets you explore who believes that words can harm, see how every item is distributed, and find what other beliefs and traits are associated with the Words Can Harm Scale.</p>
          <div class="dd-actions">
            <a class="dd-btn dd-primary" href="index.html">
              <span class="dd-label">Interactive Data Dashboard</span>
              <span class="dd-arr" aria-hidden="true">→</span>
            </a>
            <a class="dd-btn" href="https://spaces-cdn.owlstown.com/blobs/6g1pqi4edz5colrmsfywhbv1v0em" target="_blank" rel="noopener">
              <span class="dd-label">Read the full paper</span>
              <span class="dd-arr" aria-hidden="true">↗</span>
            </a>
          </div>
        </div>

        <button class="restart-link" id="restart">Retake from scratch ↺</button>
    `;
  }

  // build a share caption + url for clipboard / native share
  function shareText() {
    const url = location.origin + location.pathname.replace(/wrapped\.html$/, '') + 'wrapped.html';
    return {
      title: 'Words Can Harm Scale',
      text: `How strongly do you believe words can harm? Take the 10-question scale used in Pratt et al. (2026) and see how you compare to a nationally representative sample of ${data.people.length.toLocaleString()} U.S. adults:`,
      url,
    };
  }

  // ————————————————— boot
  cur = 0;
  render();
})();
