/**
 * ApplyPage.jsx  — full professional application flow
 *
 * Steps:
 *  1. Job preview                  (auto-loaded)
 *  2. Personal info                (pre-filled from profile)
 *  3. CV / resume upload           (pdf, doc, docx — max 5 MB)
 *  4. Cover letter                 (rich textarea with live count)
 *  5. Additional documents         (optional — up to 3 files)
 *  6. Salary expectation + notes
 *  7. Review & submit
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft, ChevronRight, Upload, X, FileText,
  User, Briefcase, DollarSign, CheckCircle2,
  AlertCircle, Paperclip, Eye, Send, Building2,
  MapPin, Clock, Banknote, CheckCircle,
} from 'lucide-react';
import { applyToJob } from '../../api/jobs';
import { cachedGetJob } from '../../api/cachedApi';
import { getJobSeekerProfile } from '../../api/profiles';
import { useAuth } from '../../context/AuthContext';

import '../../styles/apply-page.css';

/* ─── Constants ─────────────────────────────────────────── */
const MAX_CV_MB     = 5;
const MAX_DOC_MB    = 5;
const MAX_EXTRA_DOCS = 3;
const ACCEPTED_CV   = '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const STEPS = [
  { id: 'info',     label: 'Personal Info',  icon: User        },
  { id: 'resume',   label: 'Resume / CV',    icon: FileText    },
  { id: 'letter',   label: 'Cover Letter',   icon: Briefcase   },
  { id: 'docs',     label: 'Documents',      icon: Paperclip   },
  { id: 'salary',   label: 'Expectations',   icon: DollarSign  },
  { id: 'review',   label: 'Review',         icon: Eye         },
];

/* ─── Helpers ────────────────────────────────────────────── */
function fileToBase64(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload  = () => res(reader.result);
    reader.onerror = rej;
  });
}

function fmtBytes(bytes) {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024**2)    return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/1024**2).toFixed(1)} MB`;
}

function UploadZone({ label, hint, accept, maxMb, file, onFile, onRemove, error }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  }, [onFile]);

  return (
    <div className="ap-upload-zone-wrap">
      {file ? (
        <div className="ap-file-preview-row">
          <FileText size={22} className="ap-file-icon-green" />
          <div className="ap-file-info">
            <span className="ap-file-name">{file.name}</span>
            <span className="ap-file-size">{fmtBytes(file.size)}</span>
          </div>
          <button type="button" className="ap-file-remove" onClick={onRemove} aria-label="Remove file">
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          className={`ap-upload-zone${dragging ? ' dragging' : ''}${error ? ' ap-upload-zone--error' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
          aria-label={label}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="ap-file-input"
            onChange={e => e.target.files[0] && onFile(e.target.files[0])}
          />
          <Upload size={26} className="ap-upload-icon-svg" />
          <p className="ap-upload-text">{label}</p>
          <p className="ap-upload-hint">{hint || `Drag & drop or click — Max ${maxMb} MB`}</p>
        </div>
      )}
      {error && <p className="ap-field-error">{error}</p>}
    </div>
  );
}

function StepIndicator({ steps, current }) {
  return (
    <div className="ap-steps">
      {steps.map((s, i) => {
        const Icon = s.icon;
        const done    = i < current;
        const active  = i === current;
        return (
          <div key={s.id} className="ap-step-item">
            <div className={`ap-step-circle${done ? ' done' : active ? ' active' : ''}`}>
              {done ? <CheckCircle2 size={14} /> : <Icon size={14} />}
            </div>
            <span className={`ap-step-label${active ? ' active' : done ? ' done' : ''}`}>{s.label}</span>
            {i < steps.length - 1 && <div className={`ap-step-line${done ? ' done' : ''}`} />}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function ApplyPage() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { user }    = useAuth();
  const { t }       = useTranslation();

  /* ── Remote data ──────────────────────────────────────── */
  const [job,        setJob]        = useState(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [jobError,   setJobError]   = useState(null);

  /* ── Wizard state ─────────────────────────────────────── */
  const [step, setStep]       = useState(0);
  const [errors, setErrors]   = useState({});
  const [submitting, setSub]  = useState(false);
  const [submitted, setDone]  = useState(false);
  const [submitError, setSErr] = useState(null);

  /* ── Form fields ──────────────────────────────────────── */
  const [form, setForm] = useState({
    // Step 0 — personal
    fullName:    user?.fullName || '',
    email:       user?.email    || '',
    phone:       '',
    city:        '',
    linkedin:    '',
    portfolio:   '',
    description: '',
    // Step 1 — resume
    cvFile:      null,
    cvBase64:    null,
    cvUrl:       '',   // existing URL from profile
    // Step 2 — cover letter
    coverLetter: '',
    // Step 3 — extra docs
    extraDocs:   [],   // [{file, base64, name}]
    // Step 4 — salary
    expectedSalary: '',
    availability:   'immediately',
    notes:          '',
  });

  /* ── Load job + profile ───────────────────────────────── */
  useEffect(() => {
    async function load() {
      try {
        const [jobData, profileData] = await Promise.allSettled([
          cachedGetJob(id),
          user?.id ? getJobSeekerProfile(user.id) : Promise.resolve(null),
        ]);
        if (jobData.status === 'fulfilled')     setJob(jobData.value);
        else                                    setJobError('Could not load job details.');
        if (profileData.status === 'fulfilled' && profileData.value) {
          const p = profileData.value;
          setForm(f => ({
            ...f,
            fullName:    p.fullName    || f.fullName,
            email:       p.email      || f.email,
            phone:       p.phone      || '',
            city:        p.city       || '',
            linkedin:    p.linkedInUrl || '',
            portfolio:   p.portfolioUrl || '',
            description: p.profileSummary || '',
            cvUrl:       p.cvUrl || '',
          }));
        }
      } catch {
        setJobError('Could not load job details.');
      } finally {
        setJobLoading(false);
      }
    }
    load();
  }, [id, user?.id]);

  /* ── Field helpers ────────────────────────────────────── */
  const upd = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: undefined }));
  };

  /* ── CV upload ────────────────────────────────────────── */
  const handleCvFile = async (file) => {
    if (file.size > MAX_CV_MB * 1024 * 1024) {
      setErrors(e => ({ ...e, cvFile: `File must be under ${MAX_CV_MB} MB` }));
      return;
    }
    const b64 = await fileToBase64(file);
    upd('cvFile', file);
    upd('cvBase64', b64);
  };

  /* ── Extra docs ───────────────────────────────────────── */
  const handleExtraDoc = async (file) => {
    if (form.extraDocs.length >= MAX_EXTRA_DOCS) return;
    if (file.size > MAX_DOC_MB * 1024 * 1024) {
      setErrors(e => ({ ...e, extraDocs: `Each file must be under ${MAX_DOC_MB} MB` }));
      return;
    }
    const b64 = await fileToBase64(file);
    setForm(f => ({
      ...f,
      extraDocs: [...f.extraDocs, { file, base64: b64, name: file.name }],
    }));
  };

  const removeExtraDoc = (idx) => {
    setForm(f => ({ ...f, extraDocs: f.extraDocs.filter((_, i) => i !== idx) }));
  };

  /* ── Validation per step ──────────────────────────────── */
  const validateStep = (s) => {
    const errs = {};
    if (s === 0) {
      if (!form.fullName.trim())  errs.fullName  = 'Full name is required';
      if (!form.email.trim())     errs.email     = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
      if (!form.phone.trim())     errs.phone     = 'Phone number is required';
    }
    if (s === 1) {
      if (!form.cvFile && !form.cvUrl) errs.cvFile = 'Please upload your resume / CV';
    }
    if (s === 4) {
      if (!form.expectedSalary) {
        errs.expectedSalary = 'Expected salary is required';
      } else if (isNaN(+form.expectedSalary) || +form.expectedSalary <= 0) {
        errs.expectedSalary = 'Enter a valid positive salary';
      }
    }
    return errs;
  };

  const goNext = () => {
    const errs = validateStep(step);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStep(s => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goPrev = () => {
    setErrors({});
    setStep(s => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── Submit ───────────────────────────────────────────── */
  const handleSubmit = async () => {
    if (!user?.id) { setSErr('You must be logged in to apply.'); return; }

    // Validate the final step before submitting (goNext skips this for the last step)
    const errs = validateStep(step);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    // Guard: numericId must be present — it's the backend's jobPostingId (Long FK)
    if (!job?.numericId) {
      setSErr('Unable to identify job posting. Please refresh the page and try again.');
      return;
    }

    setSub(true); setSErr(null);
    try {
      const payload = {
        jobPostingId:   job.numericId,
        coverLetter:    form.coverLetter?.slice(0, 1000) || null,
        expectedSalary: parseFloat(form.expectedSalary),
      };
      await applyToJob(user.id, payload);
      setDone(true);
    } catch (err) {
      // Backend returns Spring ProblemDetail: { detail, title, status, ... }
      // NOT a plain { message } envelope — read `detail` first, then fall back
      const detail = err.response?.data?.detail
        || err.response?.data?.message
        || err.response?.data?.error
        || null;
      if (err.response?.status === 400 && detail?.toLowerCase().includes('already applied')) {
        setSErr('You have already applied to this job.');
      } else {
        setSErr(detail || 'Application failed. Please try again.');
      }
    } finally {
      setSub(false);
    }
  };

  /* ── Early returns ────────────────────────────────────── */
  if (jobLoading) return (
    <div className="ap-page">
      <div className="ap-loading"><div className="ap-spinner" /><p>Loading job details…</p></div>
    </div>
  );
  if (jobError) return (
    <div className="ap-page">
      <div className="ap-error" role="alert"><AlertCircle size={24}/><p>{jobError}</p>
        <Link to="/jobs" className="ap-btn ap-btn--primary">Back to jobs</Link>
      </div>
    </div>
  );
  if (job?.applied && !submitted) return (
    <div className="ap-page">
      <div className="ap-container ap-container--narrow">
        <div className="ap-state-card">
          <span className="ap-state-icon"><CheckCircle size={48} color="#10B981" /></span>
          <h1>Already Applied</h1>
          <p>You have already applied for <strong>{job.title}</strong> at <strong>{job.company}</strong>.</p>
          <div className="ap-state-actions">
            <Link to="/employee/applications" className="ap-btn ap-btn--primary">View My Applications</Link>
            <Link to="/jobs"                  className="ap-btn ap-btn--outline">Browse More Jobs</Link>
          </div>
        </div>
      </div>
    </div>
  );
  if (submitted) return (
    <div className="ap-page">
      <div className="ap-container ap-container--narrow">
        <div className="ap-state-card ap-state-card--success">
          <div className="ap-success-anim">
            <CheckCircle2 size={40} color="#15803d" />
          </div>
          <h1>Application Submitted!</h1>
          <p>Your application for <strong>{job?.title}</strong> at <strong>{job?.company}</strong> has been sent successfully. We'll notify you of any updates.</p>
          <div className="ap-state-actions">
            <Link to="/employee/applications" className="ap-btn ap-btn--primary">Track My Applications</Link>
            <Link to="/jobs"                  className="ap-btn ap-btn--outline">Browse More Jobs</Link>
          </div>
        </div>
      </div>
    </div>
  );

  /* ── Step content renderers ───────────────────────────── */
  const renderStep = () => {
    switch (step) {
      /* ── 0: Personal Info ─── */
      case 0: return (
        <div className="ap-step-content">
          <div className="ap-step-header">
            <User size={20} className="ap-step-header-icon" />
            <div>
              <h2>Personal Information</h2>
              <p>Tell employers who you are. This information is pre-filled from your profile.</p>
            </div>
          </div>
          <div className="ap-form-grid">
            <div className="ap-field">
              <label className="ap-label">Full Name <span className="ap-req">*</span></label>
              <input className={`ap-input${errors.fullName?' ap-input--error':''}`} value={form.fullName} onChange={e=>upd('fullName',e.target.value)} placeholder="Jean-Paul Mbarga" />
              {errors.fullName && <p className="ap-field-error">{errors.fullName}</p>}
            </div>
            <div className="ap-field">
              <label className="ap-label">Email Address <span className="ap-req">*</span></label>
              <input type="email" className={`ap-input${errors.email?' ap-input--error':''}`} value={form.email} onChange={e=>upd('email',e.target.value)} placeholder="you@example.com" />
              {errors.email && <p className="ap-field-error">{errors.email}</p>}
            </div>
            <div className="ap-field">
              <label className="ap-label">Phone Number <span className="ap-req">*</span></label>
              <input type="tel" className={`ap-input${errors.phone?' ap-input--error':''}`} value={form.phone} onChange={e=>upd('phone',e.target.value)} placeholder="+237 6xx xxx xxx" />
              {errors.phone && <p className="ap-field-error">{errors.phone}</p>}
            </div>
            <div className="ap-field">
              <label className="ap-label">City</label>
              <input className="ap-input" value={form.city} onChange={e=>upd('city',e.target.value)} placeholder="Douala, Cameroon" />
            </div>
            <div className="ap-field">
              <label className="ap-label">LinkedIn URL <span className="ap-optional">(optional)</span></label>
              <input type="url" className="ap-input" value={form.linkedin} onChange={e=>upd('linkedin',e.target.value)} placeholder="https://linkedin.com/in/yourname" />
            </div>
            <div className="ap-field">
              <label className="ap-label">Portfolio / Website <span className="ap-optional">(optional)</span></label>
              <input type="url" className="ap-input" value={form.portfolio} onChange={e=>upd('portfolio',e.target.value)} placeholder="https://yourportfolio.com" />
            </div>
            <div className="ap-field ap-field--full">
              <label className="ap-label">Professional Summary <span className="ap-optional">(optional)</span></label>
              <textarea
                className="ap-textarea"
                rows={4}
                value={form.description}
                onChange={e => upd('description', e.target.value)}
                placeholder="Briefly describe your background, skills, and what makes you a great candidate for this role…"
                maxLength={600}
              />
              <p className="ap-char-count">{form.description.length}/600</p>
            </div>
          </div>
        </div>
      );

      /* ── 1: Resume / CV ─── */
      case 1: return (
        <div className="ap-step-content">
          <div className="ap-step-header">
            <FileText size={20} className="ap-step-header-icon" />
            <div>
              <h2>Resume / CV</h2>
              <p>Upload your most up-to-date CV. PDF format preferred.</p>
            </div>
          </div>
          {form.cvUrl && !form.cvFile && (
            <div className="ap-existing-cv-notice">
              <CheckCircle2 size={15} color="#16a34a" />
              <span>Your profile CV will be submitted. Upload a new one to override.</span>
              <a href={form.cvUrl} target="_blank" rel="noreferrer" className="ap-link">View existing CV</a>
            </div>
          )}
          <UploadZone
            label="Upload your Resume / CV"
            hint="PDF, DOC, DOCX — Max 5 MB"
            accept={ACCEPTED_CV}
            maxMb={MAX_CV_MB}
            file={form.cvFile}
            onFile={handleCvFile}
            onRemove={() => { upd('cvFile', null); upd('cvBase64', null); }}
            error={errors.cvFile}
          />
          <div className="ap-cv-tips">
            <h4>Tips for a strong CV</h4>
            <ul>
              <li>Keep it to 1–2 pages</li>
              <li>Use clear section headings: Experience, Education, Skills</li>
              <li>Quantify achievements ("Grew revenue by 30%")</li>
              <li>Tailor keywords to this job's requirements</li>
            </ul>
          </div>
        </div>
      );

      /* ── 2: Cover Letter ─── */
      case 2: return (
        <div className="ap-step-content">
          <div className="ap-step-header">
            <Briefcase size={20} className="ap-step-header-icon" />
            <div>
              <h2>Cover Letter <span className="ap-optional-badge">Optional</span></h2>
              <p>A personalised letter significantly increases your chances.</p>
            </div>
          </div>
          <div className="ap-field">
            <label className="ap-label">Your cover letter</label>
            <textarea
              className="ap-textarea ap-textarea--tall"
              rows={12}
              value={form.coverLetter}
              onChange={e => upd('coverLetter', e.target.value)}
              maxLength={1000}
              placeholder={`Dear Hiring Manager,\n\nI am excited to apply for the ${job?.title || 'position'} role at ${job?.company || 'your company'}…\n\nYours sincerely,\n${form.fullName}`}
            />
            <p className="ap-char-count">{form.coverLetter.length}/1000</p>
          </div>
          <div className="ap-letter-prompts">
            <p className="ap-prompts-title">Need inspiration? Cover these points:</p>
            <div className="ap-prompts-grid">
              {['Why this company?','Why this role?','Your top 3 relevant skills','A measurable achievement'].map(p=>(
                <span key={p} className="ap-prompt-chip">{p}</span>
              ))}
            </div>
          </div>
        </div>
      );

      /* ── 3: Additional Documents ─── */
      case 3: return (
        <div className="ap-step-content">
          <div className="ap-step-header">
            <Paperclip size={20} className="ap-step-header-icon" />
            <div>
              <h2>Additional Documents <span className="ap-optional-badge">Optional</span></h2>
              <p>Attach certifications, portfolios, or references. Max {MAX_EXTRA_DOCS} files.</p>
            </div>
          </div>
          {errors.extraDocs && <p className="ap-field-error">{errors.extraDocs}</p>}
          <div className="ap-extra-docs-list">
            {form.extraDocs.map((d, i) => (
              <div key={i} className="ap-extra-doc-row">
                <FileText size={16} className="ap-file-icon-green" />
                <span className="ap-file-name">{d.name}</span>
                <span className="ap-file-size">{fmtBytes(d.file.size)}</span>
                <button type="button" className="ap-file-remove" onClick={()=>removeExtraDoc(i)}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          {form.extraDocs.length < MAX_EXTRA_DOCS && (
            <UploadZone
              label={`Add document (${form.extraDocs.length}/${MAX_EXTRA_DOCS})`}
              hint="PDF, DOC, DOCX, PNG, JPG — Max 5 MB"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              maxMb={MAX_DOC_MB}
              file={null}
              onFile={handleExtraDoc}
              onRemove={()=>{}}
            />
          )}
          <div className="ap-doc-suggestions">
            <p className="ap-prompts-title">What to include:</p>
            <div className="ap-prompts-grid">
              {['Professional certifications','Portfolio samples','Reference letters','Academic transcripts'].map(s=>(
                <span key={s} className="ap-prompt-chip">{s}</span>
              ))}
            </div>
          </div>
        </div>
      );

      /* ── 4: Salary & Availability ─── */
      case 4: return (
        <div className="ap-step-content">
          <div className="ap-step-header">
            <DollarSign size={20} className="ap-step-header-icon" />
            <div>
              <h2>Salary & Availability</h2>
              <p>Set your expectations so we can match you with the right offer.</p>
            </div>
          </div>
          <div className="ap-form-grid">
            <div className="ap-field ap-field--full">
              <label className="ap-label">Expected Salary (XAF / month) <span className="ap-req">*</span></label>
              <div className="ap-input-prefix-wrap">
                <span className="ap-input-prefix">XAF</span>
                <input
                  type="number"
                  min="1"
                  className={`ap-input ap-input--prefixed${errors.expectedSalary?' ap-input--error':''}`}
                  value={form.expectedSalary}
                  onChange={e=>upd('expectedSalary',e.target.value)}
                  placeholder="e.g. 1500000"
                />
              </div>
              {errors.expectedSalary && <p className="ap-field-error">{errors.expectedSalary}</p>}
              {job?.salary && <p className="ap-salary-hint">Posted range: <strong>{job.salary}</strong></p>}
            </div>
            <div className="ap-field ap-field--full">
              <label className="ap-label">Earliest availability</label>
              <div className="ap-radio-group">
                {[
                  { val:'immediately', label:'Immediately' },
                  { val:'2weeks',      label:'2 weeks' },
                  { val:'1month',      label:'1 month' },
                  { val:'3months',     label:'3 months+' },
                ].map(o => (
                  <label key={o.val} className={`ap-radio-chip${form.availability===o.val?' active':''}`}>
                    <input type="radio" name="availability" value={o.val} checked={form.availability===o.val} onChange={()=>upd('availability',o.val)} />
                    {o.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="ap-field ap-field--full">
              <label className="ap-label">Additional notes to employer <span className="ap-optional">(optional)</span></label>
              <textarea
                className="ap-textarea"
                rows={3}
                value={form.notes}
                onChange={e=>upd('notes',e.target.value)}
                placeholder="Anything else you'd like the employer to know…"
                maxLength={500}
              />
              <p className="ap-char-count">{form.notes.length}/500</p>
            </div>
          </div>
        </div>
      );

      /* ── 5: Review ─── */
      case 5: return (
        <div className="ap-step-content">
          <div className="ap-step-header">
            <Eye size={20} className="ap-step-header-icon" />
            <div>
              <h2>Review & Submit</h2>
              <p>Everything look good? Submit your application.</p>
            </div>
          </div>
          {submitError && (
            <div className="ap-submit-error" role="alert">
              <AlertCircle size={14} /> {submitError}
            </div>
          )}
          <div className="ap-review-grid">
            <ReviewSection title="Personal Information" icon={<User size={14}/>}>
              <ReviewRow label="Name"        value={form.fullName} />
              <ReviewRow label="Email"       value={form.email} />
              <ReviewRow label="Phone"       value={form.phone} />
              <ReviewRow label="City"        value={form.city || '—'} />
              <ReviewRow label="LinkedIn"    value={form.linkedin || '—'} />
              <ReviewRow label="Portfolio"   value={form.portfolio || '—'} />
              {form.description && <ReviewRow label="Summary" value={form.description} multiline />}
            </ReviewSection>

            <ReviewSection title="Resume / CV" icon={<FileText size={14}/>}>
              {form.cvFile
                ? <ReviewRow label="File" value={`${form.cvFile.name} (${fmtBytes(form.cvFile.size)})`} />
                : form.cvUrl
                  ? <ReviewRow label="File" value="Existing profile CV" />
                  : <ReviewRow label="File" value="Not provided" warn />}
            </ReviewSection>

            <ReviewSection title="Cover Letter" icon={<Briefcase size={14}/>}>
              {form.coverLetter
                ? <ReviewRow label="Letter" value={form.coverLetter} multiline />
                : <ReviewRow label="Letter" value="Not provided (optional)" />}
            </ReviewSection>

            <ReviewSection title="Additional Documents" icon={<Paperclip size={14}/>}>
              {form.extraDocs.length === 0
                ? <ReviewRow label="Docs" value="None attached" />
                : form.extraDocs.map((d,i) => <ReviewRow key={i} label={`Doc ${i+1}`} value={d.name} />)}
            </ReviewSection>

            <ReviewSection title="Salary & Availability" icon={<DollarSign size={14}/>}>
              <ReviewRow label="Expected Salary" value={form.expectedSalary ? `${Number(form.expectedSalary).toLocaleString()} XAF` : '—'} />
              <ReviewRow label="Availability"    value={form.availability} />
              {form.notes && <ReviewRow label="Notes" value={form.notes} multiline />}
            </ReviewSection>
          </div>
        </div>
      );

      default: return null;
    }
  };

  /* ── Main render ──────────────────────────────────────── */
  return (
    <div className="ap-page">
      <div className="ap-container ap-container--wide">

        {/* Back */}
        <button className="ap-back-btn" onClick={() => navigate(-1)} type="button">
          <ChevronLeft size={15} /> Back
        </button>

        {/* Job banner */}
        {job && (
          <div className="ap-job-banner">
            <div className="ap-job-logo">
              {job.logo ? <img src={job.logo} alt={job.company} /> : <span>{job.company.charAt(0)}</span>}
            </div>
            <div className="ap-job-banner-info">
              <h1 className="ap-job-title">{job.title}</h1>
              <div className="ap-job-meta">
                <span><Building2 size={12}/>{job.company}</span>
                <span><MapPin size={12}/>{job.location}</span>
                <span><Briefcase size={12}/>{job.type}</span>
                {job.salary && <span><Banknote size={12}/>{job.salary}</span>}
              </div>
            </div>
            <div className="ap-job-banner-badge">
              <Send size={13} /> Apply Now
            </div>
          </div>
        )}

        {/* Step indicator */}
        <StepIndicator steps={STEPS} current={step} />

        {/* Two-column layout */}
        <div className="ap-layout">
          <form
            className="ap-form-card"
            onSubmit={e => { e.preventDefault(); step === STEPS.length - 1 ? handleSubmit() : goNext(); }}
            noValidate
          >
            {renderStep()}

            {/* Navigation */}
            <div className="ap-form-nav">
              {step > 0 && (
                <button type="button" className="ap-btn ap-btn--outline" onClick={goPrev}>
                  <ChevronLeft size={14} /> Back
                </button>
              )}
              <div style={{ flex: 1 }} />
              {step < STEPS.length - 1 ? (
                <button type="submit" className="ap-btn ap-btn--primary">
                  Continue <ChevronRight size={14} />
                </button>
              ) : (
                <button type="submit" className="ap-btn ap-btn--primary ap-btn--submit" disabled={submitting}>
                  {submitting
                    ? <><span className="ap-btn-spinner" /> Submitting…</>
                    : <><Send size={14} /> Submit Application</>}
                </button>
              )}
            </div>
          </form>

          {/* Sidebar */}
          {job && (
            <aside className="ap-sidebar">
              <div className="ap-summary-card">
                <h3 className="ap-summary-title">Application Summary</h3>
                <div className="ap-summary-job">
                  <strong>{job.title}</strong>
                  <span><Building2 size={11}/> {job.company}</span>
                  <span><MapPin size={11}/> {job.location}</span>
                  {job.salary && <span><Banknote size={11}/> {job.salary}</span>}
                </div>
                {job.tags?.length > 0 && (
                  <div className="ap-summary-tags">
                    {job.tags.map(tag => <span key={tag} className="ap-tag">{tag}</span>)}
                  </div>
                )}
                <div className="ap-progress-section">
                  <div className="ap-progress-label">
                    <span>Progress</span>
                    <span>{Math.round(((step) / (STEPS.length - 1)) * 100)}%</span>
                  </div>
                  <div className="ap-progress-bar">
                    <div
                      className="ap-progress-fill"
                      style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="ap-checklist">
                  {STEPS.map((s, i) => {
                    const Icon = s.icon;
                    const done = i < step || (i === step && step === STEPS.length - 1);
                    return (
                      <div key={s.id} className={`ap-checklist-item${done?' done':i===step?' active':''}`}>
                        {done
                          ? <CheckCircle2 size={13} className="ap-check-done" />
                          : <Icon size={13} className="ap-check-icon" />}
                        <span>{s.label}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="ap-summary-note">
                  <AlertCircle size={11} />
                  Your application will be reviewed within 48 hours.
                </p>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Review helpers ─────────────────────────────────────── */
function ReviewSection({ title, icon, children }) {
  return (
    <div className="ap-review-section">
      <h4 className="ap-review-section-title">{icon}{title}</h4>
      <div className="ap-review-rows">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value, multiline, warn }) {
  return (
    <div className="ap-review-row">
      <span className="ap-review-label">{label}</span>
      <span className={`ap-review-value${warn?' warn':''}`} style={{ whiteSpace: multiline?'pre-wrap':'normal' }}>
        {value}
      </span>
    </div>
  );
}