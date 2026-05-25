import { useRef } from "react";
import {
  Camera, Briefcase, Calendar as CalendarIcon,
  LogOut, LayoutDashboard, CheckCircle
} from "lucide-react";
import koraLogo from "../../assets/absolute-size-logo.png";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

export default function EmployerSidebar({
  employer,
  loading,
  stats,
  onPhotoChange
}) {
  const fileRef = useRef();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName = employer?.companyName || "My Company";
  const contactName = employer?.contactName || "HR Manager";

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "E";

  const isActive = (path) => location.pathname === path;

  return (
    <div className="kora-sidebar-inner">
      {/* Logo */}
      <div
        className="kora-sidebar-logo"
        onClick={() => navigate('/employer/dashboard')}
      >
        <img src={koraLogo} alt="KORA" />
      </div>

      {/* Avatar & Company Info */}
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
            onChange={(e) => e.target.files?.[0] && onPhotoChange?.(e.target.files[0])}
          />
        </div>

        <p className="kora-sidebar-name">
          {loading ? "Loading..." : displayName}
        </p>
        <p className="kora-sidebar-role">{contactName}</p>

        {!loading && employer?.isApproved && (
          <span className="kora-verified-badge">
            <CheckCircle size={12} /> Verified Employer
          </span>
        )}
      </div>

      {/* Quick Stats */}
      {!loading && stats && (
        <div className="kora-sidebar-completion">
          <div className="kora-sidebar-stat-row">
            <span>Active Jobs</span>
            <strong>{stats.activeJobs || 0}</strong>
          </div>
          <div className="kora-sidebar-stat-row">
            <span>New Applications</span>
            <strong>{stats.newApplications || 0}</strong>
          </div>
          {stats.upcomingInterviews > 0 && (
            <div className="kora-sidebar-stat-row">
              <span>Interviews</span>
              <strong>{stats.upcomingInterviews}</strong>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="kora-sidebar-nav">
        <p className="kora-sidebar-nav-label">MAIN MENU</p>

        <button
          className={`kora-sidebar-nav-item ${isActive('/employer/dashboard') ? 'active' : ''}`}
          onClick={() => navigate('/employer/dashboard')}
        >
          <LayoutDashboard size={16} />
          <span>Overview</span>
        </button>

        <button
          className={`kora-sidebar-nav-item ${isActive('/employer/jobs') ? 'active' : ''}`}
          onClick={() => navigate('/employer/jobs')}
        >
          <Briefcase size={16} />
          <span>Job Postings</span>
          {stats?.activeJobs > 0 && <span className="kora-nav-badge">{stats.activeJobs}</span>}
        </button>

        <button
          className={`kora-sidebar-nav-item ${isActive('/employer/interviews') ? 'active' : ''}`}
          onClick={() => navigate('/employer/interviews')}
        >
          <CalendarIcon size={16} />
          <span>Interviews</span>
          {stats?.upcomingInterviews > 0 && (
            <span className="kora-nav-badge" style={{ background: 'var(--kora-blue)' }}>
              {stats.upcomingInterviews}
            </span>
          )}
        </button>
      </nav>

      {/* Logout */}
      <button className="kora-sidebar-logout" onClick={handleLogout}>
        <LogOut size={16} />
        Sign Out
      </button>
    </div>
  );
}