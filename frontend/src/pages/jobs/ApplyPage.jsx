import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getJob, applyToJob } from '../../api/jobs';
import { useAuth } from '../../context/AuthContext';
import KoraNav from '../../components/KoraNav';
import '../../styles/apply-page.css';

export default function ApplyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  /* ── State ────────────────────────────────────────────── */
  const [job, setJob] = useState(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [jobError, setJobError] = useState(null);

  const [form, setForm] = useState({
    coverLetter: '',
    expectedSalary: ''
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  /* ── Load job ─────────────────────────────────────────── */
  useEffect(() => {
    async function load() {
      try {
        const data = await getJob(id);
        setJob(data);
      } catch {
        setJobError(t('jobs.error_load_job_details'));
      } finally {
        setJobLoading(false);
      }
    }
    load();
  }, [id, t]);

  /* ── Validation ───────────────────────────────────────── */
  const validate = () => {
    const errs = {};
    if (!form.expectedSalary) {
      errs.expectedSalary = t('jobs.validation_salary_required');
    } else {
      const salary = parseFloat(form.expectedSalary);
      if (isNaN(salary) || salary <= 0) {
        errs.expectedSalary = t('jobs.validation_salary_positive');
      }
    }
    return errs;
  };

  /* ── Handlers ─────────────────────────────────────────── */
  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      document.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    
    if (!user || !user.id) {
      setSubmitError(t('jobs.must_be_logged_in'));
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const requestBody = {
        jobPostingId: parseInt(id, 10),
        coverLetter: form.coverLetter,
        expectedSalary: parseFloat(form.expectedSalary)
      };
      await applyToJob(user.id, requestBody);
      setSubmitted(true);
    } catch (err) {
      const msg = err.response?.data?.message || t('jobs.error_submit_application');
      setSubmitError(msg);
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Loading / error states ───────────────────────────── */
  if (jobLoading) {
    return (
      <div className="ap-page">
        <KoraNav />
        <div className="ap-loading" aria-busy="true">
          <div className="kora-spinner" />
          <p>{t('jobs.loading_job_details')}</p>
        </div>
      </div>
    );
  }

  if (jobError) {
    return (
      <div className="ap-page">
        <KoraNav />
        <div className="ap-error" role="alert">
          <p>{jobError}</p>
          <Link to="/jobs" className="ap-btn ap-btn--primary">{t('jobs.back_to_jobs')}</Link>
        </div>
      </div>
    );
  }

  /* ── Already applied ──────────────────────────────────── */
  if (job?.applied && !submitted) {
    return (
      <div className="ap-page">
        <KoraNav />
        <div className="ap-container ap-container--narrow">
          <div className="ap-already-applied">
            <span className="ap-success-icon" aria-hidden="true">✅</span>
            <h1>{t('jobs.already_applied_title')}</h1>
            <p>
              {t('jobs.already_applied_msg_prefix')}{' '}
              <strong>{job.title}</strong>
              {t('jobs.already_applied_msg_suffix')}
            </p>
            <div className="ap-already-actions">
              <Link to="/employee/dashboard" className="ap-btn ap-btn--primary">
                {t('common.view_dashboard')}
              </Link>
              <Link to="/jobs" className="ap-btn ap-btn--outline">
                {t('jobs.browse_more_jobs')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Success state ────────────────────────────────────── */
  if (submitted) {
    return (
      <div className="ap-page">
        <KoraNav />
        <div className="ap-container ap-container--narrow">
          <div className="ap-success" role="status">
            <span className="ap-success-icon" aria-hidden="true">🎉</span>
            <h1 className="ap-success-title">{t('jobs.application_submitted_title')}</h1>
            <p className="ap-success-msg">
              {t('jobs.application_success_msg', { title: job?.title, company: job?.company })}
            </p>
            <div className="ap-success-actions">
              <Link to="/employee/dashboard" className="ap-btn ap-btn--primary">
                {t('common.view_dashboard')}
              </Link>
              <Link to="/jobs" className="ap-btn ap-btn--outline">
                {t('jobs.browse_more_jobs')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main form ────────────────────────────────────────── */
  return (
    <div className="ap-page">
      <KoraNav />

      <div className="ap-container">
        <button
          className="ap-back-btn"
          onClick={() => navigate(-1)}
          aria-label={t('common.go_back')}
        >
          {t('common.back')}
        </button>

        {job && (
          <div className="ap-job-banner" aria-label={t('jobs.applying_for_aria', { title: job.title })}>
            <div className="ap-job-logo" aria-hidden="true">
              {job.logo
                ? <img src={job.logo} alt={t('jobs.company_logo_alt', { company: job.company })} />
                : <span>{job.company.charAt(0)}</span>
              }
            </div>
            <div>
              <h1 className="ap-job-title">{job.title}</h1>
              <p className="ap-job-company">
                {job.company} · {job.location} · {job.type}
                {job.salary && ` · ${job.salary}`}
              </p>
            </div>
          </div>
        )}

        <div className="ap-layout">
          <form
            className="ap-form"
            onSubmit={handleSubmit}
            noValidate
            aria-label={t('jobs.application_form_aria')}
          >
            <h2 className="ap-form-heading">{t('jobs.your_application')}</h2>

            {submitError && (
              <div className="ap-submit-error" role="alert">{submitError}</div>
            )}

            <fieldset className="ap-fieldset">
              <legend className="ap-legend">{t('jobs.profile_and_resume')}</legend>
              <div className="ap-profile-hint">
                <p style={{ fontSize: '14px', color: '#374151', background: '#F3F4F6', padding: '12px', borderRadius: '8px' }}>
                  <span aria-hidden="true">📄</span> <strong>{t('jobs.profile_hint_bold')}</strong> {t('jobs.profile_hint_text')}
                </p>
              </div>
            </fieldset>

            <fieldset className="ap-fieldset">
              <legend className="ap-legend">{t('jobs.job_requirements')}</legend>

              <div className="ap-field">
                <label htmlFor="ap-expectedSalary" className="ap-label">
                  {t('jobs.expected_salary_label')}{' '}
                  <span aria-hidden="true" className="ap-required">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }}>$</span>
                  <input
                    id="ap-expectedSalary"
                    type="number"
                    min="1"
                    step="0.01"
                    style={{ paddingLeft: '28px' }}
                    className={`ap-input${errors.expectedSalary ? ' ap-input--error' : ''}`}
                    value={form.expectedSalary}
                    onChange={(e) => handleChange('expectedSalary', e.target.value)}
                    aria-required="true"
                    aria-invalid={!!errors.expectedSalary}
                    aria-describedby={errors.expectedSalary ? 'ap-salary-error' : undefined}
                    placeholder={t('jobs.salary_placeholder')}
                  />
                </div>
                {errors.expectedSalary && (
                  <p id="ap-salary-error" className="ap-field-error" role="alert">
                    {errors.expectedSalary}
                  </p>
                )}
              </div>
            </fieldset>

            <fieldset className="ap-fieldset">
              <legend className="ap-legend">
                {t('jobs.cover_letter')}{' '}
                <span className="ap-optional">{t('common.optional')}</span>
              </legend>
              <div className="ap-field">
                <label htmlFor="ap-coverLetter" className="ap-label">
                  {t('jobs.cover_letter_label')}
                </label>
                <textarea
                  id="ap-coverLetter"
                  className="ap-textarea"
                  rows={6}
                  placeholder={t('jobs.cover_letter_placeholder')}
                  value={form.coverLetter}
                  onChange={(e) => handleChange('coverLetter', e.target.value)}
                  maxLength={1000}
                />
                <p className="ap-char-count" aria-live="polite">
                  {t('jobs.char_count', { count: form.coverLetter.length })}
                </p>
              </div>
            </fieldset>

            <div className="ap-submit-row">
              <button
                type="submit"
                className="ap-btn ap-btn--primary ap-btn--submit"
                disabled={submitting}
                aria-busy={submitting}
              >
                {submitting ? (
                  <>
                    <span className="ap-btn-spinner" aria-hidden="true" />
                    {t('jobs.submitting')}
                  </>
                ) : (
                  t('jobs.submit_application')
                )}
              </button>
              <button
                type="button"
                className="ap-btn ap-btn--outline"
                onClick={() => navigate(-1)}
                disabled={submitting}
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>

          {job && (
            <aside className="ap-sidebar" aria-label={t('jobs.job_summary_aria')}>
              <div className="ap-summary-card">
                <h2 className="ap-summary-title">{t('jobs.application_summary')}</h2>
                <div className="ap-summary-job">
                  <strong>{job.title}</strong>
                  <span>{job.company}</span>
                  <span>{job.location}</span>
                  {job.salary && <span>{job.salary}</span>}
                </div>
                {job.tags?.length > 0 && (
                  <div className="ap-summary-tags" aria-label={t('jobs.required_skills_aria')}>
                    {job.tags.map((tag) => (
                      <span key={tag} className="ap-tag">{tag}</span>
                    ))}
                  </div>
                )}
                <p className="ap-summary-note">
                  <span aria-hidden="true">ℹ️</span>
                  {t('jobs.application_reviewed_note')}
                </p>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
