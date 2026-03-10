import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { api } from '../api';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function resolveGuideFileUrl(fileUrl) {
  if (!fileUrl) return null;
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
  return `${API_BASE}${fileUrl}`;
}

function parseDurationMinutes(duration) {
  if (!duration) return null;
  const match = String(duration).match(/(\d+)/);
  if (!match) return null;
  const min = Number(match[1]);
  return Number.isFinite(min) && min > 0 ? min : null;
}

function getSessionPhase(session, guides) {
  if (!session) return 'upcoming';
  const status = String(session.status || '').toLowerCase();
  if (status === 'cancelled') return 'cancelled';

  let liveMinutes = 20;
  if (Array.isArray(guides) && session.guideId != null) {
    const guide = guides.find((g) => g.id === session.guideId);
    const parsed = guide && parseDurationMinutes(guide.duration);
    if (parsed) liveMinutes = parsed;
  }
  const LIVE_WINDOW_MS = liveMinutes * 60 * 1000;

  if (session.schedule) {
    const ts = Date.parse(session.schedule);
    if (!Number.isNaN(ts)) {
      const now = Date.now();
      if (now < ts) return 'upcoming';
      if (now <= ts + LIVE_WINDOW_MS) return 'live';
      return 'completed';
    }
  }
  if (status === 'live' || status === 'completed') return status;
  return 'upcoming';
}

function isSessionActive(session, guides) {
  return getSessionPhase(session, guides) === 'live';
}

function formatSchedule(value) {
  if (!value) return '';
  const ts = Date.parse(value);
  if (Number.isNaN(ts)) return value;
  return new Date(ts).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function Knowledge({
  guides,
  loading,
  onAddGuide,
  onUpdateGuide,
  onDeleteGuide,
  sessions = [],
  onToggleSubscribe,
  onAskQuestion,
  onDeleteSession,
  onUpdateSession,
}) {
  const { t } = useTranslation();
  const [openGuide, setOpenGuide] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [questionSession, setQuestionSession] = useState(null);
  const [questionText, setQuestionText] = useState('');
  const [editingGuide, setEditingGuide] = useState(null);
  const [editValues, setEditValues] = useState({
    title: '',
    level: 'Beginner',
    duration: '',
    description: '',
  });

  const [viewSession, setViewSession] = useState(null);
  const [viewQuestions, setViewQuestions] = useState([]);
  const [viewQuestionsLoading, setViewQuestionsLoading] = useState(false);
  const [viewQuestionsError, setViewQuestionsError] = useState('');
  const [liveQuestionText, setLiveQuestionText] = useState('');

  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  const [editingSession, setEditingSession] = useState(null);
  const [editSessionValues, setEditSessionValues] = useState({
    title: '',
    schedule: '',
    description: '',
  });

  const guideForViewSession =
    viewSession && viewSession.guideId != null
      ? guides.find((g) => g.id === viewSession.guideId)
      : null;

  // Only treat guides as "live" while their associated session is truly active (based on schedule + duration).
  // Also de-duplicate by session id in case the backend returns duplicates.
  const activeSessionsMap = new Map();
  (sessions || []).forEach((s) => {
    if (isSessionActive(s, guides)) {
      activeSessionsMap.set(s.id, s);
    }
  });
  const activeSessions = Array.from(activeSessionsMap.values());
  const scheduledGuideIds = new Set(
    activeSessions.filter((s) => s.guideId != null).map((s) => s.guideId),
  );
  const visibleGuides = guides.filter((g) => !scheduledGuideIds.has(g.id));

  const openSessionDetails = async (session) => {
    setViewSession(session);
    setViewQuestions([]);
    setViewQuestionsError('');
    setViewQuestionsLoading(true);
    try {
      const list = await api.getKnowledgeSessionQuestions(session.id);
      setViewQuestions(Array.isArray(list) ? list : []);
    } catch {
      setViewQuestionsError('Could not load questions right now.');
    } finally {
      setViewQuestionsLoading(false);
    }
  };

  const handleSubmitGuide = (e) => {
    e.preventDefault();
    if (!onAddGuide) return;
    const form = e.target;
    const title = form.title.value.trim();
    const level = form.level.value.trim();
    const duration = form.duration.value.trim();
    const description = form.description.value.trim();
    const scheduleSession = form.scheduleSession.checked;
    const scheduleAt = form.scheduleAt.value;
    const fileInput = form.file;
    if (!title) return;
    onAddGuide({
      title,
      level,
      duration,
      description,
      file: fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0] : null,
      scheduleSession,
      scheduleAt,
    });
    form.reset();
    setShowAddForm(false);
  };

  if (loading) {
    return (
      <section className="section">
        <header className="section-header">
          <div className="section-header-main">
            <h2>{t('knowledge.title')}</h2>
            <p>{t('knowledge.description')}</p>
          </div>
        </header>
        <div className="grid two">
          <div className="card">
            <div className="skeleton skeleton-line" style={{ width: '60%', marginBottom: '1rem' }} />
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton skeleton-line" style={{ marginTop: '0.75rem' }} />
            ))}
          </div>
          <div className="card">
            <div className="skeleton skeleton-line" style={{ width: '50%', marginBottom: '0.5rem' }} />
            <div className="skeleton skeleton-line short" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <header className="section-header">
        <div className="section-header-main">
          <h2>{t('knowledge.title')}</h2>
          <p>{t('knowledge.description')}</p>
        </div>
        {onAddGuide && (
          <div className="section-header-actions">
            <button
              type="button"
              className="primary-btn"
              onClick={() => setShowAddForm(true)}
              aria-expanded={showAddForm}
            >
              {t('knowledge.shareGuide')}
            </button>
          </div>
        )}
      </header>
      {showAddForm && onAddGuide && (
        <Modal
          title={t('knowledge.shareGuide')}
          onClose={() => setShowAddForm(false)}
          labelledById="add-guide-modal-title"
        >
          <form onSubmit={handleSubmitGuide} className="form">
            <label className="form-label">
              {t('knowledge.guideTitle')}
              <input
                type="text"
                name="title"
                required
                placeholder={t('knowledge.guideTitlePlaceholder')}
                className="form-input"
              />
            </label>
            <label className="form-label">
              {t('knowledge.guideLevel')}
              <select name="level" className="form-input">
                <option value="Beginner">{t('knowledge.levelBeginner')}</option>
                <option value="Intermediate">{t('knowledge.levelIntermediate')}</option>
                <option value="Advanced">{t('knowledge.levelAdvanced')}</option>
              </select>
            </label>
            <label className="form-label">
              {t('knowledge.guideDuration')}
              <input
                type="text"
                name="duration"
                placeholder={t('knowledge.guideDurationPlaceholder')}
                className="form-input"
              />
            </label>
            <label className="form-label">
              {t('knowledge.guideDescription')}
              <textarea
                name="description"
                rows="4"
                placeholder={t('knowledge.guideDescriptionPlaceholder')}
                className="form-input"
              />
            </label>
            <label className="form-label">
              {/* No translation key yet; plain text is fine */}
              Guide file (PDF, optional)
              <input
                type="file"
                name="file"
                accept=".pdf,application/pdf"
                className="form-input"
              />
            </label>
            <label className="form-label">
              {/* Schedule live Q&A for this guide */}
              <span>
                <input type="checkbox" name="scheduleSession" style={{ marginRight: 8 }} />
                Schedule a live Q&amp;A session
              </span>
              <input
                type="datetime-local"
                name="scheduleAt"
                className="form-input"
              />
            </label>
            <div className="card-footer-row mt">
              <button type="submit" className="primary-btn">
                {t('knowledge.submitGuide')}
              </button>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setShowAddForm(false)}
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </Modal>
      )}
      <div className="grid two">
        <div className="card">
          <h3>{t('knowledge.guidesProcedures')}</h3>
          <ul className="list">
            {visibleGuides.map((guide) => (
              <li key={guide.id} className="list-item">
                <div>
                  <div className="list-title">{guide.title}</div>
                  <div className="muted">
                    {guide.level} • {guide.duration}
                  </div>
                </div>
                <div className="list-actions">
                  <button
                    type="button"
                    className="small-btn"
                    onClick={() => setOpenGuide(guide)}
                  >
                    {t('knowledge.open')}
                  </button>
                  {onUpdateGuide && (
                    <button
                      type="button"
                      className="small-btn"
                      onClick={() => {
                        setEditingGuide(guide);
                        setEditValues({
                          title: guide.title || '',
                          level: guide.level || 'Beginner',
                          duration: guide.duration || '',
                          description: guide.description || '',
                        });
                      }}
                      style={{ marginLeft: 8 }}
                    >
                      Edit
                    </button>
                  )}
                  {onDeleteGuide && (
                    <button
                      type="button"
                      className="small-btn"
                      onClick={() => {
                        if (window.confirm('Delete this guide?')) {
                          onDeleteGuide(guide.id);
                        }
                      }}
                      style={{ marginLeft: 8 }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
          <div className="card">
          <h3>{t('knowledge.liveQA')}</h3>
          <p className="muted">{t('knowledge.liveQADesc')}</p>
          {activeSessions.length === 0 ? (
            <p className="muted">No live sessions scheduled yet.</p>
          ) : (
            <ul className="list">
              {activeSessions.map((session) => {
                const phase = getSessionPhase(session, guides);
                const guideForSession =
                  session.guideId != null
                    ? guides.find((g) => g.id === session.guideId)
                    : null;
                const liveMinutes = parseDurationMinutes(guideForSession?.duration) || 20;
                return (
                  <li key={session.id} className="list-item">
                    <div>
                      <div className="list-title">
                        {session.title}
                        {phase === 'live' && (
                        <span
                          style={{
                            marginLeft: 8,
                            fontSize: 12,
                            padding: '2px 6px',
                            borderRadius: 999,
                            background: 'rgba(220,38,38,0.1)',
                            color: '#b91c1c',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                          }}
                        >
                          Live
                        </span>
                      )}
                      </div>
                      {session.schedule && (
                        <div className="muted">
                          {formatSchedule(session.schedule)}
                          {phase === 'live' && ` • Live for ${liveMinutes} mins`}
                        </div>
                      )}
                      {session.description && (
                        <div className="muted">{session.description}</div>
                      )}
                      <div className="muted" style={{ marginTop: '0.25rem' }}>
                        {session.questionCount} questions •{' '}
                        {phase === 'live'
                          ? `${session.subscriberCount} watching now`
                          : `${session.subscriberCount} subscribed`}
                      </div>
                    </div>
                    <div className="list-actions">
                      {phase === 'live' && (
                        <button
                          type="button"
                          className="small-btn"
                          onClick={() => openSessionDetails(session)}
                        >
                          Watch live
                        </button>
                      )}
                      {phase !== 'live' && onToggleSubscribe && (
                        <button
                          type="button"
                          className="small-btn"
                          onClick={() => onToggleSubscribe(session.id)}
                        >
                          {session.isSubscribed
                            ? 'Subscribed'
                            : t('knowledge.notifyMe')}
                        </button>
                      )}
                      {onAskQuestion && (
                        <button
                          type="button"
                          className="small-btn"
                          onClick={() => {
                            setQuestionSession(session);
                            setQuestionText('');
                          }}
                        >
                          {t('knowledge.ask')}
                        </button>
                      )}
                      {phase !== 'live' && (
                        <button
                          type="button"
                          className="small-btn"
                          onClick={() => openSessionDetails(session)}
                          style={{ marginLeft: 8 }}
                        >
                          View
                        </button>
                      )}
                      {onUpdateSession && (
                        <button
                          type="button"
                          className="small-btn"
                          style={{ marginLeft: 8 }}
                          onClick={() => {
                            setEditingSession(session);
                            setEditSessionValues({
                              title: session.title || '',
                              schedule: session.schedule || '',
                              description: session.description || '',
                            });
                          }}
                        >
                          Edit
                        </button>
                      )}
                      {onDeleteSession && (
                        <button
                          type="button"
                          className="small-btn"
                          style={{ marginLeft: 8 }}
                          onClick={() => {
                            if (window.confirm('Delete this live session?')) {
                              onDeleteSession(session.id);
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
          )}
        </div>
      </div>

      {openGuide && (
        <Modal
          title={openGuide.title}
          onClose={() => setOpenGuide(null)}
          labelledById="guide-modal-title"
        >
          <p className="muted">
            {openGuide.level} • {openGuide.duration}
          </p>
          <p style={{ marginTop: '1rem' }}>
            {openGuide.description
              || 'Full guide content would load here. In a production app, this could be rich text, steps, or embedded video.'}
          </p>
          {openGuide.fileUrl && (
            <div style={{ marginTop: '1.25rem' }}>
              <div style={{ marginBottom: '0.5rem', fontWeight: 500 }}>Attached guide file:</div>
              <a
                href={resolveGuideFileUrl(openGuide.fileUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="primary-btn"
                style={{ textDecoration: 'none' }}
              >
                Open file in new tab
              </a>
              <div
                style={{
                  marginTop: '1rem',
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: '1px solid rgba(0,0,0,0.08)',
                }}
              >
                <iframe
                  title={`${openGuide.title} file`}
                  src={resolveGuideFileUrl(openGuide.fileUrl)}
                  style={{ width: '100%', height: 360, border: 'none' }}
                />
              </div>
            </div>
          )}
        </Modal>
      )}
      {editingGuide && (
        <Modal
          title="Edit guide"
          onClose={() => setEditingGuide(null)}
          labelledById="edit-guide-modal-title"
        >
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!onUpdateGuide) return;
              onUpdateGuide(editingGuide.id, editValues);
              setEditingGuide(null);
            }}
          >
            <label className="form-label">
              {t('knowledge.guideTitle')}
              <input
                type="text"
                className="form-input"
                value={editValues.title}
                onChange={(e) => setEditValues((v) => ({ ...v, title: e.target.value }))}
              />
            </label>
            <label className="form-label">
              {t('knowledge.guideLevel')}
              <select
                className="form-input"
                value={editValues.level}
                onChange={(e) => setEditValues((v) => ({ ...v, level: e.target.value }))}
              >
                <option value="Beginner">{t('knowledge.levelBeginner')}</option>
                <option value="Intermediate">{t('knowledge.levelIntermediate')}</option>
                <option value="Advanced">{t('knowledge.levelAdvanced')}</option>
              </select>
            </label>
            <label className="form-label">
              {t('knowledge.guideDuration')}
              <input
                type="text"
                className="form-input"
                value={editValues.duration}
                onChange={(e) => setEditValues((v) => ({ ...v, duration: e.target.value }))}
              />
            </label>
            <label className="form-label">
              {t('knowledge.guideDescription')}
              <textarea
                rows="4"
                className="form-input"
                value={editValues.description}
                onChange={(e) => setEditValues((v) => ({ ...v, description: e.target.value }))}
              />
            </label>
            <div className="card-footer-row mt">
              <button type="submit" className="primary-btn">
                Save
              </button>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setEditingGuide(null)}
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {questionSession && (
        <Modal
          title={t('knowledge.ask')}
          onClose={() => {
            setQuestionSession(null);
            setQuestionText('');
          }}
          labelledById="knowledge-question-modal-title"
        >
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!onAskQuestion) return;
              const text = questionText.trim();
              if (!text) return;
              onAskQuestion(questionSession.id, text);
              setQuestionSession(null);
              setQuestionText('');
            }}
          >
            <label className="form-label">
              {t('knowledge.dropQuestions')}
              <textarea
                className="form-input"
                rows="3"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
              />
            </label>
            <div className="card-footer-row mt">
              <button
                type="submit"
                className="primary-btn"
                disabled={!questionText.trim()}
              >
                {t('knowledge.submitGuide')}
              </button>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => {
                  setQuestionSession(null);
                  setQuestionText('');
                }}
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {viewSession && (
        <Modal
          title={viewSession.title}
          onClose={() => {
            setViewSession(null);
            setViewQuestions([]);
            setViewQuestionsError('');
            setReplyTo(null);
            setReplyText('');
            setLiveQuestionText('');
          }}
          labelledById="knowledge-session-details-modal-title"
        >
          <p className="muted">
            {formatSchedule(viewSession.schedule) || 'No schedule set'}{' '}
            {(() => {
              const phase = getSessionPhase(viewSession, guides);
              if (phase === 'live') {
                const mins = parseDurationMinutes(guideForViewSession?.duration) || 20;
                return `• Live now (${mins} mins)`;
              }
              if (phase === 'completed') return '• Completed';
              if (phase === 'upcoming') return '• Upcoming';
              if (phase === 'cancelled') return '• Cancelled';
              return null;
            })()}
          </p>
          {guideForViewSession && guideForViewSession.fileUrl && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ marginBottom: '0.5rem', fontWeight: 500 }}>Guide</div>
              <a
                href={resolveGuideFileUrl(guideForViewSession.fileUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="small-btn"
                style={{ textDecoration: 'none', marginBottom: '0.5rem', display: 'inline-block' }}
              >
                Open in new tab
              </a>
              <div
                style={{
                  marginTop: '0.5rem',
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: '1px solid rgba(0,0,0,0.08)',
                }}
              >
                <iframe
                  title={`${guideForViewSession.title} file`}
                  src={resolveGuideFileUrl(guideForViewSession.fileUrl)}
                  style={{ width: '100%', height: 260, border: 'none', background: '#fff' }}
                />
              </div>
            </div>
          )}
          {viewSession.description && (
            <p style={{ marginTop: '0.5rem' }}>{viewSession.description}</p>
          )}
          <div style={{ marginTop: '1rem' }}>
            <h4>Questions</h4>
            {viewQuestionsLoading && <p className="muted">Loading questions…</p>}
            {viewQuestionsError && <p className="muted">{viewQuestionsError}</p>}
            {!viewQuestionsLoading && !viewQuestionsError && viewQuestions.length === 0 && (
              <p className="muted">No questions yet.</p>
            )}
            {onAskQuestion && (
              <form
                className="form"
                style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }}
                onSubmit={(e) => {
                  e.preventDefault();
                  const text = liveQuestionText.trim();
                  if (!text) return;
                  onAskQuestion(viewSession.id, text);
                  setLiveQuestionText('');
                  // refresh local questions list
                  openSessionDetails(viewSession);
                }}
              >
                <label className="form-label">
                  <span className="muted">Ask a question while watching</span>
                  <textarea
                    className="form-input"
                    rows="2"
                    value={liveQuestionText}
                    onChange={(e) => setLiveQuestionText(e.target.value)}
                  />
                </label>
                <div className="card-footer-row mt">
                  <button
                    type="submit"
                    className="primary-btn"
                    disabled={!liveQuestionText.trim()}
                  >
                    Send question
                  </button>
                </div>
              </form>
            )}
            {!viewQuestionsLoading && viewQuestions.length > 0 && (
              <ul className="list">
                {viewQuestions
                  .filter((q) => !q.parentId)
                  .map((q) => {
                    const replies = viewQuestions.filter((r) => r.parentId === q.id);
                    return (
                      <li key={q.id} className="list-item">
                        <div>
                          <div className="list-title">{q.text}</div>
                          <div className="muted">
                            {q.author || 'Farmer'}{' '}
                            {q.createdAt && `• ${new Date(q.createdAt).toLocaleString()}`}
                          </div>
                        </div>
                        <div style={{ marginTop: '0.5rem' }}>
                          <button
                            type="button"
                            className="small-btn"
                            onClick={() => {
                              setReplyTo(q);
                              setReplyText('');
                            }}
                          >
                            Reply
                          </button>
                        </div>
                        {replies.length > 0 && (
                          <ul className="list" style={{ marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
                            {replies.map((r) => (
                              <li key={r.id} className="list-item">
                                <div>
                                  <div className="list-title">{r.text}</div>
                                  <div className="muted">
                                    {r.author || 'Farmer'}{' '}
                                    {r.createdAt && `• ${new Date(r.createdAt).toLocaleString()}`}
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                        {replyTo && replyTo.id === q.id && (
                          <form
                            className="form"
                            style={{ marginTop: '0.75rem' }}
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (!onAskQuestion) return;
                              const text = replyText.trim();
                              if (!text) return;
                              onAskQuestion(viewSession.id, text, q.id);
                              setReplyTo(null);
                              setReplyText('');
                              // refresh local questions list
                              openSessionDetails(viewSession);
                            }}
                          >
                            <label className="form-label">
                              <span className="muted">Reply</span>
                              <textarea
                                className="form-input"
                                rows="2"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                              />
                            </label>
                            <div className="card-footer-row mt">
                              <button
                                type="submit"
                                className="primary-btn"
                                disabled={!replyText.trim()}
                              >
                                Send
                              </button>
                              <button
                                type="button"
                                className="ghost-btn"
                                onClick={() => {
                                  setReplyTo(null);
                                  setReplyText('');
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        )}
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>
        </Modal>
      )}
      {editingSession && (
        <Modal
          title="Edit live session"
          onClose={() => setEditingSession(null)}
          labelledById="edit-knowledge-session-modal-title"
        >
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!onUpdateSession) return;
              onUpdateSession(editingSession.id, editSessionValues);
              setEditingSession(null);
            }}
          >
            <label className="form-label">
              {t('knowledge.guideTitle')}
              <input
                type="text"
                className="form-input"
                value={editSessionValues.title}
                onChange={(e) =>
                  setEditSessionValues((v) => ({ ...v, title: e.target.value }))
                }
              />
            </label>
            <label className="form-label">
              Schedule
              <input
                type="datetime-local"
                className="form-input"
                value={editSessionValues.schedule}
                onChange={(e) =>
                  setEditSessionValues((v) => ({ ...v, schedule: e.target.value }))
                }
              />
            </label>
            <label className="form-label">
              {t('knowledge.guideDescription')}
              <textarea
                rows="3"
                className="form-input"
                value={editSessionValues.description}
                onChange={(e) =>
                  setEditSessionValues((v) => ({ ...v, description: e.target.value }))
                }
              />
            </label>
            <div className="card-footer-row mt">
              <button type="submit" className="primary-btn">
                Save
              </button>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setEditingSession(null)}
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}

export default Knowledge;
