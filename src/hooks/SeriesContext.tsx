import { createContext, useContext, useMemo } from 'react';
import { useActivities } from './useActivities';
import { useVirtualToday } from './VirtualTodayContext';
import { computeSeries } from '@/utils/series';
import type { ComputedSeries } from '@/types';

interface SeriesValue {
  getSeries: (activityId: number) => ComputedSeries[];
}

const SeriesContext = createContext<SeriesValue>({
  getSeries: () => [],
});

export function SeriesProvider({ children }: { children: React.ReactNode }) {
  const { activities } = useActivities();
  const { virtualToday } = useVirtualToday();

  const seriesMap = useMemo(() => {
    const map = new Map<number, ComputedSeries[]>();
    for (const a of activities) {
      map.set(a.id, computeSeries(a.seriesDefinitions, a.completions, virtualToday));
    }
    return map;
  }, [activities, virtualToday]);

  const value = useMemo<SeriesValue>(() => ({
    getSeries: (activityId: number) => seriesMap.get(activityId) || [],
  }), [seriesMap]);

  return (
    <SeriesContext.Provider value={value}>
      {children}
    </SeriesContext.Provider>
  );
}

export function useSeries(activityId: number): ComputedSeries[] {
  const { getSeries } = useContext(SeriesContext);
  return getSeries(activityId);
}

export function useAllSeries(): Map<number, ComputedSeries[]> {
  // Recompute is handled by the provider's useMemo; we just need the map
  // Access the internal seriesMap via the getSeries + activities
  const { getSeries } = useContext(SeriesContext);
  const { activities } = useActivities();
  const map = new Map<number, ComputedSeries[]>();
  for (const a of activities) {
    map.set(a.id, getSeries(a.id));
  }
  return map;
}
