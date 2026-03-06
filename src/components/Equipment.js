import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';

function Equipment({ items, loading, onAddEquipment, showToast }) {
  const { t } = useTranslation();
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [modeFilter, setModeFilter] = useState('all');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestItem, setRequestItem] = useState(null);

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

  const normalizedItems = Array.isArray(items) ? items : [];
  const hasItems = normalizedItems.length > 0;

  const filteredItems = normalizedItems.filter((item) => {
    const modeValue = (item.modeKey || item.mode || '').toString().toLowerCase();
    const matchesMode = modeFilter === 'all' ? true : modeValue === modeFilter;

    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      (item.name && item.name.toLowerCase().includes(term)) ||
      (item.location && item.location.toLowerCase().includes(term));

    return matchesMode && matchesSearch;
  });

  const handleOpenRequest = (item) => {
    setRequestItem(item);
    setShowRequestModal(true);
  };

  const handleCloseRequest = () => {
    setShowRequestModal(false);
    setRequestItem(null);
  };

  const handleSubmitRequest = (e) => {
    e.preventDefault();
    const form = e.target;
    const startDate = form.startDate.value;
    const endDate = form.endDate.value;
    const fullName = form.fullName.value.trim();
    const phone = form.phone.value.trim();

    if (!fullName || !phone || !startDate || !endDate) return;

    // For now we just show a confirmation toast; backend wiring can be added later.
    if (typeof showToast === 'function') {
      showToast(
        t(
          'equipment.requestSubmitted',
          'Your request has been sent to the owner. They will contact you soon.',
        ),
        'success',
      );
    }

    // Example payload if you later want to send this to an API:
    // const payload = {
    //   itemId: requestItem?.id,
    //   startDate,
    //   endDate,
    //   fullName,
    //   phone,
    //   notes: form.notes.value.trim(),
    // };

    form.reset();
    handleCloseRequest();
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
      {!loading && !hasItems && (
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
      {hasItems && (
        <>
          <div className="equipment-filters">
            <div className="equipment-filters-left">
              <input
                type="search"
                className="form-input equipment-search-input"
                placeholder={t(
                  'equipment.searchPlaceholder',
                  'Search equipment by name or location',
                )}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="equipment-filters-right">
              <select
                className="form-input"
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
              >
                <option value="all">
                  {t('equipment.filterModeAll', 'All modes')}
                </option>
                <option value="rent">
                  {t('equipment.filterModeRent', 'Rent only')}
                </option>
                <option value="sell">
                  {t('equipment.filterModeSell', 'Sell only')}
                </option>
              </select>
            </div>
          </div>
          {filteredItems.length === 0 ? (
            <div className="empty-state card">
              <div className="empty-state-icon" aria-hidden>🔍</div>
              <h3>
                {t('equipment.noMatchesTitle', 'No equipment matches your filters')}
              </h3>
              <p>
                {t(
                  'equipment.noMatchesDescription',
                  'Try changing or clearing your filters to see more equipment.',
                )}
              </p>
              <button
                type="button"
                className="small-btn mt-lg"
                onClick={() => {
                  setSearchTerm('');
                  setModeFilter('all');
                }}
              >
                {t('equipment.clearFilters', 'Clear filters')}
              </button>
            </div>
          ) : (
            <div className="grid equipment-grid">
              {filteredItems.map((item) => {
                const key = item.id || item.name;
                const statusRaw = (item.status || 'available').toString().toLowerCase();
                let statusLabel;
                if (statusRaw === 'maintenance' || statusRaw === 'under_maintenance') {
                  statusLabel = t('equipment.statusMaintenance', 'Under maintenance');
                } else if (statusRaw === 'in_use' || statusRaw === 'in use') {
                  statusLabel = t('equipment.statusInUse', 'In use');
                } else {
                  statusLabel = t('equipment.statusAvailable', 'Available');
                }
                const modeLabel = (item.modeKey || item.mode || '').toString();

                return (
                  <article key={key} className="card equipment-card">
                    <div className="equipment-card-header">
                      <h3>{item.name}</h3>
                      <span
                        className={`pill equipment-status-pill equipment-status-${statusRaw.replace(
                          /\s+/g,
                          '_',
                        )}`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <p className="muted equipment-card-meta">
                      <span>
                        {item.category || t('equipment.defaultCategory', 'General')}
                      </span>
                      {item.location && <span>{item.location}</span>}
                    </p>
                    <p className="highlight-text">{item.price}</p>
                    <p className="muted">
                      {item.includesOperator
                        ? t('equipment.includesOperator')
                        : t('equipment.operatorNotIncluded')}
                    </p>
                    <div className="card-footer-row equipment-card-footer">
                      <button
                        type="button"
                        className="primary-btn"
                        onClick={() => handleOpenRequest(item)}
                      >
                        {modeLabel.toLowerCase() === 'rent'
                          ? t('equipment.requestRent')
                          : t('equipment.requestSell')}
                      </button>
                      <button type="button" className="ghost-btn">
                        {t('equipment.viewTutorial')}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {showRequestModal && requestItem && (
        <Modal
          title={t('equipment.requestModalTitle', 'Request this equipment')}
          onClose={handleCloseRequest}
        >
          <div className="equipment-request-summary">
            <p className="muted">
              <strong>{requestItem.name}</strong>
              {requestItem.price ? ` — ${requestItem.price}` : ''}
            </p>
          </div>
          <form className="form" onSubmit={handleSubmitRequest}>
            <label className="form-label">
              {t('equipment.requestDates', 'When do you need it?')}
              <div className="equipment-request-dates">
                <input
                  type="date"
                  name="startDate"
                  required
                  className="form-input"
                />
                <input
                  type="date"
                  name="endDate"
                  required
                  className="form-input"
                />
              </div>
            </label>
            <label className="form-label">
              {t('equipment.requestFullName', 'Your name')}
              <input
                type="text"
                name="fullName"
                required
                className="form-input"
              />
            </label>
            <label className="form-label">
              {t('equipment.requestPhone', 'Phone / WhatsApp')}
              <input
                type="tel"
                name="phone"
                required
                className="form-input"
              />
            </label>
            <label className="form-label">
              {t('equipment.requestNotes', 'Notes for owner (optional)')}
              <textarea
                name="notes"
                rows="3"
                className="form-input"
              />
            </label>
            <div className="card-footer-row mt">
              <button type="submit" className="primary-btn">
                {t('equipment.submitRequest', 'Send request')}
              </button>
              <button type="button" className="ghost-btn" onClick={handleCloseRequest}>
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}

export default Equipment;
