import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

function Knowledge({ guides, loading }) {
  const { t } = useTranslation();
  const [openGuide, setOpenGuide] = useState(null);

  if (loading) {
    return (
      <section className="section">
        <header className="section-header">
          <h2>{t('knowledge.title')}</h2>
          <p>{t('knowledge.description')}</p>
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
        <h2>{t('knowledge.title')}</h2>
        <p>{t('knowledge.description')}</p>
      </header>
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
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="guide-modal-title"
          onClick={() => setOpenGuide(null)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 id="guide-modal-title">{openGuide.title}</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setOpenGuide(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="muted">
                {openGuide.level} • {openGuide.duration}
              </p>
              <p style={{ marginTop: '1rem' }}>
                {openGuide.description || 'Full guide content would load here. In a production app, this could be rich text, steps, or embedded video.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Knowledge;
