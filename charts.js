// ————————————————————————————————————————————————————————————
// Shared chart utilities — LIGHT theme (OWID/Pew aesthetic)
// ————————————————————————————————————————————————————————————

window.PAL = {
  // backgrounds
  bg:     '#FFFFFF',      // page
  bg1:    '#F7F5F1',      // card / panel
  bg2:    '#EEECE6',      // hover
  bg3:    '#E2DFD7',      // stronger

  // structural lines
  line:   '#E2DFD7',
  line2:  '#C8C4B8',
  line3:  '#9A968A',

  // type
  ink:    '#1A1A1A',
  inkDim: '#4A4A4A',
  muted:  '#7A7A7A',
  muted2: '#A8A8A8',

  // data colors — OWID-ish muted but saturated
  accent:       '#C9462F',   // signal red/orange — reserved for "you" and key emphasis
  accentSoft:   'rgba(201, 70, 47, 0.14)',
  accent2:      '#1F6E8C',   // secondary (teal/navy)

  // categorical palette (OWID-ish)
  liberal:      '#3B75B0',   // blue
  conservative: '#C54C4C',   // red
  moderate:     '#8F8F8F',
  female:       '#8E5EA2',   // purple
  male:         '#3CA6A6',   // teal

  // race split palette — keep distinct from political/gender colors
  race_white:    '#5C6B7A',   // slate
  race_black:    '#7A1F2B',   // oxblood (matches accent)
  race_asian:    '#C77E2C',   // amber
  race_hispanic: '#3F8A5C',   // green
};
const PAL = window.PAL;

function svgEl(name, attrs, parent) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', name);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(el);
  return el;
}

function pearson(xs, ys) {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return { r: 0, n: 0 };
  let mx = 0, my = 0;
  for (let i = 0; i < n; i++) { mx += xs[i]; my += ys[i]; }
  mx /= n; my /= n;
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx, dy = ys[i] - my;
    num += dx * dy; dx2 += dx * dx; dy2 += dy * dy;
  }
  if (dx2 === 0 || dy2 === 0) return { r: 0, n };
  return { r: num / Math.sqrt(dx2 * dy2), n };
}

function linreg(xs, ys) {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return null;
  let mx = 0, my = 0;
  for (let i = 0; i < n; i++) { mx += xs[i]; my += ys[i]; }
  mx /= n; my /= n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) * (xs[i] - mx);
  }
  if (den === 0) return null;
  const slope = num / den;
  return { slope, intercept: my - slope * mx };
}

function kde(values, min, max, grid, bw) {
  const out = new Array(grid).fill(0);
  const step = (max - min) / (grid - 1);
  for (const v of values) {
    for (let i = 0; i < grid; i++) {
      const x = min + i * step;
      const z = (x - v) / bw;
      out[i] += Math.exp(-0.5 * z * z) / (bw * Math.sqrt(2 * Math.PI));
    }
  }
  const n = values.length;
  for (let i = 0; i < grid; i++) out[i] /= n;
  return out;
}

function histogram(values, min, max, nBins) {
  const bins = new Array(nBins).fill(0);
  const w = (max - min) / nBins;
  for (const v of values) {
    let b = Math.floor((v - min) / w);
    if (b < 0) b = 0;
    if (b >= nBins) b = nBins - 1;
    bins[b]++;
  }
  return bins;
}

function percentile(sorted, v) {
  let lo = 0, hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] < v) lo = mid + 1; else hi = mid;
  }
  return (lo / sorted.length) * 100;
}

// Diverging color for r — negative cool, positive warm
function corrColor(r) {
  return r >= 0 ? PAL.accent : PAL.liberal;
}

function fmtR(r) {
  if (r == null || isNaN(r)) return '—';
  const s = r >= 0 ? '+' : '−';
  return s + Math.abs(r).toFixed(2);
}

// Escape HTML (for dynamic content in SVG <text>)
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
