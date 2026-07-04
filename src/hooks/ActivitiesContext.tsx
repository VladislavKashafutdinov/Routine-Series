import { createContext, useContext } from 'react';
import type { ActivityWithSeries } from '../types';

export interface ActivitiesData {
  activities: ActivityWithSeries[];
  loading: boolean;
  addActivity: (name: string, seriesLength: number, reward: number, currency: string) => Promise<void>;
  toggleDone: (activityId: number) => Promise<void>;
  toggleDate: (activityId: number, date: string) => void;
  claimReward: (seriesId: number) => Promise<void>;
  deleteActivity: (activityId: number) => Promise<void>;
}

const ActivitiesContext = createContext<ActivitiesData | null>(null);

export function ActivitiesProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: ActivitiesData;
}) {
  return (
    <ActivitiesContext.Provider value={value}>
      {children}
    </ActivitiesContext.Provider>
  );
}

export function useActivitiesContext(): ActivitiesData {
  const ctx = useContext(ActivitiesContext);
  if (!ctx) throw new Error('useActivitiesContext must be used within ActivitiesProvider');
  return ctx;
}
