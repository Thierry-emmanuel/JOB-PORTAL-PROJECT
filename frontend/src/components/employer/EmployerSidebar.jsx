import { useRef } from 'react';
import { Camera, Briefcase, CalendarCheck, LayoutDashboard, LogOut, CheckCircle, Home, Globe, BarChart2, Building } from 'lucide-react';
import koraLogo from '../../assets/absolute-size-logo.png';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV = [
  { path: '/employer/dashboard',   label: 'Overview',        icon: LayoutDashboard },
  { path: '/employer/jobs',        label: 'Job Postings',    icon: Briefcase        },
  { path: '/employer/interviews',  label: 'Interviews',      icon: CalendarCheck    },
  { path: '/profile/employer',     label: 'Company Profile', icon: Building         },
  { path: '/insights',             label: 'Market Insights', icon: BarChart2        },
  { path: '/jobs',                 label: 'Browse Jobs',     icon: Globe            },
  { path: '/',                     label: 'Home Page',       icon: Home             },
];

export default function EmployerSidebar({ employer, loading, stats, onPhotoChange }) {
  const fileRef  = useRef();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const displayName = employer?.companyName || 'Employer';
  const contactName = employer?.contactName  || 'HR Manager';
  const initials = displayName.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'E';

  return (
    <>
      {/* Logo */}
      <div className="ds-sb-header" style={{ cursor: 'pointer' }} onClick={() => navigate('/employer/dashboard')}>
        <img src={koraLogo} alt="Kora" className="ds-sb-logo" />
        <span className="ds-sb-brand">Kora</span>
      </div>

      {/* Identity */}
      <div className="ds-sb-identity">
        <div className="ds-sb-avatar">
          {employer?.logo
            ? <img src={employer.logo} alt={displayName} />
            : <span>{initials}</span>}
          {onPhotoChange && (
            <>
              <button className="ds-sb-photo-btn" onClick={() => fileRef.current?.click()} title="Change logo">
                <Camera size={10} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => e.target.files[0] && onPhotoChange(e.target.files[0])} />
            </>
          )}
        </div>
        <div className="ds-sb-identity-info">
          <p className="ds-sb-name">{loading ? '…' : displayName}</p>
          <span className="ds-sb-role">{loading ? '' : contactName}</span>
          {!loading && employer?.isApproved && (
            <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--ds-accent)', fontWeight: 600 }}>
              <CheckCircle size={11} /> Verified
            </div>
          )}
        </div>
      </div>

      {/* Stats strip */}
      {!loading && stats && (
        <div className="ds-sb-stats">
          <div className="ds-sb-stat">
            <div className="ds-sb-stat-val">{stats.activeJobs ?? 0}</div>
            <div className="ds-sb-stat-label">Active</div>
          </div>
          <div className="ds-sb-stat">
            <div className="ds-sb-stat-val">{stats.totalApplications ?? 0}</div>
            <div className="ds-sb-stat-label">Apps</div>
          </div>
          <div className="ds-sb-stat">
            <div className="ds-sb-stat-val">{stats.hired ?? 0}</div>
            <div className="ds-sb-stat-label">Hired</div>
          </div>
        </div>
      )}

      {/* Nav */}
      <div className="ds-sb-nav-wrap">
        <p className="ds-sb-nav-label">Navigation</p>
        <nav>
          {NAV.map(({ path, label, icon: Icon }) => (
            <button
              key={path}
              className={`ds-nav-item${isActive(path) ? ' active' : ''}`}
              onClick={() => navigate(path)}
              aria-current={isActive(path) ? 'page' : undefined}
            >
              <span className="ds-nav-icon"><Icon size={17} /></span>
              <span className="ds-nav-label">{label}</span>
              {label === 'Job Postings' && stats?.activeJobs > 0 && (
                <span className="ds-nav-badge">{stats.activeJobs}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="ds-sb-footer">
        <button
          className="ds-nav-item logout"
          onClick={() => { logout(); navigate('/login'); }}
        >
          <span className="ds-nav-icon"><LogOut size={17} /></span>
          <span className="ds-nav-label">Sign Out</span>
        </button>
      </div>
    </>
  );
}