import { useRef } from "react";
import { Camera, Briefcase, Calendar as CalendarIcon, FileText, LogOut, LayoutDashboard, KeyRound, CheckCircle } from "lucide-react";
import koraLogo from "../../assets/absolute-size-logo.png";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

export default function EmployerSidebar({ employer, loading, stats, onPhotoChange }) {
  const fileRef = useRef();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName = employer?.companyName || "Employer";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("").toUpperCase() || "E";

  const isActive = (path) => location.pathname === path;

  return (
    <div className="kora-sidebar-inner">
      {/* Logo */}
      <div className="kora-sidebar-logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/employer/dashboard')}>
        <img src={koraLogo} alt="KORA" />
      </div>

      {/* Avatar + Info */}
      <div className="kora-sidebar-avatar-section">
        <div className="kora-sidebar-avatar">
          {employer?.logo ? (
            <img src={employer.logo} alt={displayName} />
          ) : (
            <span className="kora-sidebar-initials">{initials}</span>
          )}
          <button
            className="kora-photo-overlay"
            onClick={() => fileRef.current?.click()}
            title="Change company logo"
          >
            <Camera size={16} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => e.target.files[0] && onPhotoChange && onPhotoChange(e.target.files[0])}
          />
        </div>
        <p className="kora-sidebar-name">{loading ? "Loading..." : displayName}</p>
        <p className="kora-sidebar-role">{loading ? "" : employer?.contactName || "HR Manager"}</p>
        {!loading && employer?.isApproved && (
          <span className="kora-verified-badge" style={{ marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--kora-green)' }}>
            <CheckCircle size={12} /> Verified Employer
          </span>
        )}
      </div>

      {/* Completion/Stats equivalent */}
      {!loading && stats && (
        <div className="kora-sidebar-completion">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--kora-muted)' }}>Active Jobs</span>
            <strong style={{ fontSize: '13px', color: 'var(--kora-ink)' }}>{stats.activeJobs || 0}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--kora-muted)' }}>New Apps</span>
            <strong style={{ fontSize: '13px', color: 'var(--kora-ink)' }}>{stats.newApplications || 0}</strong>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="kora-sidebar-nav">
        <p className="kora-sidebar-nav-label">Navigation</p>
        
        <button 
          className={`kora-sidebar-nav-item ${isActive('/employer/dashboard') ? 'active' : ''}`}
          onClick={() => navigate('/employer/dashboard')}
          style={isActive('/employer/dashboard') ? { background: 'var(--kora-green-light)', color: 'var(--kora-green)' } : {}}
        >
          <LayoutDashboard size={16} />
          <span>Overview</span>
        </button>

        <button 
          className={`kora-sidebar-nav-item ${isActive('/employer/jobs') ? 'active' : ''}`}
          onClick={() => navigate('/employer/jobs')}
          style={isActive('/employer/jobs') ? { background: 'var(--kora-green-light)', color: 'var(--kora-green)' } : {}}
        >
          <Briefcase size={16} />
          <span>Job Postings</span>
          {stats?.activeJobs > 0 && <span className="kora-nav-badge">{stats.activeJobs}</span>}
        </button>

        <button 
          className={`kora-sidebar-nav-item ${isActive('/employer/interviews') ? 'active' : ''}`}
          onClick={() => navigate('/employer/interviews')}
          style={isActive('/employer/interviews') ? { background: 'var(--kora-green-light)', color: 'var(--kora-green)' } : {}}
        >
          <CalendarIcon size={16} />
          <span>Interviews</span>
          {stats?.upcomingInterviews > 0 && <span className="kora-nav-badge" style={{background: 'var(--kora-blue)', color: 'white'}}>{stats.upcomingInterviews}</span>}
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
