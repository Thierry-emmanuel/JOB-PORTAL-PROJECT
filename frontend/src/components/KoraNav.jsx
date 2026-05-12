import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import koraLogo from '../assets/absolute-size-logo.png';
import { useAuth } from '../context/AuthContext';

export default function KoraNav() {
  const { user, logout, isAuthenticated } = useAuth();
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
    { label: 'Jobs', to: '/jobs' },
  ];

  if (isEmployer) {
    navLinks.push({ label: 'Dashboard', to: '/dashboard/employer' });
    navLinks.push({ label: 'Interviews', to: '/employer/interviews' });
    navLinks.push({ label: 'Post Job', to: '/employer/post-job' });
  } else if (isAdmin) {
    navLinks.push({ label: 'Dashboard', to: '/profile/admin' });
  } else {
    navLinks.push({ label: 'Dashboard', to: '/employee/dashboard' });
    navLinks.push({ label: 'My Profile', to: '/profile/job-seeker' });
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

        {/* Auth */}
        <div className="kn-auth">
          {isAuthenticated ? (
            <button
              className="kn-btn-primary"
              onClick={handleLogout}
            >
              Sign Out
            </button>
          ) : (
            <Link to="/login" className="kn-btn-primary">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
