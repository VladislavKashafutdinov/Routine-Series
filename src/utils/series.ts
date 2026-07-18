import type { Completion, ComputedSeries, SeriesDefinition } from '../types';

import { dayDiff } from './date';

/** Check if a gap between two dates breaks a series (gap > 1 day) */
export function isGapBreak(prevDate: string, nextDate: string): boolean {
  return dayDiff(prevDate, nextDate) > 1;
}

/**
 * Split completions into series per the README algorithm.
 * Step 3 of «Как формируются серии».
 */
function splitIntoSeries(
  comps: Completion[],
  def: SeriesDefinition,
  todayStr: string,
  startNumber: number
): ComputedSeries[] {
  if (comps.length === 0) return [];

  const sorted = [...comps].sort((a, b) => a.date.localeCompare(b.date));
  const N = def.seriesLength;

  // Build linked list of series groups
  const groups: Completion[][] = [];

  for (const c of sorted) {
    if (groups.length === 0) {
      // First completion → new series
      groups.push([c]);
    } else {
      const lastGroup = groups[groups.length - 1];
      const lastComp = lastGroup[lastGroup.length - 1];

      if (isGapBreak(lastComp.date, c.date)) {
        // Gap > 1 day → new series (broken condition)
        groups.push([c]);
      } else if (lastGroup.length >= N) {
        // Current series reached target length → new series (completed)
        groups.push([c]);
      } else {
        // Continue current series
        lastGroup.push(c);
      }
    }
  }

  // Assign status and number to each group
  return groups.map((group, i) => {
    const status: ComputedSeries['status'] =
      group.length >= N
        ? 'completed'
        : (() => {
            const lastDate = group[group.length - 1].date;
            const diffFromToday = dayDiff(lastDate, todayStr);
            if (diffFromToday <= 1) return 'active';    // yesterday or today
            return 'broken';                              // gap > 1 from today
          })();

    return {
      number: startNumber + i,
      status,
      seriesLength: N,
      reward: def.reward,
      currency: def.currency,
      startDate: group[0].date,
      endDate: status !== 'active' ? group[group.length - 1].date : undefined,
      completions: group,
      definitionCreatedAt: def.createdAt,
    };
  });
}

/**
 * Full algorithm from README «Как формируются серии».
 * Steps 0-3: sort definitions, group completions, split into series.
 */
export function computeSeries(
  defs: SeriesDefinition[],
  completions: Completion[],
  todayStr: string
): ComputedSeries[] {
  if (defs.length === 0) return [];

  // Filter out future data (date > virtualToday)
  const validComps = completions.filter((c) => c.date <= todayStr);
  const validDefs = defs.filter((d) => d.createdAt.toISOString().slice(0, 10) <= todayStr);
  if (validDefs.length === 0) return [];

  // Step 0: sort definitions by createdAt
  const sortedDefs = [...validDefs].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );

  const result: ComputedSeries[] = [];
  let seriesCounter = 0;

  // Step 1-3: for each definition, select completions and split
  for (let i = 0; i < sortedDefs.length; i++) {
    const def = sortedDefs[i];
    const defCreatedDate = def.createdAt.toISOString().slice(0, 10);
    const nextDef = sortedDefs[i + 1];
    
    // Filter completions for this definition
    const defComps = validComps.filter((c) => {
      if (i === 0 && c.date < defCreatedDate) return true;
      const afterStart = c.date >= defCreatedDate;
      if (!nextDef) return afterStart;
      const beforeNext = c.date < nextDef.createdAt.toISOString().slice(0, 10);
      return afterStart && beforeNext;
    });

    const series = splitIntoSeries(defComps, def, todayStr, seriesCounter + 1);
    result.push(...series);
    seriesCounter += series.length;
  }

  return result;
}

/** Find the series whose date window contains virtualToday, or undefined */
export function findCurrentSeries(
  series: ComputedSeries[], virtualToday: string
): ComputedSeries | undefined {
  return series.find((s) => {
    if (s.status === 'broken') return false;
    // Compute end date using local date math (avoids UTC shift from toISOString)
    const d = new Date(s.startDate + 'T00:00:00');
    d.setDate(d.getDate() + s.seriesLength - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const end = `${y}-${m}-${dd}`;
    return s.startDate <= virtualToday && virtualToday <= end;
  });
}
