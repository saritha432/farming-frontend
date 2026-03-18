import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';

const TAB_KEYS = {
  FEED: 'nav.mediaFeed',
  KNOWLEDGE: 'nav.knowledge',
  EQUIPMENT: 'nav.equipment',
  LABOR: 'nav.labor',
  PRODUCTS: 'nav.products',
  SALES: 'nav.sales',
  LEARNING: 'nav.learning',
  COMMUNITY: 'nav.community',
  PROFILE: 'nav.profile',
};

const ICONS = {
  FEED: (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  KNOWLEDGE: (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8M8 11h8" />
    </svg>
  ),
  EQUIPMENT: (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  ),
  LABOR: (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  PRODUCTS: (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  SALES: (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  ),
  LEARNING: (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  COMMUNITY: (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  PROFILE: (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
};

function NavBar({ activeTab, onChangeTab, tabs, isExpanded, onHoverStart, onHoverEnd }) {
  const { t } = useTranslation();
  const navClassName = isExpanded ? 'app-nav app-nav-expanded' : 'app-nav';
  const PATHS = {
    FEED: '/feed',
    KNOWLEDGE: '/knowledge',
    EQUIPMENT: '/equipment',
    LABOR: '/labor',
    PRODUCTS: '/products',
    SALES: '/sales',
    LEARNING: '/learning',
    COMMUNITY: '/community',
    PROFILE: '/profile',
  };
  return (
    <nav
      className={navClassName}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
    >
      {Object.keys(tabs).map((key) => {
        const value = tabs[key];
        const labelKey = TAB_KEYS[value];
        const label = labelKey ? t(labelKey) : value;
        const icon = ICONS[key] || null;
        const to = PATHS[value] || '/feed';
        return (
          <NavLink
            key={key}
            to={to}
            className={({ isActive }) => (isActive ? 'app-nav-btn active' : 'app-nav-btn')}
            onClick={() => {
              if (typeof onChangeTab === 'function') onChangeTab(value);
            }}
          >
            {icon}
            <span className="app-nav-label">{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

export default NavBar;
