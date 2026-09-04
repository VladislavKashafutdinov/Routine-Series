import { Spinner } from '@components/Spinner/Spinner';
import { useLocale } from '@/i18n/LocaleContext';
import './RefreshButton.css';

interface Props {
  busy: boolean;
  onRefresh: () => void;
}

/** Desktop-only refresh button in the top-left corner of the header. */
export function RefreshButton({ busy, onRefresh }: Props) {
  const { t } = useLocale();
  return (
    <button className="refresh-btn" type="button" disabled={busy} title={t.refreshButton} onClick={onRefresh}>
      {busy ? <Spinner /> : '↻'}
    </button>
  );
}
