import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';
import { putPendingPostFile, getPendingPostFile, deletePendingPostFile } from '../uploadPostIdb';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const PENDING_POST_UPLOAD_KEY = 'agrovibes_pending_post_upload_v1';

function makeClientUploadId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `up_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

function safeJsonParse(v) {
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

function Media({
  posts = [],
  loading,
  refreshPosts,
  onDeletePost,
  showToast,
  t: tProp,
  openAddPost,
  onAddPostClose,
  userFilter,
  onClearUserFilter,
}) {
  const { t } = useTranslation();
  const tFn = tProp || t;
  const [showAddForm, setShowAddForm] = useState(false);
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (openAddPost) setShowAddForm(true);
  }, [openAddPost]);

  // If the user refreshed during a post upload, resume it on next mount.
  useEffect(() => {
    let mounted = true;
    const resume = async () => {
      const pendingRaw = (() => {
        try {
          return localStorage.getItem(PENDING_POST_UPLOAD_KEY);
        } catch {
          return null;
        }
      })();
      const pending = safeJsonParse(pendingRaw);
      if (!mounted || !pending?.clientUploadId || !pending?.fields) return;
      if (!pending?.hasMedia) return;

      const { clientUploadId, fields, file } = pending;

      try {
        setUploading(true);
        const mediaBlob = await getPendingPostFile(clientUploadId);
        if (!mediaBlob) {
          // Stale pending record (e.g. IndexedDB was cleared). Remove it to avoid retry loops.
          try {
            localStorage.removeItem(PENDING_POST_UPLOAD_KEY);
          } catch {
            // ignore
          }
          return;
        }

        const formData = new FormData();
        formData.append('farmer', fields.farmer || 'My Farm');
        formData.append('location', fields.location || '');
        formData.append('type', fields.type || 'Photo');
        formData.append('title', fields.title || '');
        formData.append('description', fields.description || '');
        if (fields.tagsStr) formData.append('tags', fields.tagsStr);
        formData.append('clientUploadId', clientUploadId);
        formData.append('media', mediaBlob, file?.name || 'upload');

        await api.createPost(formData);

        // Clear pending state only after successful server response.
        try {
          localStorage.removeItem(PENDING_POST_UPLOAD_KEY);
        } catch {
          // ignore
        }
        await deletePendingPostFile(clientUploadId);
        if (!mounted) return;
        refreshPosts?.();
        if (showToast) showToast({ message: tFn('toast.postCreated'), type: 'success' });
      } catch (err) {
        // Keep pending so the user can retry on another refresh.
        console.error('Failed to resume pending upload:', err);
      } finally {
        if (mounted) setUploading(false);
      }
    };

    resume();
    return () => {
      mounted = false;
    };
  }, [refreshPosts, showToast, tFn]);
  const [titleError, setTitleError] = useState('');
  const [expandedComments, setExpandedComments] = useState({});
  const [commentsLoading, setCommentsLoading] = useState({});
  const [commentText, setCommentText] = useState({});
  const [commentsCache, setCommentsCache] = useState({});
  const [postingComment, setPostingComment] = useState({});
  const [commentLikes, setCommentLikes] = useState({});

  const mediaUrl = (path) => (path && path.startsWith('/') ? BASE + path : path);

  const handleSubmitPost = async (e) => {
    e.preventDefault();
    const form = e.target;
    const title = form.title?.value?.trim();
    if (!title) {
      setTitleError(tFn('media.titleLabel') + ' is required');
      return;
    }
    setTitleError('');
    const farmer =
      (user && (user.fullName || user.username)) ||
      form.farmer?.value?.trim() ||
      'My Farm';
    const location = form.location?.value?.trim() || '';
    const type = form.type?.value || 'Photo';
    const description = form.description?.value?.trim() || '';
    const tagsStr = form.tags?.value?.trim() || '';
    const fileInput = form.media;
    const selectedFile = fileInput?.files?.[0] || null;
    const clientUploadId = selectedFile ? makeClientUploadId() : null;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('farmer', farmer);
      formData.append('location', location);
      formData.append('type', type);
      formData.append('title', title);
      formData.append('description', description);
      if (tagsStr) formData.append('tags', tagsStr);
      if (selectedFile) {
        formData.append('clientUploadId', clientUploadId);
        // Persist file + metadata so an immediate refresh can resume the upload.
        const pending = {
          clientUploadId,
          hasMedia: true,
          fields: {
            farmer,
            location,
            type,
            title,
            description,
            tagsStr,
          },
          file: { name: selectedFile.name, type: selectedFile.type, size: selectedFile.size },
          createdAt: Date.now(),
        };
        try {
          localStorage.setItem(PENDING_POST_UPLOAD_KEY, JSON.stringify(pending));
        } catch {
          // ignore; resume will just not work in this case
        }
        try {
          await putPendingPostFile(clientUploadId, selectedFile);
        } catch (err) {
          console.error('Failed to persist pending post file (upload will still proceed):', err);
          try {
            localStorage.removeItem(PENDING_POST_UPLOAD_KEY);
          } catch {
            // ignore
          }
        }
        formData.append('media', selectedFile, selectedFile.name);
      }
      await api.createPost(formData);

      // Upload finished: clear pending state so a refresh doesn't re-trigger it.
      if (selectedFile && clientUploadId) {
        try {
          localStorage.removeItem(PENDING_POST_UPLOAD_KEY);
        } catch {
          // ignore
        }
        try {
          await deletePendingPostFile(clientUploadId);
        } catch (err) {
          console.error('Failed clearing pending post file:', err);
        }
      }

      form.reset();
      setShowAddForm(false);
      onAddPostClose?.();
      if (showToast) showToast({ message: tFn('toast.postCreated'), type: 'success' });
      if (refreshPosts) refreshPosts();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      await api.likePost(postId);
      if (refreshPosts) refreshPosts();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleComments = async (postId) => {
    if (expandedComments[postId]) {
      setExpandedComments((prev) => ({ ...prev, [postId]: false }));
      return;
    }
    setCommentsLoading((prev) => ({ ...prev, [postId]: true }));
    setExpandedComments((prev) => ({ ...prev, [postId]: true }));
    try {
      const list = await api.getComments(postId);
      setCommentsCache((prev) => ({ ...prev, [postId]: list }));
    } catch (err) {
      console.error(err);
    } finally {
      setCommentsLoading((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleSubmitComment = async (postId) => {
    const text = (commentText[postId] || '').trim();
    if (!text) return;
    if (!user) {
      // Non-registered / logged-out user: prompt auth instead of commenting
      alert(tFn('media.loginToComment', 'Please log in or sign up to comment.'));
      return;
    }
    const author =
      (user && (user.username || user.fullName)) ||
      'Anonymous';
    setPostingComment((prev) => ({ ...prev, [postId]: true }));
    try {
      await api.addComment(postId, author, text);
      setCommentText((prev) => ({ ...prev, [postId]: '' }));
      const list = await api.getComments(postId);
      setCommentsCache((prev) => ({ ...prev, [postId]: list }));
      if (refreshPosts) refreshPosts();
    } catch (err) {
      console.error(err);
    } finally {
      setPostingComment((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleDelete = (postId, title) => {
    const ok = window.confirm(`Delete this post: "${title || ''}"?`);
    if (!ok) return;
    if (onDeletePost) {
      onDeletePost(postId);
    }
  };

  if (loading) {
    return (
      <section className="section">
        <header className="section-header">
          <div className="section-header-main">
            <h2>{t('media.title')}</h2>
            <p className="muted">{t('media.description')}</p>
          </div>
        </header>
        <div className="grid feed-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="ig-post skeleton" style={{ height: 400 }} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <header className="section-header">
        <div className="section-header-main">
          <h2>{t('media.title')}</h2>
          <p className="muted">{t('media.description')}</p>
        </div>
      </header>

      {userFilter && (
        <div className="card profile-quick-banner">
          <div className="profile-quick-left">
            <div className="list-avatar">
              {userFilter.avatar ? (
                <img src={userFilter.avatar} alt="" />
              ) : (
                <span className="list-avatar-initial">
                  {(userFilter.username || userFilter.fullName || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="list-title">
                {userFilter.username || userFilter.fullName || 'User'}
              </div>
              {userFilter.fullName && userFilter.fullName !== userFilter.username && (
                <div className="muted small">{userFilter.fullName}</div>
              )}
            </div>
          </div>
          <button
            type="button"
            className="small-btn"
            onClick={() => onClearUserFilter && onClearUserFilter()}
          >
            {t('common.back', 'Back')}
          </button>
        </div>
      )}

      {showAddForm && (
        <Modal
          title={t('media.newPost')}
          onClose={() => {
            setShowAddForm(false);
            setTitleError('');
            onAddPostClose?.();
          }}
        >
          <form onSubmit={handleSubmitPost} className="form">
            <label className="form-label">
              {t('media.farmerName')}
              <input type="text" name="farmer" placeholder={t('media.farmerName')} className="form-input" />
            </label>
            <label className="form-label">
              {t('sales.locationLabel')}
              <input type="text" name="location" placeholder="e.g. Punjab, India" className="form-input" />
            </label>
            <label className="form-label">
              Type
              <select name="type" className="form-input">
                <option value="Photo">{t('media.uploadPhoto')}</option>
                <option value="Video">{t('media.uploadVideo')}</option>
              </select>
            </label>
            <label className="form-label">
              {t('media.titleLabel')} <span className="required">*</span>
              <input
                type="text"
                name="title"
                placeholder={t('media.titleLabel')}
                onChange={() => setTitleError('')}
                aria-invalid={!!titleError}
                className="form-input"
              />
              {titleError && <span className="form-error">{titleError}</span>}
            </label>
            <label className="form-label">
              {t('media.descriptionLabel')}
              <textarea
                name="description"
                rows={3}
                placeholder={t('media.descriptionLabel')}
                className="form-input"
              />
            </label>
            <label className="form-label">
              {t('media.tagsLabel')}
              <input type="text" name="tags" placeholder="#organic, #waterSaving" className="form-input" />
            </label>
            <label className="form-label">
              {t('media.uploadMedia')}
              <input type="file" name="media" accept="image/*,video/*" className="form-input" />
            </label>
            <div className="card-footer-row mt">
              <button type="submit" className="primary-btn" disabled={uploading}>
                {uploading ? '…' : t('media.post')}
              </button>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => {
                  setShowAddForm(false);
                  setTitleError('');
                  onAddPostClose?.();
                }}
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {!loading && posts.length === 0 && (
        <div className="empty-state ig-post" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <div className="empty-state-icon" aria-hidden>📷</div>
          <h3>{t('media.title')}</h3>
          <p>No posts yet. Add the first one to get started.</p>
        </div>
      )}

      {posts.length > 0 && (
        <div>
          {posts.map((post) => {
            const likeCount = post.likeCount ?? 0;
            const commentCount = post.commentCount ?? 0;
            const isLiked = post.isLiked ?? false;
            const url = mediaUrl(post.mediaUrl);
            const comments = commentsCache[post.id] || [];
            const expanded = expandedComments[post.id];

            return (
              <article key={post.id} className="ig-post">
                <div className="ig-post-header">
                  <div className="ig-avatar" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="ig-username">{post.farmer || 'Farm'}</div>
                    {post.location && <div className="ig-post-location">{post.location}</div>}
                  </div>
                  <div className="ig-post-options">
                    <button
                      type="button"
                      onClick={() => handleDelete(post.id, post.title)}
                    aria-label={t('media.delete')}
                    >
                    🗑️ {t('media.delete')}
                    </button>
                  </div>
                </div>

                <div className="ig-post-media">
                  {url ? (
                    post.type === 'Video' ? (
                      <video
                        src={url}
                        controls
                        muted
                        autoPlay
                        loop
                        playsInline
                      />
                    ) : (
                      <img src={url} alt={post.title} />
                    )
                  ) : (
                    <div className="ig-no-media">{post.type}</div>
                  )}
                </div>

                <div className="ig-post-actions">
                  <div className="ig-left-actions">
                    <button
                      type="button"
                      className={isLiked ? 'ig-liked' : ''}
                      onClick={() => handleLike(post.id)}
                      aria-pressed={isLiked}
                    >
                      {isLiked ? '❤️' : '🤍'}
                    </button>
                    <button type="button" onClick={() => toggleComments(post.id)}>
                      💬{commentCount > 0 ? ` ${commentCount}` : ''}
                    </button>
                    <button type="button">✈️</button>
                  </div>
                  <div className="ig-right-actions">
                    <button type="button">🔖</button>
                  </div>
                </div>

                <div className="ig-post-body">
                  {likeCount > 0 && <div className="ig-likes">{likeCount} likes</div>}
                  <div className="ig-caption">
                    <span className="ig-caption-username">{post.farmer || 'Farm'}</span>
                    <span>{post.description || post.title}</span>
                  </div>
                  {(post.tags || []).length > 0 && (
                    <div className="ig-tags">
                      {(post.tags || []).map((tag) => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  )}
                  {commentCount > 0 && !expanded && (
                    <button
                      type="button"
                      className="ig-view-comments"
                      onClick={() => toggleComments(post.id)}
                    >
                      View all {commentCount} comments
                    </button>
                  )}
                  {expanded && (
                    <div>
                      {commentsLoading[post.id] && (
                        <div className="ig-comments-loading">Loading comments…</div>
                      )}
                      <ul className="ig-comments-list">
                        {comments.map((c) => {
                          const liked = !!commentLikes[c.id];
                          const canDelete =
                            user &&
                            c.author &&
                            c.author === (user.username || user.fullName);
                          return (
                            <li key={c.id}>
                              <div>
                                <span className="ig-comment-author">{c.author}</span>
                                <span>{c.text}</span>
                              </div>
                              <div className="ig-comment-actions">
                                <button
                                  type="button"
                                  className={liked ? 'ig-comment-like-link liked' : 'ig-comment-like-link'}
                                  onClick={() =>
                                    setCommentLikes((prev) => ({
                                      ...prev,
                                      [c.id]: !prev[c.id],
                                    }))
                                  }
                                >
                                  {liked ? 'Liked' : 'Like'}
                                </button>
                                <button
                                  type="button"
                                  className="ig-comment-reply-link"
                                  onClick={() =>
                                    setCommentText((prev) => ({
                                      ...prev,
                                      [post.id]: `@${c.author || ''} `,
                                    }))
                                  }
                                >
                                  {t('media.reply', 'Reply')}
                                </button>
                                {canDelete && (
                                  <button
                                    type="button"
                                    className="ig-comment-delete-link"
                                    onClick={async () => {
                                      try {
                                        await api.deleteComment(post.id, c.id);
                                        const updated = await api.getComments(post.id);
                                        setCommentsCache((prev) => ({ ...prev, [post.id]: updated }));
                                        if (refreshPosts) refreshPosts();
                                      } catch (err) {
                                        console.error(err);
                                      }
                                    }}
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="ig-add-comment">
                  <input
                    type="text"
                    placeholder={t('media.writeComment')}
                    value={commentText[post.id] || ''}
                    onChange={(e) =>
                      setCommentText((prev) => ({ ...prev, [post.id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSubmitComment(post.id);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleSubmitComment(post.id)}
                    disabled={postingComment[post.id] || !(commentText[post.id] || '').trim()}
                  >
                    {t('media.submitComment')}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default Media;
