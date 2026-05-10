import { useState, useMemo } from "react";
import {
  Briefcase, Plus, Search, Eye, Edit2, Trash2,
  Clock, Users, CheckCircle, XCircle, FileText,
  BarChart2, Bell, Settings, LogOut, Menu, X,
  AlertTriangle, TrendingUp
} from "lucide-react";
import koraLogo from "../../assets/kora-logo.png";
import "../../styles/profile.css";
import "../../styles/employer-profile.css";
import "../../styles/employer-dashboard.css";
import "../../styles/manage-jobs.css";

// ── Mock Data ─────────────────────────────────────────────
const INITIAL_JOBS = [
  {
    id: 1,
    title: "Senior Java Developer",
    type: "CDI",
    category: "Software Engineering",
    location: "Douala",
    salaryMin: 500000,
    salaryMax: 800000,
    applications: 12,
    views: 145,
    deadline: "2025-06-15",
    daysLeft: 36,
    status: "ACTIVE",
    createdAt: "2025-04-10",
  },
  {
    id: 2,
    title: "React.js Frontend Engineer",
    type: "CDD",
    category: "Software Engineering",
    location: "Yaoundé",
    salaryMin: 350000,
    salaryMax: 550000,
    applications: 8,
    views: 112,
    deadline: "2025-05-30",
    daysLeft: 20,
    status: "ACTIVE",
    createdAt: "2025-04-15",
  },
  {
    id: 3,
    title: "DevOps Engineer",
    type: "CDI",
    category: "Infrastructure",
    location: "Douala",
    salaryMin: 600000,
    salaryMax: 900000,
    applications: 4,
    views: 85,
    deadline: "2025-07-01",
    daysLeft: 52,
    status: "ACTIVE",
    createdAt: "2025-04-20",
  },
  {
    id: 4,
    title: "UI/UX Designer",
    type: "Freelance",
    category: "Design",
    location: "Remote",
    salaryMin: 200000,
    salaryMax: 400000,
    applications: 0,
    views: 23,
    deadline: "2025-05-20",
    daysLeft: 0,
    status: "DRAFT",
    createdAt: "2025-05-01",
  },
  {
    id: 5,
    title: "Data Analyst",
    type: "CDD",
    category: "Data & Analytics",
    location: "Yaoundé",
    salaryMin: 300000,
    salaryMax: 500000,
    applications: 19,
    views: 230,
    deadline: "2025-04-30",
    daysLeft: 0,
    status: "EXPIRED",
    createdAt: "2025-03-01",
  },
];

const STATUS_TABS = [
  { key: "ALL",     label: "All Jobs"  },
  { key: "ACTIVE",  label: "Active"    },
  { key: "DRAFT",   label: "Draft"     },
  { key: "EXPIRED", label: "Expired"   },
];

// ── Status Badge ──────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    ACTIVE:  { cls: "mj-status-active",  dot: true  },
    DRAFT:   { cls: "mj-status-draft",   dot: false },
    EXPIRED: { cls: "mj-status-expired", dot: false },
  };
  const s = map[status] || {};
  return (
    <span className={`mj-status ${s.cls}`}>
      {s.dot && <span className="mj-status-dot" />}
      {status}
    </span>
  );
}

// ── Delete Confirm Dialog ─────────────────────────────────
function ConfirmDialog({ job, onConfirm, onCancel }) {
  return (
    <div className="mj-confirm-overlay">
      <div className="mj-confirm-box">
        <div className="mj-confirm-icon">
          <AlertTriangle size={26} />
        </div>
        <h3>Delete Job Posting?</h3>
        <p>
          Are you sure you want to delete{" "}
          <strong>"{job.title}"</strong>?<br />
          This action cannot be undone.
        </p>
        <div className="mj-confirm-actions">
          <button className="kora-btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="kora-btn-primary"
            style={{ background: "#dc2626" }}
            onClick={onConfirm}
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────
export default function ManageJobs({ onPostJob }) {
  const [jobs, setJobs]                 = useState(INITIAL_JOBS);
  const [activeTab, setActiveTab]       = useState("ALL");
  const [searchQuery, setSearchQuery]   = useState("");
  const [filterType, setFilterType]     = useState("ALL");
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [activeNav, setActiveNav]       = useState("jobs");

  // ── Dynamic Stats ──
  const stats = useMemo(() => ({
    total:   jobs.length,
    active:  jobs.filter((j) => j.status === "ACTIVE").length,
    draft:   jobs.filter((j) => j.status === "DRAFT").length,
    expired: jobs.filter((j) => j.status === "EXPIRED").length,
  }), [jobs]);

  // ── Filtered Jobs ──
  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      const matchTab    = activeTab === "ALL" || j.status === activeTab;
      const matchType   = filterType === "ALL" || j.type === filterType;
      const matchSearch =
        j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchTab && matchType && matchSearch;
    });
  }, [jobs, activeTab, filterType, searchQuery]);

  // ── Actions ──
  const handleDelete  = (job) => setDeleteTarget(job);
  const confirmDelete = () => {
    setJobs((prev) => prev.filter((j) => j.id !== deleteTarget.id));
    setDeleteTarget(null);
  };
  const handlePublish = (id) =>
    setJobs((prev) => prev.map((j) => j.id === id ? { ...j, status: "ACTIVE" } : j));
  const handleClose   = (id) =>
    setJobs((prev) => prev.map((j) => j.id === id ? { ...j, status: "EXPIRED" } : j));

  const navItems = [
    { key: "dashboard", icon: <BarChart2 size={16} />, label: "Dashboard"                          },
    { key: "jobs",      icon: <Briefcase size={16} />, label: "Job Postings", count: stats.active  },
    { key: "apps",      icon: <Users size={16} />,     label: "Applications"                       },
    { key: "notifs",    icon: <Bell size={16} />,      label: "Notifications"                      },
    { key: "settings",  icon: <Settings size={16} />,  label: "Settings"                           },
  ];

  return (
    <div className="kora-profile-root employer">
      <div className="kora-bg-mesh" />

      {/* Sidebar overlay for mobile */}
      <div
        className={`kora-sidebar-overlay ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <div className="kora-profile-layout">

        {/* ════════ SIDEBAR ════════ */}
        <aside className={`kora-sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="kora-sidebar-inner">

            <div className="kora-sidebar-logo">
              <img src={koraLogo} alt="KORA" />
              <button
                className="kora-sidebar-close"
                onClick={() => setSidebarOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="kora-sidebar-avatar-section">
              <div className="kora-sidebar-avatar">
                <span className="kora-sidebar-initials">TC</span>
              </div>
              <p className="kora-sidebar-name">TechCam Solutions</p>
              <p className="kora-sidebar-role">Jean-Pierre MVONDO</p>
              <span className="kora-verified-badge">
                <CheckCircle size={12} /> Verified Employer
              </span>
            </div>

            <div className="kora-employer-stats">
              <div className="kora-stat-pill">
                <strong>{stats.active}</strong>
                <span>Active Jobs</span>
              </div>
              <div className="kora-stat-pill">
                <strong>24</strong>
                <span>Applications</span>
              </div>
            </div>

            <nav className="kora-sidebar-nav">
              <p className="kora-sidebar-nav-label">Main Menu</p>
              {navItems.map(({ key, icon, label, count }) => (
                <button
                  key={key}
                  className={`kora-sidebar-nav-item ${activeNav === key ? "active" : ""}`}
                  onClick={() => { setActiveNav(key); setSidebarOpen(false); }}
                >
                  {icon}
                  <span>{label}</span>
                  {count > 0 && (
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
          <div className="mj-topbar">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                className="ed-hamburger"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={18} />
              </button>
              <div className="mj-topbar-left">
                <h1>Manage Job Postings</h1>
                <p>{stats.total} total · {stats.active} active · {stats.draft} draft</p>
              </div>
            </div>
            <div className="mj-topbar-actions">
              <button className="kora-btn-primary" onClick={onPostJob}>
                <Plus size={15} /> Post New Job
              </button>
            </div>
          </div>

          {/* Dynamic Stats Row */}
          <div className="mj-stats-row">
            {[
              { label: "Total Jobs", val: stats.total,   color: "#0B2B26", bg: "#0B2B2618", icon: <Briefcase size={18} />    },
              { label: "Active",     val: stats.active,  color: "#15803d", bg: "#dcfce7",   icon: <CheckCircle size={18} />   },
              { label: "Draft",      val: stats.draft,   color: "#6b7280", bg: "#f3f4f6",   icon: <FileText size={18} />      },
              { label: "Expired",    val: stats.expired, color: "#dc2626", bg: "#fee2e2",   icon: <XCircle size={18} />       },
            ].map(({ label, val, color, bg, icon }) => (
              <div className="mj-stat-chip" key={label}>
                <div className="mj-stat-chip-icon" style={{ background: bg, color }}>
                  {icon}
                </div>
                <div>
                  <div className="mj-stat-chip-val">{val}</div>
                  <div className="mj-stat-chip-lbl">{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Tab Filters */}
          <div className="mj-tab-filters">
            {STATUS_TABS.map(({ key, label }) => {
              const count =
                key === "ALL"
                  ? jobs.length
                  : jobs.filter((j) => j.status === key).length;
              return (
                <button
                  key={key}
                  className={`mj-tab-filter ${activeTab === key ? "active" : ""}`}
                  onClick={() => setActiveTab(key)}
                >
                  {label}
                  <span className="mj-tab-count">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Search & Type Filter */}
          <div className="mj-filters">
            <div className="mj-search">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search by title, location or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="mj-filter-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="ALL">All Types</option>
              <option value="CDI">CDI</option>
              <option value="CDD">CDD</option>
              <option value="Internship">Internship</option>
              <option value="Freelance">Freelance</option>
            </select>
          </div>

          {/* ── TABLE — Desktop ── */}
          <div className="mj-table-wrap">
            {filtered.length === 0 ? (
              <div className="mj-empty">
                <div className="mj-empty-icon">📋</div>
                <h3>No jobs found</h3>
                <p>Try adjusting your filters or post a new job.</p>
                <button className="kora-btn-primary" onClick={onPostJob}>
                  <Plus size={14} /> Post New Job
                </button>
              </div>
            ) : (
              <table className="mj-table">
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Type</th>
                    <th>Applications</th>
                    <th>Views</th>
                    <th>Deadline</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((job) => (
                    <tr key={job.id}>
                      <td>
                        <div className="mj-job-title-cell">{job.title}</div>
                        <div className="mj-job-sub">
                          {job.category} · {job.location}
                        </div>
                      </td>
                      <td>
                        <span className="kora-job-type-badge">{job.type}</span>
                      </td>
                      <td>
                        <div className="mj-progress-wrap">
                          <div className="mj-progress-bar">
                            <div
                              className="mj-progress-fill"
                              style={{ width: `${Math.min((job.applications / 20) * 100, 100)}%` }}
                            />
                          </div>
                          <div className="mj-progress-label">
                            {job.applications} applicants
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px" }}>
                          <Eye size={13} color="var(--kora-text-muted)" />
                          {job.views}
                        </span>
                      </td>
                      <td>
                        <div className={`mj-deadline ${job.daysLeft <= 14 && job.status === "ACTIVE" ? "urgent" : ""}`}>
                          <Clock size={12} />
                          {job.status === "EXPIRED"
                            ? "Expired"
                            : job.status === "DRAFT"
                            ? "Not set"
                            : `${job.daysLeft}d left`}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--kora-text-muted)", marginTop: "2px" }}>
                          {job.deadline}
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={job.status} />
                      </td>
                      <td>
                        <div className="mj-actions">
                          <button className="mj-action-btn" title="View">
                            <Eye size={14} />
                          </button>
                          <button className="mj-action-btn" title="Edit">
                            <Edit2 size={14} />
                          </button>
                          {job.status === "DRAFT" && (
                            <button
                              className="mj-action-btn success"
                              title="Publish"
                              onClick={() => handlePublish(job.id)}
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}
                          {job.status === "ACTIVE" && (
                            <button
                              className="mj-action-btn danger"
                              title="Close Job"
                              onClick={() => handleClose(job.id)}
                            >
                              <XCircle size={14} />
                            </button>
                          )}
                          <button
                            className="mj-action-btn danger"
                            title="Delete"
                            onClick={() => handleDelete(job)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ── CARDS — Mobile ── */}
          <div className="mj-cards">
            {filtered.length === 0 ? (
              <div className="mj-empty">
                <div className="mj-empty-icon">📋</div>
                <h3>No jobs found</h3>
                <p>Try adjusting your filters or post a new job.</p>
                <button className="kora-btn-primary" onClick={onPostJob}>
                  <Plus size={14} /> Post New Job
                </button>
              </div>
            ) : (
              filtered.map((job) => (
                <div key={job.id} className="mj-card">
                  <div className="mj-card-top">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="mj-card-title">{job.title}</div>
                      <div className="mj-card-meta">
                        <span className="kora-job-type-badge">{job.type}</span>
                        <span>{job.location}</span>
                        <span>{job.category}</span>
                      </div>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>
                  <div className="mj-card-stats">
                    <div className="mj-card-stat">
                      <div className="mj-card-stat-val">{job.applications}</div>
                      <div className="mj-card-stat-lbl">Applicants</div>
                    </div>
                    <div className="mj-card-stat">
                      <div className="mj-card-stat-val">{job.views}</div>
                      <div className="mj-card-stat-lbl">Views</div>
                    </div>
                    <div className="mj-card-stat">
                      <div
                        className={`mj-card-stat-val ${
                          job.daysLeft <= 14 && job.status === "ACTIVE" ? "mj-deadline urgent" : ""
                        }`}
                      >
                        {job.status === "EXPIRED" ? "—" : `${job.daysLeft}d`}
                      </div>
                      <div className="mj-card-stat-lbl">Days Left</div>
                    </div>
                  </div>
                  <div className="mj-card-actions">
                    <button className="mj-action-btn" title="View"><Eye size={14} /></button>
                    <button className="mj-action-btn" title="Edit"><Edit2 size={14} /></button>
                    {job.status === "DRAFT" && (
                      <button
                        className="mj-action-btn success"
                        onClick={() => handlePublish(job.id)}
                      >
                        <CheckCircle size={14} />
                      </button>
                    )}
                    {job.status === "ACTIVE" && (
                      <button
                        className="mj-action-btn danger"
                        onClick={() => handleClose(job.id)}
                      >
                        <XCircle size={14} />
                      </button>
                    )}
                    <button
                      className="mj-action-btn danger"
                      onClick={() => handleDelete(job)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </main>
      </div>

      {/* Delete Confirm Dialog */}
      {deleteTarget && (
        <ConfirmDialog
          job={deleteTarget}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}