import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';

function LoginModal({ onClose, onSuccess, onSwitchToSignup }) {
  const { t } = useTranslation();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const form = e.target;
    const email = form.email?.value?.trim();
    const password = form.password?.value;
    if (!email || !password) {
      setError(t('auth.emailAndPasswordRequired', 'Email and password are required'));
      return;
    }
    setSubmitting(true);
    try {
      await onSuccess({ email, password });
      onClose();
    } catch (err) {
      setError(err.body?.message || err.message || t('auth.loginFailed', 'Login failed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={t('auth.logIn', 'Log in')} onClose={onClose}>
      <form onSubmit={handleSubmit} className="form auth-form">
        {error && <p className="form-error auth-form-error">{error}</p>}
        <label className="form-label">
          {t('auth.email', 'Email')}
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            className="form-input"
            placeholder={t('auth.emailPlaceholder', 'you@example.com')}
          />
        </label>
        <label className="form-label">
          {t('auth.password', 'Password')}
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            className="form-input"
            placeholder="••••••••"
          />
        </label>
        <div className="card-footer-row mt">
          <button type="submit" className="primary-btn full-width" disabled={submitting}>
            {submitting ? t('auth.loggingIn', 'Logging in…') : t('auth.logIn', 'Log in')}
          </button>
        </div>
        {onSwitchToSignup && (
          <p className="auth-form-switch">
            {t('auth.noAccount', "Don't have an account?")}{' '}
            <button type="button" className="auth-form-link" onClick={onSwitchToSignup}>
              {t('auth.signUp', 'Sign up')}
            </button>
          </p>
        )}
      </form>
    </Modal>
  );
}

export default LoginModal;
