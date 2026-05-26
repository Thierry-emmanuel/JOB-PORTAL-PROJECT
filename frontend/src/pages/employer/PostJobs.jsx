import { useState } from "react";
import {
  Briefcase, MapPin, DollarSign, Calendar, FileText,
  Tag, CheckCircle, X, Plus, ArrowLeft, ArrowRight,
  Eye, Lightbulb
} from "lucide-react";
import EmployerSidebar from "../../components/employer/EmployerSidebar";
import { useEmployerDashboard } from "../../hooks/useEmployerDashboard";
import "../../styles/dashboard-shell.css";
import "../../styles/PostJobs.css";

/* ── Constants ─────────────────────────────────────────────── */
const STEPS = [
  { id: 1, label: "Basic Info"   },
  { id: 2, label: "Details"      },
  { id: 3, label: "Requirements" },
  { id: 4, label: "Review"       },
];

const INITIAL_FORM = {
  title: "", category: "", type: "", location: "", deadline: "",
  salaryMin: "", salaryMax: "", currency: "XAF",
  description: "", experience: "", remote: false,
  skills: [], benefits: [], languages: [],
};

const CATEGORIES = [
  "Software Engineering","Data & Analytics","Design & UX","Product Management",
  "Marketing","Sales","Operations","Finance","Human Resources","Customer Support","Other",
];
const JOB_TYPES   = ["FULL_TIME","PART_TIME","CONTRACT","INTERNSHIP","FREELANCE"];
const LEVELS      = ["ENTRY","JUNIOR","MID","SENIOR","LEAD","EXECUTIVE"];
const SKILL_OPTS  = ["JavaScript","TypeScript","React","Node.js","Python","Java","Spring Boot",
                     "SQL","PostgreSQL","Docker","AWS","Git","REST APIs","GraphQL","Agile/Scrum"];
const BENEFIT_OPTS = ["Health Insurance","Remote Work","Paid Leave","Transport Allowance",
                      "Performance Bonus","Training Budget","Flexible Hours","Stock Options"];

/* ── Sub-components ─────────────────────────────────────────── */
function StepIndicator({ current }) {
  return (
    <div className="pj-steps">
      {STEPS.map((s, i) => (
        <div key={s.id} className={`pj-step${current === s.id ? " active" : current > s.id ? " done" : ""}`}>
          <div className="pj-step-circle">
            {current > s.id ? <CheckCircle size={14} /> : s.id}
          </div>
          <span className="pj-step-label">{s.label}</span>
          {i < STEPS.length - 1 && <div className="pj-step-line" />}
        </div>
      ))}
    </div>
  );
}

function Field({ label, required, error, children }) {
  return (
    <div className="pj-field">
      <label className="pj-label">{label}{required && <span className="pj-req"> *</span>}</label>
      {children}
      {error && <p className="pj-error">{error}</p>}
    </div>
  );
}

function TagInput({ items, options, placeholder, onAdd, onRemove }) {
  const [input, setInput] = useState("");
  const filtered = options?.filter(o => !items.includes(o) && o.toLowerCase().includes(input.toLowerCase())) ?? [];
  return (
    <div className="pj-tag-input">
      <div className="pj-tags">
        {items.map(tag => (
          <span key={tag} className="pj-tag">
            {tag} <button onClick={() => onRemove(tag)}><X size={11} /></button>
          </span>
        ))}
        <input
          placeholder={placeholder}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && input.trim()) { e.preventDefault(); onAdd(input.trim()); setInput(""); }
            if (e.key === "Backspace" && !input && items.length) onRemove(items[items.length - 1]);
          }}
        />
      </div>
      {input && filtered.length > 0 && (
        <ul className="pj-suggestions">
          {filtered.slice(0, 5).map(s => (
            <li key={s} onClick={() => { onAdd(s); setInput(""); }}>{s}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Step1({ form, setForm, errors }) {
  const f = (key, val) => setForm(p => ({ ...p, [key]: val }));
  return (
    <div className="pj-step-body">
      <h2 className="pj-step-title"><Briefcase size={18} /> Basic Information</h2>
      <div className="pj-form-grid">
        <Field label="Job Title" required error={errors.title}>
          <input className="pj-input" placeholder="e.g. Senior Java Developer" value={form.title} onChange={e => f("title", e.target.value)} />
        </Field>
        <Field label="Category" required error={errors.category}>
          <select className="pj-input" value={form.category} onChange={e => f("category", e.target.value)}>
            <option value="">Select category…</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Contract Type" required error={errors.type}>
          <select className="pj-input" value={form.type} onChange={e => f("type", e.target.value)}>
            <option value="">Select type…</option>
            {JOB_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Location" required error={errors.location}>
          <div className="pj-input-icon"><MapPin size={15} />
            <input className="pj-input pj-input-with-icon" placeholder="e.g. Douala, Cameroon" value={form.location} onChange={e => f("location", e.target.value)} />
          </div>
        </Field>
        <Field label="Application Deadline" required error={errors.deadline}>
          <div className="pj-input-icon"><Calendar size={15} />
            <input type="date" className="pj-input pj-input-with-icon" value={form.deadline} min={new Date().toISOString().split("T")[0]} onChange={e => f("deadline", e.target.value)} />
          </div>
        </Field>
        <div className="pj-field pj-field-salary">
          <label className="pj-label">Salary Range</label>
          <div className="pj-salary-row">
            <div className="pj-input-icon"><DollarSign size={15} />
              <input className="pj-input pj-input-with-icon" type="number" placeholder="Min" value={form.salaryMin} onChange={e => f("salaryMin", e.target.value)} />
            </div>
            <span className="pj-salary-sep">–</span>
            <div className="pj-input-icon"><DollarSign size={15} />
              <input className="pj-input pj-input-with-icon" type="number" placeholder="Max" value={form.salaryMax} onChange={e => f("salaryMax", e.target.value)} />
            </div>
            <select className="pj-input pj-currency" value={form.currency} onChange={e => f("currency", e.target.value)}>
              {["XAF","USD","EUR","GBP"].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <Field label="">
          <label className="pj-checkbox">
            <input type="checkbox" checked={form.remote} onChange={e => f("remote", e.target.checked)} />
            <span>Remote / Hybrid position</span>
          </label>
        </Field>
      </div>
    </div>
  );
}

function Step2({ form, setForm, errors }) {
  const f = (key, val) => setForm(p => ({ ...p, [key]: val }));
  return (
    <div className="pj-step-body">
      <h2 className="pj-step-title"><FileText size={18} /> Job Details</h2>
      <Field label="Job Description" required error={errors.description}>
        <textarea className="pj-textarea" rows={8} placeholder="Describe the role, responsibilities, team culture…" value={form.description} onChange={e => f("description", e.target.value)} />
        <span className="pj-char-count">{form.description.length}/3000</span>
      </Field>
      <Field label="Experience Level" required error={errors.experience}>
        <div className="pj-pills">
          {LEVELS.map(l => (
            <button key={l} className={`pj-pill${form.experience === l ? " active" : ""}`} onClick={() => f("experience", l)}>{l}</button>
          ))}
        </div>
      </Field>
      <Field label="Benefits">
        <div className="pj-check-grid">
          {BENEFIT_OPTS.map(b => (
            <label key={b} className="pj-checkbox">
              <input type="checkbox" checked={form.benefits.includes(b)}
                onChange={e => f("benefits", e.target.checked ? [...form.benefits, b] : form.benefits.filter(x => x !== b))} />
              <span>{b}</span>
            </label>
          ))}
        </div>
      </Field>
    </div>
  );
}

function Step3({ form, setForm, errors }) {
  const f = (key, val) => setForm(p => ({ ...p, [key]: val }));
  const addSkill    = s => !form.skills.includes(s)    && f("skills",    [...form.skills, s]);
  const addLang     = l => !form.languages.includes(l) && f("languages", [...form.languages, l]);
  return (
    <div className="pj-step-body">
      <h2 className="pj-step-title"><Tag size={18} /> Requirements</h2>
      <Field label="Required Skills" required error={errors.skills}>
        <TagInput items={form.skills} options={SKILL_OPTS} placeholder="Type or pick a skill…"
          onAdd={addSkill} onRemove={s => f("skills", form.skills.filter(x => x !== s))} />
      </Field>
      <Field label="Languages">
        <TagInput items={form.languages} options={["English","French","Spanish","Arabic","Portuguese"]} placeholder="Add language…"
          onAdd={addLang} onRemove={l => f("languages", form.languages.filter(x => x !== l))} />
      </Field>
    </div>
  );
}

function Step4({ form }) {
  return (
    <div className="pj-step-body">
      <h2 className="pj-step-title"><Eye size={18} /> Review &amp; Publish</h2>
      <div className="pj-review-grid">
        {[
          ["Job Title",     form.title       || "—"],
          ["Category",      form.category    || "—"],
          ["Type",          form.type        || "—"],
          ["Location",      form.location    || "—"],
          ["Experience",    form.experience  || "—"],
          ["Deadline",      form.deadline    || "—"],
          ["Salary",        form.salaryMin && form.salaryMax ? `${Number(form.salaryMin).toLocaleString()} – ${Number(form.salaryMax).toLocaleString()} ${form.currency}` : "Not specified"],
          ["Remote",        form.remote ? "Yes" : "No"],
        ].map(([k, v]) => (
          <div key={k} className="pj-review-row"><span className="pj-review-key">{k}</span><span className="pj-review-val">{v}</span></div>
        ))}
      </div>
      {form.description && (
        <div className="pj-review-desc">
          <p className="pj-review-key">Description</p>
          <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, marginTop: 6 }}>{form.description.slice(0, 300)}{form.description.length > 300 ? "…" : ""}</p>
        </div>
      )}
      {form.skills.length > 0 && (
        <div className="pj-review-desc">
          <p className="pj-review-key">Skills</p>
          <div className="pj-tags" style={{ marginTop: 6 }}>
            {form.skills.map(s => <span key={s} className="pj-tag" style={{ cursor: "default" }}>{s}</span>)}
          </div>
        </div>
      )}
      <div className="pj-review-tip">
        <Lightbulb size={14} /> <strong>Tip:</strong> Jobs with complete descriptions get 3× more applications.
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────── */
export default function PostJob({ onBack, onSuccess }) {
  const [step,        setStep]        = useState(1);
  const [form,        setForm]        = useState(INITIAL_FORM);
  const [errors,      setErrors]      = useState({});
  const [submitted,   setSubmitted]   = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  const { employer, loading, stats } = useEmployerDashboard();

  const validate = (s) => {
    const e = {};
    if (s === 1) {
      if (!form.title.trim())    e.title    = "Job title is required.";
      if (!form.category)        e.category = "Please select a category.";
      if (!form.type)            e.type     = "Please select a contract type.";
      if (!form.location.trim()) e.location = "Location is required.";
      if (!form.deadline)        e.deadline = "Please set a deadline.";
    }
    if (s === 2) {
      if (!form.description.trim())       e.description = "Description is required.";
      if (form.description.length > 3000) e.description = "Max 3000 characters.";
      if (!form.experience)               e.experience  = "Please select an experience level.";
    }
    if (s === 3) {
      if (form.skills.length === 0) e.skills = "Add at least one skill.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext    = () => { if (validate(step)) setStep(s => s + 1); };
  const handleBack    = () => { setErrors({}); setStep(s => s - 1); };
  const handlePublish = () => { if (validate(4)) setSubmitted(true); };
  const handleDraft   = () => { setSavingDraft(true); setTimeout(() => { setSavingDraft(false); }, 900); };

  /* Shared shell wrapper */
  const Shell = ({ children }) => (
    <div className="ds-root employer">
      <div className="ds-body">
        <aside className="ds-sidebar">
          <EmployerSidebar employer={employer} loading={loading} stats={stats} />
        </aside>
        <main className="ds-main">{children}</main>
      </div>
    </div>
  );

  if (submitted) {
    return (
      <Shell>
        <div className="ds-hero" style={{ flexDirection: "column", alignItems: "center", textAlign: "center", gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle size={32} />
          </div>
          <div>
            <h1 className="ds-hero-title">Job Posted Successfully! 🎉</h1>
            <p className="ds-hero-sub">"{form.title}" is now live. Candidates can start applying immediately.</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="ds-btn ds-btn-ghost" style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }} onClick={onBack}>
              <ArrowLeft size={14} /> Back to Jobs
            </button>
            <button className="ds-btn" style={{ background: "#fff", color: "var(--ds-accent)", fontWeight: 700 }}
              onClick={() => { setSubmitted(false); setStep(1); setForm(INITIAL_FORM); setErrors({}); }}>
              <Plus size={14} /> Post Another
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      {/* Page header */}
      <div className="ds-page-header">
        <div>
          <h1 className="ds-page-title">Post a New Job</h1>
          <p className="ds-page-sub">Fill in the details to publish your listing on Kora.</p>
        </div>
        <div className="ds-page-actions">
          <button className="ds-btn ds-btn-ghost" onClick={onBack}><ArrowLeft size={14} /> Back to Jobs</button>
          <button className="ds-btn ds-btn-ghost" onClick={handleDraft} disabled={savingDraft}>
            {savingDraft ? "Saving…" : "Save Draft"}
          </button>
        </div>
      </div>

      {/* Step indicator */}
      <StepIndicator current={step} />

      {/* Form + Preview */}
      <div className="pj-form-layout">
        <div className="pj-form-card ds-card">
          {step === 1 && <Step1 form={form} setForm={setForm} errors={errors} />}
          {step === 2 && <Step2 form={form} setForm={setForm} errors={errors} />}
          {step === 3 && <Step3 form={form} setForm={setForm} errors={errors} />}
          {step === 4 && <Step4 form={form} />}

          <div className="pj-step-nav">
            <div>{step > 1 && <button className="ds-btn ds-btn-ghost" onClick={handleBack}><ArrowLeft size={14} /> Back</button>}</div>
            <div className="pj-step-nav-right">
              <span style={{ fontSize: 12, color: "#9CA3AF" }}>Step {step} of {STEPS.length}</span>
              {step < STEPS.length
                ? <button className="ds-btn ds-btn-primary" onClick={handleNext}>Next <ArrowRight size={14} /></button>
                : <button className="ds-btn ds-btn-primary" onClick={handlePublish}><CheckCircle size={14} /> Publish Job</button>
              }
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className="ds-card pj-preview-card">
          <div className="ds-card-header">
            <h3 className="ds-card-title"><div className="ds-card-title-icon"><Eye size={14} /></div>Live Preview</h3>
          </div>
          <div className="ds-card-body">
            <h4 style={{ fontWeight: 800, fontSize: 16, margin: "0 0 4px" }}>{form.title || "Job Title"}</h4>
            <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 12px" }}>{employer?.companyName || "Your Company"} · {form.location || "Location"}</p>
            {form.type && <span className="ds-job-type" style={{ marginRight: 6 }}>{form.type}</span>}
            {form.remote && <span className="ds-job-type" style={{ background: "#F0FDF4", color: "#16A34A" }}>Remote</span>}
            {form.description && <p style={{ fontSize: 12.5, color: "#374151", lineHeight: 1.6, marginTop: 12 }}>{form.description.slice(0, 160)}{form.description.length > 160 ? "…" : ""}</p>}
            {form.skills.length > 0 && (
              <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 5 }}>
                {form.skills.slice(0, 5).map(s => <span key={s} className="ds-job-type">{s}</span>)}
              </div>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}