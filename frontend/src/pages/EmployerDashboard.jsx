import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Briefcase, Users, Eye, Star, Bell, X,
  Plus, ChevronRight, Clock, Calendar, Building2, ArrowUp, ArrowDown,
  AlertCircle, Search, TrendingUp, Edit2,
  RefreshCw, AlertTriangle, Video
} from "lucide-react";
import { useEmployerDashboard } from "../hooks/useEmployerDashboard";
import InterviewScheduler from "../components/employer/InterviewScheduler";
import EmployerSidebar from "../components/employer/EmployerSidebar";

import "../styles/employee-dashboard.css";
import "../styles/employer-dashboard.css";
import "../styles/profile.css";
import "../styles/employer-profile.css";

// ── Skeleton Card ─────────────────────────────────────────
function SkeletonStatCard() {
  return (
    <div className="ed-skeleton-card">
      <div className="ed-skeleton ed-skeleton-icon" />
      <div className="ed-skeleton-body">
        <div className="ed-skeleton ed-skeleton-line short" />
        <div className="ed-skeleton ed-skeleton-line long"
          style={{ height: "28px", marginTop: "8px" }} />
        <div className="ed-skeleton ed-skeleton-line short"
          style={{ marginTop: "8px" }} />
      </div>
    </div>
  );
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

// ── Status Select ─────────────────────────────────────────
function StatusSelect({ status, appId, onUpdate }) {
  const cls = {
    APPLIED:     "status-applied",
    SHORTLISTED: "status-shortlisted",
    REJECTED:    "status-rejected",
    HIRED:       "status-hired",
  }[status] || "";

  return (
    <select
      className={`ed-status-select ${cls}`}
      value={status}
      onChange={(e) => onUpdate(appId, e.target.value)}
      onClick={(e) => e.stopPropagation()}
    >
      <option value="APPLIED">Applied</option>
      <option value="SHORTLISTED">Shortlisted</option>
      <option value="REJECTED">Rejected</option>
      <option value="HIRED">Hired</option>
    </select>
  );
}

// ── Main Component ────────────────────────────────────────
export default function EmployerDashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [schedulerTarget, setSchedulerTarget] = useState(null);

  const {
    employer, stats, applications, jobPostings,
    notifications, unreadCount,
    loading, error, refreshing,
    refresh, markNotificationRead,
    markAllRead, updateApplicationStatus,
    updateJobPostingStatus,
  } = useEmployerDashboard();

  const filteredApplications = applications.filter((a) =>
    a.applicant.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.job.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInterviewScheduled = () => {
    if (schedulerTarget) {
      updateApplicationStatus(schedulerTarget.id, "SHORTLISTED");
    }
    setTimeout(() => setSchedulerTarget(null), 3000);
  };

  if (error) {
    return (
      <div className="ed-root">
        <div className="ed-body">
          <aside className="ed-sidebar kora-sidebar">
             <EmployerSidebar employer={employer} loading={loading} stats={stats} />
          </aside>
          <main className="ed-main">
            <div className="ed-error-state">
              <div className="ed-error-icon">
                <AlertTriangle size={28} />
              </div>
              <h3>Failed to load dashboard</h3>
              <p>{error}</p>
              <button className="kora-btn-primary" onClick={refresh}>
                <RefreshCw size={14} /> Try Again
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const firstName = employer?.contactName ? employer.contactName.split(" ")[0] : "Employer";

  return (
    <div className="ed-root">

      {schedulerTarget && (
        <InterviewScheduler
          application={schedulerTarget}
          onClose={() => setSchedulerTarget(null)}
          onScheduled={handleInterviewScheduled}
        />
      )}

      <div className="ed-body">
        {/* ════════ SIDEBAR ════════ */}
        <aside className="ed-sidebar kora-sidebar">
          <EmployerSidebar employer={employer} loading={loading} stats={stats} />
        </aside>

        {/* ════════ MAIN CONTENT ════════ */}
        <main className="ed-main">

          {/* ── Welcome Banner ── */}
          <div className="ed-welcome">
            <div>
              <h1 className="ed-welcome-title">
                Welcome back, {loading ? "..." : firstName}&nbsp;
                <span aria-hidden="true">👋</span>
              </h1>
              <p className="ed-welcome-sub">
                Here's what's happening with your job postings today.
              </p>
            </div>
            <div className="ed-topbar-actions" style={{ display: 'flex', gap: '10px' }}>
              <button
                className={`ed-refresh-btn ${refreshing ? "spinning" : ""}`}
                onClick={refresh}
                title="Refresh"
                disabled={refreshing}
                style={{ background: 'var(--kora-white)', border: '1px solid var(--kora-border)', borderRadius: 'var(--kora-r-sm)', padding: '10px' }}
              >
                <RefreshCw size={16} />
              </button>
              <button className="ed-find-jobs-btn" onClick={() => navigate("/employer/post-job")}>
                <Plus size={15} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                Post New Job
              </button>
            </div>
          </div>

          {/* ── Stat Cards ── */}
          <div className="ed-stats-row">
            {loading ? (
              [1,2,3,4].map((i) => <SkeletonStatCard key={i} />)
            ) : (
              <>
                <StatCard icon={<Briefcase size={20} />} label="Active Jobs"    value={stats.activeJobs}        change={stats.activeJobsChange}        color="#0B2B26" />
                <StatCard icon={<Users size={20} />}     label="Applications"   value={stats.totalApplications} change={stats.totalApplicationsChange} color="#E07B39" />
                <StatCard icon={<Eye size={20} />}       label="Profile Views"  value={stats.totalViews}        change={stats.totalViewsChange}        color="#3b82f6" />
                <StatCard icon={<Star size={20} />}      label="Hired"          value={stats.hired}             change={stats.hiredChange}             color="#10b981" />
              </>
            )}
          </div>

          {/* ── Two Column Row ── */}
          <div className="ed-two-col">

            {/* LEFT — Applications */}
            <div className="kora-section ed-section-tall">
              <div className="kora-section-header">
                <div className="kora-section-title">
                  <Users size={18} />
                  <h2>Recent Applications</h2>
                </div>
                <button
                  className="ed-view-all-btn"
                  onClick={() => navigate("/employer/jobs")}
                >
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
                {loading ? (
                  [1,2,3].map((i) => (
                    <div key={i} className="ed-skeleton-card"
                      style={{ padding: "12px 14px", borderRadius: "10px" }}>
                      <div className="ed-skeleton ed-skeleton-icon"
                        style={{ width: 38, height: 38, borderRadius: "50%" }} />
                      <div className="ed-skeleton-body">
                        <div className="ed-skeleton ed-skeleton-line"
                          style={{ width: "50%", height: "12px" }} />
                        <div className="ed-skeleton ed-skeleton-line"
                          style={{ width: "70%", height: "10px", marginTop: "6px" }} />
                      </div>
                    </div>
                  ))
                ) : filteredApplications.length === 0 ? (
                  <div className="kora-empty-state">
                    <Users size={28} />
                    <p>No applications found.</p>
                  </div>
                ) : (
                  filteredApplications.map((app) => {
                    const av = app.applicant
                      .split(" ").map((w) => w[0]).slice(0, 2).join("");
                    return (
                      <div key={app.id} className="ed-app-row">
                        <div className="ed-app-avatar">{av}</div>
                        <div className="ed-app-info">
                          <p className="ed-app-name">{app.applicant}</p>
                          <p className="ed-app-job">
                            <Briefcase size={11} /> {app.job}
                          </p>
                        </div>
                        <div className="ed-app-right">
                          <StatusSelect
                            status={app.status}
                            appId={app.id}
                            onUpdate={updateApplicationStatus}
                          />
                          <p className="ed-app-date">
                            <Clock size={11} /> {app.date}
                          </p>
                        </div>
                        {app.status === "SHORTLISTED" && (
                          <button
                            title="Schedule Interview"
                            onClick={() => setSchedulerTarget(app)}
                            style={{
                              display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px",
                              borderRadius: "7px", border: "1.5px solid #1565c0", background: "#e3f2fd",
                              color: "#1565c0", fontSize: "11.5px", fontWeight: 700, cursor: "pointer",
                              transition: "all 0.18s", whiteSpace: "nowrap",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#1565c0"; e.currentTarget.style.color = "white"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "#e3f2fd"; e.currentTarget.style.color = "#1565c0"; }}
                          >
                            <Video size={12} /> Schedule
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT Column */}
            <div className="ed-right-col">

              {/* Active Jobs */}
              <div className="kora-section">
                <div className="kora-section-header">
                  <div className="kora-section-title">
                    <Briefcase size={18} />
                    <h2>Active Jobs</h2>
                  </div>
                  <button className="ed-view-all-btn" onClick={() => navigate("/employer/jobs")}>
                    View All <ChevronRight size={14} />
                  </button>
                </div>

                <div className="ed-jobs-list">
                  {loading ? (
                    [1,2].map((i) => (
                      <div key={i} className="ed-skeleton-card"
                        style={{ borderRadius: "10px", padding: "14px" }}>
                        <div className="ed-skeleton-body">
                          <div className="ed-skeleton ed-skeleton-line" style={{ height: "14px", width: "70%" }} />
                          <div className="ed-skeleton ed-skeleton-line" style={{ height: "10px", width: "40%", marginTop: "8px" }} />
                        </div>
                      </div>
                    ))
                  ) : jobPostings.length === 0 ? (
                    <div className="kora-empty-state">
                      <Briefcase size={24} />
                      <p>No active jobs.</p>
                    </div>
                  ) : (
                    jobPostings.map((job) => (
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
                          <div className="ed-job-progress-fill" style={{ width: `${Math.min((job.applications / 20) * 100, 100)}%` }} />
                        </div>
                        <div className="ed-job-card-actions">
                          <button className="ed-job-action-btn" onClick={() => navigate("/employer/jobs")}><Users size={12} /> Applicants</button>
                          <button className="ed-job-action-btn" onClick={() => navigate("/employer/jobs")}><Edit2 size={12} /> Edit</button>
                          <button className="ed-job-action-btn danger" onClick={() => updateJobPostingStatus(job.id, "EXPIRED")}><X size={12} /> Close</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Notifications */}
              <div className="kora-section">
                <div className="kora-section-header">
                  <div className="kora-section-title">
                    <Bell size={18} />
                    <h2>Notifications</h2>
                    {unreadCount > 0 && <span className="ed-section-badge">{unreadCount} new</span>}
                  </div>
                </div>

                {unreadCount > 0 && (
                  <div className="ed-notifs-header">
                    <span />
                    <button className="ed-mark-all-btn" onClick={markAllRead}>Mark all as read</button>
                  </div>
                )}

                <div className="ed-notifs-list">
                  {loading ? (
                    [1,2].map((i) => (
                      <div key={i} style={{ padding: "10px 4px", borderBottom: "1px solid var(--kora-border)" }}>
                        <div className="ed-skeleton ed-skeleton-line" style={{ height: "12px", width: "85%" }} />
                      </div>
                    ))
                  ) : notifications.length === 0 ? (
                    <div className="kora-empty-state"><Bell size={24} /><p>No notifications.</p></div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className={`ed-notif-item ${!n.read ? "unread" : ""}`} onClick={() => markNotificationRead(n.id)}>
                        <div className="ed-notif-dot-indicator" />
                        <div className="ed-notif-content">
                          <p className="ed-notif-text">{n.text}</p>
                          <p className="ed-notif-time"><Clock size={11} /> {n.time}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* ── Quick Actions ── */}
          <div className="kora-section">
            <div className="kora-section-header">
              <div className="kora-section-title">
                <TrendingUp size={18} />
                <h2>Quick Actions</h2>
              </div>
            </div>
            <div className="ed-quick-actions">
              {[
                { icon: <Plus size={20} />,        label: "Post a New Job",       color: "#0B2B26", bg: "#0B2B2618", action: "post-job"    },
                { icon: <Users size={20} />,       label: "Review Applications",  color: "#E07B39", bg: "#E07B3918", action: "manage-jobs" },
                { icon: <Video size={20} />,       label: "Schedule Interview",   color: "#1565c0", bg: "#e3f2fd",   action: "schedule"    },
                { icon: <Building2 size={20} />,   label: "Edit Company Profile", color: "#10b981", bg: "#10b98118", action: null          },
                { icon: <AlertCircle size={20} />, label: "Pending Approvals",    color: "#f59e0b", bg: "#f59e0b18", action: null          },
                { icon: <Edit2 size={20} />,       label: "Account Settings",     color: "#8b5cf6", bg: "#8b5cf618", action: null          },
              ].map(({ icon, label, color, bg, action }) => (
                <button
                  key={label}
                  className="ed-quick-action-btn"
                  style={{ "--qa-color": color, "--qa-bg": bg }}
                  onClick={() => {
                    if (action === "schedule" || label === "Schedule Interview") {
                      const shortlisted = applications.find((a) => a.status === "SHORTLISTED");
                      if (shortlisted) setSchedulerTarget(shortlisted);
                    } else if (action === "post-job") navigate("/employer/post-job");
                    else if (action === "manage-jobs") navigate("/employer/jobs");
                    else if (label === "Edit Company Profile" || label === "Account Settings") navigate("/profile/employer");
                  }}
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