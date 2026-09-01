import { describe, expect, it } from 'vitest';

import { calcUnissuedEntries } from './rewards';
import type { ActivityWithStreak, Completion, ComputedSeries, RewardIssue, SeriesDefinition } from '@/types';

function makeSeries(reward: number, currency: string): ComputedSeries {
  return {
    number: 1,
    status: 'completed',
    seriesLength: 7,
    reward,
    currency,
    startDate: '2026-08-01',
    endDate: '2026-08-07',
    completions: [] as Completion[],
    definitionCreatedAt: new Date('2026-08-01'),
  };
}

function makeActivity(id: number, rewardIssues: RewardIssue[]): ActivityWithStreak {
  return {
    id,
    name: `activity-${id}`,
    archived: false,
    createdAt: new Date('2026-08-01'),
    completions: [],
    rewardIssues,
    seriesDefinitions: [] as SeriesDefinition[],
  };
}

describe('calcUnissuedEntries', () => {
  it('returns one entry per activity and currency with a positive unissued amount', () => {
    const activity = makeActivity(1, [{ id: 1, activityId: 1, date: '2026-08-10', amount: 4, currency: '₽' }]);
    const seriesMap = new Map<number, ComputedSeries[]>([[1, [makeSeries(10, '₽')]]]);

    const entries = calcUnissuedEntries([activity], seriesMap);

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ activity, currency: '₽', amount: 6 });
  });

  it('skips activities whose rewards are fully issued', () => {
    const activity = makeActivity(2, [{ id: 2, activityId: 2, date: '2026-08-10', amount: 5, currency: '$' }]);
    const seriesMap = new Map<number, ComputedSeries[]>([[2, [makeSeries(5, '$')]]]);

    expect(calcUnissuedEntries([activity], seriesMap)).toHaveLength(0);
  });
});
