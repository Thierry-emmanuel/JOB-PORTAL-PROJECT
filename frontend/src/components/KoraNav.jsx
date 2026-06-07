import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import koraLogo from '../assets/absolute-size-logo.png';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function KoraNav() {
  const { user, logout, isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const closeMenu = (e) => {
      if (!e.target.closest('.kn-user-menu')) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, [dropdownOpen]);

  const getRole = () => user?.role || user?.type || "";
  const isEmployer = getRole().includes("EMPLOYER");
  const isAdmin = getRole().includes("ADMIN");

  const isEmployeeSpace = location.pathname.startsWith('/employee') || location.pathname === '/profile/job-seeker';
  const isEmployerSpace = location.pathname.startsWith('/employer') || location.pathname.startsWith('/dashboard/employer') || location.pathname === '/profile/employer';
  const isAdminSpace = location.pathname.startsWith('/admin') || location.pathname === '/profile/admin';

  let navLinks = [];

  if (isEmployeeSpace && isAuthenticated) {
    navLinks = [
      { label: t('nav.home'), to: '/' },
      { label: t('nav.dashboard'), to: '/employee/dashboard' },
      { label: t('employee.my_applications', 'Applications'), to: '/employee/applications' },
      { label: t('employee.saved_jobs', 'Saved Jobs'), to: '/employee/saved' },
      { label: t('nav.interviews'), to: '/employee/interviews' },
      { label: t('employee.browse_jobs', 'Browse Jobs'), to: '/employee/jobs' },
      { label: t('nav.insights'), to: '/employee/insights' },
    ];
  } else if (isEmployerSpace && isEmployer) {
    navLinks = [
      { label: t('nav.home'), to: '/' },
      { label: t('nav.dashboard'), to: '/dashboard/employer' },
      { label: t('employer.manage_jobs', 'Manage Jobs'), to: '/employer/jobs' },
      { label: t('nav.post_job'), to: '/employer/post-job' },
      { label: t('nav.interviews'), to: '/employer/interviews' },
      { label: t('nav.insights'), to: '/employer/insights' },
    ];
  } else if (isAdminSpace && isAdmin) {
    navLinks = [
      { label: t('nav.home'), to: '/' },
      { label: t('admin.dashboard_title', 'Dashboard'), to: '/admin/dashboard' },
    ];
  } else {
    // Public Space
    navLinks = [
      { label: t('nav.home'), to: '/' },
      { label: t('nav.jobs'), to: '/jobs' },
      { label: t('nav.insights'), to: '/insights' },
    ];

    if (isAuthenticated) {
      if (isEmployer) {
        navLinks.push({ label: t('nav.dashboard'), to: '/dashboard/employer' });
      } else if (isAdmin) {
        navLinks.push({ label: t('nav.dashboard'), to: '/profile/admin' });
      } else {
        navLinks.push({ label: t('nav.dashboard'), to: '/employee/dashboard' });
      }
    }
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (to) => location.pathname === to;

  // Nav is always transparent — all pages need white text
  const isDarkHeaderPage = true;
  const isTransparentHeaderPage = true; // always transparent

  const spaceClass = isEmployeeSpace ? ' kn-nav--employee' : isEmployerSpace ? ' kn-nav--employer' : isAdminSpace ? ' kn-nav--admin' : ' kn-nav--public';

  // Accent color for mobile menu per space
  const accentColor = isEmployerSpace ? 'var(--kora-orange)' : 'var(--kora-green)';
  const accentBg    = isEmployerSpace ? 'var(--kora-orange-light)' : 'var(--kora-green-light)';

  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <>
      <nav
        className={`kn-nav${(scrolled || !isTransparentHeaderPage) ? ' kn-nav--scrolled' : ''}${isDarkHeaderPage ? ' kn-nav--light-text' : ''}${spaceClass}`}
        aria-label="Main navigation"
      >
        <div className="kn-inner">
          {/* Logo */}
          <Link to="/" className="kn-logo" aria-label="KORA – go to home page">
            <img src={koraLogo} alt="KORA logo" />
            <div>
              <div className="kn-brand">KORA</div>
              <div className="kn-tagline">UNLOCK YOUR CAREER</div>
            </div>
          </Link>

          {/* Desktop Nav links */}
          <div className="kn-links" role="list">
            {navLinks.map(({ label, to }) => {
              const active = isActive(to);
              return (
                <Link
                  key={label}
                  to={to}
                  role="listitem"
                  className={`kn-link${active ? ' kn-link--active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                >
                  {label}
                  {active && <span className="kn-link-bar" aria-hidden="true" />}
                </Link>
              );
            })}
          </div>

          {/* Auth & Lang */}
          <div className="kn-auth" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {/* Language toggle — hidden on very small screens */}
            <button 
              onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'fr' : 'en')}
              className="kn-lang-btn kn-hide-xs"
            >
              {i18n.language === 'en' ? 'FR' : 'EN'}
            </button>
            
            {isAuthenticated ? (
              <div className="kn-user-menu">
                <button 
                  className="kn-user-trigger" 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                >
                  <div className="kn-user-avatar">
                    {initials}
                  </div>
                  <span className="kn-user-name">{user?.fullName || 'User'}</span>
                  <span className="kn-user-arrow" style={{ fontSize: '9px', color: 'var(--kora-muted)' }}>▼</span>
                </button>
                
                {dropdownOpen && (
                  <div className="kn-user-dropdown">
                    <div className="kn-dropdown-header">
                      <div className="kn-dropdown-header-name">{user?.fullName || 'User'}</div>
                      <div className="kn-dropdown-header-email">{user?.email || ''}</div>
                      <div className="kn-dropdown-header-role">
                        {(getRole() || '').replace('ROLE_', '').replace('_', ' ')}
                      </div>
                    </div>
                    
                    {isAdmin && (
                      <Link to="/admin/dashboard" className="kn-dropdown-item" onClick={() => setDropdownOpen(false)}>
                        Dashboard
                      </Link>
                    )}
                    {isEmployer && (
                      <Link to="/dashboard/employer" className="kn-dropdown-item" onClick={() => setDropdownOpen(false)}>
                        Dashboard
                      </Link>
                    )}
                    {!isAdmin && !isEmployer && (
                      <Link to="/employee/dashboard" className="kn-dropdown-item" onClick={() => setDropdownOpen(false)}>
                        Dashboard
                      </Link>
                    )}

                    {isEmployer ? (
                      <Link to="/profile/employer" className="kn-dropdown-item" onClick={() => setDropdownOpen(false)}>
                        My Profile
                      </Link>
                    ) : isAdmin ? (
                      <Link to="/profile/admin" className="kn-dropdown-item" onClick={() => setDropdownOpen(false)}>
                        My Profile
                      </Link>
                    ) : (
                      <Link to="/profile/job-seeker" className="kn-dropdown-item" onClick={() => setDropdownOpen(false)}>
                        My Profile
                      </Link>
                    )}

                    <div className="kn-dropdown-divider" />
                    
                    <button 
                      className="kn-dropdown-item kn-dropdown-item--logout"
                      onClick={() => {
                        setDropdownOpen(false);
                        handleLogout();
                      }}
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="kn-btn-primary kn-hide-xs">
                {t('nav.sign_in')}
              </Link>
            )}

            {/* Hamburger toggle — mobile only */}
            <button
              className="kn-hamburger"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile Menu Overlay + Drawer ──────────────────────── */}
      {mobileOpen && (
        <div
          className="kn-mobile-overlay"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`kn-mobile-drawer${mobileOpen ? ' kn-mobile-drawer--open' : ''}`}
        aria-label="Mobile navigation"
        role="dialog"
        aria-modal="true"
      >
        {/* Drawer Header */}
        <div className="kn-mobile-drawer-header">
          <Link to="/" className="kn-logo" onClick={() => setMobileOpen(false)}>
            <img src={koraLogo} alt="KORA logo" style={{ width: 48, height: 34, objectFit: 'contain' }} />
            <div>
              <div className="kn-brand" style={{ color: accentColor }}>KORA</div>
              <div className="kn-tagline">UNLOCK YOUR CAREER</div>
            </div>
          </Link>
          <button
            className="kn-mobile-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* User info strip if authenticated */}
        {isAuthenticated && (
          <div className="kn-mobile-user" style={{ borderLeftColor: accentColor }}>
            <div className="kn-user-avatar" style={{ width: 40, height: 40, fontSize: 16, background: `linear-gradient(135deg, ${accentColor}, var(--kora-orange))` }}>
              {initials}
            </div>
            <div>
              <p className="kn-mobile-user-name">{user?.fullName || 'User'}</p>
              <p className="kn-mobile-user-role">
                {(getRole() || '').replace('ROLE_', '').replace(/_/g, ' ')}
              </p>
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav className="kn-mobile-links" aria-label="Mobile navigation links">
          <p className="kn-mobile-section-label">Navigation</p>
          {navLinks.map(({ label, to }) => {
            const active = isActive(to);
            return (
              <Link
                key={label}
                to={to}
                className={`kn-mobile-link${active ? ' kn-mobile-link--active' : ''}`}
                style={active ? { color: accentColor, background: accentBg, borderLeftColor: accentColor } : {}}
                onClick={() => setMobileOpen(false)}
                aria-current={active ? 'page' : undefined}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="kn-mobile-footer">
          {/* Language toggle */}
          <button
            onClick={() => {
              i18n.changeLanguage(i18n.language === 'en' ? 'fr' : 'en');
              setMobileOpen(false);
            }}
            className="kn-mobile-lang-btn"
          >
            🌐 {i18n.language === 'en' ? 'Switch to French (FR)' : 'Passer en Anglais (EN)'}
          </button>

          {isAuthenticated ? (
            <button
              className="kn-mobile-logout-btn"
              onClick={() => { setMobileOpen(false); handleLogout(); }}
            >
              Sign Out
            </button>
          ) : (
            <Link to="/login" className="kn-mobile-signin-btn" onClick={() => setMobileOpen(false)}>
              {t('nav.sign_in')}
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}