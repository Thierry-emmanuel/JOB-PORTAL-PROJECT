import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getJob, applyToJob } from '../../api/jobs';
import KoraNav from '../../components/KoraNav';           // ← added
import '../../styles/apply-page.css';

/**
 * ApplyPage
 * Submit an application for a specific job.
 *  - CV file upload (inline, portability)
 *  - Optional cover letter
 *  - Submit with loading / success / error feedback
 *
 * To use the CVUploadSection component instead, uncomment:
 *   import CVUploadSection from '../../components/profile/CVUploadSection';
 * and replace the "CV Upload" fieldset below.
 */
export default function ApplyPage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  /* ── State ────────────────────────────────────────────── */
  const [job,        setJob]        = useState(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [jobError,   setJobError]   = useState(null);

  const [form, setForm] = useState({
    fullName:     '',
    email:        '',
    phone:        '',
    coverLetter:  '',
    cvFile:       null,
    cvFileName:   '',
    linkedIn:     '',
    portfolio:    '',
    availability: '',
  });

  const [errors,      setErrors]      = useState({});
  const [submitting,  setSubmitting]  = useState(false);
  const [submitted,   setSubmitted]   = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const fileInputRef = useRef(null);

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

    // Pre-fill from localStorage if available
    const savedName  = localStorage.getItem('userName')  || '';
    const savedEmail = localStorage.getItem('userEmail') || '';
    setForm((f) => ({ ...f, fullName: savedName, email: savedEmail }));
  }, [id]);

  /* ── Validation ───────────────────────────────────────── */
  const validate = () => {
    const errs = {};
    if (!form.fullName.trim())   errs.fullName = 'Full name is required.';
    if (!form.email.trim())      errs.email    = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email))
                                 errs.email    = 'Enter a valid email.';
    if (!form.cvFile)            errs.cvFile   = 'Please upload your CV.';
    return errs;
  };

  /* ── Handlers ─────────────────────────────────────────── */
  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowed.includes(file.type)) {
      setErrors((e) => ({ ...e, cvFile: 'Only PDF or Word documents are accepted.' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((e) => ({ ...e, cvFile: 'File must be under 5 MB.' }));
      return;
    }
    setForm((f) => ({ ...f, cvFile: file, cvFileName: file.name }));
    setErrors((e) => ({ ...e, cvFile: undefined }));
  };

  const handleRemoveFile = () => {
    setForm((f) => ({ ...f, cvFile: null, cvFileName: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      document.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const fd = new FormData();
      fd.append('fullName',     form.fullName);
      fd.append('email',        form.email);
      fd.append('phone',        form.phone);
      fd.append('coverLetter',  form.coverLetter);
      fd.append('linkedIn',     form.linkedIn);
      fd.append('portfolio',    form.portfolio);
      fd.append('availability', form.availability);
      if (form.cvFile) fd.append('cv', form.cvFile);
      await applyToJob(id, fd);
      setSubmitted(true);
    } catch (err) {
      setSubmitError('Failed to submit your application. Please try again.');
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
      {/* ── Top nav ── */}
      <KoraNav />

      <div className="ap-container">
        {/* Back */}
        <button
          className="ap-back-btn"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          ← Back
        </button>

        {/* Job banner */}
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
          {/* ── Application form ───────────────────── */}
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

            {/* Personal info */}
            <fieldset className="ap-fieldset">
              <legend className="ap-legend">Personal Information</legend>

              <div className="ap-field">
                <label htmlFor="ap-fullName" className="ap-label">
                  Full Name{' '}
                  <span aria-hidden="true" className="ap-required">*</span>
                </label>
                <input
                  id="ap-fullName"
                  type="text"
                  className={`ap-input${errors.fullName ? ' ap-input--error' : ''}`}
                  value={form.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  aria-required="true"
                  aria-invalid={!!errors.fullName}
                  aria-describedby={errors.fullName ? 'ap-fullName-error' : undefined}
                  autoComplete="name"
                />
                {errors.fullName && (
                  <p id="ap-fullName-error" className="ap-field-error" role="alert">
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div className="ap-row">
                <div className="ap-field">
                  <label htmlFor="ap-email" className="ap-label">
                    Email{' '}
                    <span aria-hidden="true" className="ap-required">*</span>
                  </label>
                  <input
                    id="ap-email"
                    type="email"
                    className={`ap-input${errors.email ? ' ap-input--error' : ''}`}
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    aria-required="true"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'ap-email-error' : undefined}
                    autoComplete="email"
                  />
                  {errors.email && (
                    <p id="ap-email-error" className="ap-field-error" role="alert">
                      {errors.email}
                    </p>
                  )}
                </div>
                <div className="ap-field">
                  <label htmlFor="ap-phone" className="ap-label">Phone</label>
                  <input
                    id="ap-phone"
                    type="tel"
                    className="ap-input"
                    value={form.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className="ap-row">
                <div className="ap-field">
                  <label htmlFor="ap-linkedIn" className="ap-label">LinkedIn Profile</label>
                  <input
                    id="ap-linkedIn"
                    type="url"
                    className="ap-input"
                    placeholder="https://linkedin.com/in/…"
                    value={form.linkedIn}
                    onChange={(e) => handleChange('linkedIn', e.target.value)}
                  />
                </div>
                <div className="ap-field">
                  <label htmlFor="ap-portfolio" className="ap-label">Portfolio / Website</label>
                  <input
                    id="ap-portfolio"
                    type="url"
                    className="ap-input"
                    placeholder="https://yoursite.com"
                    value={form.portfolio}
                    onChange={(e) => handleChange('portfolio', e.target.value)}
                  />
                </div>
              </div>

              <div className="ap-field">
                <label htmlFor="ap-availability" className="ap-label">Availability</label>
                <select
                  id="ap-availability"
                  className="ap-select"
                  value={form.availability}
                  onChange={(e) => handleChange('availability', e.target.value)}
                >
                  <option value="">Select availability</option>
                  <option value="immediately">Immediately</option>
                  <option value="2weeks">2 weeks notice</option>
                  <option value="1month">1 month notice</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </fieldset>

            {/* CV Upload */}
            <fieldset className="ap-fieldset">
              <legend className="ap-legend">
                CV / Résumé{' '}
                <span aria-hidden="true" className="ap-required">*</span>
              </legend>

              <div
                className={`ap-upload-zone${errors.cvFile ? ' ap-upload-zone--error' : ''}${form.cvFile ? ' ap-upload-zone--filled' : ''}`}
                onClick={() => !form.cvFile && fileInputRef.current?.click()}
                onKeyDown={(e) =>
                  (e.key === 'Enter' || e.key === ' ') &&
                  !form.cvFile &&
                  fileInputRef.current?.click()
                }
                role="button"
                tabIndex={0}
                aria-label="Upload CV"
                aria-invalid={!!errors.cvFile}
                aria-describedby={errors.cvFile ? 'ap-cv-error' : 'ap-cv-hint'}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="ap-file-input"
                  onChange={handleFileChange}
                  aria-hidden="true"
                  tabIndex={-1}
                />
                {form.cvFile ? (
                  <div className="ap-file-preview">
                    <span className="ap-file-icon" aria-hidden="true">📄</span>
                    <span className="ap-file-name">{form.cvFileName}</span>
                    <button
                      type="button"
                      className="ap-file-remove"
                      onClick={(e) => { e.stopPropagation(); handleRemoveFile(); }}
                      aria-label="Remove uploaded file"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="ap-upload-prompt">
                    <span className="ap-upload-icon" aria-hidden="true">⬆️</span>
                    <p className="ap-upload-text">Click to upload or drag & drop</p>
                    <p id="ap-cv-hint" className="ap-upload-hint">PDF, DOC, DOCX · max 5 MB</p>
                  </div>
                )}
              </div>
              {errors.cvFile && (
                <p id="ap-cv-error" className="ap-field-error" role="alert">
                  {errors.cvFile}
                </p>
              )}
            </fieldset>

            {/* Cover letter */}
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
                  maxLength={2000}
                />
                <p className="ap-char-count" aria-live="polite">
                  {form.coverLetter.length}/2000 characters
                </p>
              </div>
            </fieldset>

            {/* Submit */}
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

          {/* ── Side summary ─────────────────────────── */}
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
