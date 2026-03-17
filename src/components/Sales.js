import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';

function Sales({ items, cart, loading, onAddToCart, onAddSalesItem }) {
  const { t } = useTranslation();
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSubmitProduct = (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.productName.value.trim();
    const farm = form.farmName.value.trim();
    const price = form.price.value.trim();
    const location = form.location.value.trim();
    const tagsStr = form.tags.value.trim();
    const tags = tagsStr ? tagsStr.split(',').map((s) => s.trim()).filter(Boolean) : [];
    if (!name || !farm || !price) return;
    onAddSalesItem({ name, farm, price, location, tags });
    form.reset();
    setShowAddForm(false);
  };

  if (loading) {
    return (
      <section className="section">
        <header className="section-header">
          <div className="section-header-main">
            <h2>{t('sales.title')}</h2>
            <p>{t('sales.description')}</p>
          </div>
        </header>
        <div className="grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card skeleton skeleton-card">
              <div className="skeleton skeleton-line" style={{ width: '70%' }} />
              <div className="skeleton skeleton-line short" />
              <div className="skeleton skeleton-line" style={{ width: '40%', marginTop: '0.5rem' }} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  const cartCount = Array.isArray(cart) ? cart.length : 0;
  const uniqueFarms = Array.isArray(cart)
    ? Array.from(new Set(cart.map((item) => item.farm).filter(Boolean)))
    : [];

  return (
    <section className="section">
      <header className="section-header">
        <div className="section-header-main">
          <h2>{t('sales.title')}</h2>
          <p>{t('sales.description')}</p>
        </div>
        <div className="section-header-actions">
          <button
            type="button"
            className="primary-btn"
            onClick={() => setShowAddForm((v) => !v)}
            aria-expanded={showAddForm}
          >
            {t('sales.addProduct')}
          </button>
        </div>
      </header>
      {showAddForm && (
        <Modal
          title={t('sales.addProduct')}
          onClose={() => setShowAddForm(false)}
        >
          <form onSubmit={handleSubmitProduct} className="form">
            <label className="form-label">
              {t('sales.productName')}
              <input
                type="text"
                name="productName"
                required
                placeholder={t('sales.productName')}
                className="form-input"
              />
            </label>
            <label className="form-label">
              {t('sales.farmName')}
              <input
                type="text"
                name="farmName"
                required
                placeholder={t('sales.farmName')}
                className="form-input"
              />
            </label>
            <label className="form-label">
              {t('sales.priceLabel')}
              <input
                type="text"
                name="price"
                required
                placeholder="₹50 / kg"
                className="form-input"
              />
            </label>
            <label className="form-label">
              {t('sales.locationLabel')}
              <input
                type="text"
                name="location"
                placeholder={t('sales.locationLabel')}
                className="form-input"
              />
            </label>
            <label className="form-label">
              {t('sales.tagsPlaceholder')}
              <input
                type="text"
                name="tags"
                placeholder={t('sales.tagsPlaceholder')}
                className="form-input"
              />
            </label>
            <div className="card-footer-row mt">
              <button type="submit" className="primary-btn">{t('sales.submitProduct')}</button>
              <button type="button" className="ghost-btn" onClick={() => setShowAddForm(false)}>
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {!loading && items.length === 0 && (
        <div className="empty-state card">
          <div className="empty-state-icon" aria-hidden>🛒</div>
          <h3>{t('sales.title')}</h3>
          <p>No products listed yet. Add the first one to the marketplace.</p>
          <button type="button" className="primary-btn mt-lg" onClick={() => setShowAddForm(true)}>
            {t('sales.addProduct')}
          </button>
        </div>
      )}
      {items.length > 0 && (
        <div className="grid">
          {items.map((item) => (
            <article key={item.id} className="card">
              <h3>{item.name}</h3>
              <p className="muted">
                {item.farm} • {item.location}
              </p>
              <p className="highlight-text">{item.price}</p>
              <div className="tag-row">
                {(item.tags || []).map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="card-footer-row">
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => onAddToCart(item)}
                >
                  {t('sales.addToCart')}
                </button>
                <button type="button" className="ghost-btn">
                  {t('sales.viewFarmProfile')}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      <aside className="card cart-card">
        <h3>{t('sales.yourCart')}</h3>
        <p className="muted">
          {t(
            'sales.cartSubtitle',
            'Direct sales from local farms. Review your basket before confirming.',
          )}
        </p>
        {cartCount === 0 ? (
          <>
            <p className="muted">{t('sales.cartEmpty')}</p>
            <ul className="list small mt">
              <li className="list-item">
                {t('sales.benefitFresh', 'Fresher produce, directly from farmers')}
              </li>
              <li className="list-item">
                {t('sales.benefitTransparent', 'Transparent pricing with no middlemen')}
              </li>
              <li className="list-item">
                {t('sales.benefitSupport', 'Support your local farming community')}
              </li>
            </ul>
          </>
        ) : (
          <>
            <div className="cart-summary-row">
              <span className="pill">
                {t('sales.itemsInCart', '{{count}} items', { count: cartCount })}
              </span>
              {uniqueFarms.length > 0 && (
                <span className="muted small">
                  {t(
                    'sales.fromFarms',
                    'From {{count}} farm(s)',
                    { count: uniqueFarms.length },
                  )}
                </span>
              )}
            </div>
            <ul className="list">
              {cart.map((item) => (
                <li key={item.id} className="list-item">
                  <div>
                    <div className="list-title">{item.name}</div>
                    <div className="muted">
                      {item.farm} • {item.price}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <button type="button" className="primary-btn full-width">
              {t('sales.proceedPayment')}
            </button>
          </>
        )}
      </aside>
    </section>
  );
}

export default Sales;
