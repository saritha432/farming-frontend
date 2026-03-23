import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';

function Products({ products, onAddProduct }) {
  const { t } = useTranslation();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [acreage, setAcreage] = useState(1);

  const normalizeCrop = (s) =>
    (s || '')
      .toString()
      .trim()
      .toLowerCase();

  const cropOptions = Array.isArray(products)
    ? Array.from(
        new Set(
          products
            .flatMap((p) => String(p.crops || '').split(','))
            .map((c) => c.trim())
            .filter(Boolean),
        ),
      )
    : [];

  const recommendedProducts = !selectedCrop
    ? products
    : (products || []).filter((p) => {
        const crops = String(p.crops || '');
        return normalizeCrop(crops).includes(normalizeCrop(selectedCrop));
      });

  const estimateDoseKgPerAcre = (product) => {
    const name = normalizeCrop(product?.name || '');
    // Very rough demo estimates (adjust with real agronomy in future).
    if (name.includes('urea')) return 45;
    if (name.includes('dap')) return 25;
    if (name.includes('npk') || name.includes('npk')) return 40;
    if (name.includes('neem')) return 100;
    if (name.includes('micronutr') || name.includes('zinc') || name.includes('iron')) return 10;
    return 50;
  };

  const getApplicationPlan = (product) => {
    const type = (product?.typeKey || product?.type || '').toString().toLowerCase();
    const isChemical = type.includes('chemical');
    if (!isChemical) {
      return [
        { label: 'At sowing / land prep', percent: 100, note: 'Mix into soil or apply near root zone.' },
      ];
    }
    return [
      { label: 'Basal (early stage)', percent: 50, note: 'Apply before/at initial growth.' },
      { label: 'Top dressing 1', percent: 30, note: 'Apply ~20–25 days after sowing.' },
      { label: 'Top dressing 2', percent: 20, note: 'Apply ~45–55 days after sowing.' },
    ];
  };

  const doseEstimate = (() => {
    const list = recommendedProducts || [];
    if (!list.length) return null;
    // Pick the first recommended item for the calculator preview.
    const p = list[0];
    const kgPerAcre = estimateDoseKgPerAcre(p);
    const totalKg = kgPerAcre * (Number(acreage) || 0);
    return {
      productName: p.name,
      kgPerAcre,
      totalKg,
      plan: getApplicationPlan(p),
    };
  })();

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

      <div className="fertilizers-tooling">
        <div className="grid fertilizers-grid">
          <div className="card">
            <h3>{t('products.recommendations', 'Crop recommendation')}</h3>
            <p className="muted">
              {t(
                'products.recommendationsDesc',
                'Choose a crop to see suggested fertilizer guidance from your list.',
              )}
            </p>
            <label className="form-label">
              {t('products.cropLabel', 'Crop')}
              <select
                className="form-input"
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
              >
                <option value="">
                  {t('products.allCrops', 'All crops')}
                </option>
                {cropOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="card">
            <h3>{t('products.doseCalculator', 'Dose calculator')}</h3>
            <p className="muted">
              {t(
                'products.doseCalculatorDesc',
                'Approximate fertilizer quantity based on the first recommended item. Use soil test & local agronomy for real dosing.',
              )}
            </p>
            <label className="form-label">
              {t('products.acresLabel', 'Acreage (acres)')}
              <input
                type="number"
                min="0"
                step="0.1"
                value={acreage}
                onChange={(e) => setAcreage(e.target.value)}
                className="form-input"
              />
            </label>
            {doseEstimate ? (
              <div className="dose-estimate">
                <p className="muted small">
                  {t('products.estimateFor', 'Estimated for')}
                </p>
                <div className="list-title">{doseEstimate.productName}</div>
                <div className="muted">
                  {t('products.kgPerAcre', '~{{n}} kg/acre', { n: doseEstimate.kgPerAcre })}
                </div>
                <div className="highlight-text mt">
                  ~{doseEstimate.totalKg.toFixed(1)} kg total
                </div>
                <div className="mt">
                  <p className="muted small">{t('products.splitPlan', 'Suggested split')}</p>
                  <ul className="list small">
                    {doseEstimate.plan.map((s) => (
                      <li key={s.label} className="list-item">
                        <div className="list-title">{s.label}</div>
                        <div className="muted small">
                          {s.percent}% • {s.note}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="muted">{t('products.noRecommendation', 'Select a crop to see estimates.')}</p>
            )}
          </div>

          <div className="card">
            <h3>{t('products.soilTest', 'Soil testing checklist')}</h3>
            <ul className="list">
              <li className="list-item">
                <div className="list-title">{t('products.stChecklist1', 'Test N, P2O5, K2O')}</div>
                <div className="muted small">{t('products.stChecklist1d', 'Avoid guessing nutrition levels.')}</div>
              </li>
              <li className="list-item">
                <div className="list-title">{t('products.stChecklist2', 'Check soil pH and EC')}</div>
                <div className="muted small">{t('products.stChecklist2d', 'Helps match fertilizer availability.')}</div>
              </li>
              <li className="list-item">
                <div className="list-title">{t('products.stChecklist3', 'Use local extension advice')}</div>
                <div className="muted small">{t('products.stChecklist3d', 'Dosing varies by region and season.')}</div>
              </li>
            </ul>
          </div>
        </div>
      </div>

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

