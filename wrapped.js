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
        // Detect whether the browser can share files — on iOS/Android this
        // lets us send the card image alongside the link in one tap.
        const probeFile = new File(['ok'], 'p.txt', { type: 'text/plain' });
        const canShareFiles = !!(navigator.canShare && navigator.canShare({ files: [probeFile] }));
        // Adjust label honestly:
        //   - share + files  → "Share card & link"
        //   - share, no files → "Send to a friend" (default)
        //   - no share at all → "Copy link"
        if (!navigator.share) {
          lbl.textContent = 'Copy link';
          if (icon) icon.textContent = '⎘';
          shareBtn.dataset.default = 'Copy link';
        } else if (canShareFiles) {
          lbl.textContent = 'Share card & link';
          shareBtn.dataset.default = 'Share card & link';
        }
        shareBtn.addEventListener('click', async () => {
          const payload = shareText();
          // Try sharing image + link together
          if (canShareFiles) {
            try {
              const blob = await renderShareCardBlob();
              const file = new File([blob], 'words-can-harm.png', { type: 'image/png' });
              if (navigator.canShare({ files: [file] })) {
                await navigator.share({ ...payload, files: [file] });
                return;
              }
            } catch (err) {
              // fall through to text-only share
            }
          }
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
          <p class="dd-lede">The full interactive data dashboard lets you explore who believes that words can harm and what other beliefs and traits are associated with the Words Can Harm Scale.</p>
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

  // Render the user's share card to a 1080×1350 PNG Blob suitable for
  // attaching to navigator.share({files}). Drawn directly on canvas (rather
  // than html-to-image) so it doesn't depend on font load timing or DOM layout.
  async function renderShareCardBlob() {
    const W = 1080, H = 1350;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');

    // outer dark frame so the card sits on something instead of bleeding
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#1a0820');
    bg.addColorStop(1, '#2a0e2e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // soft grain
    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    for (let i = 0; i < 1500; i++) ctx.fillRect(Math.random()*W, Math.random()*H, 1, 1);

    // —— card geometry ——
    const cardW = 920, cardH = 1180;
    const cardX = (W - cardW) / 2;
    const cardY = (H - cardH) / 2;
    const r = 36;

    function roundRect(x, y, w, h, rad) {
      ctx.beginPath();
      ctx.moveTo(x+rad, y);
      ctx.lineTo(x+w-rad, y);
      ctx.quadraticCurveTo(x+w, y, x+w, y+rad);
      ctx.lineTo(x+w, y+h-rad);
      ctx.quadraticCurveTo(x+w, y+h, x+w-rad, y+h);
      ctx.lineTo(x+rad, y+h);
      ctx.quadraticCurveTo(x, y+h, x, y+h-rad);
      ctx.lineTo(x, y+rad);
      ctx.quadraticCurveTo(x, y, x+rad, y);
      ctx.closePath();
    }

    // card gradient — same as in-app .share-card
    const grad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    grad.addColorStop(0, '#FF4D6D');
    grad.addColorStop(0.6, '#C9184A');
    grad.addColorStop(1, '#6A0F4D');

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 60;
    ctx.shadowOffsetY = 20;
    ctx.fillStyle = grad;
    roundRect(cardX, cardY, cardW, cardH, r);
    ctx.fill();
    ctx.restore();

    // texture inside card
    ctx.save();
    roundRect(cardX, cardY, cardW, cardH, r);
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for (let i = 0; i < 1200; i++) {
      ctx.fillRect(cardX + Math.random()*cardW, cardY + Math.random()*cardH, 1, 1);
    }
    const sheen = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    sheen.addColorStop(0, 'rgba(255,255,255,0.08)');
    sheen.addColorStop(0.4, 'rgba(255,255,255,0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(cardX, cardY, cardW, cardH);
    ctx.restore();

    // —— compute values (same as slideShare) ——
    const s = score();
    const sorted = data.people.map(p => p.w).sort((a,b)=>a-b);
    const pct = Math.round(percentile(sorted, s));
    const interp = interpretScore(s);
    const N = data.people.length.toLocaleString();
    const all = data.people.map(p => p.w);
    const grid = 80;
    const dens = kde(all, 1, 100, grid, 5);
    const maxD = Math.max(...dens);

    const padX = 64;
    const left = cardX + padX;
    const right = cardX + cardW - padX;

    // Eyebrow
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '700 22px "Helvetica Neue", "Helvetica", "Arial", sans-serif';
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.fillText('YOUR WORDS CAN HARM SCORE', left, cardY + 84);

    // Big number
    ctx.fillStyle = '#fff';
    ctx.font = '800 280px "Helvetica Neue", "Helvetica", "Arial", sans-serif';
    const numStr = s.toFixed(0);
    ctx.fillText(numStr, left, cardY + 350);
    const numW = ctx.measureText(numStr).width;

    // /100
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '500 38px "Helvetica Neue", "Helvetica", "Arial", sans-serif';
    ctx.fillText('/ 100', left + numW + 18, cardY + 270);

    // Strength label
    ctx.fillStyle = 'rgba(255,236,210,0.95)';
    ctx.font = 'italic 42px "Instrument Serif", "Times New Roman", Georgia, serif';
    ctx.fillText(interp.label, left + numW + 18, cardY + 332);

    // Headline ("I have a [strong] belief that words can harm.")
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    ctx.font = 'italic 50px "Instrument Serif", "Times New Roman", Georgia, serif';
    // word-wrap the headline manually
    const headline = `I have a ${interp.label} belief that words can harm.`;
    wrapText(ctx, headline, left, cardY + 460, cardW - padX*2, 64);

    // Distribution sparkline
    const sx = left, sy = cardY + 720, sw = cardW - padX*2, sh = 130;
    let path = new Path2D();
    for (let i = 0; i < grid; i++) {
      const x = sx + (i/(grid-1)) * sw;
      const y = sy + sh - (dens[i]/maxD) * (sh - 8);
      if (i === 0) path.moveTo(x, y);
      else path.lineTo(x, y);
    }
    // fill area
    let area = new Path2D();
    for (let i = 0; i < grid; i++) {
      const x = sx + (i/(grid-1)) * sw;
      const y = sy + sh - (dens[i]/maxD) * (sh - 8);
      if (i === 0) area.moveTo(x, y);
      else area.lineTo(x, y);
    }
    area.lineTo(sx + sw, sy + sh);
    area.lineTo(sx, sy + sh);
    area.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fill(area);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 2;
    ctx.stroke(path);

    // user marker
    const ux = sx + ((s - 1)/99) * sw;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(ux, sy - 4);
    ctx.lineTo(ux, sy + sh);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(ux, sy - 4, 7, 0, Math.PI * 2);
    ctx.fill();

    // percentile caption (centered)
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = '600 30px "Helvetica Neue", "Helvetica", "Arial", sans-serif';
    ctx.fillText(`${pct}%`, cardX + cardW/2 - 90, sy + sh + 56);
    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    ctx.font = '500 24px "Helvetica Neue", "Helvetica", "Arial", sans-serif';
    ctx.fillText('SCORED LOWER THAN YOU', cardX + cardW/2 + 38, sy + sh + 56);
    ctx.textAlign = 'left';

    // dotted footer divider
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.moveTo(left, cardY + cardH - 80);
    ctx.lineTo(right, cardY + cardH - 80);
    ctx.stroke();
    ctx.setLineDash([]);

    // Footer
    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    ctx.font = '500 22px "Helvetica Neue", "Helvetica", "Arial", sans-serif';
    ctx.fillText(`PRATT ET AL. (2026)  ·  N = ${N}`, left, cardY + cardH - 40);
    ctx.textAlign = 'right';
    ctx.fillText('WORDSCANHARM.ORG', right, cardY + cardH - 40);
    ctx.textAlign = 'left';

    return await new Promise(res => c.toBlob(b => res(b), 'image/png', 0.95));
  }

  // Simple word-wrap helper for canvas
  function wrapText(ctx, text, x, y, maxW, lineH) {
    const words = text.split(' ');
    let line = '';
    let cy = y;
    for (let i = 0; i < words.length; i++) {
      const test = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, cy);
        line = words[i];
        cy += lineH;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, cy);
  }

  // build a share caption + url for clipboard / native share
  function shareText() {
    const url = location.origin + location.pathname.replace(/wrapped\.html$/, '') + 'wrapped.html';
    const s = score();
    return {
      title: 'Words Can Harm Scale',
      text: `I scored ${s.toFixed(0)}/100 on the Words Can Harm Scale (Pratt et al., 2026). How strongly do you believe words can harm? Take the 10-question scale and compare yourself to a nationally representative sample of ${data.people.length.toLocaleString()} U.S. adults:`,
      url,
    };
  }

  // ————————————————— boot
  cur = 0;
  render();
})();
