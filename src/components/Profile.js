import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import Modal from './Modal';

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

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const mediaUrl = (path) => (path && path.startsWith('/') ? BASE + path : path);

function Profile({ posts = [], onEditProfile, onOpenLogin, onOpenSignup }) {
  const { t } = useTranslation();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [myPosts, setMyPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [followRequests, setFollowRequests] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    setEditBio(user.bio || '');
    setEditFullName(user.fullName || user.username || '');
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    setLoadingPosts(true);
    const mine = (posts || [])
      .filter(
        (p) =>
          p.userId === user.id ||
          p.farmer === user.fullName ||
          p.farmer === user.username
      )
      .sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
    setMyPosts(mine);
    setLoadingPosts(false);
  }, [isAuthenticated, user, posts]);

  useEffect(() => {
    if (!user) return;
    const all = loadFollowRequests();
    const mine = all.filter(
      (r) => r.toId === user.id && r.status === 'pending',
    );
    setFollowRequests(mine);
  }, [user]);

  const handleFollowRequest = (id, status) => {
    const all = loadFollowRequests();
    const updated = all.map((r) =>
      r.id === id ? { ...r, status } : r,
    );
    saveFollowRequests(updated);
    setFollowRequests(
      updated.filter(
        (r) => r.toId === user.id && r.status === 'pending',
      ),
    );
  };

  const displayPosts = myPosts.length > 0 ? myPosts : (posts.filter((p) => p.farmer === user?.fullName || p.farmer === user?.username) || []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    try {
      await api.updateProfile({ fullName: editFullName.trim(), bio: editBio.trim() });
      await refreshUser();
      if (onEditProfile) onEditProfile();
      setShowEditModal(false);
    } catch {
      // show toast in real app
    } finally {
      setSavingProfile(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <section className="section profile-section">
        <div className="profile-gate card empty-state">
          <div className="empty-state-icon" aria-hidden>👤</div>
          <h3>{t('profile.logInToView', 'Log in to see your profile')}</h3>
          <p>{t('profile.logInToViewDesc', 'Sign in or create an account to view your profile and posts.')}</p>
          <div className="profile-gate-actions">
            {onOpenLogin && (
              <button type="button" className="primary-btn" onClick={onOpenLogin}>
                {t('auth.logIn', 'Log in')}
              </button>
            )}
            {onOpenSignup && (
              <button type="button" className="ghost-btn" onClick={onOpenSignup}>
                {t('auth.signUp', 'Sign up')}
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section profile-section">
      <div className="profile-header card">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">
            {user.avatar ? (
              <img src={user.avatar} alt="" />
            ) : (
              <span className="profile-avatar-initial">{(user.fullName || user.username || 'U').charAt(0).toUpperCase()}</span>
            )}
          </div>
        </div>
        <div className="profile-info">
          <h1 className="profile-username">{user.username || user.fullName}</h1>
          {user.fullName && user.fullName !== user.username && (
            <p className="profile-full-name">{user.fullName}</p>
          )}
          {user.bio && <p className="profile-bio">{user.bio}</p>}
          <div className="profile-stats">
            <span><strong>{displayPosts.length}</strong> {t('profile.posts', 'posts')}</span>
            <span><strong>0</strong> {t('profile.followers', 'followers')}</span>
            <span><strong>0</strong> {t('profile.following', 'following')}</span>
          </div>
          <div className="profile-actions">
            <button type="button" className="primary-btn" onClick={() => setShowEditModal(true)}>
              {t('profile.editProfile', 'Edit profile')}
            </button>
          </div>
        </div>
      </div>

      <div className="profile-posts-section">
        {followRequests.length > 0 && (
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h2 className="profile-posts-title">
              {t('profile.followRequests', 'Follow requests')}
            </h2>
            <ul className="list">
              {followRequests.map((r) => (
                <li key={r.id} className="list-item">
                  <div>
                    <div className="list-title">
                      {r.fromName}
                    </div>
                  </div>
                  <div className="card-footer-row">
                    <button
                      type="button"
                      className="small-btn"
                      onClick={() => handleFollowRequest(r.id, 'accepted')}
                    >
                      {t('profile.accept', 'Accept')}
                    </button>
                    <button
                      type="button"
                      className="small-btn"
                      onClick={() => handleFollowRequest(r.id, 'rejected')}
                    >
                      {t('profile.reject', 'Reject')}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        <h2 className="profile-posts-title">{t('profile.posts', 'Posts')}</h2>
        {loadingPosts ? (
          <div className="profile-grid profile-grid-skeleton">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="profile-grid-item skeleton" />
            ))}
          </div>
        ) : displayPosts.length === 0 ? (
          <div className="profile-empty-posts card">
            <div className="empty-state-icon">📷</div>
            <p>{t('profile.noPostsYet', 'No posts yet')}</p>
          </div>
        ) : (
          <div className="profile-grid">
            {displayPosts.map((post) => {
              const src = mediaUrl(post.mediaUrl || post.media || post.url || post.image);
              const handleOpenPost = () => {
                setSelectedPost(post);
                setShowPostModal(true);
              };
              return (
                <button
                  key={post.id}
                  type="button"
                  className="profile-grid-item"
                  onClick={handleOpenPost}
                >
                  {src ? (
                    post.type === 'Video' ? (
                      <video src={src} muted />
                    ) : (
                      <img src={src} alt={post.title || ''} />
                    )
                  ) : (
                    <div className="profile-grid-placeholder">{post.title || '📷'}</div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {showEditModal && (
        <Modal title={t('profile.editProfile', 'Edit profile')} onClose={() => setShowEditModal(false)}>
          <form onSubmit={handleSaveProfile} className="form">
            <label className="form-label">
              {t('auth.fullName', 'Full name')}
              <input
                type="text"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                className="form-input"
              />
            </label>
            <label className="form-label">
              {t('profile.bio', 'Bio')}
              <textarea
                rows={3}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                className="form-input"
                placeholder={t('profile.bioPlaceholder', 'Tell others about your farm...')}
              />
            </label>
            <div className="card-footer-row mt">
              <button type="submit" className="primary-btn" disabled={savingProfile}>
                {savingProfile ? t('common.saving', 'Saving…') : t('common.save', 'Save')}
              </button>
              <button type="button" className="ghost-btn" onClick={() => setShowEditModal(false)}>
                {t('common.cancel', 'Cancel')}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showPostModal && selectedPost && (
        <Modal
          title={selectedPost.title || t('profile.postDetails', 'Post')}
          onClose={() => {
            setShowPostModal(false);
            setSelectedPost(null);
          }}
        >
          <div className="profile-post-modal">
            <div className="profile-post-modal-media">
              {(() => {
                const src = mediaUrl(
                  selectedPost.mediaUrl ||
                    selectedPost.media ||
                    selectedPost.url ||
                    selectedPost.image,
                );
                if (!src) {
                  return (
                    <div className="profile-grid-placeholder">
                      {selectedPost.title || '📷'}
                    </div>
                  );
                }
                if (selectedPost.type === 'Video') {
                  return <video src={src} controls style={{ width: '100%' }} />;
                }
                return <img src={src} alt={selectedPost.title || ''} style={{ width: '100%' }} />;
              })()}
            </div>
            <div className="profile-post-modal-body">
              <div className="profile-post-meta">
                <div className="profile-post-author">
                  {selectedPost.farmer || user?.fullName || user?.username}
                </div>
                {selectedPost.location && (
                  <div className="profile-post-location">
                    {selectedPost.location}
                  </div>
                )}
              </div>
              {selectedPost.description && (
                <p className="profile-post-description">
                  {selectedPost.description}
                </p>
              )}
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}

export default Profile;
