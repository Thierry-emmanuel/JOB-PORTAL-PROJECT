import { useState } from "react";
import {
  Shield, Users, Briefcase, BarChart2, Bell, Settings,
  LogOut, Edit2, CheckCircle, XCircle, AlertCircle,
  TrendingUp, Eye, Trash2, UserCheck, Search
} from "lucide-react";
import koraLogo from "../../assets/kora-logo.png";
import "../../styles/profile.css";
import "../../styles/admin-profile.css";

const mockAdmin = {
  fullName: "Admin KORA",
  email: "admin@kora.cm",
  role: "ADMIN",
  stats: {
    totalUsers: 1248,
    jobSeekers: 980,
    employers: 268,
    activeJobs: 143,
    totalApplications: 3890,
    pendingApprovals: 7,
    hireRate: 18,
  },
  recentUsers: [
    { id: 1, name: "Alain NGUEMBA", role: "JOB_SEEKER", status: "ACTIVE", joined: "2025-04-28" },
    { id: 2, name: "SoftAfrica Ltd", role: "EMPLOYER", status: "PENDING", joined: "2025-04-27" },
    { id: 3, name: "Carine FOTSO", role: "JOB_SEEKER", status: "ACTIVE", joined: "2025-04-26" },
    { id: 4, name: "Cameroon Digital", role: "EMPLOYER", status: "PENDING", joined: "2025-04-25" },
    { id: 5, name: "Boris TCHAMDA", role: "JOB_SEEKER", status: "SUSPENDED", joined: "2025-04-24" },
  ],
};

const STATUS_STYLES = {
  ACTIVE: { bg: "#dcfce7", color: "#15803d" },
  PENDING: { bg: "#fef9c3", color: "#a16207" },
  SUSPENDED: { bg: "#fee2e2", color: "#dc2626" },
};

export default function AdminProfile() {
  const [profile] = useState(mockAdmin);
  const [users, setUsers] = useState(mockAdmin.recentUsers);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  const updateStatus = (id, status) =>
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));

  const deleteUser = (id) => {
    if (window.confirm("Permanently delete this user?")) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    }
  };

  const { stats } = profile;

  return (
    <div className="kora-profile-root admin">
      <div className="kora-bg-mesh" />
      <div className="kora-profile-layout">

        {/* SIDEBAR */}
        <aside className="kora-sidebar kora-admin-sidebar">
          <div className="kora-sidebar-inner">
            <div className="kora-sidebar-logo">
              <img src={koraLogo} alt="KORA" />
            </div>

            <div className="kora-sidebar-avatar-section">
              <div className="kora-admin-avatar">
                <Shield size={32} />
              </div>
              <p className="kora-sidebar-name">{profile.fullName}</p>
              <p className="kora-sidebar-role">Platform Administrator</p>
            </div>

            <div className="kora-admin-quick-stat">
              <div className="kora-quick-stat-item">
                <strong>{stats.pendingApprovals}</strong>
                <span>Pending Approvals</span>
              </div>
            </div>

            <nav className="kora-sidebar-nav">
              <p className="kora-sidebar-nav-label">Administration</p>
              {[
                { icon: <BarChart2 size={16} />, label: "Dashboard" },
                { icon: <Users size={16} />, label: "User Management", count: stats.totalUsers },
                { icon: <Briefcase size={16} />, label: "Job Postings", count: stats.activeJobs },
                { icon: <AlertCircle size={16} />, label: "Pending Approvals", count: stats.pendingApprovals },
                { icon: <Bell size={16} />, label: "Notifications" },
                { icon: <Settings size={16} />, label: "Platform Settings" },
              ].map(({ icon, label, count }) => (
                <button key={label} className="kora-sidebar-nav-item">
                  {icon}<span>{label}</span>
                  {count !== undefined && <span className="kora-nav-badge">{count}</span>}
                </button>
              ))}
            </nav>

            <button className="kora-sidebar-logout"><LogOut size={15} />Sign Out</button>
          </div>
        </aside>

        {/* MAIN */}
        <main className="kora-main-content">

          {/* Admin Header */}
          <div className="kora-profile-header">
            <div className="kora-header-banner admin-banner">
              <div className="kora-banner-pattern" />
              <div className="kora-banner-gradient" />
              <div className="kora-admin-banner-badge">
                <Shield size={16} />ADMINISTRATOR
              </div>
            </div>
            <div className="kora-header-body">
              <div className="kora-header-avatar-wrap">
                <div className="kora-header-avatar-placeholder kora-admin-avatar-large">
                  <Shield size={36} />
                </div>
              </div>
              <div className="kora-header-info">
                <div className="kora-header-name-row">
                  <h1 className="kora-header-name">{profile.fullName}</h1>
                  <button className="kora-edit-btn"><Edit2 size={15} />Edit Info</button>
                </div>
                <div className="kora-header-meta">
                  <span className="kora-meta-chip">{profile.email}</span>
                  <span className="kora-meta-chip kora-admin-chip">
                    <Shield size={12} />Full Access
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="kora-tabs">
            {["dashboard", "users", "reports"].map((tab) => (
              <button key={tab} className={`kora-tab ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* KPI Cards */}
          {(activeTab === "dashboard" || activeTab === "reports") && (
            <div className="kora-kpi-grid">
              {[
                { label: "Total Users", value: stats.totalUsers.toLocaleString(), icon: <Users size={20} />, color: "#0B2B26" },
                { label: "Job Seekers", value: stats.jobSeekers.toLocaleString(), icon: <UserCheck size={20} />, color: "#1a4a42" },
                { label: "Employers", value: stats.employers.toLocaleString(), icon: <Briefcase size={20} />, color: "#E07B39" },
                { label: "Active Jobs", value: stats.activeJobs.toLocaleString(), icon: <TrendingUp size={20} />, color: "#0B2B26" },
                { label: "Applications", value: stats.totalApplications.toLocaleString(), icon: <BarChart2 size={20} />, color: "#1a4a42" },
                { label: "Hire Rate", value: `${stats.hireRate}%`, icon: <CheckCircle size={20} />, color: "#22c55e" },
              ].map(({ label, value, icon, color }) => (
                <div key={label} className="kora-kpi-card" style={{ "--kpi-color": color }}>
                  <div className="kora-kpi-icon">{icon}</div>
                  <div>
                    <p className="kora-kpi-value">{value}</p>
                    <p className="kora-kpi-label">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* User Management Table */}
          {(activeTab === "dashboard" || activeTab === "users") && (
            <section className="kora-section">
              <div className="kora-section-header">
                <div className="kora-section-title">
                  <Users size={18} />
                  <h2>User Management</h2>
                </div>
                <div className="kora-admin-search">
                  <Search size={14} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search users..."
                  />
                </div>
              </div>

              <div className="kora-user-table">
                <div className="kora-table-header">
                  <span>Name</span>
                  <span>Role</span>
                  <span>Status</span>
                  <span>Joined</span>
                  <span>Actions</span>
                </div>
                {filtered.map((user) => (
                  <div key={user.id} className="kora-table-row">
                    <span className="kora-table-name">{user.name}</span>
                    <span className={`kora-role-badge kora-role-${user.role.toLowerCase()}`}>
                      {user.role === "JOB_SEEKER" ? "Job Seeker" : "Employer"}
                    </span>
                    <span
                      className="kora-status-badge"
                      style={{
                        background: STATUS_STYLES[user.status]?.bg,
                        color: STATUS_STYLES[user.status]?.color,
                      }}
                    >
                      {user.status}
                    </span>
                    <span className="kora-table-date">{user.joined}</span>
                    <div className="kora-table-actions">
                      {user.status === "PENDING" && (
                        <button className="kora-action-btn kora-action-approve" title="Approve" onClick={() => updateStatus(user.id, "ACTIVE")}>
                          <CheckCircle size={14} />
                        </button>
                      )}
                      {user.status === "ACTIVE" && (
                        <button className="kora-action-btn kora-action-suspend" title="Suspend" onClick={() => updateStatus(user.id, "SUSPENDED")}>
                          <XCircle size={14} />
                        </button>
                      )}
                      {user.status === "SUSPENDED" && (
                        <button className="kora-action-btn kora-action-approve" title="Reactivate" onClick={() => updateStatus(user.id, "ACTIVE")}>
                          <CheckCircle size={14} />
                        </button>
                      )}
                      <button className="kora-action-btn" title="View"><Eye size={14} /></button>
                      <button className="kora-action-btn kora-action-delete" title="Delete" onClick={() => deleteUser(user.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="kora-empty-state"><Users size={28} /><p>No users found</p></div>
                )}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
