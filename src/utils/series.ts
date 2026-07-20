import type { Completion, ComputedSeries, SeriesDefinition } from '../types';

import { dayDiff } from './date';

/** Check if a gap between two dates breaks a series (gap > 1 day) */
export function isGapBreak(prevDate: string, nextDate: string): boolean {
  return dayDiff(prevDate, nextDate) > 1;
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function defDate(d: SeriesDefinition): string {
  return d.createdAt.toISOString().slice(0, 10);
}

/**
 * VISION algorithm v2 — super-series based series computation.
 * Splits completions by gaps first, then assigns definitions per completion.
 */
export function computeSeries(
  defs: SeriesDefinition[],
  completions: Completion[],
  todayStr: string
): ComputedSeries[] {
  if (defs.length === 0) return [];

  // Filter out future data
  const validComps = completions.filter((c) => c.date <= todayStr);
  const validDefs = defs.filter((d) => defDate(d) <= todayStr);
  if (validDefs.length === 0) return [];

  // 0. Define key dates
  const sortedDefs = [...validDefs].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const firstDef = sortedDefs[0];
  const lastDef = sortedDefs[sortedDefs.length - 1];
  const virtualYesterday = addDays(todayStr, -1);

  // 1. Sort completions by date
  const sortedComps = [...validComps].sort((a, b) => a.date.localeCompare(b.date));
  if (sortedComps.length === 0) return [];

  // 2. Split into super series by gaps
  const superSeriesList: Completion[][] = [];
  for (const c of sortedComps) {
    if (superSeriesList.length === 0) {
      superSeriesList.push([c]);
    } else {
      const lastGroup = superSeriesList[superSeriesList.length - 1];
      const lastComp = lastGroup[lastGroup.length - 1];
      if (isGapBreak(lastComp.date, c.date)) {
        superSeriesList.push([c]);
      } else {
        lastGroup.push(c);
      }
    }
  }

  // 3. Process each super series
  const result: ComputedSeries[] = [];
  let seriesCounter = 0;

  for (const superSeries of superSeriesList) {
    const processingSeries: Completion[] = [];

    for (let compIndex = 0; compIndex < superSeries.length; compIndex++) {
      const c = superSeries[compIndex];

      // Determine definition for this completion
      let def: SeriesDefinition;
      if (c.date < defDate(firstDef)) {
        def = firstDef;
      } else {
        // Latest def with creationDate <= completion.date
        const matching = sortedDefs.filter((d) => defDate(d) <= c.date);
        def = matching[matching.length - 1];
      }

      processingSeries.push(c);

      if (processingSeries.length === def.seriesLength) {
        // Completed series
        seriesCounter++;
        result.push({
          number: seriesCounter,
          status: 'completed',
          seriesLength: def.seriesLength,
          reward: def.reward,
          currency: def.currency,
          startDate: processingSeries[0].date,
          endDate: processingSeries[processingSeries.length - 1].date,
          completions: [...processingSeries],
          definitionCreatedAt: def.createdAt,
        });
        processingSeries.length = 0;
      } else if (compIndex === superSeries.length - 1) {
        // Last completion of super series
        seriesCounter++;
        if (c.date >= virtualYesterday) {
          // Active — uses lastSeriesDefinition params
          result.push({
            number: seriesCounter,
            status: 'active',
            seriesLength: lastDef.seriesLength,
            reward: lastDef.reward,
            currency: lastDef.currency,
            startDate: processingSeries[0].date,
            endDate: undefined,
            completions: [...processingSeries],
            definitionCreatedAt: lastDef.createdAt,
          });
        } else {
          // Broken
          result.push({
            number: seriesCounter,
            status: 'broken',
            seriesLength: def.seriesLength,
            reward: def.reward,
            currency: def.currency,
            startDate: processingSeries[0].date,
            endDate: processingSeries[processingSeries.length - 1].date,
            completions: [...processingSeries],
            definitionCreatedAt: def.createdAt,
          });
        }
        processingSeries.length = 0;
      }
    }
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
