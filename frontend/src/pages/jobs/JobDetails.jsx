import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getJob, saveJob } from '../../api/jobs';
import '../../styles/job-list.css';

/**
 * JobDetails
 * Full-page view for a single job posting.
 */
export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [savePending, setSavePending] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getJob(id);
        setJob(data);
        setSaved(data.saved || false);
      } catch (e) {
        setError('Job not found or failed to load.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleSave = async () => {
    if (savePending) return;
    const prev = saved;
    setSaved(!prev);
    setSavePending(true);
    try {
      await saveJob(id);
    } catch {
      setSaved(prev); // rollback
    } finally {
      setSavePending(false);
    }
  };

  if (loading) {
    return (
      <div className="jd-loading" aria-busy="true">
        <div className="ed-spinner" />
        <p>Loading job details…</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="jd-error" role="alert">
        <p>{error || 'Job not found.'}</p>
        <Link to="/jobs" className="jl-btn jl-btn--primary">Back to Jobs</Link>
      </div>
    );
  }

  return (
    <div className="jd-page">
      <div className="jd-container">
        {/* Back nav */}
        <button className="jl-back-btn" onClick={() => navigate(-1)} aria-label="Go back">
          ← Back to Jobs
        </button>

        <div className="jd-layout">
          {/* Main column */}
          <article className="jd-main">
            {/* Header */}
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
                className={`jd-save-btn ${saved ? 'saved' : ''}`}
                onClick={handleSave}
                disabled={savePending}
                aria-pressed={saved}
                aria-label={saved ? 'Unsave this job' : 'Save this job'}
              >
                {saved ? '🔖 Saved' : '🏷️ Save'}
              </button>
            </div>

            {/* Facts */}
            <div className="jd-facts">
              <span><span aria-hidden="true">📍</span> {job.location}</span>
              <span><span aria-hidden="true">💼</span> {job.type}</span>
              {job.salary && <span><span aria-hidden="true">💰</span> {job.salary}</span>}
              <span><span aria-hidden="true">📅</span> Posted {new Date(job.postedAt).toLocaleDateString()}</span>
            </div>

            {/* Tags */}
            <div className="jd-tags" aria-label="Skills required">
              {job.tags?.map((t) => <span key={t} className="jd-tag">{t}</span>)}
            </div>

            {/* Description */}
            <section aria-labelledby="jd-desc-heading">
              <h2 id="jd-desc-heading" className="jd-section-heading">About the Role</h2>
              <p className="jd-description">{job.description}</p>
            </section>

            {/* Company */}
            {job.companyInfo && (
              <section aria-labelledby="jd-company-heading">
                <h2 id="jd-company-heading" className="jd-section-heading">About {job.company}</h2>
                <dl className="jd-company-dl">
                  <div><dt>Industry</dt><dd>{job.companyInfo.industry}</dd></div>
                  <div><dt>Size</dt><dd>{job.companyInfo.size} employees</dd></div>
                  {job.companyInfo.website && (
                    <div>
                      <dt>Website</dt>
                      <dd>
                        <a href={job.companyInfo.website} target="_blank" rel="noopener noreferrer">
                          {job.companyInfo.website}
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </section>
            )}
          </article>

          {/* Sidebar CTA */}
          <aside className="jd-sidebar" aria-label="Apply panel">
            <div className="jd-apply-card">
              <h2 className="jd-apply-title">Ready to apply?</h2>
              <p className="jd-apply-sub">Submit your application in minutes.</p>
              {job.applied ? (
                <div className="jd-applied-badge" aria-label="You have already applied">
                  ✓ Application Submitted
                </div>
              ) : (
                <Link
                  to={`/jobs/${job.id}/apply`}
                  className="jd-apply-btn"
                >
                  Apply Now
                </Link>
              )}
              <button
                className={`jd-save-sidebar-btn ${saved ? 'saved' : ''}`}
                onClick={handleSave}
                disabled={savePending}
                aria-pressed={saved}
              >
                {saved ? '🔖 Saved' : '🏷️ Save Job'}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}