import {
  fmt, fmtAxis, calcData, easeOut, makeLabelIdxs,
  getYears, getYearsAwayText, clampPrincipal, sliderPercent,
  RATE, COLLEGE_YEAR, SLIDER_MAX, ANIM_MS,
} from './calculator.js';

const START_YEAR  = new Date().getFullYear();
const YEARS       = getYears(COLLEGE_YEAR, START_YEAR);
const FIXED_MAX   = SLIDER_MAX * Math.pow(1 + RATE, YEARS);

const slider       = document.getElementById('giftSlider');
const amtInput     = document.getElementById('amountInput');
const resultEl     = document.getElementById('resultValue');
const resultYearEl = document.getElementById('resultYear');
const yearsAwayEl  = document.getElementById('yearsAway');
const canvas       = document.getElementById('growthChart');
const ctx          = canvas.getContext('2d');
const overlay      = document.getElementById('overlay');

resultYearEl.textContent = 'by ' + COLLEGE_YEAR + ' \u{1F393}';
yearsAwayEl.textContent  = getYearsAwayText(YEARS);

let animFrame = null;
let animStart = null;
let currentPrincipal = 100;

document.getElementById('openNote').addEventListener('click', function () {
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
});

function closeOverlay() {
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('closeNote').addEventListener('click', closeOverlay);
overlay.addEventListener('click', function (e) { if (e.target === overlay) closeOverlay(); });
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeOverlay(); });

function drawChart(data, progress) {
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.offsetWidth;
  const H = canvas.offsetHeight;
  if (W === 0) return;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const pL = 48, pR = 12, pT = 42, pB = 32;
  const cW = W - pL - pR;
  const cH = H - pT - pB;
  const maxVal = Math.max(FIXED_MAX, data[YEARS]) || 1;

  const xp = (i) => YEARS === 0 ? pL + cW / 2 : pL + (i / YEARS) * cW;
  const yp = (v) => pT + cH - (v / maxVal) * cH * progress;

  ctx.clearRect(0, 0, W, H);
  if (data[YEARS] === 0) return;

  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.font = '10px Nunito, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillStyle = '#A78BFA';
  [0.25, 0.5, 0.75, 1].forEach(function (t) {
    const y = pT + cH - t * cH;
    ctx.beginPath();
    ctx.moveTo(pL, y);
    ctx.lineTo(pL + cW, y);
    ctx.strokeStyle = 'rgba(196,181,253,0.4)';
    ctx.stroke();
    ctx.fillText(fmtAxis(maxVal * t), pL - 4, y + 4);
  });
  ctx.setLineDash([]);

  const pts = data.map((v, i) => ({ x: xp(i), y: yp(v) }));

  function smoothPath() {
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
  }

  const fill = ctx.createLinearGradient(0, pT, 0, pT + cH);
  fill.addColorStop(0, 'rgba(124,58,237,0.4)');
  fill.addColorStop(1, 'rgba(236,72,153,0.04)');
  ctx.beginPath();
  smoothPath();
  ctx.lineTo(pts[pts.length - 1].x, pT + cH);
  ctx.lineTo(pts[0].x, pT + cH);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();

  const stroke = ctx.createLinearGradient(pL, 0, pL + cW, 0);
  stroke.addColorStop(0, '#7C3AED');
  stroke.addColorStop(1, '#EC4899');
  ctx.beginPath();
  smoothPath();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.stroke();

  ctx.font = 'bold 10px Nunito, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#8B5CF6';
  makeLabelIdxs(YEARS).forEach(function (i) {
    ctx.fillText(START_YEAR + i, pts[i].x, pT + cH + 22);
  });

  const ep = pts[pts.length - 1];
  ctx.beginPath();
  ctx.arc(ep.x, ep.y, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#EC4899';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  if (progress >= 1) {
    const calloutW = 86, calloutH = 26;
    let cx2 = Math.min(ep.x - calloutW / 2, W - pR - calloutW);
    cx2 = Math.max(pL, cx2);
    let cy2 = ep.y - calloutH - 10;
    if (cy2 < 2) cy2 = ep.y + 14;
    ctx.beginPath();
    ctx.roundRect(cx2, cy2, calloutW, calloutH, 6);
    ctx.fillStyle = '#EC4899';
    ctx.fill();
    ctx.font = 'bold 11px Nunito, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(fmt(data[YEARS]), cx2 + calloutW / 2, cy2 + 17);
  }
}

function run(p, animate) {
  const data = calcData(p, YEARS);
  resultEl.textContent = fmt(data[YEARS]);
  if (animFrame) cancelAnimationFrame(animFrame);
  if (!animate) { drawChart(data, 1); return; }
  animStart = null;
  animFrame = requestAnimationFrame(function tick(ts) {
    if (!animStart) animStart = ts;
    const pct = Math.min((ts - animStart) / ANIM_MS, 1);
    drawChart(data, easeOut(pct));
    if (pct < 1) animFrame = requestAnimationFrame(tick);
  });
}

const presetBtns = document.querySelectorAll('.preset-btn');

function syncSlider(val) {
  slider.style.setProperty('--pct', sliderPercent(val) + '%');
}

function syncPresets(val) {
  presetBtns.forEach(function (btn) {
    btn.classList.toggle('active', parseInt(btn.dataset.val, 10) === val);
  });
}

presetBtns.forEach(function (btn) {
  btn.addEventListener('click', function () {
    const v = parseInt(btn.dataset.val, 10);
    amtInput.value = v;
    slider.value = Math.min(v, SLIDER_MAX);
    syncSlider(v);
    syncPresets(v);
    currentPrincipal = v;
    run(v, false);
  });
});

slider.addEventListener('input', function () {
  const v = parseInt(slider.value, 10);
  amtInput.value = v;
  syncSlider(v);
  syncPresets(v);
  currentPrincipal = v;
  run(v, false);
});

amtInput.addEventListener('input', function () {
  const raw = parseInt(amtInput.value, 10);
  if (isNaN(raw) || raw < 0) return;
  slider.value = Math.min(raw, SLIDER_MAX);
  syncSlider(raw);
  syncPresets(raw);
  currentPrincipal = raw;
  run(raw, false);
});

amtInput.addEventListener('blur', function () {
  const v = clampPrincipal(amtInput.value);
  amtInput.value = v;
  slider.value = Math.min(v, SLIDER_MAX);
  syncSlider(v);
  syncPresets(v);
  currentPrincipal = v;
  run(v, false);
});

let resizeTimer;
window.addEventListener('resize', function () {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(function () { run(currentPrincipal, false); }, 100);
});

syncSlider(100);
syncPresets(100);
run(100, true);
