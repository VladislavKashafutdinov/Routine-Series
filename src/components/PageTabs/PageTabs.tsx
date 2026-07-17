import { useLocale } from '../../i18n/LocaleContext';
import './PageTabs.css';

export type Page = 'dashboard' | 'monitoring' | 'archive';

interface Props {
  page: Page;
  onChange: (p: Page) => void;
}

const PAGES: { key: Page; en: string; ru: string }[] = [
  { key: 'dashboard', en: 'Activities', ru: 'Активности' },
  { key: 'monitoring', en: 'Monitoring', ru: 'Мониторинг' },
  { key: 'archive', en: 'Archive', ru: 'Архив' },
];

export function PageTabs({ page, onChange }: Props) {
  const { lang } = useLocale();

  return (
    <nav className="page-tabs">
      {PAGES.map((p) => (
        <button
          key={p.key}
          className={`page-tabs__btn ${page === p.key ? 'page-tabs__btn--active' : ''}`}
          onClick={() => onChange(p.key)}
        >
          {lang === 'en' ? p.en : p.ru}
        </button>
      ))}
    </nav>
  );
}
