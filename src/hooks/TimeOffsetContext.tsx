import { createContext, useContext, useState } from 'react';

interface TimeOffsetValue {
  offset: number;
  setOffset: (n: number) => void;
}

const TimeOffsetContext = createContext<TimeOffsetValue>({
  offset: 0,
  setOffset: () => {},
});

export function TimeOffsetProvider({ children }: { children: React.ReactNode }) {
  const [offset, setOffset] = useState(0);
  return (
    <TimeOffsetContext.Provider value={{ offset, setOffset }}>
      {children}
    </TimeOffsetContext.Provider>
  );
}

export function useTimeOffset(): TimeOffsetValue {
  return useContext(TimeOffsetContext);
}
