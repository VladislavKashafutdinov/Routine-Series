import { memo, useState } from 'react';
import { useLocale } from '../../i18n/LocaleContext';
import { useActivities, latestDef } from '../../hooks/useActivities';
import { useVirtualToday } from '../../hooks/VirtualTodayContext';
import type { ActivityWithStreak } from '../../types';
import './SeriesDefinitionTab.css';

const PER_PAGE = 10;

interface Props {
  activity: ActivityWithStreak;
}

export const SeriesDefinitionTab = memo(function SeriesDefinitionTab({ activity }: Props) {
  const { t } = useLocale();
  const { addSeriesDefinition, deleteSeriesDefinition } = useActivities();
  const { virtualToday } = useVirtualToday();
  const [page, setPage] = useState(0);

  // Show form for adding new definition
  if (activity.seriesDefinitions.length === 0) {
    return <div className="accordion__placeholder">{t.loading}</div>;
  }
  const def = latestDef(activity.seriesDefinitions, activity.id);
  const [showForm, setShowForm] = useState(false);
  const [length, setLength] = useState(def.seriesLength);
  const [reward, setReward] = useState(def.reward);
  const [currency, setCurrency] = useState(def.currency);

  const defs = [...activity.seriesDefinitions].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
  const total = defs.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const paged = defs.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (length < 1) return;
    await addSeriesDefinition(activity.id, length, reward, currency || '₽');
    setShowForm(false);
  };

  return (
    <div className="sdef-tab">
      {!showForm && (
        <button className="sdef-tab__add" onClick={() => setShowForm(true)} type="button">
          + {t.editSeries}
        </button>
      )}
      {showForm && (
        <form className="sdef-tab__form" onSubmit={handleSubmit}>
          <label className="sdef-tab__field">
            {t.seriesLengthLabel}
            <input className="sdef-tab__num" type="number" min={1} max={365} value={length} onChange={(e) => setLength(Number(e.target.value) || 1)} />
          </label>
          <label className="sdef-tab__field">
            {t.rewardLabel}
            <input className="sdef-tab__num" type="number" min={0} value={reward} onChange={(e) => setReward(Number(e.target.value) || 0)} />
          </label>
          <label className="sdef-tab__field">
            {t.currencyLabel}
            <input className="sdef-tab__num" type="text" maxLength={10} value={currency} onChange={(e) => setCurrency(e.target.value || '₽')} />
          </label>
          <button className="sdef-tab__save" type="submit">{t.editSeriesSave}</button>
          <button className="sdef-tab__cancel" type="button" onClick={() => setShowForm(false)}>{t.editSeriesCancel}</button>
        </form>
      )}

      {total === 0 ? (
        <div className="sdef-tab__empty">{t.noSeriesYet}</div>
      ) : (
        <table className="sdef-tab__table">
          <thead>
            <tr>
              <th>{t.seriesLengthLabel}</th>
              <th>{t.rewardLabel}</th>
              <th>{t.rewardCurrency}</th>
              <th>{t.rewardDate}</th>
              <th>{t.rewardActions}</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((d) => (
              <tr key={d.id}>
                <td>{d.seriesLength}</td>
                <td>{d.reward}</td>
                <td>{d.currency}</td>
                <td>{d.createdAt.toISOString().slice(0, 10)}</td>
                <td>
                  {d.createdAt.toISOString().slice(0, 10) >= virtualToday && defs.length > 1 && (
                    <button
                      className="sdef-tab__del"
                      onClick={() => {
                        if (confirm(t.deleteConfirm(t.seriesLengthLabel))) {
                          deleteSeriesDefinition(d.id!);
                        }
                      }}
                      type="button"
                    >
                      {t.deleteTitle}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {totalPages > 1 && (
        <div className="sdef-tab__pager">
          <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} type="button">◀</button>
          <span>{page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} type="button">▶</button>
        </div>
      )}
    </div>
  );
});
