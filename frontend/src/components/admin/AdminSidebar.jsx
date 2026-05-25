import { useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, Building2, Briefcase, Users, BarChart3, ShieldCheck } from 'lucide-react';
import koraLogo from '../../assets/absolute-size-logo.png';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { key: 'overview',  label: 'Overview',     icon: LayoutDashboard },
  { key: 'employers', label: 'Employers',     icon: Building2       },
  { key: 'jobs',      label: 'Job Postings',  icon: Briefcase       },
  { key: 'seekers',   label: 'Job Seekers',   icon: Users           },
  { key: 'reports',   label: 'Reports',       icon: BarChart3       },
];

export default function AdminSidebar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.fullName ?? user?.name ?? user?.email ?? 'Administrator';
  const initials = displayName.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || 'AD';

  return (
    <>
      {/* Logo */}
      <div className="ds-sb-header">
        <img src={koraLogo} alt="Kora" className="ds-sb-logo" />
        <span className="ds-sb-brand">Admin</span>
      </div>

      {/* Identity */}
      <div className="ds-sb-identity">
        <div className="ds-sb-avatar"><span>{initials}</span></div>
        <div className="ds-sb-identity-info">
          <p className="ds-sb-name">{displayName}</p>
          <span className="ds-sb-role" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <ShieldCheck size={10} /> Super Admin
          </span>
        </div>
      </div>

      {/* Nav */}
      <div className="ds-sb-nav-wrap">
        <p className="ds-sb-nav-label">Management</p>
        <nav>
          {NAV.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`ds-nav-item${activeTab === key ? ' active' : ''}`}
              onClick={() => setActiveTab(key)}
              aria-current={activeTab === key ? 'page' : undefined}
            >
              <span className="ds-nav-icon"><Icon size={17} /></span>
              <span className="ds-nav-label">{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="ds-sb-footer">
        <button className="ds-nav-item logout" onClick={() => { logout(); navigate('/login'); }}>
          <span className="ds-nav-icon"><LogOut size={17} /></span>
          <span className="ds-nav-label">Sign Out</span>
        </button>
      </div>
    </>
  );
}