import { useEffect } from 'react';
import { useLocale } from '../i18n/LocaleContext';
import { useTimeOffset } from '../hooks/TimeOffsetContext';
import { useVirtualToday } from '../hooks/VirtualTodayContext';
import { today } from '../utils/date';

export function TimeTravel() {
  const { lang } = useLocale();
  const { offset, setOffset } = useTimeOffset();
  const { setVirtualToday } = useVirtualToday();
  const displayDate = today(offset);

  // Sync virtualToday whenever offset changes
  useEffect(() => {
    setVirtualToday(today(offset));
  }, [offset, setVirtualToday]);

  return (
    <div className="time-travel">
      <button className="time-travel__btn" onClick={() => setOffset(offset - 1)}
        title={lang === 'en' ? 'Previous day' : 'Предыдущий день'}>◀</button>
      <span className={`time-travel__date ${offset !== 0 ? 'time-travel__date--virtual' : ''}`}>
        {displayDate}
        {offset !== 0 && ` (${offset > 0 ? '+' : ''}${offset}d)`}
      </span>
      <button className="time-travel__btn" onClick={() => setOffset(offset + 1)}
        title={lang === 'en' ? 'Next day' : 'Следующий день'}>▶</button>
      {offset !== 0 && (
        <button className="time-travel__reset" onClick={() => setOffset(0)}>
          {lang === 'en' ? 'Today' : 'Сегодня'}
        </button>
      )}
    </div>
  );
}
