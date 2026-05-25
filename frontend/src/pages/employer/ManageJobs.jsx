import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useEmployerDashboard } from "../../hooks/useEmployerDashboard";
import {
  Search, Plus, Filter, MoreVertical,
  CheckCircle, Clock, Users, Eye, XCircle, Trash2, Edit2, Play, Calendar as CalendarIcon, Briefcase
} from "lucide-react";
import EmployerSidebar from "../../components/employer/EmployerSidebar";

import "../../styles/dashboard-shell.css";
import "../../styles/profile.css";
import "../../styles/ManageJobs.css";

// ── Status Badge ──
function StatusBadge({ status }) {
  const statusClass = status.toLowerCase();
  return (
    <span className={`mj-status mj-status-${statusClass}`}>
      <span className="mj-status-dot" />
      <span>{status}</span>
    </span>
  );
}

export default function ManageJobs() {
  const navigate = useNavigate();
  const {
    employer, stats, jobPostings,
    loading, error,
    updateJobPostingStatus, deleteJobPosting
  } = useEmployerDashboard();

  const [activeTab, setActiveTab]     = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType]   = useState("ALL");
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── Derived Stats ──
  const localStats = useMemo(() => {
    const jobs = jobPostings || [];
    return {
      total:   jobs.length,
      active:  jobs.filter((j) => j.status === "ACTIVE").length,
      draft:   jobs.filter((j) => j.status === "DRAFT").length,
      expired: jobs.filter((j) => j.status === "EXPIRED" || j.status === "DELETED").length,
    };
  }, [jobPostings]);

  // ── Filtered Jobs ──
  const filtered = useMemo(() => {
    const jobsToFilter = jobPostings || [];
    return jobsToFilter.filter((j) => {
      const matchTab    = activeTab === "ALL" || j.status === activeTab;
      const matchType   = filterType === "ALL" || j.type === filterType;
      const matchSearch =
        j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchTab && matchType && matchSearch;
    });
  }, [jobPostings, activeTab, filterType, searchQuery]);

  // ── Actions ──
  const handleDelete  = (job) => setDeleteTarget(job);
  const confirmDelete = () => {
    deleteJobPosting(deleteTarget.id);
    setDeleteTarget(null);
  };
  const handlePublish = (id) => updateJobPostingStatus(id, "ACTIVE");
  const handleClose   = (id) => updateJobPostingStatus(id, "EXPIRED");

  if (error) {
    return (
      <div className="ds-root employer">
        <div className="ds-body">
          <aside className="ds-sidebar">
             <EmployerSidebar employer={employer} loading={loading} stats={stats} />
          </aside>
          <main className="ds-main">
            <div className="kora-empty-state">
              <p>Failed to load jobs: {error}</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="ds-root employer">

      {deleteTarget && (
        <>
          <div className="mj-confirm-overlay" onClick={() => setDeleteTarget(null)} />
          <div className="mj-confirm-box">
            <div className="mj-confirm-icon"><Trash2 size={24} /></div>
            <h3>Delete Job Posting</h3>
            <p>
              Are you sure you want to delete <strong>{deleteTarget.title}</strong>?
              This action cannot be undone and will remove all associated applications.
            </p>
            <div className="mj-confirm-actions">
              <button className="mj-btn-cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="mj-btn-danger" onClick={confirmDelete}>Delete Job</button>
            </div>
          </div>
        </>
      )}

      <div className="ds-body">
        {/* ════════ SIDEBAR ════════ */}
        <aside className="ds-sidebar">
          <EmployerSidebar employer={employer} loading={loading} stats={stats} />
        </aside>

        {/* ════════ MAIN CONTENT ════════ */}
        <main className="ds-main">

          <div className="ed-welcome">
            <div>
              <h1 className="ed-welcome-title">Manage Job Postings</h1>
              <p className="ed-welcome-sub">
                {localStats.total} total · {localStats.active} active · {localStats.draft} draft
              </p>
            </div>
            <button className="ed-find-jobs-btn" onClick={() => navigate("/employer/post-job")}>
              <Plus size={15} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              Post New Job
            </button>
          </div>

          {/* Stats Row */}
          <div className="mj-stats-row">
            <div className="mj-stat-chip">
              <div className="mj-stat-chip-icon" style={{ background: "rgba(22, 163, 74, 0.1)", color: "#16A34A" }}>
                <CheckCircle size={20} />
              </div>
              <div>
                <div className="mj-stat-chip-val">{localStats.active}</div>
                <div className="mj-stat-chip-lbl">Active Jobs</div>
              </div>
            </div>
            <div className="mj-stat-chip">
              <div className="mj-stat-chip-icon" style={{ background: "rgba(75, 85, 99, 0.1)", color: "#4B5563" }}>
                <Edit2 size={20} />
              </div>
              <div>
                <div className="mj-stat-chip-val">{localStats.draft}</div>
                <div className="mj-stat-chip-lbl">Drafts</div>
              </div>
            </div>
            <div className="mj-stat-chip">
              <div className="mj-stat-chip-icon" style={{ background: "rgba(217, 119, 6, 0.1)", color: "#D97706" }}>
                <Clock size={20} />
              </div>
              <div>
                <div className="mj-stat-chip-val">{localStats.expired}</div>
                <div className="mj-stat-chip-lbl">Expired</div>
              </div>
            </div>
            <div className="mj-stat-chip">
              <div className="mj-stat-chip-icon" style={{ background: "rgba(20, 83, 116, 0.1)", color: "var(--kora-primary)" }}>
                <Briefcase size={20} />
              </div>
              <div>
                <div className="mj-stat-chip-val">{localStats.total}</div>
                <div className="mj-stat-chip-lbl">Total Posted</div>
              </div>
            </div>
          </div>

          <div className="mj-tab-filters">
            {["ALL", "ACTIVE", "DRAFT", "EXPIRED", "DELETED"].map((tab) => (
              <button
                key={tab}
                className={`mj-tab-filter ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "ALL" ? "All Jobs" : tab.charAt(0) + tab.slice(1).toLowerCase()}
                <span className="mj-tab-count">
                  {tab === "ALL" ? localStats.total : localStats[tab.toLowerCase()] || 0}
                </span>
              </button>
            ))}
          </div>

          <div className="mj-filters">
            <div className="mj-search">
              <Search size={16} className="mj-search-icon" />
              <input
                type="text"
                placeholder="Search by title, location, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="mj-filter-select-wrapper">
              <Filter size={14} className="mj-filter-icon" />
              <select
                className="mj-filter-select"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="ALL">All Types</option>
                <option value="CDI">Full-time (CDI)</option>
                <option value="CDD">Contract (CDD)</option>
                <option value="STAGE">Internship (Stage)</option>
                <option value="FREELANCE">Freelance</option>
              </select>
            </div>
          </div>

          <div className="mj-list-container">
            {loading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--kora-muted)" }}>
                Loading jobs...
              </div>
            ) : filtered.length === 0 ? (
              <div className="mj-empty-state">
                <div className="mj-empty-icon"><Briefcase size={32} /></div>
                <h3>No jobs found</h3>
                <p>We couldn't find any job postings matching your current filters.</p>
                {activeTab !== "ALL" || searchQuery !== "" ? (
                  <button
                    className="mj-btn-outline"
                    onClick={() => { setActiveTab("ALL"); setSearchQuery(""); setFilterType("ALL"); }}
                    style={{ marginTop: "16px" }}
                  >
                    Clear Filters
                  </button>
                ) : (
                  <button
                    className="kora-btn-primary"
                    onClick={() => navigate("/employer/post-job")}
                    style={{ marginTop: "16px" }}
                  >
                    Create First Job
                  </button>
                )}
              </div>
            ) : (
              <div className="mj-table-wrap">
                <table className="mj-table">
                  <thead>
                    <tr>
                      <th>Job Role</th>
                      <th>Status</th>
                      <th>Metrics</th>
                      <th>Dates</th>
                      <th className="mj-th-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((job) => (
                      <tr key={job.id}>
                        <td>
                          <div className="mj-job-title-cell">{job.title}</div>
                          <div className="mj-job-sub">
                            <span>{job.type}</span>
                            <span style={{ margin: "0 6px" }}>•</span>
                            <span>{job.location}</span>
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={job.status} />
                        </td>
                        <td>
                          <div className="mj-td-metrics">
                            <div className="mj-metric" title="Total Applications">
                              <Users size={14} /> <strong>{job.applications}</strong>
                            </div>
                            <div className="mj-metric" title="Total Views">
                              <Eye size={14} /> <span>{job.views}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="mj-td-dates">
                            <span>Posted: {job.postedAt ? new Date(job.postedAt).toLocaleDateString() : 'N/A'}</span>
                            <span className={job.daysLeft <= 7 && job.status === "ACTIVE" ? "mj-date-urgent" : ""}>
                              Expires: {job.expiresAt ? new Date(job.expiresAt).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="mj-td-actions">
                          <div className="mj-actions">
                            {job.status === "DRAFT" ? (
                              <button className="mj-action-btn success" title="Publish" onClick={() => handlePublish(job.id)}>
                                <Play size={16} />
                              </button>
                            ) : job.status === "ACTIVE" ? (
                              <button className="mj-action-btn danger" title="Close Job" onClick={() => handleClose(job.id)}>
                                <XCircle size={16} />
                              </button>
                            ) : null}

                            <button className="mj-action-btn" title="Edit">
                              <Edit2 size={16} />
                            </button>
                            <button className="mj-action-btn danger" title="Delete" onClick={() => handleDelete(job)}>
                              <Trash2 size={16} />
                            </button>
                            <button className="mj-action-btn" title="More options">
                              <MoreVertical size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}