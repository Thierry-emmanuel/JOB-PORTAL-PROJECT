import { useState } from "react";
import {
  Briefcase, MapPin, DollarSign, Calendar, FileText,
  Tag, CheckCircle, X, Plus, ArrowLeft, ArrowRight,
  Eye, Lightbulb, LogOut, Bell, Settings, Users,
  BarChart2, Menu, Building2
} from "lucide-react";
import koraLogo from "../../assets/kora-logo.png";
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
  const isEmpty = !form.title && !form.category && !form.type;
  return (
    <div>
      <div className="pj-preview-card">
        <div className="pj-preview-title">
          <Eye size={15} /> Live Preview
        </div>
        {isEmpty ? (
          <div className="pj-preview-empty">
            Start filling the form to see a live preview of your job posting.
          </div>
        ) : (
          <>
            <div className="pj-preview-job-title">
              {form.title || "Job Title"}
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
                  <span>Deadline: {form.deadline}</span>
                </div>
              )}
              {form.experience && (
                <div className="pj-preview-meta-item">
                  <CheckCircle size={13} />
                  <span>{form.experience} experience</span>
                </div>
              )}
            </div>

            {form.skills.length > 0 && (
              <>
                <div className="pj-preview-divider" />
                <div style={{ fontSize: "11px", color: "var(--kora-text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Required Skills
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
          <Lightbulb size={14} /> Tips for a great post
        </div>
        <div className="pj-tips-list">
          <div className="pj-tip">Write a clear, specific job title</div>
          <div className="pj-tip">Include salary range to attract more applicants</div>
          <div className="pj-tip">List the top 5–8 required skills only</div>
          <div className="pj-tip">Be specific about experience level needed</div>
          <div className="pj-tip">Set a realistic application deadline</div>
        </div>
      </div>
    </div>
  );
}

// ── Step 1 — Basic Info ───────────────────────────────────
function Step1({ form, setForm, errors }) {
  return (
    <div>
      <div className="pj-form-card-title">
        <Briefcase size={18} color="var(--kora-primary)" /> Basic Information
      </div>
      <div className="pj-form-card-sub">
        Start with the essential details about the position.
      </div>
      <div className="pj-form-grid">
        <div className="pj-field pj-field-full">
          <label>Job Title <span>*</span></label>
          <input
            className={`pj-input ${errors.title ? "error" : ""}`}
            placeholder="e.g. Senior Java Developer"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          {errors.title && <span className="pj-error-msg">{errors.title}</span>}
        </div>

        <div className="pj-field">
          <label>Category <span>*</span></label>
          <select
            className={`pj-select ${errors.category ? "error" : ""}`}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="">Select category...</option>
            {JOB_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {errors.category && <span className="pj-error-msg">{errors.category}</span>}
        </div>

        <div className="pj-field">
          <label>Contract Type <span>*</span></label>
          <select
            className={`pj-select ${errors.type ? "error" : ""}`}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="">Select type...</option>
            <option value="CDI">CDI (Permanent)</option>
            <option value="CDD">CDD (Fixed Term)</option>
            <option value="Internship">Internship</option>
            <option value="Freelance">Freelance</option>
          </select>
          {errors.type && <span className="pj-error-msg">{errors.type}</span>}
        </div>

        <div className="pj-field">
          <label>Location <span>*</span></label>
          <input
            className={`pj-input ${errors.location ? "error" : ""}`}
            placeholder="e.g. Douala, Yaoundé, Remote"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          {errors.location && <span className="pj-error-msg">{errors.location}</span>}
        </div>

        <div className="pj-field pj-field-full">
          <label>Salary Range (optional)</label>
          <div className="pj-salary-row">
            <input
              className="pj-input"
              type="number"
              placeholder="Min e.g. 300000"
              value={form.salaryMin}
              onChange={(e) => setForm({ ...form, salaryMin: e.target.value })}
            />
            <div className="pj-salary-sep">—</div>
            <input
              className="pj-input"
              type="number"
              placeholder="Max e.g. 600000"
              value={form.salaryMax}
              onChange={(e) => setForm({ ...form, salaryMax: e.target.value })}
            />
          </div>
        </div>

        <div className="pj-field">
          <label>Currency</label>
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
          <label>Application Deadline <span>*</span></label>
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
  return (
    <div>
      <div className="pj-form-card-title">
        <FileText size={18} color="var(--kora-primary)" /> Job Description
      </div>
      <div className="pj-form-card-sub">
        Describe the role, responsibilities and what success looks like.
      </div>
      <div className="pj-form-grid">
        <div className="pj-field pj-field-full">
          <label>Job Description <span>*</span></label>
          <textarea
            className={`pj-textarea ${errors.description ? "error" : ""}`}
            placeholder="Describe the role, key responsibilities, team environment, and what success looks like in this position..."
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
          <label>Experience Level <span>*</span></label>
          <select
            className={`pj-select ${errors.experience ? "error" : ""}`}
            value={form.experience}
            onChange={(e) => setForm({ ...form, experience: e.target.value })}
          >
            <option value="">Select level...</option>
            <option value="No experience">No experience required</option>
            <option value="0-1 year">0 – 1 year</option>
            <option value="1-3 years">1 – 3 years</option>
            <option value="3-5 years">3 – 5 years</option>
            <option value="5+ years">5+ years</option>
          </select>
          {errors.experience && <span className="pj-error-msg">{errors.experience}</span>}
        </div>

        <div className="pj-field">
          <label>Education Level</label>
          <select
            className="pj-select"
            value={form.education}
            onChange={(e) => setForm({ ...form, education: e.target.value })}
          >
            <option value="">Any level</option>
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
            This position is open to remote work
          </label>
        </div>
      </div>
    </div>
  );
}

// ── Step 3 — Skills ───────────────────────────────────────
function Step3({ form, setForm, errors }) {
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
        <Tag size={18} color="var(--kora-primary)" /> Required Skills
      </div>
      <div className="pj-form-card-sub">
        Add the skills required for this position. Press Enter or comma to add.
      </div>
      <div className="pj-form-grid">
        <div className="pj-field pj-field-full">
          <label>Skills <span>*</span></label>
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
                  No skills added yet...
                </span>
              )}
            </div>
            <div className="pj-skills-input-row">
              <input
                className="pj-input"
                placeholder="Type a skill and press Enter..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                className="kora-btn-primary"
                onClick={() => addSkill(skillInput)}
                disabled={!skillInput.trim()}
              >
                <Plus size={14} /> Add
              </button>
            </div>
            <div className="pj-skills-hint">
              {form.skills.length}/15 skills added
            </div>
          </div>
          {errors.skills && <span className="pj-error-msg">{errors.skills}</span>}
        </div>

        <div className="pj-field pj-field-full">
          <label>Suggested Skills</label>
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
  const rows = [
    { label: "Job Title",       value: form.title       },
    { label: "Category",        value: form.category    },
    { label: "Contract Type",   value: form.type        },
    { label: "Location",        value: form.location + (form.remote ? " (Remote OK)" : "") },
    { label: "Salary",          value: form.salaryMin || form.salaryMax
        ? `${Number(form.salaryMin || 0).toLocaleString()} – ${Number(form.salaryMax || 0).toLocaleString()} ${form.currency}`
        : "Not specified" },
    { label: "Deadline",        value: form.deadline    },
    { label: "Experience",      value: form.experience  },
    { label: "Education",       value: form.education || "Any level" },
    { label: "Skills",          value: form.skills.length > 0 ? form.skills.join(", ") : "None" },
  ];

  return (
    <div>
      <div className="pj-form-card-title">
        <Eye size={18} color="var(--kora-primary)" /> Review Your Posting
      </div>
      <div className="pj-form-card-sub">
        Review all details before publishing. You can go back to edit.
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
              {value || <span style={{ color: "var(--kora-text-muted)", fontStyle: "italic" }}>Not provided</span>}
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
              Description
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
      if (!form.title.trim())    e.title    = "Job title is required.";
      if (!form.category)        e.category = "Please select a category.";
      if (!form.type)            e.type     = "Please select a contract type.";
      if (!form.location.trim()) e.location = "Location is required.";
      if (!form.deadline)        e.deadline = "Please set an application deadline.";
    }
    if (currentStep === 2) {
      if (!form.description.trim()) e.description = "Job description is required.";
      if (form.description.length > 3000) e.description = "Description must be under 3000 characters.";
      if (!form.experience) e.experience = "Please select an experience level.";
    }
    if (currentStep === 3) {
      if (form.skills.length === 0) e.skills = "Please add at least one required skill.";
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
    setTimeout(() => { setSavingDraft(false); alert("Draft saved successfully!"); }, 800);
  };

  const handlePublish = () => {
    if (validate(4)) setSubmitted(true);
  };

  const navItems = [
    { key: "dashboard", icon: <BarChart2 size={16} />, label: "Dashboard"   },
    { key: "jobs",      icon: <Briefcase size={16} />, label: "Job Postings" },
    { key: "apps",      icon: <Users size={16} />,     label: "Applications" },
    { key: "notifs",    icon: <Bell size={16} />,      label: "Notifications" },
    { key: "settings",  icon: <Settings size={16} />,  label: "Settings"     },
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
              <button className="kora-sidebar-logout"><LogOut size={15} /> Sign Out</button>
            </div>
          </aside>
          <main className="kora-main-content">
            <div className="pj-success">
              <div className="pj-success-icon"><CheckCircle size={36} /></div>
              <h2>Job Posted Successfully! 🎉</h2>
              <p>
                <strong>"{form.title}"</strong> has been published and is now live on the Kora platform.
                Candidates can start applying immediately.
              </p>
              <div className="pj-success-actions">
                <button className="kora-btn-secondary" onClick={onBack}>
                  <ArrowLeft size={14} /> Back to Jobs
                </button>
                <button
                  className="kora-btn-primary"
                  onClick={() => { setSubmitted(false); setStep(1); setForm(INITIAL_FORM); setErrors({}); }}
                >
                  <Plus size={14} /> Post Another Job
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
                <CheckCircle size={12} /> Verified Employer
              </span>
            </div>
            <div className="kora-employer-stats">
              <div className="kora-stat-pill"><strong>3</strong><span>Active Jobs</span></div>
              <div className="kora-stat-pill"><strong>24</strong><span>Applications</span></div>
            </div>
            <nav className="kora-sidebar-nav">
              <p className="kora-sidebar-nav-label">Main Menu</p>
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
              <LogOut size={15} /> Sign Out
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
                <h1>Post a New Job</h1>
                <p>Fill in the details to publish your job posting on Kora.</p>
              </div>
            </div>
            <div className="pj-topbar-actions">
              <button className="kora-btn-secondary" onClick={onBack}>
                <ArrowLeft size={14} /> Back to Jobs
              </button>
              <button
                className="kora-btn-secondary"
                onClick={handleSaveDraft}
                disabled={savingDraft}
              >
                {savingDraft ? "Saving..." : "Save Draft"}
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
                      <ArrowLeft size={14} /> Back
                    </button>
                  )}
                </div>
                <div className="pj-step-nav-right">
                  <span style={{ fontSize: "12px", color: "var(--kora-text-muted)" }}>
                    Step {step} of {STEPS.length}
                  </span>
                  {step < STEPS.length ? (
                    <button className="kora-btn-primary" onClick={handleNext}>
                      Next <ArrowRight size={14} />
                    </button>
                  ) : (
                    <button className="kora-btn-primary" onClick={handlePublish}>
                      <CheckCircle size={14} /> Publish Job
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