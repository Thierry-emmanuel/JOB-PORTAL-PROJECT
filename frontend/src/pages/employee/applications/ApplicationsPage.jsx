/**
 * ApplicationsPage.jsx — Employee application tracker
 * Full redesign: timeline view, status filters, job title resolution,
 * interview details inline, withdraw action.
 */
import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase, Clock, ChevronRight, AlertCircle, RefreshCw, Eye,
  CheckCircle2, XCircle, Star, FileText, Video, Phone, MapPin,
  CalendarCheck, ArrowUpRight, Inbox, Search, X, ClipboardList,
  DollarSign, User, Building2, CalendarDays, MessageSquare,
  Mail, Download, Globe
} from 'lucide-react';
import EmployeeLayout from '../../../layouts/EmployeeLayout';
import useEmployeeDashboard from '../../../hooks/useEmployeeDashboard';
import { useAuth } from '../../../context/AuthContext';
import { getUserApplications, getJobDetail } from '../../../api/jobs';
import '../../../styles/employee-dashboard.css';
import '../../../styles/applications.css';

/* ─── Status config ──────────────────────────────────────── */
const STATUS = {
  APPLIED:             { bg:'#EFF6FF', color:'#1E40AF', dot:'#3B82F6', label:'Applied',            icon:<FileText size={12}/> },
  SHORTLISTED:         { bg:'#FAF5FF', color:'#6B21A8', dot:'#A855F7', label:'Shortlisted',        icon:<Star size={12}/> },
  INTERVIEW_SCHEDULED: { bg:'#FFF7ED', color:'#C2410C', dot:'#F97316', label:'Interview Scheduled', icon:<CalendarCheck size={12}/> },
  HIRED:               { bg:'#ECFDF5', color:'#065F46', dot:'#10B981', label:'Hired 🎉',           icon:<CheckCircle2 size={12}/> },
  REJECTED:            { bg:'#FEF2F2', color:'#991B1B', dot:'#EF4444', label:'Not Selected',       icon:<XCircle size={12}/> },
};
const DEFAULT_STATUS = { bg:'#F3F4F6', color:'#374151', dot:'#9CA3AF', label:'Pending', icon:<Clock size={12}/> };

function StatusBadge({ status }) {
  const s = STATUS[status] || DEFAULT_STATUS;
  return (
    <span className="apps-badge" style={{ background:s.bg, color:s.color }}>
      <span className="apps-badge-dot" style={{ background:s.dot }}/>
      {s.label}
    </span>
  );
}

const fmtDate = d => !d ? '—' : new Date(d).toLocaleDateString('fr-CM', { day:'2-digit', month:'short', year:'numeric' });
const fmtTime = d => !d ? '' : new Date(d).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });

/* Interview type display */
function InterviewChip({ type, link, scheduledAt }) {
  const map = {
    VIDEO:     { icon:<Video size={11}/>,  color:'#1d4ed8', bg:'#eff6ff', label:'Video' },
    PHONE:     { icon:<Phone size={11}/>,  color:'#065f46', bg:'#ecfdf5', label:'Phone' },
    IN_PERSON: { icon:<MapPin size={11}/>, color:'#92400e', bg:'#fffbeb', label:'On-site' },
  };
  const t = map[type] || map.VIDEO;
  return (
    <div className="apps-iv-row">
      <span className="apps-iv-chip" style={{ background:t.bg, color:t.color }}>
        {t.icon} {t.label}
      </span>
      {scheduledAt && (
        <span className="apps-iv-time">
          <CalendarCheck size={10}/>
          {fmtDate(scheduledAt)} · {fmtTime(scheduledAt)}
        </span>
      )}
      {link && type === 'VIDEO' && (
        <a href={link} target="_blank" rel="noreferrer" className="apps-iv-join">
          Join <ArrowUpRight size={10}/>
        </a>
      )}
    </div>
  );
}

const TABS = ['ALL','APPLIED','SHORTLISTED','INTERVIEW_SCHEDULED','HIRED','REJECTED'];
const TAB_LABELS = {
  ALL:'All', APPLIED:'Applied', SHORTLISTED:'Shortlisted',
  INTERVIEW_SCHEDULED:'Interview', HIRED:'Hired', REJECTED:'Rejected',
};

/* ─── Application Detail Modal ───────────────────────────── */
function ApplicationDetailModal({ app, profile, onClose }) {
  if (!app) return null;
  const s       = STATUS[app.status] || DEFAULT_STATUS;
  const iv      = app.interview;
  const jobLabel = app.jobTitle || `Job #${app.jobPostingId}`;

  // Close on backdrop click
  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  /* ── Interview type icon map ── */
  const ivMap = {
    VIDEO:     { icon: <Video size={13}/>,  color: '#1d4ed8', bg: '#eff6ff', label: 'Video Call'   },
    PHONE:     { icon: <Phone size={13}/>,  color: '#065f46', bg: '#ecfdf5', label: 'Phone Call'   },
    IN_PERSON: { icon: <MapPin size={13}/>, color: '#92400e', bg: '#fffbeb', label: 'On-site'      },
  };
  const ivType = iv ? (ivMap[iv.type] || ivMap.VIDEO) : null;

  return (
    <div className="appd-backdrop" onClick={handleBackdrop}>
      <div className="appd-modal appd-modal--wide" role="dialog" aria-modal="true" aria-label="Application Details">

        {/* Header */}
        <div className="appd-header" style={{ borderTop: `4px solid ${s.dot}` }}>
          <div className="appd-header-left">
            <div className="appd-header-icon" style={{ background: s.bg, color: s.color }}>
              <FileText size={20}/>
            </div>
            <div>
              <h2 className="appd-title">{jobLabel}</h2>
              {app.companyName && <p className="appd-company"><Building2 size={12}/> {app.companyName}</p>}
            </div>
          </div>
          <button className="appd-close" onClick={onClose} aria-label="Close">
            <X size={18}/>
          </button>
        </div>

        {/* Status strip */}
        <div className="appd-status-strip" style={{ background: s.bg }}>
          <span className="appd-status-badge" style={{ background: s.dot, color: '#fff' }}>
            {s.icon} {s.label}
          </span>
          {app.appliedAt && (
            <span className="appd-status-meta">
              <CalendarDays size={11}/> Applied {fmtDate(app.appliedAt)}
            </span>
          )}
          {app.lastUpdatedAt && app.lastUpdatedAt !== app.appliedAt && (
            <span className="appd-status-meta">
              <Clock size={11}/> Updated {fmtDate(app.lastUpdatedAt)}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="appd-body">
          <div className="appd-grid">

            {/* Left Column - Application Info */}
            <div className="appd-col-left">
              {/* Expected Salary */}
              {app.expectedSalary && (
                <div className="appd-section">
                  <p className="appd-section-label"><DollarSign size={13}/> Expected Salary</p>
                  <p className="appd-section-value appd-salary">
                    {Number(app.expectedSalary).toLocaleString()} XAF
                  </p>
                </div>
              )}

              {/* Cover Letter */}
              <div className="appd-section">
                <p className="appd-section-label"><MessageSquare size={13}/> Cover Letter</p>
                {app.coverLetter ? (
                  <div className="appd-cover-letter">{app.coverLetter}</div>
                ) : (
                  <p className="appd-empty-field">No cover letter was provided.</p>
                )}
              </div>

              {/* Recruiter Review Notes */}
              {app.employerReview && (
                <div className="appd-section">
                  <p className="appd-section-label"><ClipboardList size={13}/> Recruiter Evaluation Notes</p>
                  <div className="appd-review-card">
                    <p className="appd-review-title">Employer Notes</p>
                    <p className="appd-review-text">{app.employerReview}</p>
                  </div>
                </div>
              )}

              {/* Interview info */}
              {iv && (
                <div className="appd-section">
                  <p className="appd-section-label"><CalendarCheck size={13}/> Interview Details</p>
                  <div className="appd-iv-card" style={{ borderLeft: `3px solid ${ivType?.color}` }}>
                    <div className="appd-iv-type" style={{ background: ivType?.bg, color: ivType?.color }}>
                      {ivType?.icon} {ivType?.label}
                    </div>
                    {iv.scheduledAt && (
                      <div className="appd-iv-row">
                        <CalendarDays size={12}/>
                        <span>{fmtDate(iv.scheduledAt)} at {fmtTime(iv.scheduledAt)}</span>
                      </div>
                    )}
                    {iv.platform && (
                      <div className="appd-iv-row">
                        <Building2 size={12}/>
                        <span>{iv.platform}</span>
                      </div>
                    )}
                    {iv.meetingLink && (
                      <a href={iv.meetingLink} target="_blank" rel="noreferrer" className="appd-iv-join">
                        <Video size={12}/> Join Meeting <ArrowUpRight size={11}/>
                      </a>
                    )}
                    {iv.feedback && (
                      <div className="appd-iv-feedback">
                        <p className="appd-iv-feedback-label">Feedback</p>
                        <p>{iv.feedback}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Hired message */}
              {app.status === 'HIRED' && (
                <div className="appd-hired-banner">
                  🎉 Congratulations! You were hired for this position.
                </div>
              )}

              {/* Rejected message */}
              {app.status === 'REJECTED' && (
                <div className="appd-rejected-banner">
                  Thank you for applying. Unfortunately, this application was not selected to move forward.
                </div>
              )}
            </div>

            {/* Right Column - Seeker Profile & CV */}
            <div className="appd-col-right">
              {/* Seeker Info Card */}
              <div className="appd-section">
                <p className="appd-section-label"><User size={13}/> Seeker Profile</p>
                <div className="appd-profile-card">
                  <div className="appd-profile-header">
                    <div className="appd-profile-avatar">
                      {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : (profile?.email ? profile.email.charAt(0).toUpperCase() : '?')}
                    </div>
                    <div>
                      <h4 className="appd-profile-name">{profile?.fullName || 'Candidate'}</h4>
                      <p className="appd-profile-title">Job Seeker</p>
                    </div>
                  </div>
                  <div className="appd-profile-info">
                    {profile?.email && (
                      <div className="appd-info-item">
                        <Mail size={13}/>
                        <span>{profile.email}</span>
                      </div>
                    )}
                    {profile?.phone && (
                      <div className="appd-info-item">
                        <Phone size={13}/>
                        <span>{profile.phone}</span>
                      </div>
                    )}
                    {profile?.city && (
                      <div className="appd-info-item">
                        <MapPin size={13}/>
                        <span>{profile.city}{profile.region ? `, ${profile.region}` : ''}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Resume / CV Section */}
              {profile?.cvUrl && (
                <div className="appd-section">
                  <p className="appd-section-label"><FileText size={13}/> Submitted Resume</p>
                  <div className="appd-cv-card">
                    <div className="appd-cv-info">
                      <FileText size={20} className="appd-cv-icon"/>
                      <span className="appd-cv-name">{profile.cvFileName || 'resume.pdf'}</span>
                    </div>
                    <a href={profile.cvUrl} target="_blank" rel="noreferrer" className="appd-cv-btn">
                      <Download size={12}/> View / Download
                    </a>
                  </div>
                </div>
              )}

              {/* Bio Summary */}
              {profile?.summary && (
                <div className="appd-section">
                  <p className="appd-section-label"><Briefcase size={13}/> Profile Summary</p>
                  <p className="appd-section-value" style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.6', background: '#f9fafb', padding: '12px', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                    {profile.summary}
                  </p>
                </div>
              )}

              {/* Professional links */}
              {(profile?.linkedInUrl || profile?.portfolioUrl) && (
                <div className="appd-section">
                  <p className="appd-section-label"><Globe size={13}/> Professional Links</p>
                  <div className="appd-links-row">
                    {profile.linkedInUrl && (
                      <a href={profile.linkedInUrl} target="_blank" rel="noreferrer" className="appd-link-badge appd-link-badge--linkedin">
                        LinkedIn <ArrowUpRight size={11}/>
                      </a>
                    )}
                    {profile.portfolioUrl && (
                      <a href={profile.portfolioUrl} target="_blank" rel="noreferrer" className="appd-link-badge">
                        Portfolio / Website <ArrowUpRight size={11}/>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Footer actions */}
        <div className="appd-footer">
          <Link
            to={`/jobs/${app.jobPostingId}?viewOnly=true`}
            className="appd-btn-primary"
            onClick={onClose}
          >
            <Eye size={13}/> View Job Posting
          </Link>
          <button className="appd-btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
export default function ApplicationsPage() {
  const { user }   = useAuth();
  const { profile, completion, handlePhotoChange } = useEmployeeDashboard();
  const navigate   = useNavigate();

  const [apps,        setApps]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [filter,      setFilter]      = useState('ALL');
  const [search,      setSearch]      = useState('');
  const [selectedApp, setSelectedApp] = useState(null);

  const load = useCallback(() => {
    if (!user?.id) return;
    setLoading(true); setError(null);
    getUserApplications(user.id)
      .then(async (res) => {
        const appsList = Array.isArray(res) ? res : res?.content || [];
        const enriched = await Promise.all(
          appsList.map(async (app) => {
            try {
              const jobDetail = await getJobDetail(app.jobPostingId);
              return {
                ...app,
                jobTitle: jobDetail.title,
                companyName: jobDetail.company,
              };
            } catch (err) {
              console.warn(`Could not fetch details for job ${app.jobPostingId}`, err);
              return app;
            }
          })
        );
        setApps(enriched);
      })
      .catch(() => setError('Could not load your applications. Please retry.'))
      .finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  /* Derived */
  const counts = TABS.reduce((acc, t) => {
    acc[t] = t === 'ALL' ? apps.length : apps.filter(a=>a.status===t).length;
    return acc;
  }, {});

  const visible = apps.filter(a => {
    const matchTab = filter === 'ALL' || a.status === filter;
    const matchSearch = !search.trim() || (a.jobTitle || `Job #${a.jobPostingId}`).toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <EmployeeLayout profile={profile} completion={completion} onPhotoChange={handlePhotoChange}>

      {/* Page header */}
      <div className="ds-page-header">
        <div>
          <h1 className="ds-page-title">My Applications</h1>
          <p className="ds-page-sub">{apps.length} total · {counts.HIRED} hired · {counts.SHORTLISTED} shortlisted</p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <button className="ds-btn ds-btn-ghost" onClick={load}>
            <RefreshCw size={13}/> Refresh
          </button>
          <Link to="/jobs" className="ds-btn ds-btn-primary">
            <Briefcase size={13}/> Browse Jobs
          </Link>
        </div>
      </div>

      {/* Filter + search bar */}
      <div className="apps-filter-bar">
        <div className="apps-tabs">
          {TABS.map(t => (
            <button
              key={t}
              className={`apps-tab${filter===t?' active':''}`}
              onClick={()=>setFilter(t)}
            >
              {TAB_LABELS[t]}
              {counts[t] > 0 && <span className="apps-tab-count">{counts[t]}</span>}
            </button>
          ))}
        </div>
        <div className="apps-search">
          <Search size={13}/>
          <input
            value={search}
            onChange={e=>setSearch(e.target.value)}
            placeholder="Search by job title…"
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="apps-loading">
          <div className="apps-spinner"/><span>Loading applications…</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="apps-error">
          <AlertCircle size={18}/>
          <p>{error}</p>
          <button className="ds-btn ds-btn-ghost ds-btn-sm" onClick={load}>
            <RefreshCw size={12}/> Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && visible.length === 0 && (
        <div className="apps-empty">
          <div className="apps-empty-icon"><Inbox size={36}/></div>
          <h3>No applications {filter !== 'ALL' ? `with status "${TAB_LABELS[filter]}"` : 'yet'}</h3>
          <p>Start applying to jobs that match your profile and skills.</p>
          <Link to="/jobs" className="ds-btn ds-btn-primary" style={{ marginTop:4 }}>
            Find Jobs <ChevronRight size={13}/>
          </Link>
        </div>
      )}

      {/* Application cards */}
      {!loading && !error && visible.length > 0 && (
        <div className="apps-list">
          {visible.map(app => {
            const jobLabel = app.jobTitle || `Job #${app.jobPostingId}`;
            const iv = app.interview; // embedded if backend returns it
            const isGood = app.status === 'HIRED' || app.status === 'SHORTLISTED';
            const isBad  = app.status === 'REJECTED';
            return (
              <div
                key={app.id}
                className={`apps-card${isGood?' apps-card--good':isBad?' apps-card--bad':''}`}
              >
                {/* Left accent line */}
                <div className="apps-card-accent" style={{
                  background: (STATUS[app.status]||DEFAULT_STATUS).dot
                }}/>

                {/* Body */}
                <div className="apps-card-body">
                  <div className="apps-card-top">
                    <div className="apps-card-info">
                      <h3 className="apps-card-title">{jobLabel}</h3>
                      {app.companyName && (
                        <p className="apps-card-company">{app.companyName}</p>
                      )}
                      {app.appliedAt && (
                        <p className="apps-card-date">
                          <Clock size={10}/> Applied {fmtDate(app.appliedAt)}
                        </p>
                      )}
                    </div>
                    <div className="apps-card-right">
                      <StatusBadge status={app.status}/>
                      {app.expectedSalary && (
                        <span className="apps-card-salary">
                          {Number(app.expectedSalary).toLocaleString()} XAF
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Interview details if scheduled */}
                  {iv && (
                    <div className="apps-iv-section">
                      <InterviewChip
                        type={iv.type}
                        link={iv.meetingLink}
                        scheduledAt={iv.scheduledAt}
                      />
                      {iv.platform && (
                        <span className="apps-iv-platform">{iv.platform}</span>
                      )}
                    </div>
                  )}

                  {/* Hired congratulation */}
                  {app.status === 'HIRED' && (
                    <div className="apps-hired-banner">
                      🎉 Congratulations! You were hired for this position.
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="apps-card-actions">
                  <button
                    className="apps-action-btn apps-action-btn--primary"
                    onClick={() => setSelectedApp(app)}
                  >
                    <ClipboardList size={12}/> View Application
                  </button>
                  <Link to={`/jobs/${app.jobPostingId}?viewOnly=true`} className="apps-action-btn">
                    <Eye size={12}/> View Job
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Application Detail Modal */}
      {selectedApp && (
        <ApplicationDetailModal
          app={selectedApp}
          profile={profile}
          onClose={() => setSelectedApp(null)}
        />
      )}
    </EmployeeLayout>
  );
}