import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

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
          <h2>{t('equipment.title')}</h2>
          <p>{t('equipment.description')}</p>
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
        <h2>{t('equipment.title')}</h2>
        <p>{t('equipment.description')}</p>
        {onAddEquipment && (
          <button
            type="button"
            className="primary-btn"
            onClick={() => setShowAddForm((v) => !v)}
            aria-expanded={showAddForm}
          >
            {t('equipment.listEquipment')}
          </button>
        )}
      </header>
      {showAddForm && onAddEquipment && (
        <div className="card form-card">
          <h3>{t('equipment.listEquipment')}</h3>
          <form onSubmit={handleSubmitEquipment}>
            <label>
              {t('equipment.itemName')}
              <input type="text" name="itemName" required placeholder={t('equipment.itemName')} />
            </label>
            <label>
              {t('equipment.modeLabel')}
              <select name="mode" required>
                <option value="Rent">Rent</option>
                <option value="Sell">Sell</option>
              </select>
            </label>
            <label>
              {t('equipment.priceLabel')}
              <input type="text" name="price" required placeholder="₹1,500 / day" />
            </label>
            <label>
              {t('equipment.locationLabel')}
              <input type="text" name="location" placeholder={t('equipment.locationLabel')} />
            </label>
            <label className="checkbox-label">
              <input type="checkbox" name="includesOperator" />
              {t('equipment.operatorLabel')}
            </label>
            <div className="card-footer-row">
              <button type="submit" className="primary-btn">{t('equipment.submitEquipment')}</button>
              <button type="button" className="ghost-btn" onClick={() => setShowAddForm(false)}>
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
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
