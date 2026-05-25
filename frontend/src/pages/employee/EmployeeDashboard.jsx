/**
 * EmployeeDashboard.jsx  (v4 — inline Jobs Browser)
 * ─────────────────────────────────────────────────────────────
 * When the user clicks "Browse Jobs" the dashboard does NOT
 * navigate to /jobs. Instead it switches to an inline
 * JobsBrowserPanel that fetches all jobs from the DB and lets
 * the user search/filter/paginate — all within the same layout.
 * ─────────────────────────────────────────────────────────────
 */
import { memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Briefcase, Bookmark, CalendarCheck, Star,
  ArrowRight, MapPin, Zap, FileText, AlertCircle,
  RefreshCw, CheckCircle2, XCircle, Eye, Clock,
} from 'lucide-react';
import EmployeeLayout from '../../layouts/EmployeeLayout';
import JobsBrowserPanel from '../../components/employee/JobsBrowserPanel';
import InterviewCard from '../../components/interviews/InterviewCard';
import useEmployeeDashboard from '../../hooks/useEmployeeDashboard';
import { useTranslation } from 'react-i18next';
import '../../styles/employee-dashboard.css';
import '../../styles/jobs-browser-panel.css';

/* ─── Helpers ───────────────────────────────────────────── */
function getGreeting(t) {
  const h = new Date().getHours();
  if (h < 12) return t('dashboard.welcome') + ' (morning)';
  if (h < 17) return t('dashboard.welcome') + ' (afternoon)';
  return t('dashboard.welcome') + ' (evening)';
}
function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

/* ─── Status badge ──────────────────────────────────────── */
const STATUS_CONFIG = {
  'Under Review':        { bg: '#FFF7ED', text: '#C2410C', dot: '#F97316' },
  'Interview Scheduled': { bg: '#F0FDF4', text: '#166534', dot: '#22C55E' },
  Rejected:              { bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444' },
  Hired:                 { bg: '#ECFDF5', text: '#065F46', dot: '#10B981' },
  Applied:               { bg: '#EFF6FF', text: '#1E40AF', dot: '#3B82F6' },
  Shortlisted:           { bg: '#FAF5FF', text: '#6B21A8', dot: '#A855F7' },
};
const DEFAULT_STATUS = { bg: '#F9FAFB', text: '#374151', dot: '#9CA3AF' };

const StatusBadge = memo(({ status }) => {
  const c = STATUS_CONFIG[status] || DEFAULT_STATUS;
  return (
    <span className="ed-badge" style={{ background: c.bg, color: c.text }}>
      <span className="ed-badge-dot" style={{ background: c.dot }} aria-hidden="true" />
      {status}
    </span>
  );
});
StatusBadge.propTypes = { status: PropTypes.string.isRequired };

/* ─── Stat card ─────────────────────────────────────────── */
const StatCard = memo(({ icon: Icon, value, label, sub, accent, onClick, to }) => {
  const inner = (
    <div className="ed-stat-card" role="group" aria-label={`${label}: ${value}`}>
      <div className="ed-stat-icon" style={{ background: `${accent}18`, color: accent }} aria-hidden="true">
        <Icon size={20} strokeWidth={2} />
      </div>
      <div className="ed-stat-body">
        <div className="ed-stat-value">{value}</div>
        <div className="ed-stat-label">{label}</div>
        {sub && <div className="ed-stat-sub">{sub}</div>}
      </div>
      <ArrowRight size={14} className="ed-stat-arrow" aria-hidden="true" />
    </div>
  );

  if (onClick) {
    return (
      <button className="ed-stat-link" onClick={onClick} type="button">
        {inner}
      </button>
    );
  }
  return to
    ? <Link to={to} className="ed-stat-link">{inner}</Link>
    : inner;
});
StatCard.propTypes = {
  icon:    PropTypes.elementType.isRequired,
  value:   PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  label:   PropTypes.string.isRequired,
  sub:     PropTypes.string,
  accent:  PropTypes.string.isRequired,
  onClick: PropTypes.func,
  to:      PropTypes.string,
};

/* ─── Skeleton ──────────────────────────────────────────── */
const Skeleton = memo(({ rows = 3, grid = false }) => (
  <div className={grid ? 'ed-skeleton-grid' : 'ed-skeleton-list'} aria-busy="true">
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="ed-skeleton-card">
        <div className="ed-skeleton-line ed-sk-short" />
        <div className="ed-skeleton-line" />
        <div className="ed-skeleton-line ed-sk-medium" />
      </div>
    ))}
  </div>
));

Skeleton.propTypes = {
  rows: PropTypes.number,
  grid: PropTypes.bool,
};

/* ─── Empty state ───────────────────────────────────────── */
const EmptyState = memo(({ icon: Icon, title, sub, cta, ctaTo, ctaOnClick }) => (
  <div className="ed-empty" role="status">
    <div className="ed-empty-icon" aria-hidden="true"><Icon size={28} strokeWidth={1.5} /></div>
    <p className="ed-empty-title">{title}</p>
    {sub && <p className="ed-empty-sub">{sub}</p>}
    {cta && ctaOnClick && (
      <button className="ed-empty-cta" onClick={ctaOnClick}>{cta} <ArrowRight size={13} /></button>
    )}
    {cta && ctaTo && !ctaOnClick && (
      <Link to={ctaTo} className="ed-empty-cta">{cta} <ArrowRight size={13} /></Link>
    )}
  </div>
));

EmptyState.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  sub: PropTypes.string,
  cta: PropTypes.string,
  ctaTo: PropTypes.string,
  ctaOnClick: PropTypes.func,
};

/* ─── Section ───────────────────────────────────────────── */
const Section = memo(({ titleId, title, badge, seeAllTo, seeAllLabel, seeAllOnClick, children }) => (
  <section className="ed-section" aria-labelledby={titleId}>
    <div className="ed-section-header">
      <div className="el-section-header-left" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <h2 id={titleId} className="ed-section-title">{title}</h2>
        {badge > 0 && <span className="ed-section-badge">{badge}</span>}
      </div>
      {seeAllOnClick && (
        <button className="ed-section-link" onClick={seeAllOnClick} type="button">
          {seeAllLabel || 'View all'} <ArrowRight size={13} />
        </button>
      )}
      {seeAllTo && !seeAllOnClick && (
        <Link to={seeAllTo} className="ed-section-link">
          {seeAllLabel || 'View all'} <ArrowRight size={13} />
        </Link>
      )}
    </div>
    {children}
  </section>
));

Section.propTypes = {
  titleId: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  badge: PropTypes.number,
  seeAllTo: PropTypes.string,
  seeAllLabel: PropTypes.string,
  seeAllOnClick: PropTypes.func,
  children: PropTypes.node.isRequired,
};

/* ─── Mini job card (dashboard widget) ──────────────────── */
const MiniJobCard = memo(({ job, onViewInBrowser }) => {
  const { t } = useTranslation();
  return (
    <div
      className="ed-mini-job-card"
      role="article"
      aria-label={`${job.title} at ${job.company}`}
    >
      <div className="ed-mini-job-header">
        <div className="ed-mini-job-logo" aria-hidden="true">
          {job.logo
            ? <img src={job.logo} alt="" loading="lazy" />
            : <span>{job.company?.charAt(0)?.toUpperCase()}</span>}
        </div>
        {job.type && <span className="ed-type-badge">{job.type}</span>}
      </div>
      <h3 className="ed-mini-job-title">{job.title}</h3>
      <p className="ed-mini-job-company">{job.company}</p>
      <div className="ed-mini-job-meta">
        {job.location && <span><MapPin size={11} /> {job.location}</span>}
        {job.salary   && <span>💰 {job.salary}</span>}
      </div>
      <div className="ed-mini-job-footer">
        <div className="ed-mini-job-tags">
          {job.tags?.slice(0, 2).map(t => <span key={t} className="ed-tag">{t}</span>)}
        </div>
        {/* Keep deep-link to job detail page for direct apply */}
        <Link to={`/jobs/${job.id}`} className="ed-mini-job-cta">
          {t('jobs.apply')} <ArrowRight size={11} />
        </Link>
      </div>
    </div>
  );
});

MiniJobCard.propTypes = {
  job: PropTypes.object.isRequired,
  onViewInBrowser: PropTypes.func,
};

/* ─── Nudge checklist ────────────────────────────────────── */
const NUDGE_ITEMS = [
  { key: 'profilePhoto', label: 'Profile photo',       weight: 15 },
  { key: 'summary',      label: 'Professional summary', weight: 15 },
  { key: 'phone',        label: 'Phone number',         weight: 10 },
  { key: 'cvUrl',        label: 'CV / Resume',          weight: 20 },
  { key: 'experiences',  label: 'Work experience',      weight: 15, arr: true },
  { key: 'education',    label: 'Education',            weight: 10, arr: true },
  { key: 'skills',       label: '3+ Skills',            weight: 10, count: 3 },
  { key: 'languages',    label: 'Languages',            weight: 5,  arr: true },
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
  const { t } = useTranslation();

  const {
    /* profile */
    profile, completion, firstName,
    /* applications */
    applications, appsLoading, appsError, retryApps,
    /* interviews */
    interviews, interLoading,
    /* dashboard recommended jobs */
    recJobs, jobsLoading,
    /* actions */
    handlePhotoChange, handleCancelInterview,
    /* ── jobs browser ── */
    activeSection, openJobsBrowser, openDashboard,
    allJobs, allJobsLoading, allJobsError, retryAllJobs,
    jobSearch, setJobSearch,
    jobFilters, setJobFilters,
    jobPage, setJobPage,
    paginatedJobs, filteredJobs, totalJobPages,
  } = useEmployeeDashboard();

  const pendingApps   = applications.filter(a => ['Under Review', 'Applied'].includes(a.status)).length;
  const upcomingInter = interviews.filter(iv => new Date(iv.scheduledAt) > new Date()).length;
  const today         = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const missing = missingItems(profile);

  return (
    <EmployeeLayout
      profile={profile}
      completion={completion}
      onEdit={() => navigate('/profile/job-seeker')}
      onPhotoChange={handlePhotoChange}
      appsBadge={pendingApps}
      /* Pass openJobsBrowser so sidebar "Browse Jobs" also uses it */
      onBrowseJobs={openJobsBrowser}
    >

      {/* ════ JOBS BROWSER (replaces dashboard content) ══════ */}
      {activeSection === 'jobs' && (
        <JobsBrowserPanel
          onBack={openDashboard}
          allJobsLoading={allJobsLoading}
          allJobsError={allJobsError}
          retryAllJobs={retryAllJobs}
          paginatedJobs={paginatedJobs}
          filteredJobs={filteredJobs}
          totalJobPages={totalJobPages}
          jobSearch={jobSearch}
          setJobSearch={setJobSearch}
          jobFilters={jobFilters}
          setJobFilters={setJobFilters}
          jobPage={jobPage}
          setJobPage={setJobPage}
        />
      )}

      {/* ════ DASHBOARD CONTENT ══════════════════════════════ */}
      {activeSection === 'dashboard' && (
        <>

          {/* ── Hero banner ──────────────────────────────── */}
          <div className="ed-hero" role="banner">
            <div className="ed-hero-bg" aria-hidden="true" />
            <div className="ed-hero-inner">
              <div className="ed-hero-text">
                <p className="ed-hero-eyebrow">
                  <span className="ed-hero-dot" aria-hidden="true" />{today}
                </p>
                <h1 className="ed-hero-title">
                  {t('dashboard.welcome')}, <span className="ed-hero-name">{firstName}</span> 👋
                </h1>
                <p className="ed-hero-sub">
                  {applications.length === 0
                    ? t('home.hero_subtitle')
                    : `${t('dashboard.welcome')} ${applications.length} ${t('employee.recent_applications').toLowerCase()}`}
                </p>
              </div>
              <div className="ed-hero-ctas">
                {/* KEY CHANGE: onClick opens inline browser instead of navigating */}
                <button
                  type="button"
                  className="ed-btn-primary"
                  onClick={openJobsBrowser}
                >
                  <Briefcase size={15} aria-hidden="true" /> {t('employee.browse_jobs')}
                </button>
                <Link to="/profile/job-seeker" className="ed-btn-outline">
                  {t('employee.edit_profile')}
                </Link>
              </div>
            </div>

            {completion < 100 && (
              <div className="ed-hero-progress">
                <div className="ed-hero-progress-meta">
                  <Zap size={13} aria-hidden="true" />
                  <span>{t('employee.profile_strength')}</span>
                  <strong>{completion}%</strong>
                </div>
                <div
                  className="ed-hero-bar"
                  role="progressbar"
                  aria-valuenow={completion}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="ed-hero-bar-fill" style={{ width: `${completion}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* ── Stats ─────────────────────────────────────── */}
          <div className="ed-stats-row" role="region" aria-label="Activity summary">
            <StatCard
              icon={FileText}
              value={applications.length}
              label={t('employee.recent_applications')}
              sub={pendingApps > 0 ? `${pendingApps} under review` : 'None pending'}
              accent="#1A5C2E"
              to="/employee/applications"
            />
            <StatCard
              icon={Bookmark}
              value={5}
              label={t('employee.saved_jobs')}
              sub="View your wishlist"
              accent="#F97316"
              to="/employee/saved"
            />
            <StatCard
              icon={CalendarCheck}
              value={upcomingInter}
              label={t('employee.upcoming_interviews')}
              sub={upcomingInter > 0 ? 'Scheduled upcoming' : 'None yet'}
              accent="#3B82F6"
              to="/employee/interviews"
            />
            <StatCard
              icon={Star}
              value={`${completion}%`}
              label={t('employee.profile_score')}
              sub={completion < 100 ? `${missing.length} items missing` : '✓ Complete!'}
              accent="#8B5CF6"
              to="/profile/job-seeker"
            />
          </div>

          {/* ── Profile nudge ─────────────────────────────── */}
          {completion < 80 && (
            <div className="ed-nudge" role="note">
              <div className="ed-nudge-left">
                <div className="ed-nudge-icon-ring" aria-hidden="true"><Zap size={17} /></div>
                <div className="ed-nudge-text">
                  <strong>{t('employee.boost_visibility')}</strong>
                  <p>
                    {completion < 40
                      ? t('employee.boost_sub_empty')
                      : completion < 60
                      ? t('employee.boost_sub_partial')
                      : t('employee.boost_sub_almost')}
                  </p>
                  {missing.length > 0 && (
                    <div className="ed-nudge-checklist">
                      {missing.slice(0, 3).map(it => (
                        <span key={it.key} className="ed-nudge-item">
                          <span className="ed-nudge-item-dot" aria-hidden="true" />
                          {it.label}
                          <span className="ed-nudge-item-weight">+{it.weight}%</span>
                        </span>
                      ))}
                      {missing.length > 3 && (
                        <span className="ed-nudge-more">+{missing.length - 3} more</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <Link to="/profile/job-seeker" className="ed-nudge-btn">{t('employee.complete_profile')}</Link>
            </div>
          )}

          {/* ── Recent Applications ────────────────────────── */}
          <Section
            titleId="apps-heading"
            title={t('employee.recent_applications')}
            badge={applications.length}
            seeAllTo="/employee/applications"
            seeAllLabel={t('employee.see_all_jobs')}
          >
            {appsLoading && <Skeleton rows={4} />}

            {appsError && !appsLoading && (
              <div className="ed-error" role="alert">
                <AlertCircle size={15} aria-hidden="true" />
                <span>{appsError}</span>
                <button className="ed-retry-btn" onClick={retryApps}>
                  <RefreshCw size={12} /> {t('common.retry')}
                </button>
              </div>
            )}

            {!appsLoading && !appsError && applications.length === 0 && (
              <EmptyState
                icon={Briefcase}
                title={t('employee.no_applications')}
                sub={t('employee.find_first_job')}
                cta={t('employee.find_first_job')}
                ctaOnClick={openJobsBrowser}
              />
            )}

            {!appsLoading && !appsError && applications.length > 0 && (
              <div className="ed-app-table" role="table" aria-label="Recent applications">
                <div className="ed-app-thead" role="row">
                  <span role="columnheader">{t('employee.position')}</span>
                  <span role="columnheader">{t('employee.company')}</span>
                  <span role="columnheader">{t('employee.status')}</span>
                  <span role="columnheader">{t('employee.applied')}</span>
                </div>
                {applications.slice(0, 5).map(app => (
                  <div key={app.id} className="ed-app-row" role="row">
                    <div className="ed-app-pos" role="cell">
                      <span className="ed-app-title">{app.jobTitle}</span>
                      {app.location && (
                        <span className="ed-app-loc"><MapPin size={10} /> {app.location}</span>
                      )}
                    </div>
                    <span className="ed-app-company" role="cell">{app.company}</span>
                    <span role="cell"><StatusBadge status={app.status} /></span>
                    <span className="ed-app-date" role="cell">
                      <Clock size={10} aria-hidden="true" /> {formatDate(app.appliedAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* ── Upcoming Interviews ────────────────────────── */}
          <Section titleId="inter-heading" title={t('employee.upcoming_interviews')} badge={upcomingInter}>
            {interLoading
              ? <Skeleton rows={2} grid />
              : interviews.length === 0
              ? <EmptyState
                  icon={CalendarCheck}
                  title={t('employee.no_interviews')}
                  sub={t('employee.browse_roles')}
                  cta={t('employee.browse_roles')}
                  ctaOnClick={openJobsBrowser}
                />
              : (
                <div className="ed-interview-grid">
                  {interviews.map(iv => (
                    <InterviewCard key={iv.id} interview={iv} onCancel={handleCancelInterview} />
                  ))}
                </div>
              )
            }
          </Section>

          {/* ── Jobs For You ───────────────────────────────── */}
          <Section
            titleId="recjobs-heading"
            title={t('employee.jobs_for_you')}
            seeAllLabel={t('employee.see_all_jobs')}
            seeAllOnClick={openJobsBrowser}   /* ← opens browser, no redirect */
          >
            {jobsLoading
              ? <Skeleton rows={3} grid />
              : recJobs.length === 0
              ? <EmptyState
                  icon={Briefcase}
                  title={t('employee.no_recommendations')}
                  sub={t('employee.complete_profile')}
                  cta={t('employee.see_all_jobs')}
                  ctaOnClick={openJobsBrowser}
                />
              : (
                <div className="ed-mini-jobs-grid">
                  {recJobs.map(job => (
                    <MiniJobCard key={job.id} job={job} onViewInBrowser={openJobsBrowser} />
                  ))}
                </div>
              )
            }
          </Section>

        </>
      )}

    </EmployeeLayout>
  );
}
