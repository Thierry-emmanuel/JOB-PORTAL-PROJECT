import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import koraLogo from '../assets/absolute-size-logo.png';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function KoraNav() {
  const { user, logout, isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

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

  const navLinks = [
    { label: t('nav.home'), to: '/' },
    { label: t('nav.jobs'), to: '/jobs' },
    { label: t('nav.insights'), to: '/insights' },
  ];

  if (isEmployer) {
    navLinks.push({ label: t('nav.dashboard'), to: '/dashboard/employer' });
    navLinks.push({ label: t('nav.interviews'), to: '/employer/interviews' });
    navLinks.push({ label: t('nav.post_job'), to: '/employer/post-job' });
  } else if (isAdmin) {
    navLinks.push({ label: t('nav.dashboard'), to: '/profile/admin' });
  } else {
    navLinks.push({ label: t('nav.dashboard'), to: '/employee/dashboard' });
    navLinks.push({ label: t('nav.my_profile'), to: '/profile/job-seeker' });
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (to) => location.pathname === to;

  return (
    <nav
      className={`kn-nav${scrolled ? ' kn-nav--scrolled' : ''}`}
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

        {/* Nav links */}
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
          <button 
            onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'fr' : 'en')}
            style={{ 
              background: 'rgba(255,255,255,0.1)', 
              border: '1px solid rgba(255,255,255,0.2)', 
              color: 'white', 
              padding: '4px 8px', 
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: '600'
            }}
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
                  {user?.fullName ? user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
                </div>
                <span className="kn-user-name">{user?.fullName || 'User'}</span>
                <span style={{ fontSize: '9px', color: 'var(--kora-muted)' }}>▼</span>
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
            <Link to="/login" className="kn-btn-primary">
              {t('nav.sign_in')}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
