import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from './api';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import NavBar from './components/NavBar';
import Media from './components/Media';
import Knowledge from './components/Knowledge';
import Equipment from './components/Equipment';
import Labor from './components/Labor';
import Products from './components/Products';
import Sales from './components/Sales';
import Learning from './components/Learning';
import Community from './components/Community';
import Profile from './components/Profile';
import LoginModal from './components/LoginModal';
import SignupModal from './components/SignupModal';
import AuthGate from './components/AuthGate';
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
  PROFILE: 'PROFILE',
};

function AppContent() {
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading, login, signup, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showAuthDropdown, setShowAuthDropdown] = useState(false);
  const authDropdownRef = useRef(null);
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
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const [showAddPostModal, setShowAddPostModal] = useState(false);
  const prevUserRef = useRef(null);
  const [seenInteractions, setSeenInteractions] = useState(0);
  const [feedUserFilter, setFeedUserFilter] = useState(null);

  const addToast = useCallback(({ id, message, type }) => {
    setToasts((prev) => [...prev, { id: id || Date.now(), message, type: type || 'info' }]);
  }, []);
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // After login/signup, go directly to Media Feed
  useEffect(() => {
    if (user && !prevUserRef.current) {
      setActiveTab(TABS.FEED);
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('agrovibes_active_tab', TABS.FEED);
        } catch {
          // ignore
        }
      }
    }
    prevUserRef.current = user;
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (authDropdownRef.current && !authDropdownRef.current.contains(e.target)) {
        setShowAuthDropdown(false);
      }
    };
    if (showAuthDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showAuthDropdown]);

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
            const sorted = [...posts].sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
            setApiData((prev) => ({ ...prev, posts: sorted }));
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

  // Simple notification count: likes + comments on my posts
  const myInteractionTotal = Array.isArray(data.posts) && user
    ? data.posts
        .filter(
          (p) =>
            p.farmer === user.fullName ||
            p.farmer === user.username,
        )
        .reduce(
          (sum, p) =>
            sum +
            (Number(p.likeCount || 0) +
              Number(p.commentCount || 0)),
          0,
        )
    : 0;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('agrovibes_seen_interactions');
      if (raw != null) {
        const n = Number(raw);
        if (!Number.isNaN(n)) {
          setSeenInteractions(n);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const unseenInteractions = Math.max(
    myInteractionTotal - seenInteractions,
    0,
  );

  const handleOpenNotifications = () => {
    setActiveTab(TABS.PROFILE);
    try {
      window.localStorage.setItem(
        'agrovibes_seen_interactions',
        String(myInteractionTotal),
      );
    } catch {
      // ignore
    }
    setSeenInteractions(myInteractionTotal);
  };

  const handleViewUserFromSearch = (userSummary) => {
    setFeedUserFilter(
      userSummary
        ? {
            id: userSummary.id,
            username: userSummary.username || '',
            fullName: userSummary.fullName || '',
          }
        : null,
    );
    setActiveTab(TABS.FEED);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('agrovibes_active_tab', TABS.FEED);
      } catch {
        // ignore
      }
    }
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

  const handleRequestEquipment = async (equipmentId, requestBody) => {
    // Send a rent/sell request for a specific equipment item.
    await api.postEquipmentRequest(equipmentId, requestBody);
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
            guideId: created.id,
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

  const handleAskKnowledgeQuestion = async (sessionId, text, parentId) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      const body = {
        author: 'Farmer',
        text: trimmed,
      };
      if (parentId != null) {
        body.parentId = parentId;
      }
      await api.postKnowledgeQuestion(sessionId, body);
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

  const refreshKnowledgeSessions = async () => {
    const refreshed = await api.getKnowledgeSessions(api.getClientId()).catch(() => null);
    if (Array.isArray(refreshed)) {
      setApiData((prev) => ({ ...prev, knowledgeSessions: refreshed }));
    }
  };

  const handleDeleteKnowledgeSession = async (sessionId) => {
    try {
      await api.deleteKnowledgeSession(sessionId);
    } catch {
      // ignore delete errors; we'll refresh list anyway
    }
    await refreshKnowledgeSessions();
  };

  const handleUpdateKnowledgeSession = async (sessionId, updates) => {
    try {
      await api.updateKnowledgeSession(sessionId, updates);
    } catch {
      // ignore errors; we'll refresh list anyway
    }
    await refreshKnowledgeSessions();
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
    api
      .getPosts(api.getClientId())
      .then((r) =>
        setApiData((prev) => ({
          ...prev,
          posts: Array.isArray(r) ? r : prev.posts,
        })),
      )
      .catch(() => {});
  };

  const handleDeletePost = useCallback(
    async (postId) => {
      // Optimistically remove the post from local state
      setApiData((prev) => ({
        ...prev,
        posts: Array.isArray(prev.posts) ? prev.posts.filter((p) => p.id !== postId) : prev.posts,
      }));
      try {
        await api.deletePost(postId);
        addToast({ id: Date.now(), message: t('toast.postDeleted'), type: 'success' });
      } catch {
        // If delete fails on the server, reload posts so the UI stays in sync
        api
          .getPosts(api.getClientId())
          .then((r) =>
            setApiData((prev) => ({
              ...prev,
              posts: Array.isArray(r) ? r : prev.posts,
            })),
          )
          .catch(() => {});
        addToast({ id: Date.now(), message: t('toast.deleteFailed'), type: 'error' });
      }
    },
    [addToast, t],
  );

  const clearCart = () => {
    setCart([]);
    setShowCartDropdown(false);
  };

  // Auth gate: show only signup/login for new visitors (Instagram/FB style)
  if (authLoading) {
    return (
      <div className="app-root auth-gate-loading">
        <div className="auth-gate-loading-spinner" aria-hidden />
        <p className="auth-gate-loading-text">{t('authGate.loading', 'Loading…')}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-root">
        <AuthGate
          onLogin={() => setShowLoginModal(true)}
          onSignup={() => setShowSignupModal(true)}
        />
        {showLoginModal && (
          <LoginModal
            onClose={() => setShowLoginModal(false)}
            onSuccess={login}
            onSwitchToSignup={() => {
              setShowLoginModal(false);
              setShowSignupModal(true);
            }}
          />
        )}
        {showSignupModal && (
          <SignupModal
            onClose={() => setShowSignupModal(false)}
            onSuccess={signup}
            onSwitchToLogin={() => {
              setShowSignupModal(false);
              setShowLoginModal(true);
            }}
          />
        )}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    );
  }

  return (
    <div className="app-root">
      {!apiOnline && (
        <div className="app-banner-offline" role="status">
          {t('app.usingCachedData')}
        </div>
      )}
      <header className="app-header">
        <div className="app-header-left">
          <button
            type="button"
            className="app-header-menu-toggle"
            aria-label="Show navigation labels"
            onMouseEnter={() => setIsNavExpanded(true)}
          >
            ☰
          </button>
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
              className="app-header-add-post-btn"
              aria-label={t('media.addPost', 'Add post')}
              onClick={() => {
                setActiveTab(TABS.FEED);
                setShowAddPostModal(true);
                if (typeof window !== 'undefined') {
                  try {
                    window.localStorage.setItem('agrovibes_active_tab', TABS.FEED);
                  } catch {
                    // ignore
                  }
                }
              }}
              title={t('media.addPost', 'Add post')}
            >
              +
            </button>
            <button
              type="button"
              aria-label="Search community"
              onClick={() => {
                setActiveTab(TABS.COMMUNITY);
                if (typeof window !== 'undefined') {
                  try {
                    window.localStorage.setItem('agrovibes_active_tab', TABS.COMMUNITY);
                  } catch {
                    // ignore
                  }
                }
              }}
            >
              🔍
            </button>
            <button
              type="button"
              className="app-header-notif-btn"
              aria-label="Notifications"
              onClick={handleOpenNotifications}
            >
              ❤️
              {unseenInteractions > 0 && (
                <span className="app-header-notif-badge">
                  {unseenInteractions > 9 ? '9+' : unseenInteractions}
                </span>
              )}
            </button>
          </div>
          <div className="app-header-auth">
            {user ? (
              <div className="auth-user-wrap" ref={authDropdownRef}>
                <button
                  type="button"
                  className="auth-avatar-btn"
                  onClick={() => setShowAuthDropdown((v) => !v)}
                  aria-expanded={showAuthDropdown}
                  aria-haspopup="true"
                  aria-label={t('profile.myProfile', 'My profile')}
                >
                  <span className="auth-avatar">
                    {user.avatar ? (
                      <img src={user.avatar} alt="" />
                    ) : (
                      <span className="auth-avatar-initial">{(user.fullName || user.username || 'U').charAt(0).toUpperCase()}</span>
                    )}
                  </span>
                </button>
                {showAuthDropdown && (
                  <div className="auth-dropdown" role="menu">
                    <button
                      type="button"
                      className="auth-dropdown-item"
                      onClick={() => {
                        setActiveTab(TABS.PROFILE);
                        if (typeof window !== 'undefined') {
                          try {
                            window.localStorage.setItem('agrovibes_active_tab', TABS.PROFILE);
                          } catch {}
                        }
                        setShowAuthDropdown(false);
                      }}
                    >
                      {t('profile.myProfile', 'Profile')}
                    </button>
                    <button
                      type="button"
                      className="auth-dropdown-item auth-dropdown-item-danger"
                      onClick={() => {
                        logout();
                        setShowAuthDropdown(false);
                      }}
                    >
                      {t('auth.logOut', 'Log out')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className="ghost-btn app-header-login-btn"
                  onClick={() => setShowLoginModal(true)}
                >
                  {t('auth.logIn', 'Log in')}
                </button>
                <button
                  type="button"
                  className="primary-btn app-header-signup-btn"
                  onClick={() => setShowSignupModal(true)}
                >
                  {t('auth.signUp', 'Sign up')}
                </button>
              </>
            )}
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
          setIsNavExpanded(false);
          if (typeof window !== 'undefined') {
            try {
              window.localStorage.setItem('agrovibes_active_tab', tab);
            } catch {
              // ignore
            }
          }
        }}
        tabs={TABS}
        isExpanded={isNavExpanded}
        onHoverStart={() => setIsNavExpanded(true)}
        onHoverEnd={() => setIsNavExpanded(false)}
      />

      <main className="app-main">
        <div className="ig-shell">
          <div className="ig-feed-column">
            {activeTab === TABS.FEED && (
              <Media
                posts={
                  feedUserFilter && data.posts.length
                    ? data.posts.filter((p) => {
                        const farmer = (p.farmer || '').toString();
                        return (
                          farmer === feedUserFilter.fullName ||
                          farmer === feedUserFilter.username
                        );
                      })
                    : data.posts
                }
                loading={loading.feed}
                refreshPosts={refreshPosts}
                onDeletePost={handleDeletePost}
                showToast={addToast}
                t={t}
                openAddPost={showAddPostModal}
                onAddPostClose={() => setShowAddPostModal(false)}
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
                onDeleteSession={handleDeleteKnowledgeSession}
                onUpdateSession={handleUpdateKnowledgeSession}
              />
            )}

            {activeTab === TABS.EQUIPMENT && (
              <Equipment
                items={data.equipment}
                loading={loading.equipment}
                onAddEquipment={handleAddEquipment}
                showToast={addToast}
                onRequestEquipment={handleRequestEquipment}
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

            {activeTab === TABS.COMMUNITY && (
              <Community onViewUser={handleViewUserFromSearch} />
            )}

            {activeTab === TABS.PROFILE && (
              <Profile
                posts={data.posts}
                onOpenLogin={() => setShowLoginModal(true)}
                onOpenSignup={() => setShowSignupModal(true)}
              />
            )}
          </div>
        </div>
      </main>

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSuccess={login}
          onSwitchToSignup={() => {
            setShowLoginModal(false);
            setShowSignupModal(true);
          }}
        />
      )}
      {showSignupModal && (
        <SignupModal
          onClose={() => setShowSignupModal(false)}
          onSuccess={signup}
          onSwitchToLogin={() => {
            setShowSignupModal(false);
            setShowLoginModal(true);
          }}
        />
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
