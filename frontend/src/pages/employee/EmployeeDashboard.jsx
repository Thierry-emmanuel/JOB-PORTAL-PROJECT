import { memo, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Briefcase, Bookmark, CalendarCheck, Star,
  ArrowRight, Zap, FileText, AlertCircle,
  RefreshCw, CheckCircle2, XCircle, Clock,
  TrendingUp, Search, BarChart2, CheckCircle, X, Eye,
  Home, User, Hand
} from 'lucide-react';
import EmployeeLayout from '../../layouts/EmployeeLayout';
import InterviewCard from '../../components/interviews/InterviewCard';
import JobCard from '../../components/jobs/JobCard';
import useEmployeeDashboard from '../../hooks/useEmployeeDashboard';
import { getApplicationDisplayStatus } from '../../utils/applicationStatus';
import { resolveApplicationJobId } from '../../utils/jobEnums';
import '../../styles/dashboard-shell.css';
import '../../styles/job-list.css';

/* ─── Helpers ──────────────────────────────────────────────── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}

/* ─── Toast ────────────────────────────────────────────────── */
function Toast({ toasts, remove }) {
  if (!toasts.length) return null;
  return (
    <div style={{ position:'fixed', top:20, right:20, zIndex:9999, display:'flex', flexDirection:'column', gap:10 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display:'flex', alignItems:'flex-start', gap:10,
          background: t.type === 'error' ? '#FEF2F2' : '#ECFDF5',
          border: `1.5px solid ${t.type === 'error' ? '#FCA5A5' : '#6EE7B7'}`,
          borderRadius:12, padding:'12px 16px', boxShadow:'0 4px 20px rgba(0,0,0,0.12)',
          minWidth:280, maxWidth:380, animation:'emp-slide-in 0.3s ease',
        }}>
          {t.type === 'error'
            ? <AlertCircle size={16} color="#DC2626" style={{flexShrink:0,marginTop:1}}/>
            : <CheckCircle size={16} color="#10B981" style={{flexShrink:0,marginTop:1}}/>}
          <div style={{flex:1}}>
            <p style={{fontSize:13,fontWeight:600,color:t.type==='error'?'#991B1B':'#065F46',margin:'0 0 2px'}}>{t.title}</p>
            {t.body && <p style={{fontSize:12,color:'#6B7280',margin:0}}>{t.body}</p>}
          </div>
          <button onClick={() => remove(t.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#9CA3AF',padding:0,flexShrink:0}}><X size={14}/></button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((title, body='', type='success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, title, body, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  const remove = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);
  return { toasts, add, remove };
}

/* ─── Status config ────────────────────────────────────────── */
const STATUS_CONFIG = {
  APPLIED:             { bg:'#EFF6FF', text:'#1E40AF', dot:'#3B82F6',  label:'Applied',             Icon: FileText     },
  SHORTLISTED:         { bg:'#FAF5FF', text:'#6B21A8', dot:'#A855F7',  label:'Shortlisted',         Icon: Star         },
  INTERVIEW_SCHEDULED: { bg:'#FFF7ED', text:'#C2410C', dot:'#F97316',  label:'Interview Scheduled', Icon: CalendarCheck },
  REJECTED:            { bg:'#FEF2F2', text:'#991B1B', dot:'#EF4444',  label:'Rejected',            Icon: XCircle      },
  HIRED:               { bg:'#ECFDF5', text:'#065F46', dot:'#10B981',  label:'Hired',               Icon: CheckCircle2 },
};
const DEFAULT_STATUS = { bg:'#F9FAFB', text:'#374151', dot:'#9CA3AF', label: null, Icon: AlertCircle };

/* ─── Sub-components ───────────────────────────────────────── */
const StatusBadge = memo(({ status }) => {
  const c = STATUS_CONFIG[status] || DEFAULT_STATUS;
  return (
    <span className="ds-badge" style={{ background: c.bg, color: c.text }}>
      <span className="ds-badge-dot" style={{ background: c.dot }} />
      {c.label || status}
    </span>
  );
});
StatusBadge.propTypes = { status: PropTypes.string.isRequired };

const StatCard = memo(({ icon: Icon, value, label, sub, accent, to }) => {
  const inner = (
    <div className="ds-stat-card" role="group">
      <div className="ds-stat-icon" style={{ background:`${accent}18`, color:accent }}>
        <Icon size={20} strokeWidth={2} />
      </div>
      <div className="ds-stat-body">
        <div className="ds-stat-value">{value}</div>
        <div className="ds-stat-label">{label}</div>
        {sub && <div className="ds-stat-sub">{sub}</div>}
      </div>
      {to && <ArrowRight size={14} className="ds-stat-arrow" />}
    </div>
  );
  return to ? <Link to={to} className="ds-stat-link">{inner}</Link> : inner;
});
StatCard.propTypes = { icon: PropTypes.elementType.isRequired, value: PropTypes.any, label: PropTypes.string.isRequired, sub: PropTypes.string, accent: PropTypes.string.isRequired, to: PropTypes.string };

const Skeleton = memo(({ rows = 3, grid = false }) => (
  <div className={grid ? 'ed-skeleton-grid' : 'ed-skeleton-list'}>
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="ds-skeleton-card">
        <div className="ds-skeleton ds-skeleton-text w-50" />
        <div className="ds-skeleton ds-skeleton-text" />
        <div className="ds-skeleton ds-skeleton-text w-75" />
      </div>
    ))}
  </div>
));

const EmptyState = memo(({ icon: Icon, title, sub, cta, ctaTo }) => (
  <div className="ds-empty" role="status">
    <div className="ds-empty-icon"><Icon size={28} strokeWidth={1.5} /></div>
    <p className="ds-empty-title">{title}</p>
    {sub  && <p className="ds-empty-sub">{sub}</p>}
    {cta && ctaTo && (
      <Link to={ctaTo} className="ds-btn ds-btn-ghost ds-btn-sm">{cta} <ArrowRight size={13} /></Link>
    )}
  </div>
));

const Section = memo(({ titleId, title, badge, seeAllTo, seeAllLabel, children }) => (
  <section className="ds-card" aria-labelledby={titleId}>
    <div className="ds-card-header">
      <div className="ds-card-title">
        <h2 id={titleId} className="ds-card-title" style={{ fontSize: 15, fontWeight: 700 }}>{title}</h2>
        {badge > 0 && <span className="ds-nav-badge">{badge}</span>}
      </div>
      {seeAllTo && (
        <Link to={seeAllTo} className="ds-btn ds-btn-ghost ds-btn-sm">
          {seeAllLabel || 'View all'} <ArrowRight size={13} />
        </Link>
      )}
    </div>
    {children}
  </section>
));

/* Mini job card — now delegated to the unified JobCard (compact variant) */

const NUDGE_ITEMS = [
  { key:'profilePhoto', label:'Profile photo',        weight:15 },
  { key:'summary',      label:'Professional summary', weight:15 },
  { key:'phone',        label:'Phone number',         weight:10 },
  { key:'cvUrl',        label:'CV / Resume',          weight:20 },
  { key:'experiences',  label:'Work experience',      weight:15, arr:true },
  { key:'education',    label:'Education',            weight:10, arr:true },
  { key:'skills',       label:'3+ Skills',            weight:10, count:3 },
  { key:'languages',    label:'Languages',            weight:5,  arr:true },
];
function missingItems(profile) {
  return NUDGE_ITEMS.filter(it => {
    if (it.arr)   return !profile[it.key]?.length;
    if (it.count) return (profile[it.key]?.length || 0) < it.count;
    return !profile[it.key];
  });
}

/* ════ EmployeeDashboard ════════════════════════════════════════ */
export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const { toasts, add: addToast, remove: removeToast } = useToast();
  const {
    profile, completion, firstName,
    applications, appsLoading, appsError, retryApps,
    interviews, interLoading,
    recJobs, jobsLoading,
    handlePhotoChange, handleCancelInterview,
  } = useEmployeeDashboard();

  const missing       = missingItems(profile);
  const pendingApps   = applications.filter(a => a.status === 'APPLIED' || a.status === 'SHORTLISTED').length;
  const upcomingInter = interviews.filter(iv => iv.pending || (!iv.completed && !iv.result)).length;

  const handleCancelWithToast = async (id) => {
    try {
      await handleCancelInterview(id);
      addToast('Interview cancelled', 'The interview has been removed from your schedule.', 'success');
    } catch {
      addToast('Cancel failed', 'Could not cancel this interview. Please try again.', 'error');
    }
  };

  const handlePhotoWithToast = async (file) => {
    try {
      await handlePhotoChange(file);
      addToast('Photo updated', 'Your profile photo has been saved.', 'success');
    } catch {
      addToast('Upload failed', 'Could not upload photo. Please try again.', 'error');
    }
  };

  return (
    <EmployeeLayout profile={profile} completion={completion} onPhotoChange={handlePhotoWithToast}>
      <Toast toasts={toasts} remove={removeToast} />

      {/* ═══ HERO GREETING ══════════════════════════════════ */}
      <div className="ds-hero-sticky">
      <div className="ds-hero">
        <div className="ds-hero-text">
          <h1 className="ds-hero-title">
            {getGreeting()}, <span className="ds-hero-name">{firstName}</span> <Hand size={18} style={{display:"inline-block",verticalAlign:"middle",marginLeft:4}} />
          </h1>
          <p className="ds-hero-sub">
            {completion < 60
              ? 'Complete your profile to get noticed by top employers.'
              : completion < 100
              ? 'Your profile looks great — keep applying!'
              : "You're all set. Employers can find you!"}
          </p>
        </div>
        {completion < 100 && (
          <div className="ds-hero-progress">
            <div className="ds-hero-progress-label">
              <span>Profile</span>
              <strong>{completion}%</strong>
            </div>
            <div className="ds-sb-progress-track" role="progressbar" aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100}>
              <div className="ds-sb-progress-fill" style={{ width:`${completion}%` }} />
            </div>
          </div>
        )}
      </div>
      </div>

      {/* ═══ QUICK ACTIONS ══════════════════════════════════ */}
      <div className="ds-card">
        <div className="ds-card-header">
          <h2 className="ds-card-title" style={{ fontSize:15, fontWeight:700 }}>
            <div className="ds-card-title-icon"><TrendingUp size={15} /></div>
            Quick Actions
          </h2>
        </div>
        <div className="ds-card-body">
          <div className="ds-quick-grid">
            {[
              { icon: <Search size={20}/>,       label: 'Browse Jobs',      color: '#1A5C2E', bg: '#E8F5EE', to: '/employee/jobs'         },
              { icon: <FileText size={20}/>,     label: 'My Applications',  color: '#E07B39', bg: '#FFF3EA', to: '/employee/applications'  },
              { icon: <CalendarCheck size={20}/>, label: 'My Interviews',    color: '#3B82F6', bg: '#EFF6FF', to: '/employee/interviews'    },
              { icon: <Bookmark size={20}/>,     label: 'Saved Jobs',       color: '#F97316', bg: '#FFF3EA', to: '/employee/saved'         },
              { icon: <BarChart2 size={20}/>,    label: 'Market Insights',  color: '#8B5CF6', bg: '#F5F3FF', to: '/employee/insights'      },
              { icon: <User size={20}/>,          label: 'My Profile',       color: '#10B981', bg: '#ECFDF5', to: '/profile/job-seeker'     },
              { icon: <Home size={20}/>,          label: 'Go to Homepage',   color: '#0D9488', bg: '#CCFBF1', to: '/'                      },
            ].map(({ icon, label, color, bg, to }) => (
              <button key={label} className="ds-quick-btn" onClick={() => navigate(to)}>
                <div className="ds-quick-icon" style={{ background: bg, color }}>{icon}</div>
                <span className="ds-quick-label">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ STATS ROW ══════════════════════════════════════ */}
      <div className="ds-stats-grid" role="region" aria-label="Activity summary">
        <StatCard icon={FileText}     value={applications.length} label="Applications" sub={pendingApps > 0 ? `${pendingApps} under review` : 'None pending'} accent="#1A5C2E" to="/employee/applications" />
        <StatCard icon={Bookmark}     value={5}                   label="Saved Jobs"   sub="View your wishlist"  accent="#F97316" to="/employee/saved" />
        <StatCard icon={CalendarCheck} value={upcomingInter}      label="Interviews"   sub={upcomingInter > 0 ? 'Scheduled upcoming' : 'None yet'} accent="#3B82F6" to="/employee/interviews" />
        <StatCard icon={Star}         value={`${completion}%`}   label="Profile Score" sub={completion < 100 ? `${missing.length} items missing` : 'Complete!'} accent="#8B5CF6" to="/profile/job-seeker" />
      </div>

      {/* ═══ PROFILE NUDGE ══════════════════════════════════ */}
      {completion < 80 && (
        <div className="ds-card" style={{ background: "var(--ds-accent-light)", border: "1px solid var(--ds-accent-glow)", borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }} role="note">
          <div className="ds-nudge-left">
            <div className="ds-nudge-icon"><Zap size={17} /></div>
            <div className="ds-nudge-text">
              <strong>Boost your visibility</strong>
              <p>
                {completion < 40
                  ? "Your profile is almost empty — employers can't find you."
                  : completion < 60
                  ? 'Add experience and education to stand out.'
                  : 'Almost there! Upload your CV to get shortlisted faster.'}
              </p>
              {missing.length > 0 && (
                <div className="ds-nudge-list">
                  {missing.slice(0, 3).map(it => (
                    <span key={it.key} className="ds-nudge-item">
                      <span className="ds-badge-dot" />
                      {it.label}
                      <span className="ds-nudge-weight">+{it.weight}%</span>
                    </span>
                  ))}
                  {missing.length > 3 && <span className="ds-nudge-more">+{missing.length - 3} more</span>}
                </div>
              )}
            </div>
          </div>
          <Link to="/profile/job-seeker" className="ds-btn ds-btn-primary">Complete Profile</Link>
        </div>
      )}

      {/* ═══ RECENT APPLICATIONS ════════════════════════════ */}
      <Section titleId="apps-heading" title="Recent Applications" badge={applications.length} seeAllTo="/employee/applications" seeAllLabel="View all">
        {appsLoading && <Skeleton rows={4} />}

        {appsError && !appsLoading && (
          <div className="ds-empty" style={{ background: "#FEF2F2", borderRadius: 12, padding: "12px 16px", flexDirection: "row" }} role="alert">
            <AlertCircle size={15} />
            <span>{appsError}</span>
            <button className="ds-btn ds-btn-ghost ds-btn-sm" onClick={retryApps}><RefreshCw size={12} /> Retry</button>
          </div>
        )}

        {!appsLoading && !appsError && applications.length === 0 && (
          <EmptyState icon={Briefcase} title="No applications yet" sub="Start applying to roles that match your skills." cta="Browse jobs" ctaTo="/employee/jobs" />
        )}

        {!appsLoading && !appsError && applications.length > 0 && (
          <div className="ds-card" role="table">
            <div className="ds-table-head" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr auto" }} role="row">
              <span>Job</span><span>Status</span><span>Salary</span><span>Applied</span><span/>
            </div>
            {applications.slice(0, 5).map(app => {
              const jobLabel = app.jobTitle || (app.jobPostingId ? `Job #${app.jobPostingId}` : 'View job');
              const jobViewId = resolveApplicationJobId(app);
              const jobPath = jobViewId ? `/jobs/${jobViewId}?viewOnly=true` : null;
              return (
              <div key={app.id} className="ds-table-row" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr auto" }} role="row">
                <div className="ds-app-info" role="cell">
                  {jobPath ? (
                    <Link to={jobPath} className="ds-app-name">{jobLabel}</Link>
                  ) : (
                    <span className="ds-app-name">{jobLabel}</span>
                  )}
                </div>
                <span role="cell"><StatusBadge status={getApplicationDisplayStatus(app)} /></span>
                <span className="ds-app-job" role="cell">{app.expectedSalary ? `${Number(app.expectedSalary).toLocaleString()} XAF` : '—'}</span>
                <span className="ds-app-date" role="cell"><Clock size={10} /> {formatDate(app.appliedAt)}</span>
                {jobPath ? (
                  <Link to={jobPath} className="ds-btn ds-btn-ghost ds-btn-sm" style={{flexShrink:0}} role="cell"><Eye size={12}/></Link>
                ) : (
                  <span className="ds-btn ds-btn-ghost ds-btn-sm" style={{flexShrink:0, opacity:0.4}} role="cell"><Eye size={12}/></span>
                )}
              </div>
            );})}
          </div>
        )}
      </Section>

      {/* ═══ UPCOMING INTERVIEWS ════════════════════════════ */}
      <Section titleId="inter-heading" title="Upcoming Interviews" badge={upcomingInter} seeAllTo="/employee/interviews" seeAllLabel="View all">
        {interLoading
          ? <Skeleton rows={2} grid />
          : interviews.length === 0
          ? <EmptyState icon={CalendarCheck} title="No interviews scheduled" sub="Keep applying — invitations will appear here." cta="Browse open roles" ctaTo="/employee/jobs" />
          : (
            <div className="ds-interview-grid">
              {interviews.map(iv => (
                <InterviewCard key={iv.id} interview={iv} onCancel={handleCancelWithToast} />
              ))}
            </div>
          )
        }
      </Section>

      {/* ═══ JOBS FOR YOU ═══════════════════════════════════ */}
      <Section titleId="recjobs-heading" title="Jobs For You" seeAllTo="/employee/jobs" seeAllLabel="Browse all jobs">
        {jobsLoading
          ? <Skeleton rows={3} grid />
          : recJobs.length === 0
          ? <EmptyState icon={Briefcase} title="No recommendations yet" sub="Complete your profile to unlock personalised matches." cta="Browse jobs" ctaTo="/employee/jobs" />
          : (
            <div className="ds-mini-jobs-grid">
              {recJobs.map(job => (
                <JobCard key={job.id} job={job} variant="compact" />
              ))}
            </div>
          )
        }
      </Section>

      <style>{`@keyframes emp-slide-in { from { transform: translateX(40px); opacity: 0; } to { transform: none; opacity: 1; } }`}</style>
    </EmployeeLayout>
  );
}