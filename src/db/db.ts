import Dexie, { type Table } from 'dexie';
import type { Activity, Completion } from '../types';

export class RoutineDB extends Dexie {
  activities!: Table<Activity, number>;
  completions!: Table<Completion, number>;

  constructor() {
    super('RoutineSeriesDB');
    this.version(1).stores({
      activities: '++id, name, createdAt',
      completions: '++id, activityId, date, [activityId+date]',
    });
  }
}

export const db = new RoutineDB();
