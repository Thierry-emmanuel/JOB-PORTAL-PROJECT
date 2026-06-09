/**
 * ManageJobs.jsx — Employer job & applicant management
 *
 * Features:
 * • Job listings with stats (views, applications, days left)
 * • Per-job applicant drawer with full candidate profile
 * • Accept (→ SHORTLISTED), Reject, Hire immediately
 * • Schedule interview (opens InterviewScheduler modal)
 * • Status tabs, search, sort
 */
import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase, Users, Eye, Clock, Plus, Search,
  ChevronDown, MoreVertical, CheckCircle2, XCircle,
  CalendarClock, Award, Trash2, Pause, Play,
  ArrowRight, FileText, Phone, MapPin, Mail,
  Banknote, ExternalLink, X, AlertCircle,
  RefreshCw, Filter, SortDesc, TrendingUp,
  UserCheck, UserX, Star, ArrowDown, Video, ArrowUpRight, Menu,
} from 'lucide-react';
import EmployerSidebar from '../../components/employer/EmployerSidebar';
import InterviewScheduler from '../../components/employer/InterviewScheduler';
import { useEmployerDashboard } from '../../hooks/useEmployerDashboard';
import { useAuth } from '../../context/AuthContext';
import { scheduleInterview, addInterviewFeedback } from '../../api/interviews';
import '../../styles/dashboard-shell.css';
import '../../styles/ManageJobs.css';

/* ─── Constants ─────────────────────────────────────────── */
const JOB_STATUS_TABS = [
  { key: 'ALL',     label: 'All Jobs'  },
  { key: 'ACTIVE',  label: 'Active'    },
  { key: 'DRAFT',   label: 'Draft'     },
  { key: 'EXPIRED', label: 'Expired'   },
];

const APP_STATUS_TABS = [
  { key: 'ALL',          label: 'All'          },
  { key: 'APPLIED',      label: 'Applied'      },
  { key: 'SHORTLISTED',  label: 'Shortlisted'  },
  { key: 'HIRED',        label: 'Hired'        },
  { key: 'REJECTED',     label: 'Rejected'     },
];

const STATUS_STYLE = {
  APPLIED:              { bg: '#EFF6FF', color: '#1E40AF', dot: '#3B82F6' },
  SHORTLISTED:          { bg: '#FAF5FF', color: '#6B21A8', dot: '#A855F7' },
  INTERVIEW_SCHEDULED:  { bg: '#FFF7ED', color: '#C2410C', dot: '#F97316' },
  HIRED:                { bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
  REJECTED:             { bg: '#FEF2F2', color: '#991B1B', dot: '#EF4444' },
};

const JOB_STATUS_STYLE = {
  ACTIVE:  { bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
  DRAFT:   { bg: '#F9FAFB', color: '#374151', dot: '#9CA3AF' },
  EXPIRED: { bg: '#FEF2F2', color: '#991B1B', dot: '#EF4444' },
};

/* ─── Helpers ────────────────────────────────────────────── */
const fmtDate = d => !d ? '—' : new Date(d).toLocaleDateString('fr-CM', { day:'2-digit', month:'short', year:'numeric' });
const fmtSalary = v => v ? `${Number(v).toLocaleString()} XAF` : '—';

function StatusBadge({ status, map = STATUS_STYLE }) {
  const s = map[status] || { bg:'#F3F4F6', color:'#374151', dot:'#9CA3AF' };
  return (
    <span className="mj-badge" style={{ background: s.bg, color: s.color }}>
      <span className="mj-badge-dot" style={{ background: s.dot }}/>
      {status?.replace(/_/g,' ')}
    </span>
  );
}

function Avatar({ name, size = 36, color = '#1A5C2E' }) {
  const initials = (name||'?').split(' ').slice(0,2).map(w=>w[0]?.toUpperCase()||'').join('');
  return (
    <div className="mj-avatar" style={{ width:size, height:size, fontSize:size*0.36, background:`${color}18`, color }}>
      {initials}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function ManageJobs() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    employer, stats, applications, jobPostings,
    loading, error, refreshing,
    refresh,
    updateApplicationStatus, updateJobPostingStatus, deleteJobPosting,
    updateApplicationReview,
  } = useEmployerDashboard();

  /* ── UI state ─────────────────────────────────────────── */
  const [jobTab,    setJobTab]    = useState('ALL');
  const [jobSearch, setJobSearch] = useState('');
  const [appTab,    setAppTab]    = useState('ALL');
  const [appSearch, setAppSearch] = useState('');
  const [selectedJob,  setSelectedJob]  = useState(null); // job whose applications we're viewing
  const [expandedJob,  setExpandedJob]  = useState(null); // accordion on mobile
  const [toast, setToast]               = useState(null);
  const [scheduling, setScheduling] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── Derived data ─────────────────────────────────────── */
  const filteredJobs = useMemo(() => {
    let list = jobTab === 'ALL'
      ? jobPostings
      : jobPostings.filter(j => j.status === jobTab);
    if (jobSearch.trim()) {
      const q = jobSearch.toLowerCase();
      list = list.filter(j =>
        j.title.toLowerCase().includes(q) || j.location?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [jobPostings, jobTab, jobSearch]);

  const jobApps = useMemo(() => {
    if (!selectedJob) return [];
    // applications.jobPostingId is a numeric Long; job.numericId is the same numeric identifier.
    // job.id is a UUID string — do NOT compare against that.
    return applications.filter(a =>
      String(a.jobPostingId) === String(selectedJob.numericId ?? selectedJob.id)
    );
  }, [applications, selectedJob]);

  const filteredApps = useMemo(() => {
    let list = appTab === 'ALL' ? jobApps : jobApps.filter(a => a.status === appTab);
    if (appSearch.trim()) {
      const q = appSearch.toLowerCase();
      list = list.filter(a => a.applicant?.toLowerCase().includes(q));
    }
    return list;
  }, [jobApps, appTab, appSearch]);

  /* KPI counts */
  const kpi = useMemo(() => ({
    total:        jobPostings.length,
    active:       jobPostings.filter(j=>j.status==='ACTIVE').length,
    apps:         applications.length,
    shortlisted:  applications.filter(a=>a.status==='SHORTLISTED').length,
    hired:        applications.filter(a=>a.status==='HIRED').length,
  }), [jobPostings, applications]);

  /* ── Handlers ─────────────────────────────────────────── */
  const handleStatusChange = useCallback(async (appId, newStatus) => {
    await updateApplicationStatus(appId, newStatus);
    showToast(`Applicant ${newStatus.toLowerCase()}.`);
  }, [updateApplicationStatus]);

  const handleScheduled = useCallback((iv) => {
    showToast('Interview scheduled successfully!');
  }, []);

  const handleJobStatusToggle = useCallback(async (job) => {
    const next = job.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';
    await updateJobPostingStatus(job.id, next);
    showToast(`Job ${next === 'ACTIVE' ? 'activated' : 'paused'}.`);
  }, [updateJobPostingStatus]);

  const handleDeleteJob = useCallback(async (jobId) => {
    if (!window.confirm('Delete this job listing? This cannot be undone.')) return;
    await deleteJobPosting(jobId);
    if (selectedJob?.id === jobId) setSelectedJob(null);
    showToast('Job deleted.');
  }, [deleteJobPosting, selectedJob]);

  /* ── Loading / error ──────────────────────────────────── */
  if (loading) return (
    <div className="ds-root employer">
      <div className="ds-body">
        <aside className="ds-sidebar"><EmployerSidebar employer={employer} loading stats={stats}/></aside>
        <main className="ds-main">
          <div className="mj-loading"><div className="mj-spinner"/><span>Loading jobs…</span></div>
        </main>
      </div>
    </div>
  );

  /* ── Render ───────────────────────────────────────────── */
  return (
    <div className="ds-root employer">
      {/* Mobile */}
      {mobileOpen && <div className="ds-mobile-overlay" onClick={() => setMobileOpen(false)} />}

      <div className="ds-body">
        <aside className={`ds-sidebar${mobileOpen ? ' ds-sidebar--mobile-open' : ''}`}>
          <button className="ds-mobile-close" onClick={() => setMobileOpen(false)}><X size={16} /></button>
          <EmployerSidebar employer={employer} loading={false} stats={stats}/>
        </aside>

        <main className="ds-main">
          {/* Toast */}
          {toast && (
            <div className={`mj-toast${toast.type === 'error' ? ' error' : ''}`}>
              {toast.type === 'success' ? <CheckCircle2 size={14}/> : <AlertCircle size={14}/>}
              {toast.msg}
            </div>
          )}

          {/* FAB trigger (mobile) */}
          <button className="ds-mobile-trigger" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>

          {/* Top bar */}
          <div className="mj-topbar">
            <div className="mj-topbar-left">
              <h1>Manage Jobs</h1>
              <p>{kpi.total} listings · {kpi.apps} applications</p>
            </div>
            <div className="mj-topbar-actions">
              <button className="mj-btn-ghost" onClick={refresh} disabled={refreshing}>
                <RefreshCw size={13} className={refreshing ? 'mj-spin' : ''}/>
                Refresh
              </button>
              <button className="mj-btn-primary" onClick={() => navigate('/employer/post-job')}>
                <Plus size={14}/> Post Job
              </button>
            </div>
          </div>

          {/* KPI strip */}
          <div className="mj-stats-row">
            {[
              { label:'Active Jobs',    val: kpi.active,       icon: <Briefcase size={16}/>, color:'#1A5C2E', bg:'#ecfdf5' },
              { label:'Total Apps',     val: kpi.apps,         icon: <Users size={16}/>,     color:'#1d4ed8', bg:'#eff6ff' },
              { label:'Shortlisted',    val: kpi.shortlisted,  icon: <Star size={16}/>,      color:'#7c3aed', bg:'#faf5ff' },
              { label:'Hired',          val: kpi.hired,        icon: <Award size={16}/>,     color:'#065f46', bg:'#d1fae5' },
            ].map(s => (
              <div key={s.label} className="mj-stat-chip">
                <div className="mj-stat-chip-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                <div>
                  <div className="mj-stat-chip-val">{s.val}</div>
                  <div className="mj-stat-chip-lbl">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Main two-col layout */}
          <div className="mj-main-layout">

            {/* ── LEFT: job listings ── */}
            <div className="mj-jobs-col">
              <div className="mj-col-head">
                <h2>Job Listings</h2>
                <div className="mj-search-box">
                  <Search size={13}/>
                  <input
                    value={jobSearch}
                    onChange={e => setJobSearch(e.target.value)}
                    placeholder="Search jobs…"
                  />
                </div>
              </div>

              {/* Status tabs */}
              <div className="mj-tab-filters">
                {JOB_STATUS_TABS.map(t => (
                  <button
                    key={t.key}
                    className={`mj-tab${jobTab === t.key ? ' active' : ''}`}
                    onClick={() => setJobTab(t.key)}
                  >
                    {t.label}
                    <span className="mj-tab-count">
                      {t.key === 'ALL' ? jobPostings.length : jobPostings.filter(j=>j.status===t.key).length}
                    </span>
                  </button>
                ))}
              </div>

              {/* Job cards */}
              {filteredJobs.length === 0 ? (
                <div className="mj-empty">
                  <Briefcase size={28}/>
                  <p>No jobs found</p>
                  <button className="mj-btn-primary" onClick={() => navigate('/employer/post-job')}>
                    <Plus size={13}/> Post your first job
                  </button>
                </div>
              ) : (
                <div className="mj-job-list">
                  {filteredJobs.map(job => {
                    const appCount = applications.filter(a => String(a.jobPostingId) === String(job.numericId ?? job.id)).length;
                    const isSelected = selectedJob?.id === job.id;
                    return (
                      <div
                        key={job.id}
                        className={`mj-job-card${isSelected ? ' selected' : ''}`}
                        onClick={() => { setSelectedJob(job); setAppTab('ALL'); setAppSearch(''); }}
                      >
                        <div className="mj-job-card-top">
                          <div className="mj-job-card-info">
                            <div className="mj-job-card-title-row">
                              <h3 className="mj-job-card-title">{job.title}</h3>
                              <StatusBadge status={job.status} map={JOB_STATUS_STYLE}/>
                            </div>
                            <div className="mj-job-card-meta">
                              <span><MapPin size={11}/>{job.location}</span>
                              <span><Briefcase size={11}/>{job.type}</span>
                              {job.deadline && <span><Clock size={11}/>Closes {fmtDate(job.deadline)}</span>}
                            </div>
                          </div>
                          <div className="mj-job-card-stats">
                            <div className="mj-job-stat">
                              <span className="mj-job-stat-val">{appCount}</span>
                              <span className="mj-job-stat-lbl">Apps</span>
                            </div>
                            <div className="mj-job-stat">
                              <span className="mj-job-stat-val">{job.views || 0}</span>
                              <span className="mj-job-stat-lbl">Views</span>
                            </div>
                            {job.daysLeft != null && (
                              <div className="mj-job-stat" style={{ color: job.daysLeft < 3 ? '#dc2626' : undefined }}>
                                <span className="mj-job-stat-val">{job.daysLeft}d</span>
                                <span className="mj-job-stat-lbl">Left</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quick actions row */}
                        <div className="mj-job-card-actions" onClick={e => e.stopPropagation()}>
                          <button
                            className="mj-job-action-btn"
                            onClick={() => handleJobStatusToggle(job)}
                            title={job.status === 'ACTIVE' ? 'Pause job' : 'Activate job'}
                          >
                            {job.status === 'ACTIVE' ? <Pause size={12}/> : <Play size={12}/>}
                            {job.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                          </button>
                          <Link
                            to={`/employer/post-job?edit=${job.id}`}
                            className="mj-job-action-btn"
                          >
                            Edit
                          </Link>
                          <button
                            className="mj-job-action-btn danger"
                            onClick={() => handleDeleteJob(job.id)}
                          >
                            <Trash2 size={12}/> Delete
                          </button>
                          <button
                            className="mj-job-action-btn primary"
                            onClick={() => { setSelectedJob(job); setAppTab('ALL'); }}
                          >
                            <Users size={12}/> {appCount} Applicants <ArrowRight size={11}/>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── RIGHT: applicants panel ── */}
            <div className="mj-apps-col">
              {!selectedJob ? (
                <div className="mj-apps-placeholder">
                  <Users size={32}/>
                  <h3>Select a job to view applicants</h3>
                  <p>Click any job on the left to see its applicant list.</p>
                </div>
              ) : (
                <>
                  <div className="mj-col-head">
                    <div>
                      <h2>{selectedJob.title}</h2>
                      <p className="mj-col-sub">{jobApps.length} applicants</p>
                    </div>
                    <div className="mj-search-box">
                      <Search size={13}/>
                      <input
                        value={appSearch}
                        onChange={e => setAppSearch(e.target.value)}
                        placeholder="Search by name…"
                      />
                    </div>
                  </div>

                  {/* App status tabs */}
                  <div className="mj-tab-filters">
                    {APP_STATUS_TABS.map(t => (
                      <button
                        key={t.key}
                        className={`mj-tab${appTab === t.key ? ' active' : ''}`}
                        onClick={() => setAppTab(t.key)}
                      >
                        {t.label}
                        <span className="mj-tab-count">
                          {t.key === 'ALL' ? jobApps.length : jobApps.filter(a=>a.status===t.key).length}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Applicant rows */}
                  {filteredApps.length === 0 ? (
                    <div className="mj-empty">
                      <Users size={24}/>
                      <p>No applicants {appTab !== 'ALL' ? `with status "${appTab}"` : 'yet'}</p>
                    </div>
                  ) : (
                    <div className="mj-app-list">
                      {filteredApps.map(app => (
                        <div
                          key={app.id}
                          className="mj-app-row"
                          onClick={() => navigate(`/applications/${app.id}`)}
                        >
                          <Avatar name={app.applicant} />
                          <div className="mj-app-row-info">
                            <span className="mj-app-row-name">{app.applicant}</span>
                            <span className="mj-app-row-date">{fmtDate(app.date)}</span>
                          </div>
                          {app.expectedSalary && (
                            <span className="mj-app-row-salary">{fmtSalary(app.expectedSalary)}</span>
                          )}
                          <StatusBadge status={app.status}/>
                          <ArrowRight size={14} className="mj-app-row-arrow"/>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>

    </div>
  );
}