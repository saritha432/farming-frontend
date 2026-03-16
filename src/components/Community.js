import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const FOLLOW_REQUESTS_KEY = 'agrovibes_follow_requests';

function loadFollowRequests() {
  try {
    const raw = window.localStorage.getItem(FOLLOW_REQUESTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFollowRequests(list) {
  try {
    window.localStorage.setItem(FOLLOW_REQUESTS_KEY, JSON.stringify(list || []));
  } catch {
    // ignore
  }
}

// Try multiple possible id fields so search + profile stay in sync
function getUserKey(u) {
  if (!u) return null;
  return u.id || u._id || u.userId || u.email || u.username || null;
}

function Community({ onViewUser }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const list = await api.searchUsers(query.trim(), api.getClientId());
      const allRequests = loadFollowRequests();
      const fromId = getUserKey(user);
      const enhanced = (Array.isArray(list) ? list : []).map((u) => {
        const targetId = getUserKey(u);
        const hasPending =
          fromId &&
          targetId &&
          allRequests.some(
            (r) =>
              r.fromId === fromId &&
              r.toId === targetId &&
              r.status === 'pending',
          );
        return hasPending ? { ...u, requestStatus: 'pending' } : u;
      });
      setResults(enhanced);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const sendFollowRequest = (targetUser) => {
    if (!user) {
      alert(t('community.loginToFollow', 'Please log in to follow users.'));
      return;
    }
    const fromId = getUserKey(user);
    const toId = getUserKey(targetUser);
    if (!fromId || !toId) return;

    const all = loadFollowRequests();
    const alreadyPending = all.some(
      (r) =>
        r.fromId === fromId &&
        r.toId === toId &&
        r.status === 'pending',
    );
    if (alreadyPending) return;

    const request = {
      id: Date.now(),
      fromId: fromId,
      fromName: user.username || user.fullName || user.email || 'User',
      toId: toId,
      toName: targetUser.username || targetUser.fullName || targetUser.email || 'User',
      status: 'pending',
    };
    const next = [...all, request];
    saveFollowRequests(next);
    setResults((prev) =>
      prev.map((u) => {
        const uid = getUserKey(u);
        return uid && uid === toId ? { ...u, requestStatus: 'pending' } : u;
      }),
    );
  };
  

  return (
    <section className="section">
      <header className="section-header">
        <div className="section-header-main">
          <h2>{t('community.title')}</h2>
          <p>{t('community.description')}</p>
        </div>
      </header>

      <div className="card form-card">
        <h3 className="list-title">{t('community.searchUsers', 'Search users')}</h3>
        <form onSubmit={handleSearch}>
          <label className="form-label">
            {t('community.searchLabel', 'Search by name or email')}
            <input
              type="search"
              className="form-input"
              value={query}
              onChange={(e) => {
                const value = e.target.value;
                setQuery(value);
                if (value.trim() === '') {
                  setResults([]);
                }
              }}
              placeholder={t('community.searchPlaceholder', 'e.g. johndoe')}
            />
          </label>
          <div className="card-footer-row mt">
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading
                ? t('community.searching', 'Searching…')
                : t('community.searchButton', 'Search')}
            </button>
          </div>
        </form>
      </div>

      {results.length > 0 && (
        <article className="card">
          <h3>{t('community.resultsTitle', 'People')}</h3>
          <ul className="list">
            {results.map((u) => (
              <li key={u.id} className="list-item">
                <div>
                  <div className="list-title">
                    {u.username || u.fullName || u.email || 'User'}
                  </div>
                  <div className="muted">
                    {u.fullName && u.fullName !== u.username ? u.fullName : null}
                    {u.fullName && u.email ? ' • ' : ''}
                    {u.email}
                  </div>
                </div>
                <div className="card-footer-row">
                  <button
                    type="button"
                    className="small-btn"
                    onClick={() => sendFollowRequest(u)}
                  >
                    {u.requestStatus === 'pending'
                      ? t('community.requested', 'Requested')
                      : t('community.follow', 'Follow')}
                  </button>
                  {onViewUser && (
                    <button
                      type="button"
                      className="small-btn"
                      onClick={() => onViewUser(u)}
                    >
                      {t('community.viewProfile', 'View posts')}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </article>
      )}
    </section>
  );
}

export default Community;

