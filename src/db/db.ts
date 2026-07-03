import Dexie, { type Table } from 'dexie';
import type { Activity, Series, Completion } from '../types';

export class RoutineDB extends Dexie {
  activities!: Table<Activity, number>;
  series!: Table<Series, number>;
  completions!: Table<Completion, number>;

  constructor() {
    super('RoutineSeriesDB');

    this.version(1).stores({
      activities: '++id, name, createdAt',
      completions: '++id, activityId, date, [activityId+date]',
    });

    this.version(2).stores({
      activities: '++id, name, createdAt',
      series: '++id, activityId, status, [activityId+status]',
      completions: '++id, seriesId, activityId, date, [activityId+date]',
    }).upgrade(async (tx) => {
      // Add default fields to existing activities
      const activities = await tx.table('activities').toArray();
      for (const a of activities) {
        await tx.table('activities').update(a.id, {
          seriesLength: 7,
          reward: 0,
          currency: '₽',
        });
      }
      // Migrate existing completions: assign seriesId = 0 (will be fixed on next load)
      const completions = await tx.table('completions').toArray();
      for (const c of completions) {
        await tx.table('completions').update(c.id, { seriesId: 0 });
      }
    });
  }
}

export const db = new RoutineDB();
