import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useEmployerDashboard } from "../../hooks/useEmployerDashboard";
import {
  Search, Plus, Filter, MoreVertical,
  CheckCircle, Clock, Users, Eye, XCircle, Trash2, Edit2, Play, Calendar as CalendarIcon, Briefcase
} from "lucide-react";
import EmployerSidebar from "../../components/employer/EmployerSidebar";
import KoraNav from "../../components/KoraNav";
import "../../styles/employer-dashboard.css";
import "../../styles/employee-dashboard.css";
import "../../styles/profile.css";

// ── Status Badge ──
function StatusBadge({ status }) {
  const map = {
    ACTIVE:  { bg: "#F0FDF4", color: "#16A34A", icon: <CheckCircle size={12} /> },
    DRAFT:   { bg: "#F3F4F6", color: "#4B5563", icon: <Edit2 size={12} /> },
    EXPIRED: { bg: "#FFFBEB", color: "#D97706", icon: <Clock size={12} /> },
    DELETED: { bg: "#FEF2F2", color: "#DC2626", icon: <XCircle size={12} /> },
  };
  const cfg = map[status] || map.DRAFT;
  return (
    <span className="mj-status-badge" style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.icon}
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
      <div className="ed-root">
        <KoraNav />
        <div className="ed-body">
          <aside className="ed-sidebar kora-sidebar">
             <EmployerSidebar employer={employer} loading={loading} stats={stats} />
          </aside>
          <main className="ed-main">
            <div className="kora-empty-state">
              <p>Failed to load jobs: {error}</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="ed-root">
      <KoraNav />

      {deleteTarget && (
        <>
          <div className="mj-modal-overlay" onClick={() => setDeleteTarget(null)} />
          <div className="mj-modal">
            <div className="mj-modal-icon"><Trash2 size={24} /></div>
            <h3>Delete Job Posting</h3>
            <p>
              Are you sure you want to delete <strong>{deleteTarget.title}</strong>? 
              This action cannot be undone and will remove all associated applications.
            </p>
            <div className="mj-modal-actions">
              <button className="mj-btn-cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="mj-btn-danger" onClick={confirmDelete}>Delete Job</button>
            </div>
          </div>
        </>
      )}

      <div className="ed-body">
        {/* ════════ SIDEBAR ════════ */}
        <aside className="ed-sidebar kora-sidebar">
          <EmployerSidebar employer={employer} loading={loading} stats={stats} />
        </aside>

        {/* ════════ MAIN CONTENT ════════ */}
        <main className="ed-main">
          
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

          <div className="mj-tabs">
            {["ALL", "ACTIVE", "DRAFT", "EXPIRED", "DELETED"].map((tab) => (
              <button
                key={tab}
                className={`mj-tab ${activeTab === tab ? "active" : ""}`}
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
            <div className="mj-search-box">
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
              <div className="mj-table-wrapper">
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
                          <div className="mj-td-role">
                            <strong>{job.title}</strong>
                            <div className="mj-td-meta">
                              <span>{job.type}</span>
                              <span className="mj-dot">•</span>
                              <span>{job.location}</span>
                            </div>
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
                          <div className="mj-action-buttons">
                            {job.status === "DRAFT" ? (
                              <button className="mj-btn-icon publish" title="Publish" onClick={() => handlePublish(job.id)}>
                                <Play size={16} />
                              </button>
                            ) : job.status === "ACTIVE" ? (
                              <button className="mj-btn-icon warning" title="Close Job" onClick={() => handleClose(job.id)}>
                                <XCircle size={16} />
                              </button>
                            ) : null}
                            
                            <button className="mj-btn-icon edit" title="Edit">
                              <Edit2 size={16} />
                            </button>
                            <button className="mj-btn-icon danger" title="Delete" onClick={() => handleDelete(job)}>
                              <Trash2 size={16} />
                            </button>
                            <button className="mj-btn-icon options" title="More options">
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