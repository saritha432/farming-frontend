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
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

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
  const location = useLocation();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showAuthDropdown, setShowAuthDropdown] = useState(false);
  const authDropdownRef = useRef(null);
  const tabFromPath = (pathname) => {
    const p = (pathname || '').toLowerCase();
    if (p.startsWith('/knowledge')) return TABS.KNOWLEDGE;
    if (p.startsWith('/equipment')) return TABS.EQUIPMENT;
    if (p.startsWith('/labor')) return TABS.LABOR;
    if (p.startsWith('/products')) return TABS.PRODUCTS;
    if (p.startsWith('/sales')) return TABS.SALES;
    if (p.startsWith('/learning')) return TABS.LEARNING;
    if (p.startsWith('/community')) return TABS.COMMUNITY;
    if (p.startsWith('/profile')) return TABS.PROFILE;
    return TABS.FEED;
  };
  const pathFromTab = (tab) => {
    switch (tab) {
      case TABS.KNOWLEDGE:
        return '/knowledge';
      case TABS.EQUIPMENT:
        return '/equipment';
      case TABS.LABOR:
        return '/labor';
      case TABS.PRODUCTS:
        return '/products';
      case TABS.SALES:
        return '/sales';
      case TABS.LEARNING:
        return '/learning';
      case TABS.COMMUNITY:
        return '/community';
      case TABS.PROFILE:
        return '/profile';
      case TABS.FEED:
      default:
        return '/feed';
    }
  };
  const activeTab = tabFromPath(location.pathname);
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
  const [followRequests, setFollowRequests] = useState([]);
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
      navigate('/feed', { replace: true });
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('agrovibes_active_tab', TABS.FEED);
        } catch {
          // ignore
        }
      }
    }
    prevUserRef.current = user;
  }, [user, navigate]);

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

  // Persist current tab for backwards compatibility (non-router clients)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('agrovibes_active_tab', activeTab);
    } catch {
      // ignore
    }
  }, [activeTab]);

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

  const hasFollowRequests = Array.isArray(followRequests) && followRequests.length > 0;
  const hasNotifications = unseenInteractions > 0 || hasFollowRequests;

  const visibleFeedPosts = feedUserFilter
    ? data.posts.filter((p) => {
        const farmer = (p.farmer || '').toString();
        const matchesId = feedUserFilter.id != null && p.userId === feedUserFilter.id;
        const matchesName =
          (feedUserFilter.fullName && farmer === feedUserFilter.fullName) ||
          (feedUserFilter.username && farmer === feedUserFilter.username);
        return matchesId || matchesName;
      })
    : data.posts;

  const handleOpenNotifications = () => {
    navigate('/profile');
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

  useEffect(() => {
    if (!user) {
      setFollowRequests([]);
      return;
    }
    api
      .getMyFollowRequests(user.id, 'pending')
      .then((list) => {
        setFollowRequests(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        setFollowRequests([]);
      });
  }, [user]);


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

  const loadRazorpayScript = () =>
    new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Razorpay SDK failed to load.'));
      document.body.appendChild(script);
    });

  const handleProceedSalesPayment = async ({ cart: salesCart, quantities, totalAmount }) => {
    try {
      await loadRazorpayScript();
    } catch {
      addToast({ id: Date.now(), message: t('sales.paymentInitFailed', 'Unable to start payment. Please check your internet and try again.'), type: 'error' });
      return;
    }

    const options = {
      key: 'rzp_test_1234567890abcdef', // TODO: replace with your real Razorpay key
      amount: Math.round((totalAmount || 0) * 100), // in paise
      currency: 'INR',
      name: 'AgroVibes',
      description: 'Direct sales order payment',
      handler: (response) => {
        addToast({
          id: Date.now(),
          message: t('sales.paymentSuccess', 'Payment successful! Your order has been placed.'),
          type: 'success',
        });
        clearCart();
        // Optionally: send response + order details to your backend here.
        console.log('Razorpay payment success', response, salesCart, quantities, totalAmount);
      },
      prefill: {
        name: user?.fullName || user?.username || '',
        email: user?.email || '',
      },
      notes: {
        platform: 'AgroVibes',
      },
      theme: {
        color: '#15803d',
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const handleViewUserPosts = (targetUser) => {
    if (!targetUser) return;
    setFeedUserFilter({
      id: targetUser.id,
      username: targetUser.username,
      fullName: targetUser.fullName,
      avatar: targetUser.avatar || null,
    });
    navigate('/feed');
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('agrovibes_active_tab', TABS.FEED);
      } catch {
        // ignore
      }
    }
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
                navigate('/feed');
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
                navigate('/feed');
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
                navigate('/community');
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
              {hasNotifications && (
                <span className="app-header-notif-badge">
                  {unseenInteractions > 0
                    ? unseenInteractions > 9
                      ? '9+'
                      : unseenInteractions
                    : '•'}
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
                        navigate('/profile');
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
            <Routes>
              <Route path="/" element={<Navigate to="/feed" replace />} />
              <Route
                path="/feed"
                element={
                  <Media
                    posts={visibleFeedPosts}
                    loading={loading.feed}
                    refreshPosts={refreshPosts}
                    onDeletePost={handleDeletePost}
                    showToast={addToast}
                    t={t}
                    openAddPost={showAddPostModal}
                    onAddPostClose={() => setShowAddPostModal(false)}
                    userFilter={feedUserFilter}
                    onClearUserFilter={() => setFeedUserFilter(null)}
                  />
                }
              />
              <Route
                path="/knowledge"
                element={
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
                }
              />
              <Route
                path="/equipment"
                element={
                  <Equipment
                    items={data.equipment}
                    loading={loading.equipment}
                    onAddEquipment={handleAddEquipment}
                    showToast={addToast}
                    onRequestEquipment={handleRequestEquipment}
                  />
                }
              />
              <Route
                path="/labor"
                element={
                  <Labor
                    laborProfiles={data.workers}
                    jobs={data.jobs}
                    onCreateJob={handleCreateJob}
                  />
                }
              />
              <Route
                path="/products"
                element={<Products products={data.products} onAddProduct={handleAddProduct} />}
              />
              <Route
                path="/sales"
                element={
                  <Sales
                    items={data.salesItems}
                    cart={cart}
                    loading={loading.sales}
                    onAddToCart={handleAddToCart}
                    onAddSalesItem={handleAddSalesItem}
                    onProceedPayment={handleProceedSalesPayment}
                  />
                }
              />
              <Route path="/learning" element={<Learning courses={data.courses} />} />
              <Route
                path="/community"
                element={<Community onViewUser={handleViewUserPosts} />}
              />
              <Route
                path="/profile"
                element={
                  <Profile
                    posts={data.posts}
                    onOpenLogin={() => setShowLoginModal(true)}
                    onOpenSignup={() => setShowSignupModal(true)}
                    onViewUser={handleViewUserPosts}
                  />
                }
              />
              <Route path="*" element={<Navigate to="/feed" replace />} />
            </Routes>
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
