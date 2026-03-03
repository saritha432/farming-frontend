import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';

function Products({ products, onAddProduct }) {
  const { t } = useTranslation();
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSubmitProduct = (e) => {
    e.preventDefault();
    if (!onAddProduct) return;
    const form = e.target;
    const name = form.name.value.trim();
    const typeKey = form.type.value;
    const crops = form.crops.value.trim();
    const benefits = form.benefits.value.trim();
    const risk = form.risk.value.trim();
    if (!name) return;
    onAddProduct({
      name,
      typeKey,
      crops,
      benefits,
      risk,
    });
    form.reset();
    setShowAddForm(false);
  };

  return (
    <section className="section">
      <header className="section-header">
        <div className="section-header-main">
          <h2>{t('products.title')}</h2>
          <p>{t('products.description')}</p>
        </div>
        {onAddProduct && (
          <div className="section-header-actions">
            <button
              type="button"
              className="primary-btn"
              onClick={() => setShowAddForm(true)}
              aria-expanded={showAddForm}
            >
              {t('products.addGuidance')}
            </button>
          </div>
        )}
      </header>
      {showAddForm && onAddProduct && (
        <Modal
          title={t('products.addGuidance')}
          onClose={() => setShowAddForm(false)}
        >
          <form onSubmit={handleSubmitProduct} className="form">
            <label className="form-label">
              {t('products.productName')}
              <input
                type="text"
                name="name"
                required
                placeholder={t('products.productNamePlaceholder')}
                className="form-input"
              />
            </label>
            <label className="form-label">
              {t('products.typeLabel')}
              <select name="type" className="form-input">
                <option value="Organic">{t('products.typeOrganic')}</option>
                <option value="Chemical">{t('products.typeChemical')}</option>
              </select>
            </label>
            <label className="form-label">
              {t('products.cropsLabel')}
              <input
                type="text"
                name="crops"
                placeholder={t('products.cropsPlaceholder')}
                className="form-input"
              />
            </label>
            <label className="form-label">
              {t('products.benefits')}
              <textarea
                name="benefits"
                rows="3"
                placeholder={t('products.benefitsPlaceholder')}
                className="form-input"
              />
            </label>
            <label className="form-label">
              {t('products.risksCautions')}
              <textarea
                name="risk"
                rows="3"
                placeholder={t('products.risksPlaceholder')}
                className="form-input"
              />
            </label>
            <div className="card-footer-row mt">
              <button type="submit" className="primary-btn">
                {t('products.submitGuidance')}
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
      <div className="grid">
        {products.map((product) => (
          <article key={product.id} className="card">
            <h3>{product.name}</h3>
            <p className="muted">{product.crops}</p>
            <span
              className={
                (product.typeKey || product.type) === 'Organic'
                  ? 'pill pill-organic'
                  : 'pill pill-chemical'
              }
            >
              {product.type}
            </span>
            <h4 className="mt">{t('products.benefits')}</h4>
            <p>{product.benefits}</p>
            <h4 className="mt">{t('products.risksCautions')}</h4>
            <p className="muted">{product.risk}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Products;

