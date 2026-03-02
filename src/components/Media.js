import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Media({ posts = [], loading, refreshPosts, onDeletePost, showToast, t: tProp }) {
  const { t } = useTranslation();
  const tFn = tProp || t;
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [titleError, setTitleError] = useState('');
  const [expandedComments, setExpandedComments] = useState({});
  const [commentText, setCommentText] = useState({});
  const [commentsCache, setCommentsCache] = useState({});
  const [postingComment, setPostingComment] = useState({});

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
    const farmer = form.farmer?.value?.trim() || 'My Farm';
    const location = form.location?.value?.trim() || '';
    const type = form.type?.value || 'Photo';
    const description = form.description?.value?.trim() || '';
    const tagsStr = form.tags?.value?.trim() || '';
    const fileInput = form.media;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('farmer', farmer);
      formData.append('location', location);
      formData.append('type', type);
      formData.append('title', title);
      formData.append('description', description);
      if (tagsStr) formData.append('tags', tagsStr);
      if (fileInput?.files?.[0]) formData.append('media', fileInput.files[0]);
      await api.createPost(formData);
      form.reset();
      setShowAddForm(false);
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
    setExpandedComments((prev) => ({ ...prev, [postId]: true }));
    try {
      const list = await api.getComments(postId);
      setCommentsCache((prev) => ({ ...prev, [postId]: list }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitComment = async (postId) => {
    const text = (commentText[postId] || '').trim();
    if (!text) return;
    const author = 'Anonymous';
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

  const handleDelete = async (postId, title) => {
    const ok = window.confirm(`Delete this post: "${title || ''}"?`);
    if (!ok) return;
    if (onDeletePost) onDeletePost(postId);
    try {
      await api.deletePost(postId);
      if (showToast) showToast({ message: tFn('toast.postDeleted'), type: 'success' });
    } catch (err) {
      console.error(err);
      if (refreshPosts) refreshPosts();
      if (showToast) showToast({ message: tFn('toast.deleteFailed'), type: 'error' });
    }
  };

  if (loading) {
    return (
      <section className="section">
        <header className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{t('media.title')}</h2>
          {refreshPosts && (
            <button type="button" className="primary-btn" style={{ fontSize: '0.8rem' }}>
              {t('media.addPost')}
            </button>
          )}
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
      <header className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{t('media.title')}</h2>
        {refreshPosts && (
          <button
            type="button"
            className="primary-btn"
            onClick={() => setShowAddForm((v) => !v)}
            aria-expanded={showAddForm}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
          >
            {t('media.addPost')}
          </button>
        )}
      </header>

      {showAddForm && (
        <div className="card form-card media-form-card" style={{ marginBottom: '1.5rem', borderRadius: 8, border: '1px solid #dbdbdb' }}>
          <h3>{t('media.newPost')}</h3>
          <form onSubmit={handleSubmitPost}>
            <label>
              {t('media.farmerName')}
              <input type="text" name="farmer" placeholder={t('media.farmerName')} />
            </label>
            <label>
              {t('sales.locationLabel')}
              <input type="text" name="location" placeholder="e.g. Punjab, India" />
            </label>
            <label>
              Type
              <select name="type">
                <option value="Photo">{t('media.uploadPhoto')}</option>
                <option value="Video">{t('media.uploadVideo')}</option>
              </select>
            </label>
            <label>
              {t('media.titleLabel')} <span className="required">*</span>
              <input
                type="text"
                name="title"
                placeholder={t('media.titleLabel')}
                onChange={() => setTitleError('')}
                aria-invalid={!!titleError}
              />
              {titleError && <span className="form-error">{titleError}</span>}
            </label>
            <label>
              {t('media.descriptionLabel')}
              <textarea name="description" rows={3} placeholder={t('media.descriptionLabel')} />
            </label>
            <label>
              {t('media.tagsLabel')}
              <input type="text" name="tags" placeholder="#organic, #waterSaving" />
            </label>
            <label>
              {t('media.uploadMedia')}
              <input type="file" name="media" accept="image/*,video/*" />
            </label>
            <div className="card-footer-row">
              <button type="submit" className="primary-btn" disabled={uploading}>
                {uploading ? '…' : t('media.post')}
              </button>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => { setShowAddForm(false); setTitleError(''); }}
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div className="empty-state ig-post" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <div className="empty-state-icon" aria-hidden>📷</div>
          <h3>{t('media.title')}</h3>
          <p>No posts yet. Add the first one to get started.</p>
          {refreshPosts && (
            <button type="button" className="primary-btn mt-lg" onClick={() => setShowAddForm(true)}>
              {t('media.addPost')}
            </button>
          )}
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
                      ⋮
                    </button>
                  </div>
                </div>

                <div className="ig-post-media">
                  {url ? (
                    post.type === 'Video' ? (
                      <video src={url} controls />
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
                      💬
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
                    <ul className="ig-comments-list">
                      {comments.map((c) => (
                        <li key={c.id}>
                          <span className="ig-comment-author">{c.author}</span>
                          {c.text}
                        </li>
                      ))}
                    </ul>
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
