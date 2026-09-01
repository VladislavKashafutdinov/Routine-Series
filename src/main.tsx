import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LocaleProvider } from './i18n/LocaleContext';
import { VirtualTodayProvider } from './hooks/VirtualTodayContext';
import { AuthProvider } from './hooks/AuthContext';
import { ToastProvider } from '@components/Toast/Toast';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocaleProvider>
      <VirtualTodayProvider>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </VirtualTodayProvider>
    </LocaleProvider>
  </StrictMode>,
);
