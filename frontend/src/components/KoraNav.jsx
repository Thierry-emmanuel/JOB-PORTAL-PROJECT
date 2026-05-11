import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import koraLogo from '../assets/absolute-size-logo.png';
// KoraNav styles live in src/styles/theme.css (imported globally via App.jsx)

/**
 * KoraNav – shared top navigation bar.
 *
 * Visual design mirrors KoraHome.jsx's Navbar exactly:
 *   • 72 px sticky header, white bg, scroll shadow
 *   • absolute-size-logo.png + KORA wordmark + tagline
 *   • Active link shown with orange text + 2 px underline bar
 *   • "Sign Out" CTA uses the same orange primary button style
 *
 * Drop-in usage (no props required):
 *   import KoraNav from '../../components/KoraNav';
 *   ...
 *   <div className="my-page">
 *     <KoraNav />
 *     ...
 *   </div>
 */
export default function KoraNav() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const navLinks = [
    { label: 'Jobs',      to: '/jobs' },
    { label: 'Dashboard', to: '/employee/dashboard' },
    { label: 'Profile',   to: '/profile/job-seeker' },
  ];

  const isActive = (to) => location.pathname.startsWith(to);

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
          <Link to="/profile/job-seeker" className="kn-btn-ghost">
            My Profile
          </Link>
          <button
            className="kn-btn-primary"
            onClick={() => (window.location.href = '/login')}
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}
