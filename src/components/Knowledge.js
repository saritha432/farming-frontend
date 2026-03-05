import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';

function Knowledge({ guides, loading, onAddGuide }) {
  const { t } = useTranslation();
  const [openGuide, setOpenGuide] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSubmitGuide = (e) => {
    e.preventDefault();
    if (!onAddGuide) return;
    const form = e.target;
    const title = form.title.value.trim();
    const level = form.level.value.trim();
    const duration = form.duration.value.trim();
    const description = form.description.value.trim();
    const fileInput = form.file;
    if (!title) return;
    onAddGuide({
      title,
      level,
      duration,
      description,
      file: fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0] : null,
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
                <button
                  type="button"
                  className="small-btn"
                  onClick={() => setOpenGuide(guide)}
                >
                  {t('knowledge.open')}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h3>{t('knowledge.liveQA')}</h3>
          <p className="muted">{t('knowledge.liveQADesc')}</p>
          <ul className="list">
            <li className="list-item">
              <div>
                <div className="list-title">{t('knowledge.weeklySoil')}</div>
                <div className="muted">{t('knowledge.saturdayTime')}</div>
              </div>
              <button type="button" className="small-btn">
                {t('knowledge.notifyMe')}
              </button>
            </li>
            <li className="list-item">
              <div>
                <div className="list-title">{t('knowledge.helpDesk')}</div>
                <div className="muted">{t('knowledge.dropQuestions')}</div>
              </div>
              <button type="button" className="small-btn">
                {t('knowledge.ask')}
              </button>
            </li>
          </ul>
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
    </section>
  );
}

export default Knowledge;
