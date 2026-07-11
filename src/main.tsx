import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LocaleProvider } from './i18n/LocaleContext';
import { VirtualTodayProvider } from './hooks/VirtualTodayContext';
import { SeriesProvider } from './hooks/SeriesContext';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocaleProvider>
      <VirtualTodayProvider>
        <SeriesProvider>
          <App />
        </SeriesProvider>
      </VirtualTodayProvider>
    </LocaleProvider>
  </StrictMode>,
);
