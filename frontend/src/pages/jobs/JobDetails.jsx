import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getJob, saveJob } from '../../api/jobs';
import KoraNav from '../../components/KoraNav';          // ← added
import '../../styles/job-list.css';

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

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
        if (!cancelled) setError(t('jobs.error_load_job'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id, t]);

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
          <p>{t('jobs.loading_job_details')}</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="jd-page">
        <KoraNav />
        <div className="jd-error" role="alert">
          <p>{error || t('jobs.job_not_found')}</p>
          <Link to="/jobs" className="jl-btn jl-btn--primary">
            {t('jobs.back_to_jobs')}
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
          aria-label={t('jobs.back_to_listings_aria')}
        >
          {t('jobs.back_to_jobs')}
        </button>

        <div className="jd-layout">
          {/* ── Left: job content ───────────────────── */}
          <div className="jd-main">
            {/* Header card */}
            <div className="jd-header">
              <div className="jd-logo" aria-hidden="true">
                {job.logo
                  ? <img src={job.logo} alt={t('jobs.company_logo_alt', { company: job.company })} />
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
                aria-label={saved ? t('jobs.remove_from_saved') : t('jobs.save_this_job')}
              >
                {saved ? t('jobs.saved_label') : t('jobs.save_label')}
              </button>
            </div>

            {/* Quick facts */}
            <div className="jd-facts" aria-label={t('jobs.job_details_aria')}>
              {[
                { icon: '📍', val: job.location },
                { icon: '💼', val: job.type },
                job.salary  && { icon: '💰', val: job.salary },
                job.remote  && { icon: '🌐', val: t('jobs.remote_ok') },
                job.applicants != null && { icon: '👥', val: t('jobs.applicants_count', { count: job.applicants }) },
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
              <div className="jd-tags" aria-label={t('jobs.required_skills_aria')}>
                {job.tags.map((tag) => (
                  <span key={tag} className="jd-tag">{tag}</span>
                ))}
              </div>
            )}

            {/* Description */}
            {job.description && (
              <>
                <h2 className="jd-section-heading">{t('jobs.job_description')}</h2>
                <div className="jd-description">{job.description}</div>
              </>
            )}

            {/* Company info */}
            <h2 className="jd-section-heading">{t('jobs.about_company', { company: job.company })}</h2>
            <dl className="jd-company-dl">
              {job.location && (
                <div>
                  <dt>{t('common.location')}</dt>
                  <dd>{job.location}</dd>
                </div>
              )}
              {job.type && (
                <div>
                  <dt>{t('common.type')}</dt>
                  <dd>{job.type}</dd>
                </div>
              )}
              {job.salary && (
                <div>
                  <dt>{t('common.salary')}</dt>
                  <dd>{job.salary}</dd>
                </div>
              )}
              {job.website && (
                <div>
                  <dt>{t('common.website')}</dt>
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
          <aside className="jd-sidebar" aria-label={t('jobs.apply_for_job_aria')}>
            <div className="jd-apply-card">
              <h2 className="jd-apply-title">{t('jobs.ready_to_apply')}</h2>
              <p className="jd-apply-sub">
                {job.applicants != null
                  ? t('jobs.people_applied', { count: job.applicants })
                  : t('jobs.be_first_to_apply')}
              </p>

              {job.applied ? (
                <div className="jd-applied-badge" role="status">
                  {t('jobs.application_submitted')}
                </div>
              ) : (
                <Link
                  to={`/jobs/${id}/apply`}
                  className="jd-apply-btn"
                  aria-label={t('jobs.apply_for_title_aria', { title: job.title })}
                >
                  {t('jobs.apply_now')}
                </Link>
              )}

              <button
                className={`jd-save-sidebar-btn${saved ? ' saved' : ''}`}
                onClick={handleSave}
                disabled={saving}
                aria-label={saved ? t('jobs.remove_from_saved') : t('jobs.save_for_later_aria')}
              >
                {saving
                  ? t('jobs.saving')
                  : saved
                    ? t('jobs.saved_label')
                    : t('jobs.save_for_later')}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
