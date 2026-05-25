/**
 * EmployeeLayout.jsx
 * ─────────────────────────────────────────────────────────────
 * Shared layout shell for ALL employee-facing pages.
 * Provides: KoraNav + collapsible sidebar + main content area.
 *
 * Usage:
 *   <EmployeeLayout profile={profile} completion={completion}
 *                   onEdit={...} onPhotoChange={...}
 *                   activeSection="dashboard">
 *     {children}
 *   </EmployeeLayout>
 * ─────────────────────────────────────────────────────────────
 */
import { useState, useEffect, memo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  LayoutDashboard, Briefcase, Bookmark, CalendarCheck,
  User, BarChart2, ChevronLeft, ChevronRight, Menu, X,
  Bell, Settings, LogOut,
} from 'lucide-react';
import KoraNav from '../components/KoraNav';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import '../styles/employee-layout.css';

/* ── Nav Item ─────────────────────────────────────────────── */
const NavItem = memo(function NavItem({ item, label, active, collapsed, badge }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      className={`el-nav-item ${active ? 'el-nav-item--active' : ''} ${collapsed ? 'el-nav-item--collapsed' : ''}`}
      aria-label={collapsed ? label : undefined}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? label : undefined}
    >
      <span className="el-nav-icon" aria-hidden="true">
        <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
      </span>
      {!collapsed && (
        <>
          <span className="el-nav-label">{label}</span>
          {badge > 0 && (
            <span className="el-nav-badge" aria-label={`${badge} pending`}>{badge}</span>
          )}
        </>
      )}
      {collapsed && badge > 0 && (
        <span className="el-nav-badge-dot" aria-label={`${badge} pending`} />
      )}
    </Link>
  );
});

NavItem.propTypes = {
  item: PropTypes.object.isRequired,
  label: PropTypes.string.isRequired,
  active: PropTypes.bool.isRequired,
  collapsed: PropTypes.bool.isRequired,
  badge: PropTypes.number,
};

/* ════════════════════════════════════════════════════════════
   EmployeeLayout
   ════════════════════════════════════════════════════════════ */
export default function EmployeeLayout({
  profile,
  completion,
  onEdit,
  onPhotoChange,
  children,
  appsBadge = 0,
}) {
  const { t } = useTranslation();
  const location   = useLocation();
  const navigate   = useNavigate();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const NAV_ITEMS = [
    { key: 'dashboard',    label: t('nav.dashboard'),        icon: LayoutDashboard, to: '/employee/dashboard' },
    { key: 'jobs',         label: t('employee.browse_jobs'),       icon: Briefcase,       to: '/jobs' },
    { key: 'applications', label: t('employee.recent_applications'),   icon: Briefcase,       to: '/employee/applications' },
    { key: 'saved',        label: t('employee.saved_jobs'),        icon: Bookmark,        to: '/employee/saved' },
    { key: 'interviews',   label: t('nav.interviews'),        icon: CalendarCheck,   to: '/employee/interviews' },
    { key: 'profile',      label: t('nav.my_profile'),        icon: User,            to: '/profile/job-seeker' },
    { key: 'insights',     label: t('nav.insights'),   icon: BarChart2,       to: '/insights' },
  ];

  /* Close mobile drawer on route change */
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  /* Persist collapsed state */
  useEffect(() => {
    const saved = localStorage.getItem('kora-sidebar-collapsed');
    if (saved !== null) setCollapsed(saved === 'true');
  }, []);
  const toggleCollapsed = () => {
    setCollapsed(prev => {
      localStorage.setItem('kora-sidebar-collapsed', String(!prev));
      return !prev;
    });
  };

  /* Detect active nav item */
  const activeKey = NAV_ITEMS.find(n => location.pathname.startsWith(n.to))?.key || 'dashboard';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="el-root">
      <KoraNav />

      {/* ── Mobile overlay ──────────────────────────────── */}
      {mobileOpen && (
        <div
          className="el-mobile-overlay"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile menu trigger ──────────────────────────── */}
      <button
        className="el-mobile-trigger"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={mobileOpen}
      >
        <Menu size={20} />
      </button>

      <div className="el-body">
        {/* ════ SIDEBAR ════════════════════════════════════ */}
        <aside
          className={`el-sidebar ${collapsed ? 'el-sidebar--collapsed' : ''} ${mobileOpen ? 'el-sidebar--mobile-open' : ''}`}
          aria-label="Employee navigation"
        >
          {/* Mobile close button */}
          <button
            className="el-mobile-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>

          {/* Profile mini card */}
          <div className={`el-sidebar-profile ${collapsed ? 'el-sidebar-profile--collapsed' : ''}`}>
            <div
              className="el-sidebar-avatar"
              style={{ cursor: 'pointer' }}
              onClick={onEdit}
              aria-label="Edit profile"
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && onEdit?.()}
            >
              {profile?.profilePhoto ? (
                <img src={profile.profilePhoto} alt="Profile" />
              ) : (
                <span className="el-sidebar-initials">
                  {(profile?.fullName || 'U').charAt(0).toUpperCase()}
                </span>
              )}
              <span className="el-sidebar-status-dot" aria-label="Online" />
            </div>

            {!collapsed && (
              <div className="el-sidebar-profile-info">
                <p className="el-sidebar-name">{profile?.fullName?.split(' ')[0] || 'User'}</p>
                <p className="el-sidebar-role">{t('auth.job_seeker')}</p>
              </div>
            )}

            {/* Collapse toggle — desktop only */}
            <button
              className="el-collapse-btn"
              onClick={toggleCollapsed}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>

          {/* Progress bar */}
          {!collapsed && (
            <div className="el-sidebar-progress">
              <div className="el-sidebar-progress-header">
                <span>{t('employee.profile_strength')}</span>
                <strong>{completion}%</strong>
              </div>
              <div
                className="el-sidebar-progress-bar"
                role="progressbar"
                aria-valuenow={completion}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Profile ${completion}% complete`}
              >
                <div
                  className="el-sidebar-progress-fill"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>
          )}

          {/* Nav items */}
          {!collapsed && (
            <p className="el-nav-section-label">MENU</p>
          )}
          <nav className="el-nav" aria-label="Main navigation">
            {NAV_ITEMS.map(item => (
              <NavItem
                key={item.key}
                item={item}
                label={item.label}
                active={activeKey === item.key}
                collapsed={collapsed}
                badge={item.key === 'applications' ? appsBadge : 0}
              />
            ))}
          </nav>

          {/* Bottom actions */}
          <div className="el-sidebar-bottom">
            {!collapsed && <p className="el-nav-section-label">ACCOUNT</p>}
            <Link
              to="/profile/job-seeker"
              className={`el-nav-item ${collapsed ? 'el-nav-item--collapsed' : ''}`}
              title={collapsed ? t('nav.my_profile') : undefined}
            >
              <span className="el-nav-icon" aria-hidden="true"><Settings size={17} /></span>
              {!collapsed && <span className="el-nav-label">{t('nav.my_profile')}</span>}
            </Link>
            <button
              className={`el-nav-item el-nav-logout ${collapsed ? 'el-nav-item--collapsed' : ''}`}
              onClick={handleLogout}
              title={collapsed ? t('nav.sign_out') : undefined}
              aria-label="Sign out"
            >
              <span className="el-nav-icon" aria-hidden="true"><LogOut size={17} /></span>
              {!collapsed && <span className="el-nav-label">{t('nav.sign_out')}</span>}
            </button>
          </div>
        </aside>

        {/* ════ MAIN ═══════════════════════════════════════ */}
        <main
          className={`el-main ${collapsed ? 'el-main--sidebar-collapsed' : ''}`}
          id="main-content"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

EmployeeLayout.propTypes = {
  profile:      PropTypes.object.isRequired,
  completion:   PropTypes.number.isRequired,
  onEdit:       PropTypes.func,
  onPhotoChange: PropTypes.func,
  children:     PropTypes.node.isRequired,
  appsBadge:    PropTypes.number,
};
