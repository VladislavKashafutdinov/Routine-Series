import { createContext, useContext, useState } from 'react';
import { today } from '@/utils/date';

interface VirtualTodayValue {
  virtualToday: string;
  setVirtualToday: (date: string) => void;
}

const VirtualTodayContext = createContext<VirtualTodayValue>({
  virtualToday: today(),
  setVirtualToday: () => {},
});

export function VirtualTodayProvider({ children }: { children: React.ReactNode }) {
  const [virtualToday, setVirtualToday] = useState<string>(today);

  return (
    <VirtualTodayContext.Provider value={{ virtualToday, setVirtualToday }}>
      {children}
    </VirtualTodayContext.Provider>
  );
}

export function useVirtualToday(): VirtualTodayValue {
  return useContext(VirtualTodayContext);
}
