import type { SeriesDefinition } from '@/types';
import { useContext } from 'react';

import { ActivitiesContext } from './ActivitiesContext';

export function latestDef(defs: SeriesDefinition[], activityId: number): SeriesDefinition {
  const actDefs = defs.filter((d) => d.activityId === activityId);
  return actDefs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
}

/** Reads the shared activities store provided by ActivitiesProvider. */
export function useActivities() {
  const ctx = useContext(ActivitiesContext);
  if (!ctx) throw new Error('useActivities must be used within ActivitiesProvider');
  return ctx;
}
