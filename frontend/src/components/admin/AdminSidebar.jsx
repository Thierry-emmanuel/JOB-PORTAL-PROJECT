import { useNavigate } from 'react-router-dom';
import {
  LogOut, LayoutDashboard, Building2, Briefcase, Users,
  BarChart3, ShieldCheck, FileText, MessageSquare, CalendarClock,
  Settings, Bell, ImagePlay, ClipboardList,
} from 'lucide-react';
import koraLogo from '../../assets/absolute-size-logo.png';
import { useAuth } from '../../context/AuthContext';

const NAV_SECTIONS = [
  {
    label: 'Platform',
    items: [
      { key: 'overview',      label: 'Overview',         icon: LayoutDashboard },
      { key: 'reports',       label: 'Reports',          icon: BarChart3       },
    ],
  },
  {
    label: 'Users',
    items: [
      { key: 'users',         label: 'All Users',        icon: Users           },
      { key: 'employers',     label: 'Employers',        icon: Building2       },
      { key: 'seekers',       label: 'Job Seekers',      icon: Users           },
      { key: 'verification',  label: 'Verification',     icon: ShieldCheck     },
    ],
  },
  {
    label: 'Content',
    items: [
      { key: 'jobs',          label: 'Job Postings',     icon: Briefcase       },
      { key: 'applications',  label: 'Applications',     icon: ClipboardList   },
      { key: 'interviews',    label: 'Interviews',       icon: CalendarClock   },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { key: 'hero',          label: 'Hero Section',     icon: ImagePlay       },
      { key: 'cms',           label: 'FAQ / CMS',        icon: FileText        },
      { key: 'broadcast',     label: 'Notifications',    icon: Bell            },
      { key: 'compliance',    label: 'Contacts',         icon: MessageSquare   },
      { key: 'settings',      label: 'Site Settings',    icon: Settings        },
    ],
  },
];

export default function AdminSidebar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.fullName ?? user?.name ?? user?.email ?? 'Administrator';
  const initials = displayName.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || 'AD';

  return (
    <div className="adm-sb">
      {/* Logo */}
      <div className="adm-sb-logo">
        <img src={koraLogo} alt="Kora" />
        <span className="adm-sb-badge">Admin</span>
      </div>

      {/* Identity */}
      <div className="adm-sb-identity">
        <div className="adm-sb-avatar">{initials}</div>
        <div className="adm-sb-identity-text">
          <p className="adm-sb-name">{displayName}</p>
          <span className="adm-sb-role">
            <ShieldCheck size={10} /> Super Admin
          </span>
        </div>
      </div>

      {/* Nav sections */}
      <nav className="adm-sb-nav">
        {NAV_SECTIONS.map(({ label, items }) => (
          <div key={label} className="adm-sb-section">
            <p className="adm-sb-section-label">{label}</p>
            {items.map(({ key, label: itemLabel, icon: Icon }) => (
              <button
                key={key}
                className={`adm-nav-item${activeTab === key ? ' active' : ''}`}
                onClick={() => setActiveTab(key)}
                aria-current={activeTab === key ? 'page' : undefined}
              >
                <Icon size={16} />
                <span>{itemLabel}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="adm-sb-footer">
        <button
          className="adm-nav-item logout"
          onClick={() => { logout(); navigate('/login'); }}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}