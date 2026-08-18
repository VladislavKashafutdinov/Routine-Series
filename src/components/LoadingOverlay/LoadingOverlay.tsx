import { useLocale } from '@/i18n/LocaleContext';
import './LoadingOverlay.css';

/** Full-screen overlay blocking interaction while the whole dataset loads from the API. */
export function LoadingOverlay() {
  const { t } = useLocale();

  return (
    <div className="loading-overlay" role="status" aria-live="polite">
      <div className="loading-overlay__spinner" aria-hidden="true" />
      <p className="loading-overlay__text">{t.loading}</p>
    </div>
  );
}
