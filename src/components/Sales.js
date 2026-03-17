import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';

function Sales({ items, cart, loading, onAddToCart, onAddSalesItem, onProceedPayment }) {
  const { t } = useTranslation();
  const [showAddForm, setShowAddForm] = useState(false);
  const [quantities, setQuantities] = useState({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);

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

  const safeCart = Array.isArray(cart) ? cart : [];
  const cartCount = safeCart.length;
  const sortedCart = [...safeCart].sort((a, b) => {
    const numA = a && a.price ? parseFloat(String(a.price).replace(/[^\d.]/g, '')) || 0 : 0;
    const numB = b && b.price ? parseFloat(String(b.price).replace(/[^\d.]/g, '')) || 0 : 0;
    return numA - numB;
  });

  const updateQuantity = (id, delta) => {
    if (id == null) return;
    setQuantities((prev) => {
      const current = prev[id] || 1;
      const next = current + delta;
      if (next < 1) return prev;
      return { ...prev, [id]: next };
    });
  };

  const computeTotals = () => {
    return sortedCart.reduce(
      (acc, item) => {
        const quantity = quantities[item.id] || 1;
        const priceNum = item && item.price
          ? parseFloat(String(item.price).replace(/[^\d.]/g, '')) || 0
          : 0;
        const lineTotal = priceNum * quantity;
        acc.total += lineTotal;
        return acc;
      },
      { total: 0 },
    );
  };

  const handleProceedPayment = () => {
    if (!cartCount) return;
    setPaymentStatus(null);
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    const { total } = computeTotals();

    // Hook for real payment gateway (Razorpay/Stripe/etc.) from parent
    if (typeof onProceedPayment === 'function') {
      await onProceedPayment({
        cart: sortedCart,
        quantities,
        totalAmount: total,
      });
      setShowPaymentModal(false);
      return;
    }

    // Frontend-only demo flow
    setPaymentStatus('success');
    setTimeout(() => {
      setShowPaymentModal(false);
      setPaymentStatus(null);
    }, 2000);
  };

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
        <div className="cart-header-row">
          <h3>{t('sales.yourCart')}</h3>
          {cartCount > 0 && (
            <span className="pill">
              {t('sales.itemsInCart', '{{count}} items', { count: cartCount })}
            </span>
          )}
        </div>
        {cartCount === 0 ? (
          <p className="muted">{t('sales.cartEmpty')}</p>
        ) : (
          <>
            <ul className="list">
              {sortedCart.map((item) => {
                const quantity = quantities[item.id] || 1;
                const priceNum = item && item.price
                  ? parseFloat(String(item.price).replace(/[^\d.]/g, '')) || 0
                  : 0;
                const lineTotal = priceNum * quantity;
                return (
                  <li key={item.id} className="list-item">
                    <div className="cart-item-main">
                      <div>
                        <div className="list-title">{item.name}</div>
                        <div className="muted small">
                          {item.farm} • {item.price}
                        </div>
                      </div>
                      <div className="cart-item-line-total">
                        ₹{lineTotal.toFixed(2)}
                      </div>
                    </div>
                    <div className="cart-item-qty-row">
                      <button
                        type="button"
                        className="small-btn"
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        -
                      </button>
                      <span className="muted small">
                        {t('sales.quantityLabel', 'Qty')}: {quantity}
                      </span>
                      <button
                        type="button"
                        className="small-btn"
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        +
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="cart-footer-summary">
              <span className="muted">
                {t('sales.totalLabel', 'Total payable')}:
              </span>
              <strong>
                ₹{computeTotals().total.toFixed(2)}
              </strong>
            </div>
            <button
              type="button"
              className="primary-btn full-width"
              onClick={handleProceedPayment}
            >
              {t('sales.proceedPayment')}
            </button>
          </>
        )}
      </aside>

      {showPaymentModal && cartCount > 0 && (
        <Modal
          title={t('sales.paymentTitle', 'Proceed to payment')}
          onClose={() => setShowPaymentModal(false)}
        >
          <form className="form" onSubmit={handleConfirmPayment}>
            <p className="muted">
              {t(
                'sales.paymentSummaryIntro',
                'Confirm your direct sales order before continuing to the payment gateway.',
              )}
            </p>
            <ul className="list small mt">
              {sortedCart.map((item) => {
                const quantity = quantities[item.id] || 1;
                return (
                  <li key={item.id} className="list-item">
                    <div className="list-title">
                      {item.name} × {quantity}
                    </div>
                    <div className="muted">
                      {item.farm} • {item.price}
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="payment-total-row">
              <span className="muted">
                {t('sales.totalLabel', 'Estimated total')}:
              </span>
              <strong>
                ₹
                {computeTotals().total.toFixed(2)}
              </strong>
            </div>
            {paymentStatus === 'success' && (
              <p className="success-text">
                {t(
                  'sales.paymentSuccessDemo',
                  'Payment simulation successful. Integrate your live payment gateway in the parent component.',
                )}
              </p>
            )}
            <div className="card-footer-row mt">
              <button type="submit" className="primary-btn">
                {t('sales.payNow', 'Pay now (demo / gateway hook)')}
              </button>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setShowPaymentModal(false)}
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

export default Sales;
