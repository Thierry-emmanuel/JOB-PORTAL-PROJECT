import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getJob, applyToJob } from '../../api/jobs';
import { useAuth } from '../../context/AuthContext';
import KoraNav from '../../components/KoraNav';
import '../../styles/apply-page.css';

export default function ApplyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

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
        setJobError('Could not load job details.');
      } finally {
        setJobLoading(false);
      }
    }
    load();
  }, [id]);

  /* ── Validation ───────────────────────────────────────── */
  const validate = () => {
    const errs = {};
    if (!form.expectedSalary) {
      errs.expectedSalary = 'Expected salary is required.';
    } else {
      const salary = parseFloat(form.expectedSalary);
      if (isNaN(salary) || salary <= 0) {
        errs.expectedSalary = 'Expected salary must be a positive number.';
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
      setSubmitError('You must be logged in to apply.');
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
      const msg = err.response?.data?.message || 'Failed to submit your application. Please try again.';
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
          <p>Loading job details…</p>
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
          <Link to="/jobs" className="ap-btn ap-btn--primary">Back to Jobs</Link>
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
            <h1>Already Applied</h1>
            <p>
              You have already submitted an application for{' '}
              <strong>{job.title}</strong>.
            </p>
            <div className="ap-already-actions">
              <Link to="/employee/dashboard" className="ap-btn ap-btn--primary">
                View Dashboard
              </Link>
              <Link to="/jobs" className="ap-btn ap-btn--outline">
                Browse More Jobs
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
            <h1 className="ap-success-title">Application Submitted!</h1>
            <p className="ap-success-msg">
              Your application for <strong>{job?.title}</strong> at{' '}
              <strong>{job?.company}</strong> has been sent.
              We'll notify you about next steps.
            </p>
            <div className="ap-success-actions">
              <Link to="/employee/dashboard" className="ap-btn ap-btn--primary">
                View Dashboard
              </Link>
              <Link to="/jobs" className="ap-btn ap-btn--outline">
                Browse More Jobs
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
          aria-label="Go back"
        >
          ← Back
        </button>

        {job && (
          <div className="ap-job-banner" aria-label={`Applying for ${job.title}`}>
            <div className="ap-job-logo" aria-hidden="true">
              {job.logo
                ? <img src={job.logo} alt={`${job.company} logo`} />
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
            aria-label="Job application form"
          >
            <h2 className="ap-form-heading">Your Application</h2>

            {submitError && (
              <div className="ap-submit-error" role="alert">{submitError}</div>
            )}

            <fieldset className="ap-fieldset">
              <legend className="ap-legend">Profile & Resume</legend>
              <div className="ap-profile-hint">
                <p style={{ fontSize: '14px', color: '#374151', background: '#F3F4F6', padding: '12px', borderRadius: '8px' }}>
                  <span aria-hidden="true">📄</span> <strong>Your profile details and uploaded CV</strong> will be automatically attached to this application. Please ensure your profile is up to date in your dashboard before applying.
                </p>
              </div>
            </fieldset>

            <fieldset className="ap-fieldset">
              <legend className="ap-legend">Job Requirements</legend>

              <div className="ap-field">
                <label htmlFor="ap-expectedSalary" className="ap-label">
                  Expected Salary (Monthly){' '}
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
                    placeholder="e.g. 500000"
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
                Cover Letter{' '}
                <span className="ap-optional">(optional)</span>
              </legend>
              <div className="ap-field">
                <label htmlFor="ap-coverLetter" className="ap-label">
                  Tell the employer why you're a great fit
                </label>
                <textarea
                  id="ap-coverLetter"
                  className="ap-textarea"
                  rows={6}
                  placeholder="Write a short cover letter highlighting your relevant experience and enthusiasm for this role…"
                  value={form.coverLetter}
                  onChange={(e) => handleChange('coverLetter', e.target.value)}
                  maxLength={1000}
                />
                <p className="ap-char-count" aria-live="polite">
                  {form.coverLetter.length}/1000 characters
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
                    Submitting…
                  </>
                ) : (
                  'Submit Application'
                )}
              </button>
              <button
                type="button"
                className="ap-btn ap-btn--outline"
                onClick={() => navigate(-1)}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </form>

          {job && (
            <aside className="ap-sidebar" aria-label="Job summary">
              <div className="ap-summary-card">
                <h2 className="ap-summary-title">Application Summary</h2>
                <div className="ap-summary-job">
                  <strong>{job.title}</strong>
                  <span>{job.company}</span>
                  <span>{job.location}</span>
                  {job.salary && <span>{job.salary}</span>}
                </div>
                {job.tags?.length > 0 && (
                  <div className="ap-summary-tags" aria-label="Required skills">
                    {job.tags.map((t) => (
                      <span key={t} className="ap-tag">{t}</span>
                    ))}
                  </div>
                )}
                <p className="ap-summary-note">
                  <span aria-hidden="true">ℹ️</span>
                  Your application will be reviewed by the hiring team.
                </p>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
