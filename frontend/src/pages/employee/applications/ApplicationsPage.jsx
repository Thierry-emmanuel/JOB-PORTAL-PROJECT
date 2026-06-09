/**
 * ApplicationsPage.jsx — Employee application tracker
 * Full redesign: timeline view, status filters, job title resolution,
 * interview details inline, withdraw action.
 */
import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowUpRight, Briefcase, Building2, CalendarCheck, CalendarDays, CheckCircle2, ChevronRight, ClipboardList, Clock, DollarSign, Download, Eye, FileText, Globe, Inbox, Mail, MapPin, MessageSquare, PartyPopper, Phone, RefreshCw, Search, Star, User, Video, X, XCircle } from 'lucide-react';
import EmployeeLayout from '../../../layouts/EmployeeLayout';
import useEmployeeDashboard from '../../../hooks/useEmployeeDashboard';
import { useAuth } from '../../../context/AuthContext';
import { getUserApplications, getJobDetail } from '../../../api/jobs';
import '../../../styles/employee-dashboard.css';
import '../../../styles/applications.css';
import { getApplicationDisplayStatus } from '../../../utils/applicationStatus';
import DashboardPagination from '../../../components/shared/DashboardPagination';

const APPS_PAGE_SIZE = 10;

/* ─── Status config ──────────────────────────────────────── */
const STATUS = {
  APPLIED:             { bg:'#EFF6FF', color:'#1E40AF', dot:'#3B82F6', label:'Applied',            icon:<FileText size={12}/> },
  SHORTLISTED:         { bg:'#FAF5FF', color:'#6B21A8', dot:'#A855F7', label:'Shortlisted',        icon:<Star size={12}/> },
  INTERVIEW_SCHEDULED: { bg:'#FFF7ED', color:'#C2410C', dot:'#F97316', label:'Interview Scheduled', icon:<CalendarCheck size={12}/> },
  HIRED:               { bg:'#ECFDF5', color:'#065F46', dot:'#10B981', label:'Hired', icon:<CheckCircle2 size={12}/> },
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
  const [page,        setPage]        = useState(1);

  const load = useCallback(() => {
    if (!user?.id) return;
    setLoading(true); setError(null);
    getUserApplications(user.id)
      .then(async (res) => {
        const appsList = Array.isArray(res) ? res : res?.content || [];
        const enriched = await Promise.all(
          appsList.map(async (app) => {
            // FIX: only call /detail when we have a valid UUID jobListingId.
            // jobPostingId is a numeric Long from the job_postings table and is
            // NOT a valid path parameter for GET /api/jobs/{uuid}/detail.
            // For legacy applications where jobListingId was not yet recorded,
            // we skip the fetch and fall back to whatever title the backend
            // already embedded in the application response.
            if (!app.jobListingId) {
              return app;
            }
            try {
              const jobDetail = await getJobDetail(app.jobListingId);
              return {
                ...app,
                jobTitle: jobDetail.title,
                companyName: jobDetail.company,
              };
            } catch (err) {
              console.warn(`Could not fetch details for job listing ${app.jobListingId}`, err);
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
    acc[t] = t === 'ALL'
      ? apps.length
      : apps.filter(a => getApplicationDisplayStatus(a) === t).length;
    return acc;
  }, {});

  const visible = apps.filter(a => {
    const matchTab = filter === 'ALL' || getApplicationDisplayStatus(a) === filter;
    const matchSearch = !search.trim() || (a.jobTitle || `Job #${a.jobPostingId}`).toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(visible.length / APPS_PAGE_SIZE));
  const paginated = visible.slice((page - 1) * APPS_PAGE_SIZE, page * APPS_PAGE_SIZE);

  useEffect(() => { setPage(1); }, [filter, search]);

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
          {paginated.map(app => {
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
                      <StatusBadge status={getApplicationDisplayStatus(app)}/>
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
                        type={iv.type ?? iv.interviewType}
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
                      <PartyPopper size={16} style={{display:"inline-block",verticalAlign:"middle"}} /> Congratulations! You were hired for this position.
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="apps-card-actions">
                  <button
                    className="apps-action-btn apps-action-btn--primary"
                    onClick={() => navigate(`/applications/${app.id}`)}
                  >
                    <ClipboardList size={12}/> View Application
                  </button>
                  {/* FIX: only link to the job detail page when a valid UUID is available.
                      Navigating to /jobs/1073741824?viewOnly=true would also 404. */}
                  {app.jobListingId ? (
                    <Link to={`/jobs/${app.jobListingId}?viewOnly=true`} className="apps-action-btn">
                      <Eye size={12}/> View Job
                    </Link>
                  ) : (
                    <span className="apps-action-btn apps-action-btn--disabled" title="Job listing no longer available">
                      <Eye size={12}/> View Job
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && !error && visible.length > 0 && (
        <DashboardPagination
          page={page}
          totalPages={totalPages}
          total={visible.length}
          pageSize={APPS_PAGE_SIZE}
          onChange={setPage}
        />
      )}
    </EmployeeLayout>
  );
}