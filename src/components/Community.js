import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api';

function Community({ onViewUser }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const list = await api.searchUsers(query.trim(), api.getClientId());
      setResults(Array.isArray(list) ? list : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async (userId) => {
    try {
      const res = await api.followUser(userId);
      const following = !!res?.following;
      setResults((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isFollowing: following } : u)),
      );
    } catch {
      // ignore for now
    }
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
              onChange={(e) => setQuery(e.target.value)}
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
                    onClick={() => toggleFollow(u.id)}
                  >
                    {u.isFollowing
                      ? t('community.following', 'Following')
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

