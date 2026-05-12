import { describe, it, expect } from 'vitest';
import {
  fmt,
  fmtAxis,
  calcData,
  easeOut,
  makeLabelIdxs,
  getYears,
  getYearsAwayText,
  clampPrincipal,
  sliderPercent,
  RATE,
  COLLEGE_YEAR,
  SLIDER_MAX,
} from '../src/calculator.js';

describe('fmt', () => {
  it('formats zero', () => {
    expect(fmt(0)).toBe('$0');
  });
  it('formats whole numbers', () => {
    expect(fmt(100)).toBe('$100');
    expect(fmt(500)).toBe('$500');
  });
  it('rounds decimals', () => {
    expect(fmt(99.6)).toBe('$100');
    expect(fmt(99.4)).toBe('$99');
    expect(fmt(0.5)).toBe('$1');
  });
  it('formats thousands with commas', () => {
    expect(fmt(1000)).toBe('$1,000');
    expect(fmt(10000)).toBe('$10,000');
    expect(fmt(1234567)).toBe('$1,234,567');
  });
});

describe('fmtAxis', () => {
  it('formats values under 1000', () => {
    expect(fmtAxis(0)).toBe('$0');
    expect(fmtAxis(500)).toBe('$500');
    expect(fmtAxis(999)).toBe('$999');
  });
  it('formats thousands with one decimal', () => {
    expect(fmtAxis(1000)).toBe('$1.0k');
    expect(fmtAxis(2500)).toBe('$2.5k');
    expect(fmtAxis(9999)).toBe('$10.0k');
  });
  it('formats tens of thousands with no decimal', () => {
    expect(fmtAxis(10000)).toBe('$10k');
    expect(fmtAxis(50000)).toBe('$50k');
  });
  it('formats hundreds of thousands with no decimal', () => {
    expect(fmtAxis(100000)).toBe('$100k');
    expect(fmtAxis(500000)).toBe('$500k');
  });
  it('formats millions with one decimal', () => {
    expect(fmtAxis(1000000)).toBe('$1.0M');
    expect(fmtAxis(2500000)).toBe('$2.5M');
    expect(fmtAxis(10000000)).toBe('$10.0M');
  });
});

describe('calcData', () => {
  it('returns single element array for years=0', () => {
    const data = calcData(100, 0);
    expect(data).toHaveLength(1);
    expect(data[0]).toBe(100);
  });
  it('first element always equals principal', () => {
    expect(calcData(250, 5)[0]).toBe(250);
    expect(calcData(0, 5)[0]).toBe(0);
  });
  it('returns years+1 elements', () => {
    expect(calcData(100, 10)).toHaveLength(11);
    expect(calcData(100, 17)).toHaveLength(18);
  });
  it('applies compound growth using default RATE', () => {
    const data = calcData(100, 1);
    expect(data[1]).toBeCloseTo(100 * (1 + RATE), 8);
  });
  it('applies compound growth with custom rate', () => {
    const data = calcData(100, 2, 0.05);
    expect(data[0]).toBe(100);
    expect(data[1]).toBeCloseTo(105, 8);
    expect(data[2]).toBeCloseTo(110.25, 8);
  });
  it('handles zero principal', () => {
    calcData(0, 5).forEach((v) => expect(v).toBe(0));
  });
  it('grows monotonically for positive principal and rate', () => {
    const data = calcData(100, 10);
    for (let i = 1; i < data.length; i++) {
      expect(data[i]).toBeGreaterThan(data[i - 1]);
    }
  });
  it('handles large principal', () => {
    const data = calcData(10000, 3, 0.1);
    expect(data[3]).toBeCloseTo(10000 * Math.pow(1.1, 3), 4);
  });
});

describe('easeOut', () => {
  it('returns 0 at t=0', () => {
    expect(easeOut(0)).toBe(0);
  });
  it('returns 1 at t=1', () => {
    expect(easeOut(1)).toBe(1);
  });
  it('returns 0.875 at t=0.5', () => {
    expect(easeOut(0.5)).toBeCloseTo(0.875, 8);
  });
  it('output is always between 0 and 1 for t in [0,1]', () => {
    [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1].forEach((t) => {
      const v = easeOut(t);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    });
  });
  it('is monotonically increasing', () => {
    const ts = [0, 0.2, 0.4, 0.6, 0.8, 1];
    const vals = ts.map(easeOut);
    for (let i = 1; i < vals.length; i++) {
      expect(vals[i]).toBeGreaterThan(vals[i - 1]);
    }
  });
});

describe('makeLabelIdxs', () => {
  it('returns [0] for years=0', () => {
    expect(makeLabelIdxs(0)).toEqual([0]);
  });
  it('returns two points for years=1', () => {
    expect(makeLabelIdxs(1)).toEqual([0, 1]);
  });
  it('returns three points for years=2', () => {
    expect(makeLabelIdxs(2)).toEqual([0, 1, 2]);
  });
  it('returns four points for years=3', () => {
    expect(makeLabelIdxs(3)).toEqual([0, 1, 2, 3]);
  });
  it('returns five points for years=4', () => {
    expect(makeLabelIdxs(4)).toEqual([0, 1, 2, 3, 4]);
  });
  it('caps at 5 points for years > 4', () => {
    expect(makeLabelIdxs(17)).toHaveLength(5);
    expect(makeLabelIdxs(100)).toHaveLength(5);
  });
  it('always starts at 0 and ends at years', () => {
    [1, 5, 10, 17, 50].forEach((y) => {
      const idxs = makeLabelIdxs(y);
      expect(idxs[0]).toBe(0);
      expect(idxs[idxs.length - 1]).toBe(y);
    });
  });
  it('returns correct indices for years=17', () => {
    expect(makeLabelIdxs(17)).toEqual([0, 4, 9, 13, 17]);
  });
  it('returns correct indices for years=10', () => {
    expect(makeLabelIdxs(10)).toEqual([0, 3, 5, 8, 10]);
  });
});

describe('getYears', () => {
  it('returns positive difference for future college year', () => {
    expect(getYears(2043, 2026)).toBe(17);
    expect(getYears(2030, 2026)).toBe(4);
  });
  it('returns 0 when college year equals start year', () => {
    expect(getYears(2026, 2026)).toBe(0);
  });
  it('returns 0 when college year is in the past', () => {
    expect(getYears(2020, 2026)).toBe(0);
    expect(getYears(2000, 2026)).toBe(0);
  });
  it('returns 1 for one year away', () => {
    expect(getYears(2027, 2026)).toBe(1);
  });
});

describe('getYearsAwayText', () => {
  it('includes the count for positive years', () => {
    expect(getYearsAwayText(17)).toBe('17 years away!');
    expect(getYearsAwayText(1)).toBe('1 years away!');
  });
  it('returns starting now for zero years', () => {
    expect(getYearsAwayText(0)).toBe('Starting now!');
  });
});

describe('clampPrincipal', () => {
  it('passes through valid positive integers', () => {
    expect(clampPrincipal('100')).toBe(100);
    expect(clampPrincipal('500')).toBe(500);
    expect(clampPrincipal('0')).toBe(0);
  });
  it('clamps negative values to 0', () => {
    expect(clampPrincipal('-1')).toBe(0);
    expect(clampPrincipal('-999')).toBe(0);
  });
  it('returns 0 for non-numeric strings', () => {
    expect(clampPrincipal('abc')).toBe(0);
    expect(clampPrincipal('')).toBe(0);
    expect(clampPrincipal('$100')).toBe(0);
  });
  it('returns 0 for NaN', () => {
    expect(clampPrincipal(NaN)).toBe(0);
  });
  it('truncates decimal strings via parseInt', () => {
    expect(clampPrincipal('99.9')).toBe(99);
    expect(clampPrincipal('100.1')).toBe(100);
  });
  it('accepts numeric input', () => {
    expect(clampPrincipal(250)).toBe(250);
    expect(clampPrincipal(0)).toBe(0);
  });
});

describe('sliderPercent', () => {
  it('returns 0 for zero value', () => {
    expect(sliderPercent(0)).toBe(0);
  });
  it('returns 100 for max value', () => {
    expect(sliderPercent(SLIDER_MAX)).toBe(100);
  });
  it('returns 50 for half of max', () => {
    expect(sliderPercent(500)).toBe(50);
  });
  it('returns 10 for 10% of max', () => {
    expect(sliderPercent(100)).toBe(10);
  });
  it('clamps values above max to 100', () => {
    expect(sliderPercent(2000)).toBe(100);
    expect(sliderPercent(999999)).toBe(100);
  });
  it('clamps negative values to 0', () => {
    expect(sliderPercent(-1)).toBe(0);
    expect(sliderPercent(-1000)).toBe(0);
  });
  it('uses custom max correctly', () => {
    expect(sliderPercent(50, 200)).toBe(25);
    expect(sliderPercent(200, 200)).toBe(100);
    expect(sliderPercent(0, 500)).toBe(0);
  });
});

describe('constants', () => {
  it('RATE is a positive fraction', () => {
    expect(RATE).toBeGreaterThan(0);
    expect(RATE).toBeLessThan(1);
  });
  it('COLLEGE_YEAR is in the future', () => {
    expect(COLLEGE_YEAR).toBeGreaterThan(new Date().getFullYear());
  });
  it('SLIDER_MAX is 1000', () => {
    expect(SLIDER_MAX).toBe(1000);
  });
});
