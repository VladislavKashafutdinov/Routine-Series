import { describe, it, expect } from 'vitest';
import { computeSeries, isGapBreak } from './series';
import type { Completion, SeriesDefinition } from '../types';

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
