import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import KoraNav from '../../components/KoraNav';
import ProfileSidebar from '../../components/profile/ProfileSidebar';
import { getUserApplications, getJobs } from '../../api/jobs';
import { getInterviewsBySeeker, cancelInterview } from '../../api/interviews';
import { getJobSeekerProfile } from '../../api/profiles';
import InterviewCard from '../../components/interviews/InterviewCard';
import { useAuth } from '../../context/AuthContext';
import '../../styles/employee-dashboard.css';

/* ─────────────────────────────────────────────────────────
   Profile is fetched from the backend. Fallback layout if missing.
   ───────────────────────────────────────────────────────── */
const EMPTY_PROFILE = {
  fullName: 'Loading User...',
  email: '',
  phone: '',
  city: '',
  region: '',
  dateOfBirth: '',
  profilePhoto: null,
  summary: '',
  cvUrl: null,
  cvFileName: null,
  experiences: [],
  education: [],
  skills: [],
  languages: [],
};

/* ── Profile completion (same formula as JobSeekerProfile) ── */
function profileCompletion(p) {
  let score = 0;
  if (p.profilePhoto) score += 15;
  if (p.summary)      score += 15;
  if (p.phone)        score += 10;
  if (p.cvUrl)        score += 20;
  if (p.experiences?.length > 0) score += 15;
  if (p.education?.length > 0)   score += 10;
  if (p.skills?.length >= 3)     score += 10;
  if (p.languages?.length > 0)   score += 5;
  return score;
}

/* ── Application status badge ───────────────────────────── */
const STATUS_MAP = {
  'Under Review':        { bg: '#FFF7ED', text: '#C2410C', dot: '#F97316' },
  'Interview Scheduled': { bg: '#F0FDF4', text: '#166534', dot: '#22C55E' },
  Rejected:              { bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444' },
  Hired:                 { bg: '#F0FDF4', text: '#166534', dot: '#22C55E' },
};
const DEFAULT_STATUS = { bg: '#F9FAFB', text: '#374151', dot: '#9CA3AF' };

function StatusBadge({ status }) {
  const c = STATUS_MAP[status] || DEFAULT_STATUS;
  return (
    <span className="ed-badge" style={{ background: c.bg, color: c.text }}>
      <span className="ed-badge-dot" style={{ background: c.dot }} aria-hidden="true" />
      {status}
    </span>
  );
}
StatusBadge.propTypes = { status: PropTypes.string.isRequired };

/* ── Stat card ──────────────────────────────────────────── */
function StatCard({ icon, value, label, delta, accent }) {
  return (
    <div className="ed-stat-card">
      <div
        className="ed-stat-icon"
        style={{ background: `${accent}18`, color: accent }}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div className="ed-stat-body">
        <div className="ed-stat-value">{value}</div>
        <div className="ed-stat-label">{label}</div>
        {delta && <div className="ed-stat-delta">{delta}</div>}
      </div>
    </div>
  );
}
StatCard.propTypes = {
  icon: PropTypes.node.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  label: PropTypes.string.isRequired,
  delta: PropTypes.string,
  accent: PropTypes.string.isRequired,
};

/* ── Mini job card (Jobs For You section) ───────────────── */
function MiniJobCard({ job }) {
  return (
    <Link to={`/jobs/${job.id}`} className="ed-mini-job-card">
      <div className="ed-mini-job-logo" aria-hidden="true">
        {job.logo ? (
          <img src={job.logo} alt={`${job.company} logo`} loading="lazy" />
        ) : (
          <span>{job.company.charAt(0)}</span>
        )}
      </div>
      <div className="ed-mini-job-info">
        <h3 className="ed-mini-job-title">{job.title}</h3>
        <p className="ed-mini-job-company">{job.company}</p>
        <div className="ed-mini-job-meta">
          <span>📍 {job.location}</span>
          {job.salary && <span>💰 {job.salary}</span>}
        </div>
      </div>
      <div className="ed-mini-job-footer">
        <div className="ed-mini-job-tags">
          {job.tags?.slice(0, 2).map((t) => (
            <span key={t} className="ed-tag">{t}</span>
          ))}
        </div>
        <span className="ed-type-badge">{job.type}</span>
      </div>
    </Link>
  );
}
MiniJobCard.propTypes = { job: PropTypes.object.isRequired };

/* ════════════════════════════════════════════════════════════
   EmployeeDashboard
   ════════════════════════════════════════════════════════════ */
export default function EmployeeDashboard() {
  const { user, token } = useAuth();
  // Merge auth user (has email/role) with any local profile overrides
  const [profile, setProfile] = useState({ ...EMPTY_PROFILE, ...(user || {}) });
  const completion = profileCompletion(profile);
  const firstName  = profile.fullName?.split(' ')[0] || profile.firstName || profile.email?.split('@')[0] || 'User';

  /* ── API data ───────────────────────────────────────────── */
  const [applications,  setApplications]  = useState([]);
  const [appsLoading,   setAppsLoading]   = useState(true);
  const [appsError,     setAppsError]     = useState(null);

  const [interviews,    setInterviews]    = useState([]);
  const [interLoading,  setInterLoading]  = useState(true);

  const [recJobs,       setRecJobs]       = useState([]);
  const [jobsLoading,   setJobsLoading]   = useState(true);

  useEffect(() => {
    if (!token || !user?.id) return;

    const seekerId = user.id;

    // Fetch actual JobSeeker profile
    getJobSeekerProfile(seekerId)
      .then((data) => {
        if (data) {
          setProfile(prev => ({ ...prev, ...data }));
        }
      })
      .catch((err) => console.error('Failed to fetch profile:', err));

    getUserApplications(seekerId)
      .then((res) => setApplications(res.data || []))
      .catch(() => {
        setAppsError('Could not load applications.');
        setApplications([]); // Fallback
      })
      .finally(() => setAppsLoading(false));

    getInterviewsBySeeker(seekerId)
      .then((data) => setInterviews(data || []))
      .catch((err) => {
        console.error("Interviews fetch error gracefully caught:", err.message);
        setInterviews([]); // Fallback
      })
      .finally(() => setInterLoading(false));

    getJobs({ limit: 3 })
      .then((res) => setRecJobs(res.data || []))
      .catch(() => {})
      .finally(() => setJobsLoading(false));
  }, [user, token]);

  const handleCancelInterview = async (id) => {
    if (window.confirm('Cancel this interview?')) {
      try {
        await cancelInterview(id);
        setInterviews(interviews.filter(iv => iv.id !== id));
      } catch (err) {
        alert('Failed to cancel.');
      }
    }
  };

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="ed-root">
      <KoraNav />

      <div className="ed-body">
        {/* ── Left sidebar ──────────────────────────────── */}
        <aside className="ed-sidebar kora-sidebar" aria-label="Profile sidebar">
          <ProfileSidebar
            profile={profile}
            completion={completion}
            onEdit={() => {}}
            onPhotoChange={(file) => {
              const url = URL.createObjectURL(file);
              setProfile((p) => ({ ...p, profilePhoto: url }));
            }}
          />
        </aside>

        {/* ── Main content ──────────────────────────────── */}
        <main className="ed-main" id="main-content">
          {/* Welcome */}
          <div className="ed-welcome">
            <div>
              <h1 className="ed-welcome-title">
                Welcome back, {firstName}&nbsp;
                <span aria-hidden="true">👋</span>
              </h1>
              <p className="ed-welcome-sub">
                Here's what's happening with your job search today.
              </p>
            </div>
            <Link to="/jobs" className="ed-find-jobs-btn">
              Browse Jobs →
            </Link>
          </div>

          {/* Stats row */}
          <div className="ed-stats-row" role="region" aria-label="Activity summary">
            <StatCard
              icon="📄"
              value={applications.length}
              label="Applications Sent"
              accent="#1A5C2E"
            />
            <StatCard
              icon="🔖"
              value={5}
              label="Saved Jobs"
              accent="#F97316"
            />
            <StatCard
              icon="📅"
              value={interviews.length}
              label="Upcoming Interviews"
              accent="#3B82F6"
            />
            <StatCard
              icon="⭐"
              value={`${completion}%`}
              label="Profile Complete"
              accent="#8B5CF6"
              delta={completion < 100 ? 'Add more details' : '✓ All done'}
            />
          </div>

          {/* Profile completion nudge */}
          {completion < 80 && (
            <div className="ed-nudge" role="note" aria-label="Profile completion tip">
              <span className="ed-nudge-icon" aria-hidden="true">💡</span>
              <div className="ed-nudge-text">
                <strong>Boost your visibility</strong>
                <p>
                  {completion < 50
                    ? 'Add experience and education to stand out to employers.'
                    : 'Upload your CV to increase your chances of getting noticed.'}
                </p>
              </div>
              <Link to="/profile/job-seeker" className="ed-nudge-btn">
                Complete Profile
              </Link>
            </div>
          )}

          {/* ── Recent Applications ───────────────────────── */}
          <section className="ed-section" aria-labelledby="apps-heading">
            <div className="ed-section-header">
              <h2 id="apps-heading" className="ed-section-title">
                Recent Applications
              </h2>
              <Link to="#" className="ed-section-link">View all →</Link>
            </div>

            {appsLoading && (
              <div className="ed-loading-row">
                <div className="kora-spinner" aria-label="Loading applications" />
              </div>
            )}

            {appsError && !appsLoading && (
              <p className="ed-error-msg" role="alert">{appsError}</p>
            )}

            {!appsLoading && !appsError && applications.length === 0 && (
              <div className="ed-empty">
                <span aria-hidden="true">📋</span>
                <p>
                  No applications yet.{' '}
                  <Link to="/jobs">Find your first job →</Link>
                </p>
              </div>
            )}

            {!appsLoading && !appsError && applications.length > 0 && (
              <div
                className="ed-app-table"
                role="table"
                aria-label="Recent applications"
              >
                <div className="ed-app-thead" role="row">
                  <span role="columnheader">Job Title</span>
                  <span role="columnheader">Company</span>
                  <span role="columnheader">Status</span>
                  <span role="columnheader">Applied</span>
                </div>
                {applications.map((app) => (
                  <div key={app.id} className="ed-app-row" role="row">
                    <span className="ed-app-title" role="cell">
                      {app.jobTitle}
                    </span>
                    <span className="ed-app-company" role="cell">
                      {app.company}
                    </span>
                    <span role="cell">
                      <StatusBadge status={app.status} />
                    </span>
                    <span className="ed-app-date" role="cell">
                      {new Date(app.appliedAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Upcoming Interviews ───────────────────────── */}
          <section className="ed-section" aria-labelledby="inter-heading">
            <div className="ed-section-header">
              <h2 id="inter-heading" className="ed-section-title">
                Upcoming Interviews
              </h2>
            </div>

            {interLoading ? (
              <div className="ed-loading-row">
                <div className="kora-spinner" aria-label="Loading interviews" />
              </div>
            ) : interviews.length === 0 ? (
              <div className="ed-empty">
                <span aria-hidden="true">📅</span>
                <p>No interviews scheduled yet.</p>
              </div>
            ) : (
              <div className="ed-interview-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {interviews.map((iv) => (
                  <InterviewCard 
                    key={iv.id} 
                    interview={iv} 
                    onCancel={handleCancelInterview}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── Jobs For You ──────────────────────────────── */}
          <section className="ed-section" aria-labelledby="recjobs-heading">
            <div className="ed-section-header">
              <h2 id="recjobs-heading" className="ed-section-title">
                Jobs For You
              </h2>
              <Link to="/jobs" className="ed-section-link">
                See all jobs →
              </Link>
            </div>

            {jobsLoading ? (
              <div className="ed-loading-row">
                <div className="kora-spinner" aria-label="Loading recommended jobs" />
              </div>
            ) : recJobs.length === 0 ? (
              <div className="ed-empty">
                <span aria-hidden="true">🔍</span>
                <p>
                  No recommendations yet.{' '}
                  <Link to="/jobs">Browse all jobs →</Link>
                </p>
              </div>
            ) : (
              <div className="ed-mini-jobs-grid">
                {recJobs.map((job) => (
                  <MiniJobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
