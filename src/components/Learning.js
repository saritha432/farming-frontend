import React from 'react';
import { useTranslation } from 'react-i18next';

function Learning({ courses }) {
  const { t } = useTranslation();
  return (
    <section className="section">
      <header className="section-header">
        <div className="section-header-main">
          <h2>{t('learning.title')}</h2>
          <p>{t('learning.description')}</p>
        </div>
      </header>
      <div className="grid">
        {courses.map((course) => (
          <article key={course.id} className="card">
            <h3>{course.title}</h3>
            <p className="muted">
              {course.modules} {t('learning.modules')} • {t('learning.badge')}: {course.badge}
            </p>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${course.progress}%` }}
              />
            </div>
            <p className="muted">{t('learning.progress')}: {course.progress}%</p>
            <button type="button" className="primary-btn">
              {t('learning.continueCourse')}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Learning;

