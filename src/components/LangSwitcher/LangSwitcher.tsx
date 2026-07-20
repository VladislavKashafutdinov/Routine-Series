import { useLocale } from '@/i18n/LocaleContext';
import './LangSwitcher.css';

export function LangSwitcher() {
  const { lang, setLang } = useLocale();
  return (
    <button
      className="app-lang"
      onClick={() => setLang(lang === 'en' ? 'ru' : 'en')}
      title={lang === 'en' ? 'Русский' : 'English'}
    >
      {lang === 'en' ? '🇷🇺 RU' : '🇬🇧 EN'}
    </button>
  );
}
