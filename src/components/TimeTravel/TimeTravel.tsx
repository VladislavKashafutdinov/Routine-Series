import { useLocale } from '../../i18n/LocaleContext';
import { useVirtualToday } from '../../hooks/VirtualTodayContext';
import { today, dayDiff } from '../../utils/date';
import './TimeTravel.css';

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function TimeTravel() {
  const { lang } = useLocale();
  const { virtualToday, setVirtualToday } = useVirtualToday();
  const realToday = today();
  const offset = dayDiff(realToday, virtualToday);

  return (
    <div className="time-travel">
      <button className="time-travel__btn" onClick={() => setVirtualToday(addDays(virtualToday, -1))}
        title={lang === 'en' ? 'Previous day' : 'Предыдущий день'}>◀</button>
      <span className={`time-travel__date ${offset !== 0 ? 'time-travel__date--virtual' : ''}`}>
        {virtualToday}
        {offset !== 0 && ` (${offset > 0 ? '+' : ''}${offset}d)`}
      </span>
      <button className="time-travel__btn" onClick={() => setVirtualToday(addDays(virtualToday, 1))}
        title={lang === 'en' ? 'Next day' : 'Следующий день'}>▶</button>
      {offset !== 0 && (
        <button className="time-travel__reset" onClick={() => setVirtualToday(realToday)}>
          {lang === 'en' ? 'Today' : 'Сегодня'}
        </button>
      )}
    </div>
  );
}
