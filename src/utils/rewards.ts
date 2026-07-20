import type { ComputedSeries, RewardIssue, SeriesDefinition } from '@/types';

export function calcEarnedByCurrency(series: ComputedSeries[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const s of series.filter((s) => s.status === 'completed')) {
    result[s.currency] = (result[s.currency] || 0) + s.reward;
  }
  return result;
}

export function calcIssuedByCurrency(issues: RewardIssue[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const r of issues) {
    result[r.currency] = (result[r.currency] || 0) + r.amount;
  }
  return result;
}

export function calcUnissuedByCurrency(
  earned: Record<string, number>,
  issued: Record<string, number>
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const c of new Set([...Object.keys(earned), ...Object.keys(issued)])) {
    const v = (earned[c] || 0) - (issued[c] || 0);
    if (v > 0) result[c] = v;
  }
  return result;
}

export function getCurrencies(defs: SeriesDefinition[], issues: RewardIssue[]): string[] {
  const set = new Set<string>();
  for (const d of defs) set.add(d.currency);
  for (const r of issues) set.add(r.currency);
  return [...set];
}
