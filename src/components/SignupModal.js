import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';

function SignupModal({ onClose, onSuccess, onSwitchToLogin }) {
  const { t } = useTranslation();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const form = e.target;
    const username = form.username?.value?.trim();
    const fullName = form.fullName?.value?.trim();
    const email = form.email?.value?.trim();
    const password = form.password?.value;
    const role = (form.role?.value || 'user').toString();
    if (!username || !fullName || !email || !password) {
      setError(t('auth.allFieldsRequired', 'All fields are required'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.passwordTooShort', 'Password must be at least 6 characters'));
      return;
    }
    setSubmitting(true);
    try {
      await onSuccess({ username, fullName, email, password, role });
      onClose();
    } catch (err) {
      setError(err.body?.message || err.message || t('auth.signupFailed', 'Sign up failed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={t('auth.signUp', 'Sign up')} onClose={onClose}>
      <form onSubmit={handleSubmit} className="form auth-form">
        {error && <p className="form-error auth-form-error">{error}</p>}
        <label className="form-label">
          {t('auth.username', 'Username')}
          <input
            type="text"
            name="username"
            autoComplete="username"
            required
            className="form-input"
            placeholder={t('auth.usernamePlaceholder', 'johndoe')}
          />
        </label>
        <label className="form-label">
          {t('auth.fullName', 'Full name')}
          <input
            type="text"
            name="fullName"
            autoComplete="name"
            required
            className="form-input"
            placeholder={t('auth.fullNamePlaceholder', 'John Doe')}
          />
        </label>
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
            autoComplete="new-password"
            required
            minLength={6}
            className="form-input"
            placeholder="••••••••"
          />
        </label>
        <fieldset className="auth-role-fieldset">
          <legend className="auth-role-legend">{t('auth.accountType', 'Account type')}</legend>
          <label className="auth-role-option">
            <input type="radio" name="role" value="user" defaultChecked />
            <span>{t('auth.roleUser', 'Farmer / user — book machinery, feed, community')}</span>
          </label>
          <label className="auth-role-option">
            <input type="radio" name="role" value="provider" />
            <span>{t('auth.roleProvider', 'Service provider — list equipment for rent or sale')}</span>
          </label>
        </fieldset>
        <div className="card-footer-row mt">
          <button type="submit" className="primary-btn full-width" disabled={submitting}>
            {submitting ? t('auth.signingUp', 'Signing up…') : t('auth.signUp', 'Sign up')}
          </button>
        </div>
        {onSwitchToLogin && (
          <p className="auth-form-switch">
            {t('auth.haveAccount', 'Already have an account?')}{' '}
            <button type="button" className="auth-form-link" onClick={onSwitchToLogin}>
              {t('auth.logIn', 'Log in')}
            </button>
          </p>
        )}
      </form>
    </Modal>
  );
}

export default SignupModal;
