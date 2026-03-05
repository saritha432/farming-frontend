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
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem('agrovibes_active_tab');
        if (saved && Object.values(TABS).includes(saved)) {
          return saved;
        }
      } catch {
        // ignore
      }
    }
    return TABS.FEED;
  });
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
    knowledgeSessions: null,
  });

  const addToast = useCallback(({ id, message, type }) => {
    setToasts((prev) => [...prev, { id: id || Date.now(), message, type: type || 'info' }]);
  }, []);
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.getHealth &&
      api
        .getHealth()
        .then((r) => {
          if (!cancelled) setApiOnline(r && r.ok);
        })
        .catch(() => {
          if (!cancelled) setApiOnline(false);
        });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadForTab = async () => {
      try {
        if (activeTab === TABS.FEED && apiData.posts === null) {
          const posts = await api.getPosts(api.getClientId()).catch(() => null);
          if (!cancelled && Array.isArray(posts)) {
            setApiData((prev) => ({ ...prev, posts }));
          }
        }

        if (activeTab === TABS.KNOWLEDGE) {
          if (apiData.guides === null) {
            const guides = await api.getGuides().catch(() => null);
            if (!cancelled && Array.isArray(guides)) {
              setApiData((prev) => ({ ...prev, guides }));
            }
          }

          if (apiData.knowledgeSessions === null) {
            const sessions = await api
              .getKnowledgeSessions(api.getClientId())
              .catch(() => null);
            if (!cancelled && Array.isArray(sessions)) {
              setApiData((prev) => ({ ...prev, knowledgeSessions: sessions }));
            }
          }
        }

        if (activeTab === TABS.EQUIPMENT && apiData.equipment === null) {
          const equipment = await api.getEquipment().catch(() => null);
          if (!cancelled && Array.isArray(equipment)) {
            setApiData((prev) => ({ ...prev, equipment }));
          }
        }

        if (activeTab === TABS.LABOR && (apiData.workers === null || apiData.jobs === null)) {
          const [workers, jobs] = await Promise.all([
            api.getWorkers().catch(() => null),
            api.getJobs().catch(() => null),
          ]);
          const next = {};
          if (Array.isArray(workers)) next.workers = workers;
          if (Array.isArray(jobs)) next.jobs = jobs;
          if (!cancelled && Object.keys(next).length) {
            setApiData((prev) => ({ ...prev, ...next }));
          }
        }

        if (activeTab === TABS.PRODUCTS && apiData.products === null) {
          const products = await api.getProducts().catch(() => null);
          if (!cancelled && Array.isArray(products)) {
            setApiData((prev) => ({ ...prev, products }));
          }
        }

        if (activeTab === TABS.SALES && apiData.salesItems === null) {
          const salesItems = await api.getSales().catch(() => null);
          if (!cancelled && Array.isArray(salesItems)) {
            setApiData((prev) => ({ ...prev, salesItems }));
          }
        }

        if (activeTab === TABS.LEARNING && apiData.courses === null) {
          const courses = await api.getCourses().catch(() => null);
          if (!cancelled && Array.isArray(courses)) {
            setApiData((prev) => ({ ...prev, courses }));
          }
        }
      } catch {
        // ignore individual load errors here; UI already handles empty states
      }
    };

    loadForTab();

    return () => {
      cancelled = true;
    };
  }, [activeTab, apiData, setApiData]);

  const data = {
    posts: Array.isArray(apiData.posts) ? apiData.posts : [],
    guides: Array.isArray(apiData.guides) ? apiData.guides : [],
    equipment: Array.isArray(apiData.equipment) ? apiData.equipment : [],
    workers: Array.isArray(apiData.workers) ? apiData.workers : [],
    jobs: Array.isArray(apiData.jobs) ? apiData.jobs : [],
    products: Array.isArray(apiData.products) ? apiData.products : [],
    salesItems: Array.isArray(apiData.salesItems) ? apiData.salesItems : [],
    courses: Array.isArray(apiData.courses) ? apiData.courses : [],
    knowledgeSessions: Array.isArray(apiData.knowledgeSessions)
      ? apiData.knowledgeSessions
      : [],
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
      let created;
      if (item.file) {
        const formData = new FormData();
        formData.append('title', item.title);
        if (item.level) formData.append('level', item.level);
        if (item.duration) formData.append('duration', item.duration);
        if (item.description) formData.append('description', item.description);
        formData.append('file', item.file);
        created = await api.postGuide(formData);
      } else {
        created = await api.postGuide({
          title: item.title,
          level: item.level,
          duration: item.duration,
          description: item.description,
        });
      }
      setApiData((prev) => ({ ...prev, guides: [...(prev.guides || data.guides), created] }));
      addToast({ id: Date.now(), message: t('toast.guideCreated'), type: 'success' });

      if (item.scheduleSession && item.scheduleAt) {
        try {
          await api.createKnowledgeSession({
            title: created.title,
            description: created.description || '',
            schedule: item.scheduleAt,
            host: '',
            status: 'upcoming',
          });
          const refreshed = await api
            .getKnowledgeSessions(api.getClientId())
            .catch(() => null);
          if (Array.isArray(refreshed)) {
            setApiData((prev) => ({ ...prev, knowledgeSessions: refreshed }));
          }
        } catch {
          // ignore scheduling errors; guide creation already succeeded
        }
      }
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

  const handleUpdateGuide = async (id, updates) => {
    try {
      const updated = await api.updateGuide(id, updates);
      setApiData((prev) => ({
        ...prev,
        guides: (prev.guides || data.guides).map((g) => (g.id === id ? updated : g)),
      }));
      addToast({ id: Date.now(), message: t('toast.guideCreated'), type: 'success' });
    } catch {
      // ignore errors for now
    }
  };

  const handleDeleteGuide = async (id) => {
    try {
      await api.deleteGuide(id);
    } catch {
      // even if delete fails on server, reflect locally
    }
    setApiData((prev) => ({
      ...prev,
      guides: (prev.guides || data.guides).filter((g) => g.id !== id),
    }));
  };

  const handleToggleKnowledgeSubscribe = async (sessionId) => {
    try {
      await api.subscribeKnowledgeSession(sessionId, api.getClientId());
      const refreshed = await api
        .getKnowledgeSessions(api.getClientId())
        .catch(() => null);
      if (Array.isArray(refreshed)) {
        setApiData((prev) => ({ ...prev, knowledgeSessions: refreshed }));
      }
    } catch {
      // ignore, user will just see unchanged state
    }
  };

  const handleAskKnowledgeQuestion = async (sessionId, text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      await api.postKnowledgeQuestion(sessionId, {
        author: 'Farmer',
        text: trimmed,
      });
      const refreshed = await api
        .getKnowledgeSessions(api.getClientId())
        .catch(() => null);
      if (Array.isArray(refreshed)) {
        setApiData((prev) => ({ ...prev, knowledgeSessions: refreshed }));
      }
    } catch {
      // ignore for now
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
            <button
              type="button"
              aria-label="Home"
              onClick={() => {
                setActiveTab(TABS.FEED);
                if (typeof window !== 'undefined') {
                  try {
                    window.localStorage.setItem('agrovibes_active_tab', TABS.FEED);
                  } catch {
                    // ignore
                  }
                }
              }}
            >
              🏠
            </button>
            <button
              type="button"
              aria-label="Explore"
              onClick={() => {
                setActiveTab(TABS.KNOWLEDGE);
                if (typeof window !== 'undefined') {
                  try {
                    window.localStorage.setItem('agrovibes_active_tab', TABS.KNOWLEDGE);
                  } catch {
                    // ignore
                  }
                }
              }}
            >
              🔍
            </button>
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

      <NavBar
        activeTab={activeTab}
        onChangeTab={(tab) => {
          setActiveTab(tab);
          if (typeof window !== 'undefined') {
            try {
              window.localStorage.setItem('agrovibes_active_tab', tab);
            } catch {
              // ignore
            }
          }
        }}
        tabs={TABS}
      />

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
              <Knowledge
                guides={data.guides}
                loading={loading.knowledge}
                onAddGuide={handleAddGuide}
                onUpdateGuide={handleUpdateGuide}
                onDeleteGuide={handleDeleteGuide}
                sessions={data.knowledgeSessions}
                onToggleSubscribe={handleToggleKnowledgeSubscribe}
                onAskQuestion={handleAskKnowledgeQuestion}
              />
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
