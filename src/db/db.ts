import Dexie, { type Table } from 'dexie';
import type { Activity, SeriesDefinition, Completion, RewardIssue } from '@/types';

export class RoutineDB extends Dexie {
  activities!: Table<Activity, number>;
  seriesDefinitions!: Table<SeriesDefinition, number>;
  completions!: Table<Completion, number>;
  rewardIssues!: Table<RewardIssue, number>;

  constructor() {
    super('RoutineSeriesDB');

    this.version(1).stores({
      activities: '++id, name, createdAt',
      completions: '++id, activityId, date, [activityId+date]',
    });

    this.version(2).stores({
      activities: '++id, name, createdAt',
      seriesDefinitions: '++id, activityId, createdAt',
      completions: '++id, activityId, date, [activityId+date]',
    }).upgrade(async (tx) => {
      const activities = await tx.table('activities').toArray();
      for (const a of activities) {
        const len = (a as any).seriesLength ?? 7;
        const reward = (a as any).reward ?? 0;
        const currency = (a as any).currency ?? '₽';
        await tx.table('seriesDefinitions').add({
          activityId: a.id,
          seriesLength: len,
          reward,
          currency,
          createdAt: a.createdAt,
        });
      }
    });

    this.version(3).stores({
      activities: '++id, name, createdAt',
      seriesDefinitions: '++id, activityId, createdAt',
      completions: '++id, activityId, date, [activityId+date]',
      rewardIssues: '++id, activityId, date',
    });
  }
}

export const db = new RoutineDB();
