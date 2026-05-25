import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Briefcase, MapPin, DollarSign, Calendar, FileText,
  Tag, CheckCircle, X, Plus, ArrowLeft, ArrowRight,
  Eye, Lightbulb, LogOut, Bell, Settings, Users,
  BarChart2, Menu, Building2
} from "lucide-react";
import koraLogo from "../../assets/absolute-size-logo.png";
import "../../styles/profile.css";
import "../../styles/employer-profile.css";
import "../../styles/employer-dashboard.css";
import "../../styles/PostJobs.css";

// ── Constants ─────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Basic Info"    },
  { id: 2, label: "Details"       },
  { id: 3, label: "Requirements"  },
  { id: 4, label: "Review"        },
];

const JOB_CATEGORIES = [
  "Software Engineering", "Frontend Development", "Backend Development",
  "Mobile Development", "DevOps & Infrastructure", "Data & Analytics",
  "UI/UX Design", "Product Management", "Marketing", "Finance",
  "Human Resources", "Sales", "Customer Support", "Other",
];

const SKILL_SUGGESTIONS = [
  "Java", "Spring Boot", "React.js", "Node.js", "Python",
  "MySQL", "PostgreSQL", "Docker", "Git", "REST API",
  "TypeScript", "AWS", "Linux", "Agile", "Communication",
];

// ── Initial Form State ────────────────────────────────────
const INITIAL_FORM = {
  title:       "",
  category:    "",
  type:        "",
  location:    "",
  salaryMin:   "",
  salaryMax:   "",
  currency:    "XAF",
  deadline:    "",
  description: "",
  skills:      [],
  experience:  "",
  education:   "",
  remote:      false,
};

// ── Step Indicator ────────────────────────────────────────
function StepIndicator({ current }) {
  const { t } = useTranslation();
  return (
    <div className="pj-steps">
      {STEPS.map((step, idx) => {
        const isDone   = current > step.id;
        const isActive = current === step.id;
        return (
          <div key={step.id} style={{ display: "flex", alignItems: "center", flex: idx < STEPS.length - 1 ? 1 : 0 }}>
            <div className={`pj-step ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}>
              <div className="pj-step-circle">
                {isDone ? <CheckCircle size={16} /> : step.id}
              </div>
              <span className="pj-step-label">{step.label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`pj-step-line ${isDone ? "done" : ""}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Live Preview ──────────────────────────────────────────
function JobPreview({ form }) {
  const { t } = useTranslation();
  const isEmpty = !form.title && !form.category && !form.type;
  return (
    <div>
      <div className="pj-preview-card">
        <div className="pj-preview-title">
          <Eye size={15} /> {t('employer.live_preview')}
        </div>
        {isEmpty ? (
          <div className="pj-preview-empty">
            {t('employer.preview_empty')}
          </div>
        ) : (
          <>
            <div className="pj-preview-job-title">
              {form.title || t('employer.job_title')}
            </div>
            <div className="pj-preview-company">TechCam Solutions</div>
            <div className="pj-preview-meta">
              {form.type && (
                <div className="pj-preview-meta-item">
                  <Briefcase size={13} />
                  <span>{form.type}</span>
                </div>
              )}
              {form.location && (
                <div className="pj-preview-meta-item">
                  <MapPin size={13} />
                  <span>{form.location}</span>
                </div>
              )}
              {(form.salaryMin || form.salaryMax) && (
                <div className="pj-preview-meta-item">
                  <DollarSign size={13} />
                  <span>
                    {form.salaryMin && `${Number(form.salaryMin).toLocaleString()}`}
                    {form.salaryMin && form.salaryMax && " – "}
                    {form.salaryMax && `${Number(form.salaryMax).toLocaleString()}`}
                    {" "}{form.currency}
                  </span>
                </div>
              )}
              {form.deadline && (
                <div className="pj-preview-meta-item">
                  <Calendar size={13} />
                  <span>{t('employer.deadline')}: {form.deadline}</span>
                </div>
              )}
              {form.experience && (
                <div className="pj-preview-meta-item">
                  <CheckCircle size={13} />
                  <span>{form.experience} {t('employer.experience_suffix')}</span>
                </div>
              )}
            </div>

            {form.skills.length > 0 && (
              <>
                <div className="pj-preview-divider" />
                <div style={{ fontSize: "11px", color: "var(--kora-text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {t('employer.required_skills')}
                </div>
                <div className="pj-preview-skills">
                  {form.skills.map((s) => (
                    <span key={s} className="pj-preview-skill">{s}</span>
                  ))}
                </div>
              </>
            )}

            {form.description && (
              <>
                <div className="pj-preview-divider" />
                <div style={{ fontSize: "12.5px", color: "var(--kora-text-mid)", lineHeight: 1.6, maxHeight: "80px", overflow: "hidden" }}>
                  {form.description}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div className="pj-tips-card">
        <div className="pj-tips-title">
          <Lightbulb size={14} /> {t('employer.tips_title')}
        </div>
        <div className="pj-tips-list">
          <div className="pj-tip">{t('employer.tip_1')}</div>
          <div className="pj-tip">{t('employer.tip_2')}</div>
          <div className="pj-tip">{t('employer.tip_3')}</div>
          <div className="pj-tip">{t('employer.tip_4')}</div>
          <div className="pj-tip">{t('employer.tip_5')}</div>
        </div>
      </div>
    </div>
  );
}

// ── Step 1 — Basic Info ───────────────────────────────────
function Step1({ form, setForm, errors }) {
  const { t } = useTranslation();
  return (
    <div>
      <div className="pj-form-card-title">
        <Briefcase size={18} color="var(--kora-primary)" /> {t('employer.basic_info')}
      </div>
      <div className="pj-form-card-sub">
        {t('employer.basic_info_sub')}
      </div>
      <div className="pj-form-grid">
        <div className="pj-field pj-field-full">
          <label>{t('employer.job_title')} <span>*</span></label>
          <input
            className={`pj-input ${errors.title ? "error" : ""}`}
            placeholder={t('employer.job_title_placeholder')}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          {errors.title && <span className="pj-error-msg">{errors.title}</span>}
        </div>

        <div className="pj-field">
          <label>{t('employer.category')} <span>*</span></label>
          <select
            className={`pj-select ${errors.category ? "error" : ""}`}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="">{t('employer.select_category')}</option>
            {JOB_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {errors.category && <span className="pj-error-msg">{errors.category}</span>}
        </div>

        <div className="pj-field">
          <label>{t('employer.job_type')} <span>*</span></label>
          <select
            className={`pj-select ${errors.type ? "error" : ""}`}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="">{t('employer.select_type')}</option>
            <option value="CDI">{t('employer.cdi')}</option>
            <option value="CDD">{t('employer.cdd')}</option>
            <option value="Internship">{t('employer.internship')}</option>
            <option value="Freelance">{t('employer.freelance')}</option>
          </select>
          {errors.type && <span className="pj-error-msg">{errors.type}</span>}
        </div>

        <div className="pj-field">
          <label>{t('employer.location')} <span>*</span></label>
          <input
            className={`pj-input ${errors.location ? "error" : ""}`}
            placeholder={t('employer.location_placeholder')}
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          {errors.location && <span className="pj-error-msg">{errors.location}</span>}
        </div>

        <div className="pj-field pj-field-full">
          <label>{t('employer.salary_range')}</label>
          <div className="pj-salary-row">
            <input
              className="pj-input"
              type="number"
              placeholder={t('employer.salary_min')}
              value={form.salaryMin}
              onChange={(e) => setForm({ ...form, salaryMin: e.target.value })}
            />
            <div className="pj-salary-sep">—</div>
            <input
              className="pj-input"
              type="number"
              placeholder={t('employer.salary_max')}
              value={form.salaryMax}
              onChange={(e) => setForm({ ...form, salaryMax: e.target.value })}
            />
          </div>
        </div>

        <div className="pj-field">
          <label>{t('employer.currency')}</label>
          <select
            className="pj-select"
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
          >
            <option value="XAF">XAF (FCFA)</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>

        <div className="pj-field">
          <label>{t('employer.deadline')} <span>*</span></label>
          <input
            className={`pj-input ${errors.deadline ? "error" : ""}`}
            type="date"
            value={form.deadline}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
          />
          {errors.deadline && <span className="pj-error-msg">{errors.deadline}</span>}
        </div>
      </div>
    </div>
  );
}

// ── Step 2 — Description ──────────────────────────────────
function Step2({ form, setForm, errors }) {
  const { t } = useTranslation();
  return (
    <div>
      <div className="pj-form-card-title">
        <FileText size={18} color="var(--kora-primary)" /> {t('employer.description')}
      </div>
      <div className="pj-form-card-sub">
        {t('employer.description_sub')}
      </div>
      <div className="pj-form-grid">
        <div className="pj-field pj-field-full">
          <label>{t('employer.description')} <span>*</span></label>
          <textarea
            className={`pj-textarea ${errors.description ? "error" : ""}`}
            placeholder={t('employer.description_placeholder')}
            value={form.description}
            rows={8}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {errors.description
              ? <span className="pj-error-msg">{errors.description}</span>
              : <span />
            }
            <span className="pj-char-count">{form.description.length} / 3000</span>
          </div>
        </div>

        <div className="pj-field">
          <label>{t('employer.exp_level')} <span>*</span></label>
          <select
            className={`pj-select ${errors.experience ? "error" : ""}`}
            value={form.experience}
            onChange={(e) => setForm({ ...form, experience: e.target.value })}
          >
            <option value="">{t('employer.select_level')}</option>
            <option value="No experience">{t('employer.exp_none')}</option>
            <option value="0-1 year">{t('employer.exp_0_1')}</option>
            <option value="1-3 years">{t('employer.exp_1_3')}</option>
            <option value="3-5 years">{t('employer.exp_3_5')}</option>
            <option value="5+ years">{t('employer.exp_5plus')}</option>
          </select>
          {errors.experience && <span className="pj-error-msg">{errors.experience}</span>}
        </div>

        <div className="pj-field">
          <label>{t('employer.education_level')}</label>
          <select
            className="pj-select"
            value={form.education}
            onChange={(e) => setForm({ ...form, education: e.target.value })}
          >
            <option value="">{t('employer.edu_any')}</option>
            <option value="BAC">BAC</option>
            <option value="BTS / HND">BTS / HND</option>
            <option value="Licence / Bachelor">Licence / Bachelor</option>
            <option value="Master">Master</option>
            <option value="PhD">PhD</option>
          </select>
        </div>

        <div className="pj-field pj-field-full">
          <label style={{ display: "flex", alignItems: "center", gap: "8px", textTransform: "none", letterSpacing: 0, fontSize: "13.5px", fontWeight: 500 }}>
            <input
              type="checkbox"
              checked={form.remote}
              onChange={(e) => setForm({ ...form, remote: e.target.checked })}
              style={{ width: "16px", height: "16px", accentColor: "var(--kora-primary)", cursor: "pointer" }}
            />
            {t('employer.remote_ok')}
          </label>
        </div>
      </div>
    </div>
  );
}

// ── Step 3 — Skills ───────────────────────────────────────
function Step3({ form, setForm, errors }) {
  const { t } = useTranslation();
  const [skillInput, setSkillInput] = useState("");

  const addSkill = (skill) => {
    const trimmed = skill.trim();
    if (trimmed && !form.skills.includes(trimmed) && form.skills.length < 15) {
      setForm({ ...form, skills: [...form.skills, trimmed] });
      setSkillInput("");
    }
  };

  const removeSkill = (skill) =>
    setForm({ ...form, skills: form.skills.filter((s) => s !== skill) });

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(skillInput);
    }
  };

  return (
    <div>
      <div className="pj-form-card-title">
        <Tag size={18} color="var(--kora-primary)" /> {t('employer.required_skills')}
      </div>
      <div className="pj-form-card-sub">
        {t('employer.skills_sub')}
      </div>
      <div className="pj-form-grid">
        <div className="pj-field pj-field-full">
          <label>{t('employer.skills_label')} <span>*</span></label>
          <div className="pj-skills-wrap">
            <div className="pj-skills-cloud">
              {form.skills.map((skill) => (
                <span key={skill} className="pj-skill-tag">
                  {skill}
                  <button onClick={() => removeSkill(skill)}>
                    <X size={12} />
                  </button>
                </span>
              ))}
              {form.skills.length === 0 && (
                <span style={{ fontSize: "12.5px", color: "var(--kora-text-muted)", fontStyle: "italic" }}>
                  {t('employer.no_skills_yet')}
                </span>
              )}
            </div>
            <div className="pj-skills-input-row">
              <input
                className="pj-input"
                placeholder={t('employer.skill_input_placeholder')}
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                className="kora-btn-primary"
                onClick={() => addSkill(skillInput)}
                disabled={!skillInput.trim()}
              >
                <Plus size={14} /> {t('employer.add_skill')}
              </button>
            </div>
            <div className="pj-skills-hint">
              {form.skills.length}/15 {t('employer.skills_added')}
            </div>
          </div>
          {errors.skills && <span className="pj-error-msg">{errors.skills}</span>}
        </div>

        <div className="pj-field pj-field-full">
          <label>{t('employer.suggested_skills')}</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", marginTop: "4px" }}>
            {SKILL_SUGGESTIONS.filter((s) => !form.skills.includes(s)).map((skill) => (
              <button
                key={skill}
                onClick={() => addSkill(skill)}
                style={{
                  padding: "5px 12px",
                  border: "1.5px dashed var(--kora-border)",
                  borderRadius: "999px",
                  background: "transparent",
                  fontSize: "12px",
                  color: "var(--kora-text-muted)",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.target.style.borderColor = "var(--kora-primary)"; e.target.style.color = "var(--kora-primary)"; }}
                onMouseLeave={(e) => { e.target.style.borderColor = "var(--kora-border)"; e.target.style.color = "var(--kora-text-muted)"; }}
              >
                + {skill}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step 4 — Review ───────────────────────────────────────
function Step4({ form }) {
  const { t } = useTranslation();
  const rows = [
    { label: t('employer.job_title'),     value: form.title       },
    { label: t('employer.category'),      value: form.category    },
    { label: t('employer.job_type'),      value: form.type        },
    { label: t('employer.location'),      value: form.location + (form.remote ? ` (${t('employer.remote_ok_short')})` : "") },
    { label: t('employer.salary_label'),  value: form.salaryMin || form.salaryMax
        ? `${Number(form.salaryMin || 0).toLocaleString()} – ${Number(form.salaryMax || 0).toLocaleString()} ${form.currency}`
        : t('employer.not_specified') },
    { label: t('employer.deadline'),      value: form.deadline    },
    { label: t('employer.experience'),    value: form.experience  },
    { label: t('employer.education'),     value: form.education || t('employer.edu_any') },
    { label: t('employer.required_skills'), value: form.skills.length > 0 ? form.skills.join(", ") : t('common.none') },
  ];

  return (
    <div>
      <div className="pj-form-card-title">
        <Eye size={18} color="var(--kora-primary)" /> {t('employer.review_title')}
      </div>
      <div className="pj-form-card-sub">
        {t('employer.review_sub')}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {rows.map(({ label, value }) => (
          <div
            key={label}
            style={{
              display: "flex",
              gap: "16px",
              padding: "12px 16px",
              background: "var(--kora-bg)",
              borderRadius: "8px",
              border: "1px solid var(--kora-border)",
              flexWrap: "wrap",
            }}
          >
            <div style={{ minWidth: "130px", fontSize: "12px", fontWeight: 700, color: "var(--kora-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0 }}>
              {label}
            </div>
            <div style={{ fontSize: "13.5px", color: "var(--kora-text-dark)", flex: 1 }}>
              {value || <span style={{ color: "var(--kora-text-muted)", fontStyle: "italic" }}>{t('employer.not_provided')}</span>}
            </div>
          </div>
        ))}

        {form.description && (
          <div
            style={{
              padding: "12px 16px",
              background: "var(--kora-bg)",
              borderRadius: "8px",
              border: "1px solid var(--kora-border)",
            }}
          >
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--kora-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
              {t('employer.description')}
            </div>
            <div style={{ fontSize: "13.5px", color: "var(--kora-text-dark)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {form.description}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────
export default function PostJob({ onBack, onSuccess }) {
  const { t } = useTranslation();
  const [step, setStep]               = useState(1);
  const [form, setForm]               = useState(INITIAL_FORM);
  const [errors, setErrors]           = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav]     = useState("jobs");
  const [submitted, setSubmitted]     = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  // ── Validation ──
  const validate = (currentStep) => {
    const e = {};
    if (currentStep === 1) {
      if (!form.title.trim())    e.title    = t('employer.error_title_required');
      if (!form.category)        e.category = t('employer.error_category_required');
      if (!form.type)            e.type     = t('employer.error_type_required');
      if (!form.location.trim()) e.location = t('employer.error_location_required');
      if (!form.deadline)        e.deadline = t('employer.error_deadline_required');
    }
    if (currentStep === 2) {
      if (!form.description.trim()) e.description = t('employer.error_description_required');
      if (form.description.length > 3000) e.description = t('employer.error_description_too_long');
      if (!form.experience) e.experience = t('employer.error_experience_required');
    }
    if (currentStep === 3) {
      if (form.skills.length === 0) e.skills = t('employer.error_skills_required');
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate(step)) setStep((s) => s + 1);
  };

  const handleBack = () => {
    setErrors({});
    setStep((s) => s - 1);
  };

  const handleSaveDraft = () => {
    setSavingDraft(true);
    setTimeout(() => { setSavingDraft(false); alert(t('employer.draft_saved')); }, 800);
  };

  const handlePublish = () => {
    if (validate(4)) setSubmitted(true);
  };

  const navItems = [
    { key: "dashboard", icon: <BarChart2 size={16} />, label: t('employer.nav_dashboard')   },
    { key: "jobs",      icon: <Briefcase size={16} />, label: t('employer.nav_job_postings') },
    { key: "apps",      icon: <Users size={16} />,     label: t('employer.nav_applications') },
    { key: "notifs",    icon: <Bell size={16} />,      label: t('employer.nav_notifications') },
    { key: "settings",  icon: <Settings size={16} />,  label: t('employer.nav_settings')     },
  ];

  if (submitted) {
    return (
      <div className="kora-profile-root employer">
        <div className="kora-bg-mesh" />
        <div className="kora-profile-layout">
          <aside className="kora-sidebar">
            <div className="kora-sidebar-inner">
              <div className="kora-sidebar-logo"><img src={koraLogo} alt="KORA" /></div>
              <div className="kora-sidebar-avatar-section">
                <div className="kora-sidebar-avatar"><span className="kora-sidebar-initials">TC</span></div>
                <p className="kora-sidebar-name">TechCam Solutions</p>
                <p className="kora-sidebar-role">Jean-Pierre MVONDO</p>
              </div>
              <nav className="kora-sidebar-nav">
                {navItems.map(({ key, icon, label }) => (
                  <button key={key} className={`kora-sidebar-nav-item ${activeNav === key ? "active" : ""}`} onClick={() => setActiveNav(key)}>
                    {icon}<span>{label}</span>
                  </button>
                ))}
              </nav>
              <button className="kora-sidebar-logout"><LogOut size={15} /> {t('nav.sign_out')}</button>
            </div>
          </aside>
          <main className="kora-main-content">
            <div className="pj-success">
              <div className="pj-success-icon"><CheckCircle size={36} /></div>
              <h2>{t('employer.job_posted_success')} 🎉</h2>
              <p>
                <strong>"{form.title}"</strong> {t('employer.job_posted_desc')}
              </p>
              <div className="pj-success-actions">
                <button className="kora-btn-secondary" onClick={onBack}>
                  <ArrowLeft size={14} /> {t('employer.back_to_jobs')}
                </button>
                <button
                  className="kora-btn-primary"
                  onClick={() => { setSubmitted(false); setStep(1); setForm(INITIAL_FORM); setErrors({}); }}
                >
                  <Plus size={14} /> {t('employer.post_another_job')}
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="kora-profile-root employer">
      <div className="kora-bg-mesh" />

      <div
        className={`kora-sidebar-overlay ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <div className="kora-profile-layout">

        {/* ════════ SIDEBAR ════════ */}
        <aside className={`kora-sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="kora-sidebar-inner">
            <div className="kora-sidebar-logo">
              <img src={koraLogo} alt="KORA" />
              <button className="kora-sidebar-close" onClick={() => setSidebarOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="kora-sidebar-avatar-section">
              <div className="kora-sidebar-avatar">
                <span className="kora-sidebar-initials">TC</span>
              </div>
              <p className="kora-sidebar-name">TechCam Solutions</p>
              <p className="kora-sidebar-role">Jean-Pierre MVONDO</p>
              <span className="kora-verified-badge">
                <CheckCircle size={12} /> {t('employer.verified_employer')}
              </span>
            </div>
            <div className="kora-employer-stats">
              <div className="kora-stat-pill"><strong>3</strong><span>{t('employer.active_jobs')}</span></div>
              <div className="kora-stat-pill"><strong>24</strong><span>{t('employer.nav_applications')}</span></div>
            </div>
            <nav className="kora-sidebar-nav">
              <p className="kora-sidebar-nav-label">{t('common.main_menu')}</p>
              {navItems.map(({ key, icon, label }) => (
                <button
                  key={key}
                  className={`kora-sidebar-nav-item ${activeNav === key ? "active" : ""}`}
                  onClick={() => { setActiveNav(key); setSidebarOpen(false); }}
                >
                  {icon}<span>{label}</span>
                </button>
              ))}
            </nav>
            <button className="kora-sidebar-logout">
              <LogOut size={15} /> {t('nav.sign_out')}
            </button>
          </div>
        </aside>

        {/* ════════ MAIN CONTENT ════════ */}
        <main className="kora-main-content">

          {/* Top Bar */}
          <div className="pj-topbar">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button className="ed-hamburger" onClick={() => setSidebarOpen(true)}>
                <Menu size={18} />
              </button>
              <div className="pj-topbar-left">
                <h1>{t('employer.post_job_title')}</h1>
                <p>{t('employer.post_job_sub')}</p>
              </div>
            </div>
            <div className="pj-topbar-actions">
              <button className="kora-btn-secondary" onClick={onBack}>
                <ArrowLeft size={14} /> {t('employer.back_to_jobs')}
              </button>
              <button
                className="kora-btn-secondary"
                onClick={handleSaveDraft}
                disabled={savingDraft}
              >
                {savingDraft ? t('common.saving') : t('employer.create_draft')}
              </button>
            </div>
          </div>

          {/* Step Indicator */}
          <StepIndicator current={step} />

          {/* Form + Preview Layout */}
          <div className="pj-form-layout">

            {/* Form Card */}
            <div className="pj-form-card">
              {step === 1 && <Step1 form={form} setForm={setForm} errors={errors} />}
              {step === 2 && <Step2 form={form} setForm={setForm} errors={errors} />}
              {step === 3 && <Step3 form={form} setForm={setForm} errors={errors} />}
              {step === 4 && <Step4 form={form} />}

              {/* Navigation */}
              <div className="pj-step-nav">
                <div>
                  {step > 1 && (
                    <button className="kora-btn-secondary" onClick={handleBack}>
                      <ArrowLeft size={14} /> {t('common.back')}
                    </button>
                  )}
                </div>
                <div className="pj-step-nav-right">
                  <span style={{ fontSize: "12px", color: "var(--kora-text-muted)" }}>
                    {t('common.step_of', { step, total: STEPS.length })}
                  </span>
                  {step < STEPS.length ? (
                    <button className="kora-btn-primary" onClick={handleNext}>
                      {t('common.next')} <ArrowRight size={14} />
                    </button>
                  ) : (
                    <button className="kora-btn-primary" onClick={handlePublish}>
                      <CheckCircle size={14} /> {t('employer.publish_now')}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Live Preview Sidebar */}
            <JobPreview form={form} />
          </div>

        </main>
      </div>
    </div>
  );
}