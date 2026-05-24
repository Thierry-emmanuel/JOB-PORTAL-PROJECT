import { useNavigate } from "react-router-dom";
import {
  LogOut, LayoutDashboard, Building2, Briefcase,
  Users, ShieldAlert, BarChart3,
} from "lucide-react";
import koraLogo from "../../assets/absolute-size-logo.png";
import { useAuth } from "../../context/AuthContext";

export default function AdminSidebar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  /* Derive display name from auth context */
  const displayName =
    user?.fullName ?? user?.name ?? user?.email ?? "Administrator";
  const initials =
    displayName
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "AD";

  const navItems = [
    { key: "overview",  label: "Overview",      icon: <LayoutDashboard size={16} /> },
    { key: "employers", label: "Employers",      icon: <Building2 size={16} /> },
    { key: "jobs",      label: "Job Postings",   icon: <Briefcase size={16} /> },
    { key: "seekers",   label: "Job Seekers",    icon: <Users size={16} /> },
    { key: "reports",   label: "Reports",        icon: <BarChart3 size={16} /> },
  ];

  return (
    <div className="kora-sidebar-inner">
      {/* ── Logo ── */}
      <div className="kora-sidebar-logo" style={{ cursor: "pointer" }}>
        <img src={koraLogo} alt="KORA" />
      </div>

      {/* ── Admin Avatar ── */}
      <div className="kora-sidebar-avatar-section">
        <div className="kora-sidebar-avatar">
          <span className="kora-sidebar-initials">{initials}</span>
        </div>
        <p className="kora-sidebar-name">{displayName}</p>
        <p className="kora-sidebar-role">
          {user?.role === "ADMIN" ? "Platform Admin" : "Kora Platform"}
        </p>
        <span
          style={{
            marginTop: "8px",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--kora-green)",
            background: "var(--kora-green-light)",
            padding: "3px 10px",
            borderRadius: "var(--kora-r-pill)",
          }}
        >
          <ShieldAlert size={11} />
          Super Admin
        </span>
      </div>

      {/* ── Navigation ── */}
      <nav className="kora-sidebar-nav">
        <p className="kora-sidebar-nav-label">Management</p>

        {navItems.map(({ key, label, icon }) => (
          <button
            key={key}
            className={`kora-sidebar-nav-item${activeTab === key ? " active" : ""}`}
            onClick={() => setActiveTab(key)}
            aria-current={activeTab === key ? "page" : undefined}
          >
            {icon}
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* ── Logout ── */}
      <button className="kora-sidebar-logout" onClick={handleLogout}>
        <LogOut size={15} />
        Sign Out
      </button>
    </div>
  );
}