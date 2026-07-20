import { describe, it, expect } from 'vitest';
import { computeSeries, findCurrentSeries, isGapBreak } from './series';
import type { Completion, ComputedSeries, SeriesDefinition } from '@/types';

function def(overrides: Partial<SeriesDefinition> & { id: number }): SeriesDefinition {
  return {
    seriesLength: 7, reward: 100, currency: '₽',
    activityId: 1,
    createdAt: new Date('2026-01-01'),
    ...overrides,
  };
}

function comp(date: string): Completion {
  return { id: 1, activityId: 1, date } as Completion;
}

const TODAY = '2026-07-10';

// ── isGapBreak ──

describe('isGapBreak', () => {
  it('true when gap > 1 day', () => {
    expect(isGapBreak('2026-07-01', '2026-07-03')).toBe(true);
  });

  it('false when gap == 1 day (consecutive)', () => {
    expect(isGapBreak('2026-07-01', '2026-07-02')).toBe(false);
  });

  it('false when same day', () => {
    expect(isGapBreak('2026-07-01', '2026-07-01')).toBe(false);
  });
});

// ── computeSeries ──

describe('computeSeries', () => {
  it('returns empty for no definitions', () => {
    expect(computeSeries([], [], TODAY)).toEqual([]);
  });

  it('returns empty for single def with no completions', () => {
    expect(computeSeries([def({ id: 1 })], [], TODAY)).toEqual([]);
  });

  it('active series: last completion yesterday', () => {
    const defs = [def({ id: 1, seriesLength: 7 })];
    const comps = [
      comp('2026-07-08'),
      comp('2026-07-09'), // yesterday relative to TODAY
    ];
    const result = computeSeries(defs, comps, TODAY);
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('active');
    expect(result[0].completions).toHaveLength(2);
  });

  it('active series: last completion today', () => {
    const defs = [def({ id: 1, seriesLength: 7 })];
    const comps = [
      comp('2026-07-09'),
      comp(TODAY),
    ];
    const result = computeSeries(defs, comps, TODAY);
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('active');
    expect(result[0].completions).toHaveLength(2);
  });

  it('completed series: all N days done', () => {
    const defs = [def({ id: 1, seriesLength: 3 })];
    const comps = [
      comp('2026-07-01'),
      comp('2026-07-02'),
      comp('2026-07-03'),
    ];
    const result = computeSeries(defs, comps, TODAY);
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('completed');
    expect(result[0].completions).toHaveLength(3);
  });

  it('broken series: gap > 1 day from last completion to today', () => {
    const defs = [def({ id: 1, seriesLength: 7 })];
    const comps = [
      comp('2026-07-01'),
      comp('2026-07-02'),
    ]; // last is July 2, gap to July 10 > 1
    const result = computeSeries(defs, comps, TODAY);
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('broken');
  });

  it('gap within completions creates two series', () => {
    const defs = [def({ id: 1, seriesLength: 7 })];
    const comps = [
      comp('2026-07-01'),
      comp('2026-07-02'),
      // gap
      comp('2026-07-04'),
      comp('2026-07-05'),
    ];
    const result = computeSeries(defs, comps, TODAY);
    expect(result).toHaveLength(2);
    expect(result[0].status).toBe('broken'); // first series: last is July 2, gap to today
    expect(result[1].status).toBe('broken'); // second series: last is July 5, gap to today
  });

  it('completed series triggers new series start', () => {
    const defs = [def({ id: 1, seriesLength: 3 })];
    const comps = [
      comp('2026-07-01'), comp('2026-07-02'), comp('2026-07-03'), // completed
      comp('2026-07-04'), comp('2026-07-05'), // active (yesterday = July 5, gap to July 10 > 1 → broken)
    ];
    const result = computeSeries(defs, comps, TODAY);
    expect(result).toHaveLength(2);
    expect(result[0].status).toBe('completed');
    expect(result[0].completions).toHaveLength(3);
    expect(result[1].status).toBe('broken'); // last = July 5, gap to July 10 = 5
    expect(result[1].completions).toHaveLength(2);
  });

  it('multiple SeriesDefinitions split completions', () => {
    const defs = [
      def({ id: 1, createdAt: new Date('2026-07-01'), seriesLength: 2, reward: 10 }),
      def({ id: 2, createdAt: new Date('2026-07-05'), seriesLength: 2, reward: 20 }),
    ];
    const comps = [
      comp('2026-07-02'), comp('2026-07-03'), // belongs to def 1 (2 completions, N=2 → completed)
      comp('2026-07-06'), comp('2026-07-07'), // belongs to def 2 (2 completions, N=2 → completed)
    ];
    const result = computeSeries(defs, comps, TODAY);
    expect(result).toHaveLength(2);
    expect(result[0].reward).toBe(10);
    expect(result[0].status).toBe('completed');
    expect(result[1].reward).toBe(20);
    expect(result[1].status).toBe('completed');
  });

  it('series numbers are sequential across definitions', () => {
    const defs = [
      def({ id: 1, createdAt: new Date('2026-07-01'), seriesLength: 2 }),
      def({ id: 2, createdAt: new Date('2026-07-05'), seriesLength: 2 }),
    ];
    const comps = [
      comp('2026-07-02'), comp('2026-07-03'), // def 1: #1
      comp('2026-07-06'), // def 2: #2 (incomplete)
    ];
    const result = computeSeries(defs, comps, TODAY);
    expect(result).toHaveLength(2);
    expect(result[0].number).toBe(1);
    expect(result[1].number).toBe(2);
  });
});

// ── findCurrentSeries ──

function s(overrides: Partial<ComputedSeries> & { startDate: string }): ComputedSeries {
  return {
    number: 1,
    status: 'active',
    seriesLength: 7,
    reward: 100,
    currency: '₽',
    completions: [],
    definitionCreatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

describe('findCurrentSeries', () => {
  it('returns series when virtualToday equals startDate', () => {
    const series = [s({ startDate: '2026-07-10', seriesLength: 7 })];
    expect(findCurrentSeries(series, '2026-07-10')).toBe(series[0]);
  });

  it('returns series when virtualToday equals end date', () => {
    const series = [s({ startDate: '2026-07-10', seriesLength: 3 })];
    expect(findCurrentSeries(series, '2026-07-12')).toBe(series[0]);
  });

  it('returns series when virtualToday is within window', () => {
    const series = [s({ startDate: '2026-07-10', seriesLength: 7 })];
    expect(findCurrentSeries(series, '2026-07-13')).toBe(series[0]);
  });

  it('returns undefined when virtualToday is before startDate', () => {
    const series = [s({ startDate: '2026-07-10', seriesLength: 7 })];
    expect(findCurrentSeries(series, '2026-07-09')).toBeUndefined();
  });

  it('returns undefined when virtualToday is after window', () => {
    const series = [s({ startDate: '2026-07-10', seriesLength: 2 })];
    expect(findCurrentSeries(series, '2026-07-12')).toBeUndefined();
  });

  it('returns undefined for empty array', () => {
    expect(findCurrentSeries([], '2026-07-10')).toBeUndefined();
  });

  it('returns first matching when multiple series match', () => {
    const a = s({ startDate: '2026-07-10', seriesLength: 5, number: 1 });
    const b = s({ startDate: '2026-07-10', seriesLength: 5, number: 2 });
    expect(findCurrentSeries([a, b], '2026-07-12')).toBe(a);
  });

  it('ignores broken series even if window contains virtualToday', () => {
    const broken = s({ startDate: '2026-07-10', seriesLength: 7, status: 'broken' });
    expect(findCurrentSeries([broken], '2026-07-12')).toBeUndefined();
  });

  it('finds completed series if window contains virtualToday', () => {
    const completed = s({ startDate: '2026-07-10', seriesLength: 3, status: 'completed' });
    expect(findCurrentSeries([completed], '2026-07-11')).toBe(completed);
  });
});

// ── computeSeries: future filtering ──

describe('computeSeries future filtering', () => {
  it('excludes completions with date > virtualToday', () => {
    const defs = [def({ id: 1, seriesLength: 7 })];
    const comps = [
      comp('2026-07-09'),
      comp('2026-07-12'), // future
    ];
    const result = computeSeries(defs, comps, '2026-07-10');
    expect(result[0].completions).toHaveLength(1);
    expect(result[0].completions[0].date).toBe('2026-07-09');
  });

  it('excludes seriesDefinitions with createdAt > virtualToday', () => {
    const defs = [
      def({ id: 1, createdAt: new Date('2026-07-05'), seriesLength: 2, reward: 10 }),
      def({ id: 2, createdAt: new Date('2026-07-12'), seriesLength: 2, reward: 20 }), // future def
    ];
    const comps = [
      comp('2026-07-06'), comp('2026-07-07'), // belongs to def 1
    ];
    const result = computeSeries(defs, comps, '2026-07-10');
    expect(result).toHaveLength(1);
    expect(result[0].reward).toBe(10); // only def 1 used
  });

  it('returns empty if all defs are in the future', () => {
    const defs = [def({ id: 1, createdAt: new Date('2026-07-15'), seriesLength: 7 })];
    const comps = [comp('2026-07-16')];
    expect(computeSeries(defs, comps, '2026-07-10')).toEqual([]);
  });

  it('includes completions before the first def createdAt (bug: series calc)', () => {
    // Activity created today (def createdAt = today), but completions were
    // marked on days before via time travel
    const defs = [def({ id: 1, createdAt: new Date('2026-07-16'), seriesLength: 10 })];
    const comps = [
      comp('2026-07-06'), comp('2026-07-07'), comp('2026-07-08'),
      comp('2026-07-09'), comp('2026-07-10'), comp('2026-07-11'),
      // gap on 12th
      comp('2026-07-13'), comp('2026-07-14'), comp('2026-07-15'),
      // 16th (today) — not done
    ];
    const result = computeSeries(defs, comps, '2026-07-16');
    expect(result).toHaveLength(2); // broken (6-11) + active (13-15, last = yesterday)
    expect(result[0].completions).toHaveLength(6);
    expect(result[1].completions).toHaveLength(3);
    expect(result[1].status).toBe('active');
  });
});

// ── multiple active series bug ──

describe('single active series rule', () => {
  it('should not have more than one active series', () => {
    const defs = [
      def({ id: 1, createdAt: new Date('2026-07-16'), seriesLength: 7 }),
      def({ id: 2, createdAt: new Date('2026-07-18'), seriesLength: 10 }),
    ];
    const comps = [
      comp('2026-07-13'),
      comp('2026-07-14'),
      // gap on 15th
      comp('2026-07-16'),
      comp('2026-07-17'),
      comp('2026-07-18'),
    ];
    const result = computeSeries(defs, comps, '2026-07-18');

    // Only one active series allowed
    const activeSeries = result.filter((s) => s.status === 'active');
    expect(activeSeries).toHaveLength(1);

    // Expected: [13,14] broken (2 of 7, last=14, gap to today=4)
    expect(result[0].status).toBe('broken');
    expect(result[0].completions.map((c) => c.date)).toEqual(['2026-07-13', '2026-07-14']);

    // Expected: [16,17,18] active (3 of 10, last=18 = today)
    expect(result[1].status).toBe('active');
    expect(result[1].completions.map((c) => c.date)).toEqual(['2026-07-16', '2026-07-17', '2026-07-18']);
  });
});
