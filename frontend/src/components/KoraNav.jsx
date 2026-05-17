import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import koraLogo from '../assets/absolute-size-logo.png';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function KoraNav() {
  const { user, logout, isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

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
            <button
              className="kn-btn-primary"
              onClick={handleLogout}
            >
              {t('nav.sign_out')}
            </button>
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
