import { useState } from 'react';
import type { FormEvent } from 'react';

import { requestLoginCode } from '@/api/auth';
import { ApiFetchError } from '@/api/fetch';
import { useLocale } from '@/i18n/LocaleContext';
import './LoginPage.css';

type Step = 'email' | 'sent';

/**
 * Login screen: the email form sends a login code (feature 2).
 * Code entry replaces the stub in feature 3.
 */
export function LoginPage() {
  const { t } = useLocale();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      await requestLoginCode(email);
      setStep('sent');
    } catch (err) {
      if (err instanceof ApiFetchError && err.status === 400) {
        setError(t.loginEmailError);
      } else {
        setError(t.loginSendError);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__card">
        <h1 className="login-page__title">Routine Series</h1>
        {step === 'email' ? (
          <form className="login-page__form" onSubmit={handleSubmit}>
            <input
              className="login-page__input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
            />
            {error && <p className="login-page__error">{error}</p>}
            <button className="login-page__button" type="submit" disabled={sending}>
              {sending ? t.loading : t.loginSendCode}
            </button>
          </form>
        ) : (
          <div className="login-page__sent">
            <p className="login-page__sent-to">{t.loginSentTo(email)}</p>
            <p className="login-page__stub">{t.loginCodeStub}</p>
            <button className="login-page__link" type="button" onClick={() => setStep('email')}>
              {t.loginChangeEmail}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
