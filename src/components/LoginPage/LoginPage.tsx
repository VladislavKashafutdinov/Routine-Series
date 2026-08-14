import { useState } from 'react';
import type { FormEvent } from 'react';

import { requestLoginCode } from '@/api/auth';
import { ApiFetchError } from '@/api/fetch';
import { useAuth } from '@/hooks/AuthContext';
import { useLocale } from '@/i18n/LocaleContext';
import './LoginPage.css';

type Step = 'email' | 'code';

/** Login screen: email → code → session (the app gates on AuthContext). */
export function LoginPage() {
  const { t } = useLocale();
  const { verify } = useAuth();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const sendCode = async () => {
    setError('');
    setSending(true);
    try {
      await requestLoginCode(email);
      setStep('code');
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

  const handleEmailSubmit = (e: FormEvent) => {
    e.preventDefault();
    void sendCode();
  };

  const handleCodeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      // On success AuthContext switches to authenticated and App unmounts this page.
      await verify(email, code);
    } catch (err) {
      if (err instanceof ApiFetchError && err.status === 400) {
        setError(t.loginCodeError);
      } else {
        setError(t.loginSendError);
      }
      setSending(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__card">
        <h1 className="login-page__title">Routine Series</h1>
        {step === 'email' ? (
          <form className="login-page__form" onSubmit={handleEmailSubmit}>
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
          <form className="login-page__form" onSubmit={handleCodeSubmit}>
            <p className="login-page__sent-to">{t.loginSentTo(email)}</p>
            <input
              className="login-page__input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="••••••"
              required
              autoFocus
            />
            {error && <p className="login-page__error">{error}</p>}
            <button className="login-page__button" type="submit" disabled={sending || code.length !== 6}>
              {sending ? t.loading : t.loginVerifyCode}
            </button>
            <button className="login-page__link" type="button" disabled={sending} onClick={() => void sendCode()}>
              {t.loginResendCode}
            </button>
            <button
              className="login-page__link"
              type="button"
              onClick={() => {
                setStep('email');
                setCode('');
                setError('');
              }}
            >
              {t.loginChangeEmail}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
