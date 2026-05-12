export const RATE = 0.09;
export const COLLEGE_YEAR = 2043;
export const SLIDER_MAX = 1000;
export const ANIM_MS = 900;

export function fmt(n) {
  return '$' + Math.round(n).toLocaleString('en-US');
}

export function fmtAxis(n) {
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
  if (n >= 100000)  return '$' + (n / 1000).toFixed(0) + 'k';
  if (n >= 10000)   return '$' + (n / 1000).toFixed(0) + 'k';
  if (n >= 1000)    return '$' + (n / 1000).toFixed(1) + 'k';
  return '$' + Math.round(n);
}

export function calcData(principal, years, rate) {
  const r = rate !== undefined ? rate : RATE;
  const data = [];
  for (let i = 0; i <= years; i++) {
    data.push(principal * Math.pow(1 + r, i));
  }
  return data;
}

export function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}

export function makeLabelIdxs(years) {
  if (years === 0) return [0];
  const count = Math.min(5, years + 1);
  const idxs = [];
  for (let i = 0; i < count; i++) {
    idxs.push(Math.round(i * years / (count - 1)));
  }
  return idxs;
}

export function getYears(collegeYear, startYear) {
  return Math.max(0, collegeYear - startYear);
}

export function getYearsAwayText(years) {
  return years > 0 ? years + ' years away!' : 'Starting now!';
}

export function clampPrincipal(val) {
  const n = parseInt(val, 10);
  if (isNaN(n) || n < 0) return 0;
  return n;
}

export function sliderPercent(val, max) {
  const m = max !== undefined ? max : SLIDER_MAX;
  return (Math.min(Math.max(0, val), m) / m) * 100;
}
