import React from 'react';
import { useTranslation } from 'react-i18next';

function AuthGate({ onLogin, onSignup }) {
  const { t } = useTranslation();

  return (
    <div className="auth-gate">
      <div className="auth-gate-bg" aria-hidden>
        <div className="auth-gate-bg-field auth-gate-bg-field-1" />
        <div className="auth-gate-bg-field auth-gate-bg-field-2" />
        <div className="auth-gate-bg-field auth-gate-bg-field-3" />
        <div className="auth-gate-bg-sun" />
        <div className="auth-gate-bg-leaf auth-gate-bg-leaf-1" />
        <div className="auth-gate-bg-leaf auth-gate-bg-leaf-2" />
        <div className="auth-gate-bg-leaf auth-gate-bg-leaf-3" />
      </div>
      <div className="auth-gate-card">
        <div className="auth-gate-brand">
          <h1 className="auth-gate-title">{t('app.title', 'AgroVibes')}</h1>
          <p className="auth-gate-tagline">
            {t('authGate.tagline', 'Farming community, marketplace, and learning — in one place.')}
          </p>
        </div>
        <div className="auth-gate-actions">
          <button
            type="button"
            className="primary-btn auth-gate-btn auth-gate-signup"
            onClick={onSignup}
          >
            {t('auth.signUp', 'Sign up')}
          </button>
          <button
            type="button"
            className="ghost-btn auth-gate-btn auth-gate-login"
            onClick={onLogin}
          >
            {t('auth.logIn', 'Log in')}
          </button>
        </div>
        {/* <select
          className="auth-gate-lang"
          value={i18n.language && i18n.language.split('-')[0]}
          onChange={(e) => i18n.changeLanguage(e.target.value)}
          aria-label={t('language.label', 'Language')}
        >
          <option value="en">{t('language.en', 'English')}</option>
          <option value="te">{t('language.te', 'Telugu')}</option>
          <option value="hi">{t('language.hi', 'Hindi')}</option>
        </select> */}
      </div>
    </div>
  );
}

export default AuthGate;
