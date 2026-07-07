import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LocaleProvider } from './i18n/LocaleContext';
import { TimeOffsetProvider } from './hooks/TimeOffsetContext';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocaleProvider>
      <TimeOffsetProvider>
        <App />
      </TimeOffsetProvider>
    </LocaleProvider>
  </StrictMode>,
);
