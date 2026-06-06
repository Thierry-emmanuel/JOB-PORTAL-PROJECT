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
  UserCheck, UserX, Star, ArrowDown, Video, ArrowUpRight,
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

/* ─── Applicant drawer ───────────────────────────────────── */
function ApplicantDrawer({ app, onClose, onUpdateStatus, onSchedule, updateApplicationReview }) {
  const [scheduling, setScheduling] = useState(false);
  const [acting, setActing]         = useState(null);
  const [reviewNotes, setReviewNotes] = useState(app?.employerReview || '');
  const [savingReview, setSavingReview] = useState(false);
  const [ivFeedback, setIvFeedback] = useState(app?.interview?.feedback || '');
  const [savingIvFeedback, setSavingIvFeedback] = useState(false);

  useEffect(() => {
    setReviewNotes(app?.employerReview || '');
    setIvFeedback(app?.interview?.feedback || '');
  }, [app]);

  if (!app) return null;

  const handleAction = async (newStatus) => {
    setActing(newStatus);
    try { await onUpdateStatus(app.id, newStatus); }
    finally { setActing(null); }
  };

  return (
    <>
      <div className="mj-drawer-overlay" onClick={onClose} />
      <div className="mj-drawer" role="dialog" aria-label="Applicant Profile">
        {/* Header */}
        <div className="mj-drawer-head">
          <div className="mj-drawer-head-left">
            <Avatar name={app.applicant} size={44} />
            <div>
              <h3 className="mj-drawer-name">{app.applicant}</h3>
              <p className="mj-drawer-job">{app.job}</p>
            </div>
          </div>
          <button className="mj-drawer-close" onClick={onClose}><X size={16}/></button>
        </div>

        {/* Status bar */}
        <div className="mj-drawer-status-bar">
          <StatusBadge status={app.status} />
          <span className="mj-drawer-date">Applied {fmtDate(app.date)}</span>
        </div>

        {/* Body */}
        <div className="mj-drawer-body">

          {/* Contact info */}
          <section className="mj-drawer-section">
            <h4 className="mj-drawer-section-title">Contact</h4>
            <div className="mj-drawer-info-grid">
              {app.email && (
                <div className="mj-drawer-info-row">
                  <Mail size={13} className="mj-drawer-info-icon"/>
                  <a href={`mailto:${app.email}`} className="mj-drawer-link">{app.email}</a>
                </div>
              )}
              {app.phone && (
                <div className="mj-drawer-info-row">
                  <Phone size={13} className="mj-drawer-info-icon"/>
                  <span>{app.phone}</span>
                </div>
              )}
              {app.city && (
                <div className="mj-drawer-info-row">
                  <MapPin size={13} className="mj-drawer-info-icon"/>
                  <span>{app.city}</span>
                </div>
              )}
              {app.linkedInUrl && (
                <div className="mj-drawer-info-row">
                  <ExternalLink size={13} className="mj-drawer-info-icon"/>
                  <a href={app.linkedInUrl} target="_blank" rel="noreferrer" className="mj-drawer-link">LinkedIn</a>
                </div>
              )}
              {app.portfolioUrl && (
                <div className="mj-drawer-info-row">
                  <ExternalLink size={13} className="mj-drawer-info-icon"/>
                  <a href={app.portfolioUrl} target="_blank" rel="noreferrer" className="mj-drawer-link">Portfolio</a>
                </div>
              )}
              {app.expectedSalary && (
                <div className="mj-drawer-info-row">
                  <Banknote size={13} className="mj-drawer-info-icon"/>
                  <span>Expects: <strong>{fmtSalary(app.expectedSalary)}</strong></span>
                </div>
              )}
            </div>
          </section>

          {/* Professional summary */}
          {app.profileSummary && (
            <section className="mj-drawer-section">
              <h4 className="mj-drawer-section-title">Summary</h4>
              <p className="mj-drawer-summary">{app.profileSummary}</p>
            </section>
          )}

          {/* Skills */}
          {app.skills?.length > 0 && (
            <section className="mj-drawer-section">
              <h4 className="mj-drawer-section-title">Skills</h4>
              <div className="mj-drawer-chips">
                {app.skills.map((s,i) => (
                  <span key={i} className="mj-chip">{typeof s === 'object' ? s.name : s}</span>
                ))}
              </div>
            </section>
          )}

          {/* Experience */}
          {app.experiences?.length > 0 && (
            <section className="mj-drawer-section">
              <h4 className="mj-drawer-section-title">Experience</h4>
              {app.experiences.map((exp, i) => (
                <div key={i} className="mj-drawer-exp-item">
                  <div className="mj-drawer-exp-title">{exp.jobTitle || exp.position}</div>
                  <div className="mj-drawer-exp-company">{exp.companyName || exp.company}</div>
                  {(exp.startDate || exp.endDate) && (
                    <div className="mj-drawer-exp-date">
                      {exp.startDate} — {exp.endDate || 'Present'}
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* Education */}
          {app.education?.length > 0 && (
            <section className="mj-drawer-section">
              <h4 className="mj-drawer-section-title">Education</h4>
              {app.education.map((edu, i) => (
                <div key={i} className="mj-drawer-exp-item">
                  <div className="mj-drawer-exp-title">{edu.degree || edu.fieldOfStudy}</div>
                  <div className="mj-drawer-exp-company">{edu.school || edu.institution}</div>
                  {(edu.startDate || edu.endDate) && (
                    <div className="mj-drawer-exp-date">
                      {edu.startDate} — {edu.endDate || 'Present'}
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* Cover letter */}
          {app.coverLetter && (
            <section className="mj-drawer-section">
              <h4 className="mj-drawer-section-title">Cover Letter</h4>
              <div className="mj-drawer-cover">{app.coverLetter}</div>
            </section>
          )}

          {/* CV link */}
          {app.cvUrl && (
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <a href={app.cvUrl} target="_blank" rel="noreferrer" className="mj-cv-link" style={{ flex: 1, margin: 0, textAlign: 'center' }}>
                <FileText size={14}/> View Resume <ExternalLink size={12}/>
              </a>
              <a
                href={app.cvUrl.includes('cloudinary.com') ? app.cvUrl.replace('/upload/', '/upload/fl_attachment/') : app.cvUrl}
                download={app.cvFileName || 'resume.pdf'}
                className="mj-cv-link"
                style={{ flex: 1, margin: 0, textAlign: 'center', background: '#E8F5EE', color: '#1A5C2E', border: '1.5px solid #1A5C2E' }}
              >
                <ArrowDown size={14}/> Download CV
              </a>
            </div>
          )}

          {/* Interview Details */}
          {app.interview && (
            <section className="mj-drawer-section" style={{ borderTop: '1px solid #F3F4F6', paddingTop: 16, marginTop: 16 }}>
              <h4 className="mj-drawer-section-title">Interview Details</h4>
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#1d4ed8', background: '#eff6ff', padding: '3px 8px', borderRadius: 20 }}>
                    {app.interview.type} Interview
                  </span>
                  <span style={{ fontSize: 11.5, color: '#6B7280' }}>
                    {fmtDate(app.interview.scheduledAt)} · {new Date(app.interview.scheduledAt).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })}
                  </span>
                </div>
                {app.interview.platform && (
                  <div style={{ fontSize: 13, color: '#374151' }}>
                    <strong>Platform:</strong> {app.interview.platform}
                  </div>
                )}
                {app.interview.meetingLink && (
                  <a href={app.interview.meetingLink} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#1D4ED8', fontWeight: 600, fontSize: 12.5, textDecoration: 'none' }}>
                    <Video size={13}/> Join Interview Link <ArrowUpRight size={11}/>
                  </a>
                )}
                
                {/* Interview Feedback Text Area */}
                <div style={{ marginTop: 8, borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#9CA3AF', display: 'block', marginBottom: 4 }}>
                    Interview Evaluation Feedback
                  </label>
                  <textarea
                    style={{ width: '100%', minHeight: 60, border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '6px 10px', fontSize: 12.5, fontFamily: 'inherit', resize: 'vertical' }}
                    placeholder="Enter post-interview feedback or notes..."
                    value={ivFeedback}
                    onChange={e => setIvFeedback(e.target.value)}
                  />
                  <button
                    disabled={savingIvFeedback}
                    onClick={async () => {
                      setSavingIvFeedback(true);
                      try {
                        await addInterviewFeedback(app.interview.id, ivFeedback);
                        app.interview.feedback = ivFeedback;
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setSavingIvFeedback(false);
                      }
                    }}
                    style={{ marginTop: 6, background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                  >
                    {savingIvFeedback ? 'Saving...' : 'Save Feedback'}
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Recruiter review notes */}
          <section className="mj-drawer-section" style={{ borderTop: '1px solid #F3F4F6', paddingTop: 16, marginTop: 16 }}>
            <h4 className="mj-drawer-section-title">Recruiter Review Notes</h4>
            <textarea
              style={{ width: '100%', minHeight: 80, border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }}
              placeholder="Add notes, evaluations or summary reviews about this candidate..."
              value={reviewNotes}
              onChange={e => setReviewNotes(e.target.value)}
            />
            <button
              disabled={savingReview}
              onClick={async () => {
                setSavingReview(true);
                try {
                  await updateApplicationReview(app.id, reviewNotes);
                  app.employerReview = reviewNotes;
                } catch (err) {
                  console.error(err);
                } finally {
                  setSavingReview(false);
                }
              }}
              style={{ marginTop: 8, background: '#1A5C2E', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              {savingReview ? 'Saving...' : 'Save Notes'}
            </button>
          </section>
        </div>

        {/* Actions footer */}
        <div className="mj-drawer-footer">
          {app.status === 'APPLIED' && (
            <>
              <button
                className="mj-action-btn mj-action-btn--accept"
                onClick={() => handleAction('SHORTLISTED')}
                disabled={!!acting}
              >
                {acting === 'SHORTLISTED'
                  ? <><span className="mj-btn-spin"/> Accepting…</>
                  : <><UserCheck size={14}/> Accept & Shortlist</>}
              </button>
              <button
                className="mj-action-btn mj-action-btn--reject"
                onClick={() => handleAction('REJECTED')}
                disabled={!!acting}
              >
                {acting === 'REJECTED'
                  ? <><span className="mj-btn-spin"/> Rejecting…</>
                  : <><UserX size={14}/> Reject</>}
              </button>
            </>
          )}

          {app.status === 'SHORTLISTED' && (
            <>
              <button
                className="mj-action-btn mj-action-btn--hire"
                onClick={() => handleAction('HIRED')}
                disabled={!!acting}
              >
                {acting === 'HIRED'
                  ? <><span className="mj-btn-spin"/> Hiring…</>
                  : <><Award size={14}/> Hire Immediately</>}
              </button>
              <button
                className="mj-action-btn mj-action-btn--schedule"
                onClick={() => setScheduling(true)}
                disabled={!!acting}
              >
                <CalendarClock size={14}/> Schedule Interview
              </button>
              <button
                className="mj-action-btn mj-action-btn--reject"
                onClick={() => handleAction('REJECTED')}
                disabled={!!acting}
              >
                <UserX size={14}/> Reject
              </button>
            </>
          )}

          {app.status === 'INTERVIEW_SCHEDULED' && (
            <>
              <button
                className="mj-action-btn mj-action-btn--hire"
                onClick={() => handleAction('HIRED')}
                disabled={!!acting}
              >
                {acting === 'HIRED'
                  ? <><span className="mj-btn-spin"/> Hiring…</>
                  : <><Award size={14}/> Hire Candidate</>}
              </button>
              <button
                className="mj-action-btn mj-action-btn--schedule"
                onClick={() => setScheduling(true)}
                disabled={!!acting}
              >
                <CalendarClock size={14}/> Reschedule Interview
              </button>
              <button
                className="mj-action-btn mj-action-btn--reject"
                onClick={() => handleAction('REJECTED')}
                disabled={!!acting}
              >
                <UserX size={14}/> Reject
              </button>
            </>
          )}

          {(app.status === 'HIRED' || app.status === 'REJECTED') && (
            <div className="mj-drawer-terminal">
              <CheckCircle2 size={14} style={{ color: app.status === 'HIRED' ? '#16a34a' : '#dc2626' }}/>
              Application {app.status === 'HIRED' ? 'marked as Hired' : 'Rejected'}
            </div>
          )}
        </div>

        {/* Interview scheduler modal */}
        {scheduling && (
          <InterviewScheduler
            application={app}
            onClose={() => setScheduling(false)}
            onScheduled={(iv) => {
              setScheduling(false);
              onSchedule?.(iv);
            }}
          />
        )}
      </div>
    </>
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
  const [selectedApp,  setSelectedApp]  = useState(null); // applicant drawer
  const [expandedJob,  setExpandedJob]  = useState(null); // accordion on mobile
  const [toast, setToast]               = useState(null);
  const [scheduling, setScheduling] = useState(null);

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
    return applications.filter(a => String(a.jobPostingId) === String(selectedJob.id));
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
    // Refresh drawer data
    setSelectedApp(prev => prev?.id === appId ? { ...prev, status: newStatus } : prev);
  }, [updateApplicationStatus]);

  const handleScheduled = useCallback((iv) => {
    showToast('Interview scheduled successfully!');
    setSelectedApp(null);
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
      <div className="ds-body">
        <aside className="ds-sidebar">
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
                    const appCount = applications.filter(a => String(a.jobPostingId) === String(job.id)).length;
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
                          onClick={() => setSelectedApp(app)}
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

      {/* Applicant drawer */}
      <ApplicantDrawer
        app={selectedApp}
        onClose={() => setSelectedApp(null)}
        onUpdateStatus={handleStatusChange}
        onSchedule={(app) => setScheduling(app)}
        updateApplicationReview={updateApplicationReview}
      />
    </div>
  );
}