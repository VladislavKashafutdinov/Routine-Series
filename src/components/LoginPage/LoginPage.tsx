import { useLocale } from '@/i18n/LocaleContext';
import './LoginPage.css';

/** Placeholder login screen for unauthenticated users (stub until feature 2/3). */
export function LoginPage() {
  const { t } = useLocale();
  return (
    <div className="login-page">
      <div className="login-page__card">
        <h1 className="login-page__title">Routine Series</h1>
        <p className="login-page__stub">{t.loginStub}</p>
      </div>
    </div>
  );
}
