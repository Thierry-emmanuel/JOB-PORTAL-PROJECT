import { useState } from "react";
import {
  Briefcase, Users, Eye, Star, Bell, Settings,
  LogOut, BarChart2, Plus, ChevronRight, Clock,
  CheckCircle, Calendar, Building2, ArrowUp, ArrowDown,
  FileText, AlertCircle, Search, TrendingUp, Edit2, Menu, X
} from "lucide-react";
import koraLogo from "../assets/kora-logo.png";
import "../styles/profile.css";
import "../styles/employer-profile.css";
import "../styles/employer-dashboard.css";

// ── Mock Data ─────────────────────────────────────────────
const mockDashboardData = {
  employer: {
    companyName: "TechCam Solutions",
    contactName: "Jean-Pierre MVONDO",
    logo: null,
    city: "Douala",
    sector: "Information Technology",
  },
  stats: {
    activeJobs: 3,
    totalApplications: 24,
    totalViews: 342,
    hired: 2,
    activeJobsChange: +1,
    totalApplicationsChange: +6,
    totalViewsChange: +48,
    hiredChange: +1,
  },
  recentApplications: [
    { id: 1, applicant: "Lena Biloa Ekassi",    job: "Senior Java Developer",      status: "SHORTLISTED", date: "2025-05-10" },
    { id: 2, applicant: "Thomas Nguisseu",       job: "React.js Frontend Engineer", status: "APPLIED",     date: "2025-05-09" },
    { id: 3, applicant: "Marie Kana Tsolefack", job: "DevOps Engineer",            status: "APPLIED",     date: "2025-05-08" },
    { id: 4, applicant: "Thierry Tsafack",       job: "Senior Java Developer",      status: "REJECTED",    date: "2025-05-07" },
    { id: 5, applicant: "Marc Tsobeng",          job: "React.js Frontend Engineer", status: "HIRED",       date: "2025-05-06" },
  ],
  jobPostings: [
    { id: 1, title: "Senior Java Developer",      type: "CDI", applications: 12, views: 145, status: "ACTIVE", daysLeft: 36 },
    { id: 2, title: "React.js Frontend Engineer", type: "CDD", applications: 8,  views: 112, status: "ACTIVE", daysLeft: 20 },
    { id: 3, title: "DevOps Engineer",            type: "CDI", applications: 4,  views: 85,  status: "ACTIVE", daysLeft: 52 },
  ],
  notifications: [
    { id: 1, text: "New application for Senior Java Developer",    time: "2 hours ago", read: false },
    { id: 2, text: "Your job post 'DevOps Engineer' was approved", time: "1 day ago",   read: false },
    { id: 3, text: "Thomas Nguisseu updated their application",    time: "2 days ago",  read: true  },
  ],
};

// ── Status Badge ──────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    APPLIED:     { label: "Applied",     cls: "status-applied"     },
    SHORTLISTED: { label: "Shortlisted", cls: "status-shortlisted" },
    REJECTED:    { label: "Rejected",    cls: "status-rejected"    },
    HIRED:       { label: "Hired",       cls: "status-hired"       },
  };
  const s = map[status] || { label: status, cls: "" };
  return <span className={`ed-status-badge ${s.cls}`}>{s.label}</span>;
}

// ── Stat Card ─────────────────────────────────────────────
function StatCard({ icon, label, value, change, color }) {
  const isPositive = change >= 0;
  return (
    <div className="ed-stat-card">
      <div className="ed-stat-icon" style={{ background: color + "18", color }}>
        {icon}
      </div>
      <div className="ed-stat-body">
        <p className="ed-stat-label">{label}</p>
        <p className="ed-stat-value">{value}</p>
        <div className={`ed-stat-change ${isPositive ? "positive" : "negative"}`}>
          {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
          <span>{Math.abs(change)} this week</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────
export default function EmployerDashboard() {
  const [activeNav, setActiveNav]     = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { employer, stats, recentApplications, jobPostings, notifications } = mockDashboardData;

  const unreadCount = notifications.filter((n) => !n.read).length;
  const initials    = employer.companyName.split(" ").map((w) => w[0]).slice(0, 2).join("");

  const filteredApplications = recentApplications.filter((a) =>
    a.applicant.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.job.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navItems = [
    { key: "dashboard", icon: <BarChart2 size={16} />, label: "Dashboard"                                    },
    { key: "jobs",      icon: <Briefcase size={16} />, label: "Job Postings",  count: stats.activeJobs       },
    { key: "apps",      icon: <Users size={16} />,     label: "Applications",  count: stats.totalApplications },
    { key: "notifs",    icon: <Bell size={16} />,      label: "Notifications", count: unreadCount            },
    { key: "settings",  icon: <Settings size={16} />,  label: "Settings"                                     },
  ];

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="kora-profile-root employer">
      <div className="kora-bg-mesh" />

      {/* Mobile Sidebar Overlay */}
      <div
        className={`ed-sidebar-overlay ${sidebarOpen ? "open" : ""}`}
        onClick={closeSidebar}
      />

      <div className="kora-profile-layout">

        {/* ════════ SIDEBAR ════════ */}
        <aside className={`kora-sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="kora-sidebar-inner">

            {/* Logo + close btn on mobile */}
            <div className="kora-sidebar-logo" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <img src={koraLogo} alt="KORA" />
              <button
                onClick={closeSidebar}
                style={{
                  display: "none",
                  background: "none", border: "none",
                  color: "rgba(255,255,255,0.6)", cursor: "pointer",
                }}
                className="ed-close-sidebar-btn"
              >
                <X size={18} />
              </button>
            </div>

            {/* Avatar */}
            <div className="kora-sidebar-avatar-section">
              <div className="kora-sidebar-avatar">
                {employer.logo
                  ? <img src={employer.logo} alt={employer.companyName} />
                  : <span className="kora-sidebar-initials">{initials}</span>
                }
              </div>
              <p className="kora-sidebar-name">{employer.companyName}</p>
              <p className="kora-sidebar-role">{employer.contactName}</p>
              <span className="kora-verified-badge">
                <CheckCircle size={12} /> Verified Employer
              </span>
            </div>

            {/* Quick Stats */}
            <div className="kora-employer-stats">
              <div className="kora-stat-pill">
                <strong>{stats.activeJobs}</strong>
                <span>Active Jobs</span>
              </div>
              <div className="kora-stat-pill">
                <strong>{stats.totalApplications}</strong>
                <span>Applications</span>
              </div>
            </div>

            {/* Nav */}
            <nav className="kora-sidebar-nav">
              <p className="kora-sidebar-nav-label">Main Menu</p>
              {navItems.map(({ key, icon, label, count }) => (
                <button
                  key={key}
                  className={`kora-sidebar-nav-item ${activeNav === key ? "active" : ""}`}
                  onClick={() => { setActiveNav(key); closeSidebar(); }}
                >
                  {icon}
                  <span>{label}</span>
                  {count !== undefined && count > 0 && (
                    <span className="kora-nav-badge">{count}</span>
                  )}
                </button>
              ))}
            </nav>

            <button className="kora-sidebar-logout">
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </aside>

        {/* ════════ MAIN CONTENT ════════ */}
        <main className="kora-main-content">

          {/* Top Bar */}
          <div className="ed-topbar">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {/* Hamburger — visible on tablet/mobile only */}
              <button
                className="ed-hamburger"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={18} />
              </button>
              <div>
                <h1 className="ed-topbar-title">Dashboard</h1>
                <p className="ed-topbar-sub">
                  <Calendar size={13} />
                  {new Date().toLocaleDateString("en-GB", {
                    weekday: "long", year: "numeric",
                    month: "long",   day: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div className="ed-topbar-actions">
              <button className="ed-notif-btn">
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="ed-notif-dot">{unreadCount}</span>
                )}
              </button>
              <button className="kora-btn-primary ed-post-btn">
                <Plus size={15} />
                <span className="ed-post-btn-text">Post New Job</span>
              </button>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="ed-stats-grid">
            <StatCard icon={<Briefcase size={20} />} label="Active Jobs"        value={stats.activeJobs}           change={stats.activeJobsChange}           color="#0B2B26" />
            <StatCard icon={<Users size={20} />}     label="Applications"       value={stats.totalApplications}    change={stats.totalApplicationsChange}    color="#E07B39" />
            <StatCard icon={<Eye size={20} />}       label="Profile Views"      value={stats.totalViews}           change={stats.totalViewsChange}           color="#3b82f6" />
            <StatCard icon={<Star size={20} />}      label="Candidates Hired"   value={stats.hired}                change={stats.hiredChange}                color="#10b981" />
          </div>

          {/* Two Column Row */}
          <div className="ed-two-col">

            {/* LEFT — Applications */}
            <div className="kora-section ed-section-tall">
              <div className="kora-section-header">
                <div className="kora-section-title">
                  <Users size={18} /> <h2>Recent Applications</h2>
                </div>
                <button className="ed-view-all-btn">
                  View All <ChevronRight size={14} />
                </button>
              </div>
              <div className="ed-search-bar">
                <Search size={14} />
                <input
                  type="text"
                  placeholder="Search applicants or jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="ed-applications-list">
                {filteredApplications.map((app) => {
                  const av = app.applicant.split(" ").map((w) => w[0]).slice(0, 2).join("");
                  return (
                    <div key={app.id} className="ed-app-row">
                      <div className="ed-app-avatar">{av}</div>
                      <div className="ed-app-info">
                        <p className="ed-app-name">{app.applicant}</p>
                        <p className="ed-app-job"><Briefcase size={11} /> {app.job}</p>
                      </div>
                      <div className="ed-app-right">
                        <StatusBadge status={app.status} />
                        <p className="ed-app-date"><Clock size={11} /> {app.date}</p>
                      </div>
                    </div>
                  );
                })}
                {filteredApplications.length === 0 && (
                  <div className="kora-empty-state">
                    <Users size={28} /><p>No applications found.</p>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT Column */}
            <div className="ed-right-col">

              {/* Active Jobs */}
              <div className="kora-section">
                <div className="kora-section-header">
                  <div className="kora-section-title">
                    <Briefcase size={18} /> <h2>Active Jobs</h2>
                  </div>
                  <button className="ed-view-all-btn">View All <ChevronRight size={14} /></button>
                </div>
                <div className="ed-jobs-list">
                  {jobPostings.map((job) => (
                    <div key={job.id} className="ed-job-card">
                      <div className="ed-job-card-top">
                        <div>
                          <p className="ed-job-card-title">{job.title}</p>
                          <div className="ed-job-card-meta">
                            <span className="kora-job-type-badge">{job.type}</span>
                            <span className={`ed-days-left ${job.daysLeft <= 14 ? "urgent" : ""}`}>
                              <Clock size={11} /> {job.daysLeft}d left
                            </span>
                          </div>
                        </div>
                        <span className="kora-status-badge kora-status-active">ACTIVE</span>
                      </div>
                      <div className="ed-job-card-stats">
                        <span><Users size={12} /> {job.applications} applicants</span>
                        <span><Eye size={12} /> {job.views} views</span>
                      </div>
                      <div className="ed-job-progress">
                        <div className="ed-job-progress-fill"
                          style={{ width: `${Math.min((job.applications / 20) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notifications */}
              <div className="kora-section">
                <div className="kora-section-header">
                  <div className="kora-section-title">
                    <Bell size={18} /> <h2>Notifications</h2>
                    {unreadCount > 0 && (
                      <span className="ed-section-badge">{unreadCount} new</span>
                    )}
                  </div>
                </div>
                <div className="ed-notifs-list">
                  {notifications.map((n) => (
                    <div key={n.id} className={`ed-notif-item ${!n.read ? "unread" : ""}`}>
                      <div className="ed-notif-dot-indicator" />
                      <div className="ed-notif-content">
                        <p className="ed-notif-text">{n.text}</p>
                        <p className="ed-notif-time"><Clock size={11} /> {n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Quick Actions */}
          <div className="kora-section">
            <div className="kora-section-header">
              <div className="kora-section-title">
                <TrendingUp size={18} /> <h2>Quick Actions</h2>
              </div>
            </div>
            <div className="ed-quick-actions">
              {[
                { icon: <Plus size={20} />,        label: "Post a New Job",       color: "#0B2B26", bg: "#0B2B2618" },
                { icon: <Users size={20} />,       label: "Review Applications",  color: "#E07B39", bg: "#E07B3918" },
                { icon: <FileText size={20} />,    label: "View Job Reports",     color: "#3b82f6", bg: "#3b82f618" },
                { icon: <Building2 size={20} />,   label: "Edit Company Profile", color: "#10b981", bg: "#10b98118" },
                { icon: <AlertCircle size={20} />, label: "Pending Approvals",    color: "#f59e0b", bg: "#f59e0b18" },
                { icon: <Edit2 size={20} />,       label: "Account Settings",     color: "#8b5cf6", bg: "#8b5cf618" },
              ].map(({ icon, label, color, bg }) => (
                <button
                  key={label}
                  className="ed-quick-action-btn"
                  style={{ "--qa-color": color, "--qa-bg": bg }}
                >
                  <span className="ed-qa-icon">{icon}</span>
                  <span className="ed-qa-label">{label}</span>
                </button>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}