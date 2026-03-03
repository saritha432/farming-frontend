import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';

function Equipment({ items, loading, onAddEquipment }) {
  const { t } = useTranslation();
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSubmitEquipment = (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.itemName.value.trim();
    const modeKey = form.mode.value;
    const price = form.price.value.trim();
    const location = form.location.value.trim();
    const includesOperator = form.includesOperator.checked;
    if (!name || !price) return;
    onAddEquipment({
      name,
      mode: modeKey,
      modeKey,
      price,
      location,
      includesOperator,
    });
    form.reset();
    setShowAddForm(false);
  };

  if (loading) {
    return (
      <section className="section">
        <header className="section-header">
          <div className="section-header-main">
            <h2>{t('equipment.title')}</h2>
            <p>{t('equipment.description')}</p>
          </div>
        </header>
        <div className="grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card skeleton skeleton-card">
              <div className="skeleton skeleton-line" style={{ width: '75%' }} />
              <div className="skeleton skeleton-line short" />
              <div className="skeleton skeleton-line" style={{ width: '50%', marginTop: '0.5rem' }} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <header className="section-header">
        <div className="section-header-main">
          <h2>{t('equipment.title')}</h2>
          <p>{t('equipment.description')}</p>
        </div>
        {onAddEquipment && (
          <div className="section-header-actions">
            <button
              type="button"
              className="primary-btn"
              onClick={() => setShowAddForm((v) => !v)}
              aria-expanded={showAddForm}
            >
              {t('equipment.listEquipment')}
            </button>
          </div>
        )}
      </header>
      {showAddForm && onAddEquipment && (
        <Modal
          title={t('equipment.listEquipment')}
          onClose={() => setShowAddForm(false)}
        >
          <form onSubmit={handleSubmitEquipment} className="form">
            <label className="form-label">
              {t('equipment.itemName')}
              <input
                type="text"
                name="itemName"
                required
                placeholder={t('equipment.itemName')}
                className="form-input"
              />
            </label>
            <label className="form-label">
              {t('equipment.modeLabel')}
              <select name="mode" required className="form-input">
                <option value="Rent">Rent</option>
                <option value="Sell">Sell</option>
              </select>
            </label>
            <label className="form-label">
              {t('equipment.priceLabel')}
              <input
                type="text"
                name="price"
                required
                placeholder="₹1,500 / day"
                className="form-input"
              />
            </label>
            <label className="form-label">
              {t('equipment.locationLabel')}
              <input
                type="text"
                name="location"
                placeholder={t('equipment.locationLabel')}
                className="form-input"
              />
            </label>
            <label className="form-label checkbox-label">
              <input type="checkbox" name="includesOperator" />
              {t('equipment.operatorLabel')}
            </label>
            <div className="card-footer-row mt">
              <button type="submit" className="primary-btn">{t('equipment.submitEquipment')}</button>
              <button type="button" className="ghost-btn" onClick={() => setShowAddForm(false)}>
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {!loading && items.length === 0 && (
        <div className="empty-state card">
          <div className="empty-state-icon" aria-hidden>🚜</div>
          <h3>{t('equipment.title')}</h3>
          <p>No equipment listed yet. List your first item for rent or sale.</p>
          {onAddEquipment && (
            <button type="button" className="primary-btn mt-lg" onClick={() => setShowAddForm(true)}>
              {t('equipment.listEquipment')}
            </button>
          )}
        </div>
      )}
      {items.length > 0 && (
        <div className="grid">
          {items.map((item) => (
            <article key={item.id} className="card">
              <h3>{item.name}</h3>
              <p className="muted">
                {item.location} • {item.mode}
              </p>
              <p className="highlight-text">{item.price}</p>
              <p className="muted">
                {item.includesOperator
                  ? t('equipment.includesOperator')
                  : t('equipment.operatorNotIncluded')}
              </p>
              <div className="card-footer-row">
                <button type="button" className="primary-btn">
                  {(item.modeKey || item.mode).toString().toLowerCase() === 'rent'
                    ? t('equipment.requestRent')
                    : t('equipment.requestSell')}
                </button>
                <button type="button" className="ghost-btn">
                  {t('equipment.viewTutorial')}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default Equipment;
