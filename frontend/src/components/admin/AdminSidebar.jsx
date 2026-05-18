import { useNavigate } from "react-router-dom";
import { LogOut, LayoutDashboard, Building2, Briefcase, Users, ShieldAlert } from "lucide-react";
import koraLogo from "../../assets/absolute-size-logo.png";
import { useAuth } from "../../context/AuthContext";

export default function AdminSidebar({ activeTab, setActiveTab }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="kora-sidebar-inner">
      {/* Logo */}
      <div className="kora-sidebar-logo" style={{ cursor: 'pointer' }}>
        <img src={koraLogo} alt="KORA" />
      </div>

      {/* Admin Avatar */}
      <div className="kora-sidebar-avatar-section">
        <div className="kora-sidebar-avatar">
          <span className="kora-sidebar-initials" style={{ background: '#7c3aed', color: 'white' }}>AD</span>
        </div>
        <p className="kora-sidebar-name">Administrator</p>
        <p className="kora-sidebar-role">Kora Platform</p>
        <span className="kora-verified-badge" style={{ marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#7c3aed' }}>
          <ShieldAlert size={12} /> Super Admin
        </span>
      </div>

      {/* Navigation */}
      <nav className="kora-sidebar-nav">
        <p className="kora-sidebar-nav-label">Management</p>
        
        <button 
          className={`kora-sidebar-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
          style={activeTab === 'overview' ? { background: '#f3e8ff', color: '#7c3aed' } : {}}
        >
          <LayoutDashboard size={16} />
          <span>Overview</span>
        </button>

        <button 
          className={`kora-sidebar-nav-item ${activeTab === 'employers' ? 'active' : ''}`}
          onClick={() => setActiveTab('employers')}
          style={activeTab === 'employers' ? { background: '#f3e8ff', color: '#7c3aed' } : {}}
        >
          <Building2 size={16} />
          <span>Employers</span>
        </button>

        <button 
          className={`kora-sidebar-nav-item ${activeTab === 'jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('jobs')}
          style={activeTab === 'jobs' ? { background: '#f3e8ff', color: '#7c3aed' } : {}}
        >
          <Briefcase size={16} />
          <span>Job Postings</span>
        </button>

        <button 
          className={`kora-sidebar-nav-item ${activeTab === 'seekers' ? 'active' : ''}`}
          onClick={() => setActiveTab('seekers')}
          style={activeTab === 'seekers' ? { background: '#f3e8ff', color: '#7c3aed' } : {}}
        >
          <Users size={16} />
          <span>Job Seekers</span>
        </button>
      </nav>

      {/* Logout */}
      <button className="kora-sidebar-logout" onClick={handleLogout}>
        <LogOut size={15} />
        Sign Out
      </button>
    </div>
  );
}
