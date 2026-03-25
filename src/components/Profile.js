import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import Modal from './Modal';

// Follow requests are now loaded from the backend via api.getMyFollowRequests.

// Keep a single way of identifying users across search/profile
function getUserKey(u) {
  if (!u) return null;
  return u.id || u._id || u.userId || u.email || u.username || null;
}

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const mediaUrl = (path) => (path && path.startsWith('/') ? BASE + path : path);

function Profile({ posts = [], onEditProfile, onOpenLogin, onOpenSignup, onViewUser }) {
  const { t } = useTranslation();
  const { user, isAuthenticated, refreshUser, updateUser } = useAuth();
  const [myPosts, setMyPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [followRequests, setFollowRequests] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setEditBio(user.bio || '');
    setEditFullName(user.fullName || user.username || '');
    setEditWebsite(user.website || '');
    setEditAvatar(user.avatar || '');
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
    api
      .getMyFollowRequests(user.id, 'pending')
      .then((list) => {
        setFollowRequests(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        setFollowRequests([]);
      });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    api
      .getFollowers(user.id)
      .then((list) => setFollowers(Array.isArray(list) ? list : []))
      .catch(() => setFollowers([]));
    api
      .getFollowing(user.id)
      .then((list) => setFollowing(Array.isArray(list) ? list : []))
      .catch(() => setFollowing([]));
  }, [user]);

  const handleFollowRequest = async (id, status) => {
    const action = status === 'accepted' ? 'accept' : 'reject';
    try {
      await api.respondFollowRequest(id, action);
      setFollowRequests((prev) =>
        prev.filter((r) => r.id !== id && r._id !== id),
      );
    } catch {
      // ignore for now or show toast in future
    }
  };

  const displayPosts = myPosts.length > 0 ? myPosts : (posts.filter((p) => p.farmer === user?.fullName || p.farmer === user?.username) || []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    try {
      const avatarVal = editAvatar.trim();
      const avatarForApi =
        avatarVal.startsWith('blob:') ? user.avatar || '' : avatarVal;
      const payload = {
        fullName: editFullName.trim(),
        bio: editBio.trim(),
        website: editWebsite.trim(),
        avatar: avatarForApi,
      };
      await api.updateProfile(payload);
      // Backend may not support /me for all deployments yet; keep UI consistent locally.
      if (typeof updateUser === 'function') updateUser(payload);
      await refreshUser();
      if (onEditProfile) onEditProfile();
      setShowEditModal(false);
    } catch {
      // If backend update fails, still update local cached user so UI reflects changes.
      const avatarVal = editAvatar.trim();
      const avatarForApi =
        avatarVal.startsWith('blob:') ? user.avatar || '' : avatarVal;
      const payload = {
        fullName: editFullName.trim(),
        bio: editBio.trim(),
        website: editWebsite.trim(),
        avatar: avatarForApi,
      };
      if (typeof updateUser === 'function') updateUser(payload);
      setShowEditModal(false);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarFile = async (file) => {
    if (!file) return;
    const prevAvatar = user?.avatar || '';
    let objectUrl = null;
    setAvatarUploading(true);
    try {
      objectUrl = URL.createObjectURL(file);
      setEditAvatar(objectUrl);
      updateUser({ avatar: objectUrl });

      if (!user?.id) return;

      let uploaded;
      try {
        uploaded = await api.uploadAvatar(user.id, file);
      } catch {
        const dataUri = await new Promise((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result);
          r.onerror = () => reject(new Error('read failed'));
          r.readAsDataURL(file);
        });
        uploaded = await api.uploadAvatarDataUri(user.id, dataUri);
      }

      if (uploaded?.avatar) {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        objectUrl = null;
        setEditAvatar(uploaded.avatar);
        updateUser({ avatar: uploaded.avatar });
        try {
          await refreshUser();
        } catch {
          // refresh is optional when no JWT; cache was already updated
        }
      }
    } catch {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setEditAvatar(prevAvatar);
      updateUser({ avatar: prevAvatar });
    } finally {
      setAvatarUploading(false);
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
      {followRequests.length > 0 && (
        <div className="card profile-follow-requests-banner">
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

      <div className="profile-header card">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">
            {user.avatar ? (
              <img src={user.avatar} alt="" />
            ) : (
              <span className="profile-avatar-initial">{(user.fullName || user.username || 'U').charAt(0).toUpperCase()}</span>
            )}
          </div>
          <label className="profile-avatar-upload" title={t('profile.changePhoto', 'Change photo')}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files && e.target.files[0];
                e.target.value = '';
                handleAvatarFile(file);
              }}
              disabled={avatarUploading}
            />
            <span aria-hidden="true">📷</span>
          </label>
        </div>
        <div className="profile-info">
          <h1 className="profile-username">{user.username || user.fullName}</h1>
          {user.fullName && user.fullName !== user.username && (
            <p className="profile-full-name">{user.fullName}</p>
          )}
          {user.bio && <p className="profile-bio">{user.bio}</p>}
          <div className="profile-stats">
            <span><strong>{displayPosts.length}</strong> {t('profile.posts', 'posts')}</span>
            <button
              type="button"
              className="profile-stat-btn"
              onClick={() => setShowFollowersModal(true)}
            >
              <strong>{followers.length}</strong> {t('profile.followers', 'followers')}
            </button>
            <button
              type="button"
              className="profile-stat-btn"
              onClick={() => setShowFollowingModal(true)}
            >
              <strong>{following.length}</strong> {t('profile.following', 'following')}
            </button>
          </div>
          <div className="profile-actions">
            <button type="button" className="primary-btn" onClick={() => setShowEditModal(true)}>
              {t('profile.editProfile', 'Edit profile')}
            </button>
          </div>
        </div>
      </div>

      <div className="profile-posts-section">
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
                      <video
                        src={src}
                        muted
                        autoPlay
                        loop
                        playsInline
                      />
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
          <form onSubmit={handleSaveProfile} className="form edit-profile-form">
            <div className="edit-profile-top">
              <div className="edit-profile-avatar">
                {editAvatar ? (
                  <img src={editAvatar} alt="" />
                ) : (
                  <span className="edit-profile-avatar-initial">
                    {(user?.fullName || user?.username || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="edit-profile-top-text">
                <div className="edit-profile-username">
                  {user?.username || user?.fullName || 'User'}
                </div>
                <div className="muted small">
                  {user?.fullName && user?.fullName !== user?.username ? user.fullName : user?.email}
                </div>
              </div>
            </div>

            <div className="edit-profile-section">
              <div className="edit-profile-section-title">
                {t('profile.profileInfo', 'Profile info')}
              </div>

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
                {t('profile.website', 'Website')}
                <input
                  type="url"
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                  className="form-input"
                  placeholder="https://example.com"
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
                <div className="muted small edit-profile-hint">
                  {t('profile.bioHint', 'Tip: add your location, crops, and contact preference.')}
                </div>
              </label>
            </div>

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
                  return (
                    <video
                      src={src}
                      controls
                      muted
                      autoPlay
                      loop
                      playsInline
                      style={{ width: '100%' }}
                    />
                  );
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

      {showFollowersModal && (
        <Modal
          title={t('profile.followers', 'Followers')}
          onClose={() => setShowFollowersModal(false)}
        >
          {followers.length === 0 ? (
            <p className="muted">
              {t('profile.noFollowers', 'No followers yet.')}
            </p>
          ) : (
            <ul className="list">
              {followers.map((f) => (
                <li key={getUserKey(f)} className="list-item">
                  <button
                    type="button"
                    className="list-item-main-btn"
                    onClick={() => {
                      setShowFollowersModal(false);
                      if (onViewUser) onViewUser(f);
                    }}
                  >
                    <div className="list-avatar">
                      {f.avatar ? (
                        <img src={f.avatar} alt="" />
                      ) : (
                        <span className="list-avatar-initial">
                          {(f.username || f.fullName || 'U').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="list-title">
                      {f.username || f.fullName || f.email || 'User'}
                    </div>
                    {f.fullName && f.email && (
                      <div className="muted small">
                        {f.fullName} • {f.email}
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}

      {showFollowingModal && (
        <Modal
          title={t('profile.following', 'Following')}
          onClose={() => setShowFollowingModal(false)}
        >
          {following.length === 0 ? (
            <p className="muted">
              {t('profile.noFollowing', 'You are not following anyone yet.')}
            </p>
          ) : (
            <ul className="list">
              {following.map((f) => (
                <li key={getUserKey(f)} className="list-item">
                  <button
                    type="button"
                    className="list-item-main-btn"
                    onClick={() => {
                      setShowFollowingModal(false);
                      if (onViewUser) onViewUser(f);
                    }}
                  >
                    <div className="list-avatar">
                      {f.avatar ? (
                        <img src={f.avatar} alt="" />
                      ) : (
                        <span className="list-avatar-initial">
                          {(f.username || f.fullName || 'U').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="list-title">
                      {f.username || f.fullName || f.email || 'User'}
                    </div>
                    {f.fullName && f.email && (
                      <div className="muted small">
                        {f.fullName} • {f.email}
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}
    </section>
  );
}

export default Profile;
