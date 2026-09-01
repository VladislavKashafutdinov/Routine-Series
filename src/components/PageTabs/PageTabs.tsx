import { useLocale } from '@/i18n/LocaleContext';
import './PageTabs.css';

export type Page = 'dashboard' | 'monitoring' | 'rewards' | 'archive';

interface Props {
  page: Page;
  onChange: (p: Page) => void;
  /** Count badges per tab (e.g. unissued rewards on the rewards tab). */
  badges?: Partial<Record<Page, number>>;
}

const PAGES: { key: Page; en: string; ru: string }[] = [
  { key: 'dashboard', en: 'Activities', ru: 'Активности' },
  { key: 'rewards', en: 'Rewards', ru: 'Награды' },
  { key: 'monitoring', en: 'Monitoring', ru: 'Мониторинг' },
];

export function PageTabs({ page, onChange, badges }: Props) {
  const { lang } = useLocale();

  return (
    <nav className="page-tabs">
      {PAGES.map((p) => {
        const badge = badges?.[p.key] ?? 0;
        return (
          <button
            key={p.key}
            className={`page-tabs__btn ${page === p.key ? 'page-tabs__btn--active' : ''}`}
            onClick={() => onChange(p.key)}
          >
            {lang === 'en' ? p.en : p.ru}
            {badge > 0 && <span className="page-tabs__badge">{badge}</span>}
          </button>
        );
      })}
    </nav>
  );
}
