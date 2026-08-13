import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LocaleProvider } from './i18n/LocaleContext';
import { ActivitiesProvider } from './hooks/ActivitiesContext';
import { VirtualTodayProvider } from './hooks/VirtualTodayContext';
import { SeriesProvider } from './hooks/SeriesContext';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocaleProvider>
      <VirtualTodayProvider>
        <ActivitiesProvider>
          <SeriesProvider>
            <App />
          </SeriesProvider>
        </ActivitiesProvider>
      </VirtualTodayProvider>
    </LocaleProvider>
  </StrictMode>,
);
