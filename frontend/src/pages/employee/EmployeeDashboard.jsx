/**
 * EmployeeDashboard.jsx  (v4 — uniformity fix)
 * ─────────────────────────────────────────────────────────────
 * Purely presentational. All data via useEmployeeDashboard hook.
 * Layout via EmployeeLayout shell.
 *
 * Fix: STATUS_CONFIG keys now use the real backend enum values
 *      (APPLIED, SHORTLISTED, REJECTED, HIRED) so badge colours
 *      actually render instead of always falling back to grey.
 *      pendingApps count updated to match.
 *      app.jobTitle → jobPostingId label (ApplicationResponse has
 *      no jobTitle or company fields; those are on the JobListing
 *      which is fetched separately when needed).
 * ─────────────────────────────────────────────────────────────
 */
import { memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Briefcase, Bookmark, CalendarCheck, Star,
  ArrowRight, Zap, FileText, AlertCircle,
  RefreshCw, CheckCircle2, XCircle, Clock,
} from 'lucide-react';
import EmployeeLayout from '../../layouts/EmployeeLayout';
import InterviewCard from '../../components/interviews/InterviewCard';
import JobCard from '../../components/jobs/JobCard';
import useEmployeeDashboard from '../../hooks/useEmployeeDashboard';
import '../../styles/dashboard-shell.css';
import '../../styles/job-list.css';

/* ─────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────────
   Status config — keys match the real ApplicationStatus enum
   values returned by the backend (uppercase).
   ───────────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  APPLIED:     { bg:'#EFF6FF', text:'#1E40AF', dot:'#3B82F6',  label:'Applied',     Icon: FileText     },
  SHORTLISTED: { bg:'#FAF5FF', text:'#6B21A8', dot:'#A855F7',  label:'Shortlisted', Icon: Star         },
  REJECTED:    { bg:'#FEF2F2', text:'#991B1B', dot:'#EF4444',  label:'Rejected',    Icon: XCircle      },
  HIRED:       { bg:'#ECFDF5', text:'#065F46', dot:'#10B981',  label:'Hired',       Icon: CheckCircle2 },
};
const DEFAULT_STATUS = { bg:'#F9FAFB', text:'#374151', dot:'#9CA3AF', label: null, Icon: AlertCircle };

/* ─────────────────────────────────────────────────────────
   Sub-components
   ───────────────────────────────────────────────────────── */

/* Status badge */
const StatusBadge = memo(({ status }) => {
  const c = STATUS_CONFIG[status] || DEFAULT_STATUS;
  const displayLabel = c.label || status;
  return (
    <span className="ds-badge" style={{ background: c.bg, color: c.text }} aria-label={`Status: ${displayLabel}`}>
      <span className="ds-badge-dot" style={{ background: c.dot }} aria-hidden="true" />
      {displayLabel}
    </span>
  );
});
StatusBadge.propTypes = { status: PropTypes.string.isRequired };

/* Stat card */
const StatCard = memo(({ icon: Icon, value, label, sub, accent, to }) => {
  const inner = (
    <div className="ds-stat-card" role="group" aria-label={`${label}: ${value}`}>
      <div className="ds-stat-icon" style={{ background:`${accent}18`, color:accent }} aria-hidden="true">
        <Icon size={20} strokeWidth={2} />
      </div>
      <div className="ds-stat-body">
        <div className="ds-stat-value">{value}</div>
        <div className="ds-stat-label">{label}</div>
        {sub && <div className="ds-stat-sub">{sub}</div>}
      </div>
      {to && <ArrowRight size={14} className="ds-stat-arrow" aria-hidden="true" />}
    </div>
  );
  return to
    ? <Link to={to} className="ds-stat-link">{inner}</Link>
    : inner;
});
StatCard.propTypes = {
  icon:   PropTypes.elementType.isRequired,
  value:  PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  label:  PropTypes.string.isRequired,
  sub:    PropTypes.string,
  accent: PropTypes.string.isRequired,
  to:     PropTypes.string,
};

/* Skeleton */
const Skeleton = memo(({ rows = 3, grid = false }) => (
  <div className={grid ? 'ed-skeleton-grid' : 'ed-skeleton-list'} aria-busy="true" aria-label="Loading…">
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="ds-skeleton-card">
        <div className="ds-skeleton ds-skeleton-text w-50" />
        <div className="ds-skeleton ds-skeleton-text" />
        <div className="ds-skeleton ds-skeleton-text w-75" />
      </div>
    ))}
  </div>
));
Skeleton.propTypes = { rows: PropTypes.number, grid: PropTypes.bool };

/* Empty state */
const EmptyState = memo(({ icon: Icon, title, sub, cta, ctaTo }) => (
  <div className="ds-empty" role="status">
    <div className="ds-empty-icon" aria-hidden="true"><Icon size={28} strokeWidth={1.5} /></div>
    <p className="ds-empty-title">{title}</p>
    {sub  && <p className="ds-empty-sub">{sub}</p>}
    {cta && ctaTo && (
      <Link to={ctaTo} className="ds-btn ds-btn-ghost ds-btn-sm">{cta} <ArrowRight size={13} /></Link>
    )}
  </div>
));
EmptyState.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  sub: PropTypes.string,
  cta: PropTypes.string,
  ctaTo: PropTypes.string,
};

/* Section wrapper */
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
Section.propTypes = {
  titleId:    PropTypes.string.isRequired,
  title:      PropTypes.string.isRequired,
  badge:      PropTypes.number,
  seeAllTo:   PropTypes.string,
  seeAllLabel: PropTypes.string,
  children:   PropTypes.node.isRequired,
};

/* Mini job card — now delegated to the unified JobCard (compact variant) */

/* Profile completion nudge items */
const NUDGE_ITEMS = [
  { key:'profilePhoto', label:'Profile photo',      weight:15 },
  { key:'summary',      label:'Professional summary', weight:15 },
  { key:'phone',        label:'Phone number',        weight:10 },
  { key:'cvUrl',        label:'CV / Resume',         weight:20 },
  { key:'experiences',  label:'Work experience',     weight:15, arr:true },
  { key:'education',    label:'Education',           weight:10, arr:true },
  { key:'skills',       label:'3+ Skills',           weight:10, count:3 },
  { key:'languages',    label:'Languages',           weight:5,  arr:true },
];
function missingItems(profile) {
  return NUDGE_ITEMS.filter(it => {
    if (it.arr)   return !profile[it.key]?.length;
    if (it.count) return (profile[it.key]?.length || 0) < it.count;
    return !profile[it.key];
  });
}

/* ════════════════════════════════════════════════════════════
   EmployeeDashboard
   ════════════════════════════════════════════════════════════ */
export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const {
    profile, completion, firstName,
    applications, appsLoading, appsError, retryApps,
    interviews, interLoading,
    recJobs, jobsLoading,
    handlePhotoChange, handleCancelInterview,
  } = useEmployeeDashboard();

  const missing      = missingItems(profile);
  // Count applications pending review: APPLIED + SHORTLISTED (backend enum values)
  const pendingApps  = applications.filter(a => a.status === 'APPLIED' || a.status === 'SHORTLISTED').length;
  const upcomingInter = interviews.filter(iv => iv.pending || (!iv.completed && !iv.result)).length;

  return (
    <EmployeeLayout profile={profile} completion={completion} onPhotoChange={handlePhotoChange}>

      {/* ═══ HERO GREETING ══════════════════════════════════ */}
      <div className="ds-hero">
        <div className="ds-hero-text">
          <h1 className="ds-hero-title">
            {getGreeting()}, <span className="ds-hero-name">{firstName}</span> 👋
          </h1>
          <p className="ds-hero-sub">
            {completion < 60
              ? 'Complete your profile to get noticed by top employers.'
              : completion < 100
              ? 'Your profile looks great — keep applying!'
              : 'You\'re all set. Employers can find you!'}
          </p>
        </div>
        {completion < 100 && (
          <div className="ds-hero-progress">
            <div className="ds-hero-progress-label">
              <span>Profile</span>
              <strong>{completion}%</strong>
            </div>
            <div className="ds-sb-progress-track"
              role="progressbar"
              aria-valuenow={completion}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Profile ${completion}% complete`}
            >
              <div className="ds-sb-progress-fill" style={{ width:`${completion}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* ═══ STATS ROW ══════════════════════════════════════ */}
      <div className="ds-stats-grid" role="region" aria-label="Activity summary">
        <StatCard
          icon={FileText}
          value={applications.length}
          label="Applications"
          sub={pendingApps > 0 ? `${pendingApps} under review` : 'None pending'}
          accent="#1A5C2E"
          to="/employee/applications"
        />
        <StatCard
          icon={Bookmark}
          value={5}
          label="Saved Jobs"
          sub="View your wishlist"
          accent="#F97316"
          to="/employee/saved"
        />
        <StatCard
          icon={CalendarCheck}
          value={upcomingInter}
          label="Interviews"
          sub={upcomingInter > 0 ? 'Scheduled upcoming' : 'None yet'}
          accent="#3B82F6"
          to="/employee/interviews"
        />
        <StatCard
          icon={Star}
          value={`${completion}%`}
          label="Profile Score"
          sub={completion < 100 ? `${missing.length} items missing` : '✓ Complete!'}
          accent="#8B5CF6"
          to="/profile/job-seeker"
        />
      </div>

      {/* ═══ PROFILE NUDGE ══════════════════════════════════ */}
      {completion < 80 && (
        <div className="ds-card" style={{ background: "var(--ds-accent-light)", border: "1px solid var(--ds-accent-glow)", borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }} role="note">
          <div className="ds-nudge-left">
            <div className="ds-nudge-icon" aria-hidden="true">
              <Zap size={17} />
            </div>
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
                      <span className="ds-badge-dot" aria-hidden="true" />
                      {it.label}
                      <span className="ds-nudge-weight">+{it.weight}%</span>
                    </span>
                  ))}
                  {missing.length > 3 && (
                    <span className="ds-nudge-more">+{missing.length - 3} more</span>
                  )}
                </div>
              )}
            </div>
          </div>
          <Link to="/profile/job-seeker" className="ds-btn ds-btn-primary">
            Complete Profile
          </Link>
        </div>
      )}

      {/* ═══ RECENT APPLICATIONS ════════════════════════════ */}
      <Section
        titleId="apps-heading"
        title="Recent Applications"
        badge={applications.length}
        seeAllTo="/employee/applications"
        seeAllLabel="View all"
      >
        {appsLoading && <Skeleton rows={4} />}

        {appsError && !appsLoading && (
          <div className="ds-empty" style={{ background: "#FEF2F2", borderRadius: 12, padding: "12px 16px", flexDirection: "row" }} role="alert">
            <AlertCircle size={15} aria-hidden="true" />
            <span>{appsError}</span>
            <button className="ds-btn ds-btn-ghost ds-btn-sm" onClick={retryApps}>
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {!appsLoading && !appsError && applications.length === 0 && (
          <EmptyState
            icon={Briefcase}
            title="No applications yet"
            sub="Start applying to roles that match your skills and ambitions."
            cta="Find your first job"
            ctaTo="/jobs"
          />
        )}

        {!appsLoading && !appsError && applications.length > 0 && (
          <div className="ds-card" role="table" aria-label="Recent applications">
            <div className="ds-table-head" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr" }} role="row">
              <span role="columnheader">Job ID</span>
              <span role="columnheader">Status</span>
              <span role="columnheader">Expected Salary</span>
              <span role="columnheader">Applied</span>
            </div>
            {applications.slice(0, 5).map(app => (
              <div key={app.id} className="ds-table-row" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr" }} role="row">
                <div className="ds-app-info" role="cell">
                  <Link to={`/jobs/${app.jobPostingId}`} className="ds-app-name">
                    Job #{app.jobPostingId}
                  </Link>
                </div>
                <span role="cell"><StatusBadge status={app.status} /></span>
                <span className="ds-app-job" role="cell">
                  {app.expectedSalary ? `${Number(app.expectedSalary).toLocaleString()} XAF` : '—'}
                </span>
                <span className="ds-app-date" role="cell">
                  <Clock size={10} aria-hidden="true" /> {formatDate(app.appliedAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ═══ UPCOMING INTERVIEWS ════════════════════════════ */}
      <Section
        titleId="inter-heading"
        title="Upcoming Interviews"
        badge={upcomingInter}
      >
        {interLoading
          ? <Skeleton rows={2} grid />
          : interviews.length === 0
          ? <EmptyState
              icon={CalendarCheck}
              title="No interviews scheduled"
              sub="Keep applying — interview invitations will appear here."
              cta="Browse open roles"
              ctaTo="/jobs"
            />
          : (
            <div className="ds-interview-grid">
              {interviews.map(iv => (
                <InterviewCard key={iv.id} interview={iv} onCancel={handleCancelInterview} />
              ))}
            </div>
          )
        }
      </Section>

      {/* ═══ JOBS FOR YOU ═══════════════════════════════════ */}
      <Section
        titleId="recjobs-heading"
        title="Jobs For You"
        seeAllTo="/jobs"
        seeAllLabel="See all jobs"
      >
        {jobsLoading
          ? <Skeleton rows={3} grid />
          : recJobs.length === 0
          ? <EmptyState
              icon={Briefcase}
              title="No recommendations yet"
              sub="Complete your profile to unlock personalised job matches."
              cta="Complete profile"
              ctaTo="/profile/job-seeker"
            />
          : (
            <div className="ds-mini-jobs-grid">
              {recJobs.slice(0, 3).map(job => (
                <JobCard key={job.id} job={job} variant="compact" />
              ))}
            </div>
          )
        }
      </Section>

    </EmployeeLayout>
  );
}