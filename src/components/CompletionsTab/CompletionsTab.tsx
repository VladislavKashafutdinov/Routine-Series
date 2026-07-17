import { memo, useState } from 'react';
import { useVirtualToday } from '../../hooks/VirtualTodayContext';
import { useActivities } from '../../hooks/useActivities';
import type { ActivityWithStreak } from '../../types';
import './CompletionsTab.css';

const MONTHS_PER_PAGE = 3;

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES_RU = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

interface Props {
  activity: ActivityWithStreak;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function buildMonth(year: number, month: number): (string | null)[] {
  const days: (string | null)[] = [];
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  // Start from Monday (1), shift Sunday (0) to end
  const offset = firstDow === 0 ? 6 : firstDow - 1;
  for (let i = 0; i < offset; i++) days.push(null);
  const total = daysInMonth(year, month);
  for (let d = 1; d <= total; d++) {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    days.push(`${year}-${mm}-${dd}`);
  }
  return days;
}

function monthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

const DOW_EN = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const DOW_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export const CompletionsTab = memo(function CompletionsTab({ activity }: Props) {
  const { virtualToday } = useVirtualToday();
  const { toggleDate } = useActivities();
  const [page, setPage] = useState(0);

  const doneSet = new Set(activity.completions.map((c) => c.date));
  const todayDate = virtualToday;
  const today = new Date(todayDate + 'T00:00:00');

  // Generate months going backward from today
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const totalMonths = todayYear * 12 + todayMonth + 1; // months from epoch to today
  const totalPages = Math.max(1, Math.ceil(totalMonths / MONTHS_PER_PAGE));

  // Months for current page (most recent first)
  const startMonth = totalMonths - (page + 1) * MONTHS_PER_PAGE;
  const endMonth = startMonth + MONTHS_PER_PAGE - 1;

  const months: { key: string; name: string; days: (string | null)[] }[] = [];
  for (let m = Math.max(0, startMonth); m <= Math.min(totalMonths - 1, endMonth); m++) {
    const y = Math.floor(m / 12);
    const mo = m % 12;
    const isRu = navigator.language?.startsWith('ru');
    const names = isRu ? MONTH_NAMES_RU : MONTH_NAMES;
    months.push({
      key: monthKey(y, mo),
      name: `${names[mo]} ${y}`,
      days: buildMonth(y, mo),
    });
  }

  const isRu = navigator.language?.startsWith('ru');
  const dow = isRu ? DOW_RU : DOW_EN;

  return (
    <div className="ctab">
      <div className="ctab__months">
        {months.map((m) => (
          <div key={m.key} className="ctab__month">
            <div className="ctab__month-name">{m.name}</div>
            <div className="ctab__dow">
              {dow.map((d) => <span key={d}>{d}</span>)}
            </div>
            <div className="ctab__grid">
              {m.days.map((d, i) => {
                if (!d) return <span key={`e${i}`} className="ctab__day ctab__day--empty" />;
                const done = doneSet.has(d);
                const future = d > todayDate;
                return (
                  <span
                    key={d}
                    className={`ctab__day${done ? ' ctab__day--done' : ''}${future ? ' ctab__day--future' : ''}`}
                    onClick={!future ? () => toggleDate(activity.id, d) : undefined}
                    title={d}
                  >
                    {d.slice(8)}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="ctab__pager">
        <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} type="button">◀</button>
        <span>{page + 1} / {totalPages}</span>
        <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} type="button">▶</button>
      </div>
    </div>
  );
});
