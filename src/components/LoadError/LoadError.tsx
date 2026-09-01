import { useLocale } from '@/i18n/LocaleContext';
import './LoadError.css';

/** Error state shown when the initial data load failed after all retries. */
export function LoadError({ retry }: { retry: () => void }) {
  const { t } = useLocale();
  return (
    <div className="load-error">
      <p className="load-error__message">{t.loadErrorMessage}</p>
      <button type="button" className="load-error__retry" onClick={retry}>
        {t.retryButton}
      </button>
    </div>
  );
}
