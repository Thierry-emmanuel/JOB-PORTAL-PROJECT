import { useState, useEffect, memo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  LayoutDashboard, Briefcase, Bookmark, CalendarCheck,
  User, BarChart2, Menu, X, Settings, LogOut,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import koraLogo from '../assets/absolute-size-logo.png';
import '../styles/dashboard-shell.css';

const NAV_ITEMS = [
  { key: 'dashboard',    label: 'Dashboard',      icon: LayoutDashboard, to: '/employee/dashboard' },
  { key: 'jobs',         label: 'Browse Jobs',     icon: Briefcase,       to: '/jobs'               },
  { key: 'applications', label: 'My Applications', icon: Briefcase,       to: '/employee/applications' },
  { key: 'saved',        label: 'Saved Jobs',      icon: Bookmark,        to: '/employee/saved'     },
  { key: 'interviews',   label: 'Interviews',      icon: CalendarCheck,   to: '/employee/interviews' },
  { key: 'profile',      label: 'My Profile',      icon: User,            to: '/profile/job-seeker' },
  { key: 'insights',     label: 'Market Insights', icon: BarChart2,       to: '/insights'           },
];

const NavItem = memo(function NavItem({ item, active, collapsed, badge }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      className={`ds-nav-item${active ? ' active' : ''}`}
      aria-label={collapsed ? item.label : undefined}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? item.label : undefined}
    >
      <span className="ds-nav-icon"><Icon size={17} strokeWidth={active ? 2.2 : 1.8} /></span>
      {!collapsed && <span className="ds-nav-label">{item.label}</span>}
      {!collapsed && badge > 0 && <span className="ds-nav-badge">{badge}</span>}
    </Link>
  );
});

export default function EmployeeLayout({ profile, completion, onEdit, onPhotoChange, children, appsBadge = 0 }) {
  const location   = useLocation();
  const navigate   = useNavigate();
  const { logout } = useAuth();
  const [collapsed,   setCollapsed]   = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

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

  const activeKey = NAV_ITEMS.find(n => location.pathname.startsWith(n.to))?.key || 'dashboard';

  const initials = (profile?.fullName || 'U').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="ds-root">
      {/* Mobile overlay */}
      {mobileOpen && <div className="ds-mobile-overlay" onClick={() => setMobileOpen(false)} />}

      {/* FAB trigger (mobile) */}
      <button className="ds-mobile-trigger" onClick={() => setMobileOpen(true)} aria-label="Open menu">
        <Menu size={20} />
      </button>

      <div className="ds-body">
        {/* ════ SIDEBAR ════ */}
        <aside
          className={`ds-sidebar${collapsed ? ' ds-sidebar--collapsed' : ''}${mobileOpen ? ' ds-sidebar--mobile-open' : ''}`}
          aria-label="Employee navigation"
        >
          <button className="ds-mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close"><X size={16} /></button>

          {/* Logo */}
          <div className="ds-sb-header" style={{ cursor: 'pointer' }} onClick={() => navigate('/employee/dashboard')}>
            <img src={koraLogo} alt="Kora" className="ds-sb-logo" />
            {!collapsed && <span className="ds-sb-brand">Kora</span>}
          </div>

          {/* Identity */}
          <div className="ds-sb-identity">
            <div
              className="ds-sb-avatar"
              onClick={onEdit}
              role="button"
              tabIndex={0}
              style={{ cursor: 'pointer' }}
              onKeyDown={e => e.key === 'Enter' && onEdit?.()}
              title="Edit profile"
            >
              {profile?.profilePhoto
                ? <img src={profile.profilePhoto} alt="Profile" />
                : <span>{initials}</span>}
              <span className="ds-sb-avatar-status" />
            </div>
            <div className="ds-sb-identity-info">
              <p className="ds-sb-name">{profile?.fullName?.split(' ')[0] || 'User'}</p>
              <span className="ds-sb-role">Job Seeker</span>
            </div>
          </div>

          {/* Progress bar */}
          {!collapsed && (
            <div className="ds-sb-progress">
              <div className="ds-sb-progress-header">
                <span>Profile strength</span>
                <strong>{completion}%</strong>
              </div>
              <div className="ds-sb-progress-track" role="progressbar" aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100}>
                <div className="ds-sb-progress-fill" style={{ width: `${completion}%` }} />
              </div>
            </div>
          )}

          {/* Nav */}
          <div className="ds-sb-nav-wrap">
            {!collapsed && <p className="ds-sb-nav-label">Menu</p>}
            <nav aria-label="Main navigation">
              {NAV_ITEMS.map(item => (
                <NavItem key={item.key} item={item} active={activeKey === item.key} collapsed={collapsed} badge={item.key === 'applications' ? appsBadge : 0} />
              ))}
            </nav>
          </div>

          {/* Footer */}
          <div className="ds-sb-footer">
            {!collapsed && <p className="ds-sb-nav-label">Account</p>}
            <Link to="/profile/job-seeker" className="ds-nav-item" title={collapsed ? 'Settings' : undefined}>
              <span className="ds-nav-icon"><Settings size={17} /></span>
              {!collapsed && <span className="ds-nav-label">Settings</span>}
            </Link>
            <button
              className="ds-nav-item logout"
              onClick={() => { logout(); navigate('/login'); }}
              title={collapsed ? 'Sign Out' : undefined}
              aria-label="Sign out"
            >
              <span className="ds-nav-icon"><LogOut size={17} /></span>
              {!collapsed && <span className="ds-nav-label">Sign Out</span>}
            </button>
          </div>

          {/* Collapse toggle */}
          <button className="ds-sb-collapse" onClick={toggleCollapsed} title={collapsed ? 'Expand' : 'Collapse'}>
            {collapsed ? <ChevronRight size={14} /> : <><ChevronLeft size={14} /><span style={{ fontSize: 11, fontWeight: 600 }}>Collapse</span></>}
          </button>
        </aside>

        {/* ════ MAIN ════ */}
        <main className="ds-main" id="main-content">{children}</main>
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