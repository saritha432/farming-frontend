import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from './api';
import './App.css';
import NavBar from './components/NavBar';
import Media from './components/Media';
import Knowledge from './components/Knowledge';
import Equipment from './components/Equipment';
import Labor from './components/Labor';
import Products from './components/Products';
import Sales from './components/Sales';
import Learning from './components/Learning';
import Community from './components/Community';
import { ToastContainer } from './components/Toast';

const TABS = {
  FEED: 'FEED',
  KNOWLEDGE: 'KNOWLEDGE',
  EQUIPMENT: 'EQUIPMENT',
  LABOR: 'LABOR',
  PRODUCTS: 'PRODUCTS',
  SALES: 'SALES',
  LEARNING: 'LEARNING',
  COMMUNITY: 'COMMUNITY',
};

function App() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState(TABS.FEED);
  const [cart, setCart] = useState([]);
  const [showCartDropdown, setShowCartDropdown] = useState(false);
  const [apiOnline, setApiOnline] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [apiData, setApiData] = useState({
    posts: null,
    guides: null,
    equipment: null,
    workers: null,
    jobs: null,
    products: null,
    salesItems: null,
    courses: null,
  });

  const addToast = useCallback(({ id, message, type }) => {
    setToasts((prev) => [...prev, { id: id || Date.now(), message, type: type || 'info' }]);
  }, []);
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.getHealth && api.getHealth().then((r) => {
      if (!cancelled) setApiOnline(r && r.ok);
    }).catch(() => {
      if (!cancelled) setApiOnline(false);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.getPosts(api.getClientId()).then((r) => ({ posts: r })).catch(() => null),
      api.getGuides().then((r) => ({ guides: r })).catch(() => null),
      api.getEquipment().then((r) => ({ equipment: r })).catch(() => null),
      api.getWorkers().then((r) => ({ workers: r })).catch(() => null),
      api.getJobs().then((r) => ({ jobs: r })).catch(() => null),
      api.getProducts().then((r) => ({ products: r })).catch(() => null),
      api.getSales().then((r) => ({ salesItems: r })).catch(() => null),
      api.getCourses().then((r) => ({ courses: r })).catch(() => null),
    ]).then((results) => {
      if (cancelled) return;
      const next = {};
      results.forEach((r) => r && Object.assign(next, r));
      if (Object.keys(next).length > 0) {
        setApiData((prev) => ({ ...prev, ...next }));
      }
    });
    return () => { cancelled = true; };
  }, []);

  const data = {
    posts: Array.isArray(apiData.posts) ? apiData.posts : [],
    guides: Array.isArray(apiData.guides) ? apiData.guides : [],
    equipment: Array.isArray(apiData.equipment) ? apiData.equipment : [],
    workers: Array.isArray(apiData.workers) ? apiData.workers : [],
    jobs: Array.isArray(apiData.jobs) ? apiData.jobs : [],
    products: Array.isArray(apiData.products) ? apiData.products : [],
    salesItems: Array.isArray(apiData.salesItems) ? apiData.salesItems : [],
    courses: Array.isArray(apiData.courses) ? apiData.courses : [],
  };

  const loading = {
    feed: apiData.posts === null,
    knowledge: apiData.guides === null,
    equipment: apiData.equipment === null,
    sales: apiData.salesItems === null,
  };

  const handleAddToCart = (item) => {
    setCart((prev) => {
      if (prev.find((p) => p.id === item.id)) return prev;
      return [...prev, item];
    });
    addToast({ id: Date.now(), message: t('toast.addedToCart'), type: 'success' });
  };

  const handleCreateJob = async (event) => {
    event.preventDefault();
    const form = event.target;
    const title = form.title.value.trim();
    const location = form.location.value.trim();
    const type = form.type.value.trim();
    if (!title || !location || !type) return;
    try {
      const created = await api.postJob({ title, location, type });
      setApiData((prev) => ({ ...prev, jobs: [...(prev.jobs || data.jobs), created] }));
      form.reset();
    } catch {
      setApiData((prev) => ({
        ...prev,
        jobs: [...(prev.jobs || data.jobs), { id: (prev.jobs?.length || 0) + 1, title, location, type }],
      }));
      form.reset();
    }
  };

  const handleAddSalesItem = async (item) => {
    try {
      const created = await api.postSalesItem(item);
      setApiData((prev) => ({ ...prev, salesItems: [...(prev.salesItems || data.salesItems), created] }));
      addToast({ id: Date.now(), message: t('toast.productListed'), type: 'success' });
    } catch {
      setApiData((prev) => ({
        ...prev,
        salesItems: [...(prev.salesItems || data.salesItems), { ...item, id: `user-sales-${Date.now()}` }],
      }));
      addToast({ id: Date.now(), message: t('toast.productListed'), type: 'success' });
    }
  };

  const handleAddEquipment = async (item) => {
    try {
      const created = await api.postEquipment(item);
      setApiData((prev) => ({ ...prev, equipment: [...(prev.equipment || data.equipment), created] }));
      addToast({ id: Date.now(), message: t('toast.equipmentListed'), type: 'success' });
    } catch {
      setApiData((prev) => ({
        ...prev,
        equipment: [...(prev.equipment || data.equipment), { ...item, id: `user-equip-${Date.now()}` }],
      }));
      addToast({ id: Date.now(), message: t('toast.equipmentListed'), type: 'success' });
    }
  };

  const handleAddGuide = async (item) => {
    try {
      const created = await api.postGuide(item);
      setApiData((prev) => ({ ...prev, guides: [...(prev.guides || data.guides), created] }));
      addToast({ id: Date.now(), message: t('toast.guideCreated'), type: 'success' });
    } catch {
      setApiData((prev) => ({
        ...prev,
        guides: [
          ...(prev.guides || data.guides),
          {
            ...item,
            id: `user-guide-${Date.now()}`,
          },
        ],
      }));
      addToast({ id: Date.now(), message: t('toast.guideCreated'), type: 'success' });
    }
  };

  const handleAddProduct = async (item) => {
    try {
      const created = await api.postProduct(item);
      setApiData((prev) => ({ ...prev, products: [...(prev.products || data.products), created] }));
      addToast({ id: Date.now(), message: t('toast.productGuidanceAdded'), type: 'success' });
    } catch {
      setApiData((prev) => ({
        ...prev,
        products: [
          ...(prev.products || data.products),
          { ...item, id: `user-product-${Date.now()}` },
        ],
      }));
      addToast({ id: Date.now(), message: t('toast.productGuidanceAdded'), type: 'success' });
    }
  };

  const refreshPosts = () => {
    api.getPosts(api.getClientId()).then((r) => setApiData((prev) => ({ ...prev, posts: r }))).catch(() => {});
  };

  const handleDeletePost = useCallback((postId) => {
    setApiData((prev) => ({
      ...prev,
      posts: Array.isArray(prev.posts) ? prev.posts.filter((p) => p.id !== postId) : prev.posts,
    }));
  }, []);

  const clearCart = () => {
    setCart([]);
    setShowCartDropdown(false);
  };

  return (
    <div className="app-root">
      {!apiOnline && (
        <div className="app-banner-offline" role="status">
          {t('app.usingCachedData')}
        </div>
      )}
      <header className="app-header">
        <div className="app-header-left">
          <h1 className="app-title">{t('app.title')}</h1>
          <p className="app-subtitle">{t('app.subtitle')}</p>
        </div>
        <div className="app-header-meta">
          <div className="app-header-icons">
            <button type="button" aria-label="Home" onClick={() => setActiveTab(TABS.FEED)}>🏠</button>
            <button type="button" aria-label="Explore" onClick={() => setActiveTab(TABS.KNOWLEDGE)}>🔍</button>
            <button type="button" aria-label="Cart">❤️</button>
          </div>
          <select
            className="lang-select"
            value={i18n.language && i18n.language.split('-')[0]}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            aria-label="Language"
          >
            <option value="en">{t('language.en')}</option>
            <option value="te">{t('language.te')}</option>
            <option value="hi">{t('language.hi')}</option>
          </select>
          <div className="cart-pill-wrap">
            {cart.length > 0 && (
              <>
                <button
                  type="button"
                  className="app-cart-pill app-cart-pill-btn"
                  onClick={() => setShowCartDropdown((v) => !v)}
                  aria-expanded={showCartDropdown}
                  aria-haspopup="true"
                >
                  {t('app.cart')}: <strong>{cart.length}</strong>
                </button>
                {showCartDropdown && (
                  <div className="cart-dropdown" role="dialog" aria-label={t('app.cart')}>
                    <h4>{t('sales.yourCart')}</h4>
                    <ul>
                      {cart.map((item) => (
                        <li key={item.id}>
                          <strong>{item.name}</strong> — {item.price}
                        </li>
                      ))}
                    </ul>
                    <div className="cart-dropdown-actions">
                      <button type="button" className="small-btn" onClick={clearCart}>
                        {t('app.clearCart')}
                      </button>
                      <button type="button" className="primary-btn">
                        {t('sales.proceedPayment')}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      <NavBar activeTab={activeTab} onChangeTab={setActiveTab} tabs={TABS} />

      <main className="app-main">
        <div className="ig-shell">
          <div className="ig-feed-column">
            {activeTab === TABS.FEED && (
              <Media
                posts={data.posts}
                loading={loading.feed}
                refreshPosts={refreshPosts}
                onDeletePost={handleDeletePost}
                showToast={addToast}
                t={t}
              />
            )}

            {activeTab === TABS.KNOWLEDGE && (
              <Knowledge guides={data.guides} loading={loading.knowledge} onAddGuide={handleAddGuide} />
            )}

            {activeTab === TABS.EQUIPMENT && (
              <Equipment
                items={data.equipment}
                loading={loading.equipment}
                onAddEquipment={handleAddEquipment}
                showToast={addToast}
                t={t}
              />
            )}

            {activeTab === TABS.LABOR && (
              <Labor
                laborProfiles={data.workers}
                jobs={data.jobs}
                onCreateJob={handleCreateJob}
              />
            )}

            {activeTab === TABS.PRODUCTS && (
              <Products products={data.products} onAddProduct={handleAddProduct} />
            )}

            {activeTab === TABS.SALES && (
              <Sales
                items={data.salesItems}
                cart={cart}
                loading={loading.sales}
                onAddToCart={handleAddToCart}
                onAddSalesItem={handleAddSalesItem}
                showToast={addToast}
                t={t}
              />
            )}

            {activeTab === TABS.LEARNING && (
              <Learning courses={data.courses} />
            )}

            {activeTab === TABS.COMMUNITY && <Community />}
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p className="muted">{t('app.footer')}</p>
      </footer>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default App;
