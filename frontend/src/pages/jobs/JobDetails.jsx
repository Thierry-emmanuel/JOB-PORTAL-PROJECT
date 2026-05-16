import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getJob, saveJob } from '../../api/jobs';
import KoraNav from '../../components/KoraNav';          // ← added
import '../../styles/job-list.css';

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job,     setJob]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [saved,   setSaved]   = useState(false);
  const [saving,  setSaving]  = useState(false);

  /* ── Load job ─────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getJob(id);
        if (!cancelled) {
          setJob(data);
          setSaved(data.saved ?? false);
        }
      } catch {
        if (!cancelled) setError('Could not load this job.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  /* ── Save toggle ──────────────────────────────────────── */
  const handleSave = async () => {
    setSaving(true);
    try {
      await saveJob(id, !saved);
      setSaved((v) => !v);
    } catch {
      // silently fail — the button re-enables
    } finally {
      setSaving(false);
    }
  };

  /* ── States ───────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="jd-page">
        <KoraNav />
        <div className="jd-loading" aria-busy="true">
          <div className="ed-spinner" />
          <p>Loading job details…</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="jd-page">
        <KoraNav />
        <div className="jd-error" role="alert">
          <p>{error || 'Job not found.'}</p>
          <Link to="/jobs" className="jl-btn jl-btn--primary">
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  /* ── Main render ──────────────────────────────────────── */
  return (
    <div className="jd-page">
      {/* ── Top nav ── */}
      <KoraNav />

      <div className="jd-container">
        {/* Back */}
        <button
          className="jl-back-btn"
          onClick={() => navigate(-1)}
          aria-label="Back to job listings"
        >
          ← Back to Jobs
        </button>

        <div className="jd-layout">
          {/* ── Left: job content ───────────────────── */}
          <div className="jd-main">
            {/* Header card */}
            <div className="jd-header">
              <div className="jd-logo" aria-hidden="true">
                {job.logo
                  ? <img src={job.logo} alt={`${job.company} logo`} />
                  : <span>{job.company.charAt(0)}</span>
                }
              </div>
              <div className="jd-header-info">
                <h1 className="jd-title">{job.title}</h1>
                <p className="jd-company">{job.company}</p>
              </div>
              <button
                className={`jd-save-btn${saved ? ' saved' : ''}`}
                onClick={handleSave}
                disabled={saving}
                aria-label={saved ? 'Remove from saved jobs' : 'Save this job'}
              >
                {saved ? '🔖 Saved' : '🔖 Save'}
              </button>
            </div>

            {/* Quick facts */}
            <div className="jd-facts" aria-label="Job details">
              {[
                { icon: '📍', val: job.location },
                { icon: '💼', val: job.type },
                job.salary && { icon: '💰', val: job.salary },
                job.remote  && { icon: '🌐', val: 'Remote OK' },
                job.applicants != null && { icon: '👥', val: `${job.applicants} applicants` },
              ]
                .filter(Boolean)
                .map((f) => (
                  <span key={f.val} className="jc-detail-item">
                    <span aria-hidden="true">{f.icon}</span> {f.val}
                  </span>
                ))}
            </div>

            {/* Tags */}
            {job.tags?.length > 0 && (
              <div className="jd-tags" aria-label="Required skills">
                {job.tags.map((t) => (
                  <span key={t} className="jd-tag">{t}</span>
                ))}
              </div>
            )}

            {/* Description */}
            {job.description && (
              <>
                <h2 className="jd-section-heading">Job Description</h2>
                <div className="jd-description">{job.description}</div>
              </>
            )}

            {/* Company info */}
            <h2 className="jd-section-heading">About {job.company}</h2>
            <dl className="jd-company-dl">
              {job.location && (
                <div>
                  <dt>Location</dt>
                  <dd>{job.location}</dd>
                </div>
              )}
              {job.type && (
                <div>
                  <dt>Type</dt>
                  <dd>{job.type}</dd>
                </div>
              )}
              {job.salary && (
                <div>
                  <dt>Salary</dt>
                  <dd>{job.salary}</dd>
                </div>
              )}
              {job.website && (
                <div>
                  <dt>Website</dt>
                  <dd>
                    <a
                      href={job.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {job.website}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* ── Right: apply card (sticky) ───────────── */}
          <aside className="jd-sidebar" aria-label="Apply for this job">
            <div className="jd-apply-card">
              <h2 className="jd-apply-title">Ready to Apply?</h2>
              <p className="jd-apply-sub">
                {job.applicants != null
                  ? `${job.applicants} people have already applied.`
                  : 'Be among the first to apply.'}
              </p>

              {job.applied ? (
                <div className="jd-applied-badge" role="status">
                  ✓ Application Submitted
                </div>
              ) : (
                <Link
                  to={`/jobs/${id}/apply`}
                  className="jd-apply-btn"
                  aria-label={`Apply for ${job.title}`}
                >
                  Apply Now →
                </Link>
              )}

              <button
                className={`jd-save-sidebar-btn${saved ? ' saved' : ''}`}
                onClick={handleSave}
                disabled={saving}
                aria-label={saved ? 'Remove from saved jobs' : 'Save this job for later'}
              >
                {saving ? 'Saving…' : saved ? '🔖 Saved' : '🔖 Save for Later'}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
