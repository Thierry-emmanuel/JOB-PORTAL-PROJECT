import { useRef } from "react";
import { Camera, FileText, Bookmark, Bell, Settings, LogOut, TrendingUp, KeyRound } from "lucide-react";
import koraLogo from "../../assets/absolute-size-logo.png";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function ProfileSidebar({ profile, completion, onEdit, onPhotoChange, onResetPassword }) {
  const fileRef = useRef();
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Safely build initials — fullName may be absent if backend doesn't return it
  const displayName = profile?.fullName || profile?.name || profile?.email || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("").toUpperCase() || "U";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="kora-sidebar-inner">
      {/* Logo */}
      <div className="kora-sidebar-logo">
        <img src={koraLogo} alt="KORA" />
      </div>

      {/* Avatar + Upload */}
      <div className="kora-sidebar-avatar-section">
        <div className="kora-sidebar-avatar">
          {profile.profilePhoto ? (
            <img src={profile.profilePhoto} alt={profile.fullName} />
          ) : (
            <span className="kora-sidebar-initials">{initials}</span>
          )}
          <button
            className="kora-photo-overlay"
            onClick={() => fileRef.current?.click()}
            title="Change photo"
          >
            <Camera size={16} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => e.target.files[0] && onPhotoChange(e.target.files[0])}
          />
        </div>
        <p className="kora-sidebar-name">{displayName}</p>
        <p className="kora-sidebar-role">Job Seeker</p>
      </div>

      {/* Completion */}
      <div className="kora-sidebar-completion">
        <div className="kora-completion-bar-header">
          <TrendingUp size={14} />
          <span>Profile strength</span>
          <strong>{completion}%</strong>
        </div>
        <div className="kora-completion-bar-bg">
          <div
            className="kora-completion-bar-fill"
            style={{ width: `${completion}%` }}
          />
        </div>
        {completion < 100 && (
          <p className="kora-completion-tip">
            {completion < 50
              ? "Add more details to stand out to employers"
              : completion < 80
              ? "Great progress! Upload your CV to boost visibility"
              : "Almost there! Complete all sections"}
          </p>
        )}
      </div>

      {/* Navigation */}
      <nav className="kora-sidebar-nav">
        <p className="kora-sidebar-nav-label">Navigation</p>
        {[
          { icon: <FileText size={16} />, label: "My Applications", count: 3 },
          { icon: <Bookmark size={16} />, label: "Saved Jobs", count: 5 },
          { icon: <Bell size={16} />, label: "Notifications", count: 2 },
          { icon: <Settings size={16} />, label: "Settings" },
        ].map(({ icon, label, count }) => (
          <button key={label} className="kora-sidebar-nav-item">
            {icon}
            <span>{label}</span>
            {count && <span className="kora-nav-badge">{count}</span>}
          </button>
        ))}

        {/* Reset Password */}
        <button className="kora-sidebar-nav-item kora-reset-pwd-btn" onClick={onResetPassword}>
          <KeyRound size={16} />
          <span>Reset Password</span>
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
