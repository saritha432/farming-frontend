import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';

function Knowledge({
  guides,
  loading,
  onAddGuide,
  onUpdateGuide,
  onDeleteGuide,
  sessions = [],
  onToggleSubscribe,
  onAskQuestion,
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
            {guides.map((guide) => (
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
          {sessions.length === 0 ? (
            <p className="muted">No live sessions scheduled yet.</p>
          ) : (
            <ul className="list">
              {sessions.map((session) => (
                <li key={session.id} className="list-item">
                  <div>
                    <div className="list-title">{session.title}</div>
                    {session.schedule && (
                      <div className="muted">{session.schedule}</div>
                    )}
                    {session.description && (
                      <div className="muted">{session.description}</div>
                    )}
                    <div className="muted" style={{ marginTop: '0.25rem' }}>
                      {session.questionCount} questions •{' '}
                      {session.subscriberCount} subscribed
                    </div>
                  </div>
                  <div className="list-actions">
                    {onToggleSubscribe && (
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
                  </div>
                </li>
              ))}
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
    </section>
  );
}

export default Knowledge;
