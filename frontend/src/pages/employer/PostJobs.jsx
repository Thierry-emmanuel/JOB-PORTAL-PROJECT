import { useState, useEffect, useRef, useCallback } from "react";
import {
  Briefcase, MapPin, DollarSign, Calendar, FileText,
  Tag, CheckCircle, X, Plus, ArrowLeft, ArrowRight,
  Eye, Lightbulb, Save, XCircle, Menu
} from "lucide-react";
import EmployerSidebar from "../../components/employer/EmployerSidebar";
import { useEmployerDashboard } from "../../hooks/useEmployerDashboard";
import {
  createJob,
  updateJob,
  getLocations,
  getSkills,
  getCategories,
  getJobDetail
} from "../../api/jobs";
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
  title: "", categoryId: "", type: "", locationId: "", deadline: "",
  salaryMin: "", salaryMax: "", currency: "XAF",
  description: "", experience: "", remote: false,
  skills: [], benefits: [], languages: [],
  qualificationNeeded: "", requiresInterview: false
};

const JOB_TYPES   = ["FULL_TIME","PART_TIME","CONTRACT","INTERNSHIP","FREELANCE"];
const LEVELS      = ["ENTRY","JUNIOR","MID","SENIOR","LEAD","EXECUTIVE"];
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

function Step1({ form, setForm, errors, dbCategories, dbLocations }) {
  const f = (key, val) => setForm(p => ({ ...p, [key]: val }));
  return (
    <div className="pj-step-body">
      <h2 className="pj-step-title"><Briefcase size={18} /> Basic Information</h2>
      <div className="pj-form-grid">
        <Field label="Job Title" required error={errors.title}>
          <input className="pj-input" placeholder="e.g. Senior Java Developer" value={form.title} onChange={e => f("title", e.target.value)} />
        </Field>
        <Field label="Category" required error={errors.categoryId}>
          <select className="pj-input" value={form.categoryId} onChange={e => f("categoryId", e.target.value)}>
            <option value="">Select category…</option>
            {dbCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Contract Type" required error={errors.type}>
          <select className="pj-input" value={form.type} onChange={e => f("type", e.target.value)}>
            <option value="">Select type…</option>
            {JOB_TYPES.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
          </select>
        </Field>
        <Field label="Location" required error={errors.locationId}>
          <div className="pj-input-icon"><MapPin size={15} />
            <select className="pj-input pj-input-with-icon" value={form.locationId} onChange={e => f("locationId", e.target.value)}>
              <option value="">Select location…</option>
              {dbLocations.map(l => <option key={l.id} value={l.id}>{l.city}{l.country ? `, ${l.country}` : ""}</option>)}
            </select>
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
        <textarea className="pj-textarea" rows={6} placeholder="Describe the role, responsibilities, team culture…" value={form.description} onChange={e => f("description", e.target.value)} />
        <span className="pj-char-count">{form.description?.length}/3000</span>
      </Field>
      <Field label="Qualification Needed" required error={errors.qualificationNeeded}>
        <textarea className="pj-textarea" rows={3} placeholder="Bachelor's degree in CS, 3+ years experience, certifications, etc." value={form.qualificationNeeded} onChange={e => f("qualificationNeeded", e.target.value)} />
      </Field>
      <Field label="Experience Level" required error={errors.experience}>
        <div className="pj-pills">
          {LEVELS.map(l => (
            <button key={l} className={`pj-pill${form.experience === l ? " active" : ""}`} onClick={() => f("experience", l)}>{l}</button>
          ))}
        </div>
      </Field>
      <div className="pj-form-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "10px" }}>
        <Field label="">
          <label className="pj-checkbox">
            <input type="checkbox" checked={form.requiresInterview} onChange={e => f("requiresInterview", e.target.checked)} />
            <span style={{ fontWeight: 600, color: "var(--ds-ink)" }}>Requires Interview process</span>
          </label>
        </Field>
      </div>
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

function Step3({ form, setForm, errors, skillOpts }) {
  const f = (key, val) => setForm(p => ({ ...p, [key]: val }));
  const addSkill    = s => !form.skills.includes(s)    && f("skills",    [...form.skills, s]);
  const addLang     = l => !form.languages.includes(l) && f("languages", [...form.languages, l]);
  return (
    <div className="pj-step-body">
      <h2 className="pj-step-title"><Tag size={18} /> Requirements</h2>
      <Field label="Required Skills" required error={errors.skills}>
        <TagInput items={form.skills} options={skillOpts} placeholder="Type or pick a skill…"
          onAdd={addSkill} onRemove={s => f("skills", form.skills.filter(x => x !== s))} />
      </Field>
      <Field label="Languages">
        <TagInput items={form.languages} options={["English","French","Spanish","Arabic","Portuguese"]} placeholder="Add language…"
          onAdd={addLang} onRemove={l => f("languages", form.languages.filter(x => x !== l))} />
      </Field>
    </div>
  );
}

function Step4({ form, dbCategories, dbLocations }) {
  const catName = dbCategories.find(c => c.id === form.categoryId)?.name || "—";
  const locCity = dbLocations.find(l => l.id === form.locationId)?.city || "—";
  return (
    <div className="pj-step-body">
      <h2 className="pj-step-title"><Eye size={18} /> Review &amp; Publish</h2>
      <div className="pj-review-grid">
        {[
          ["Job Title",     form.title       || "—"],
          ["Category",      catName],
          ["Type",          form.type        || "—"],
          ["Location",      locCity],
          ["Experience",    form.experience  || "—"],
          ["Deadline",      form.deadline    || "—"],
          ["Interview?",    form.requiresInterview ? "Yes, required" : "No, optional"],
          ["Salary",        form.salaryMin && form.salaryMax ? `${Number(form.salaryMin).toLocaleString()} – ${Number(form.salaryMax).toLocaleString()} ${form.currency}` : "Not specified"],
          ["Remote",        form.remote ? "Yes" : "No"],
        ].map(([k, v]) => (
          <div key={k} className="pj-review-row"><span className="pj-review-key">{k}</span><span className="pj-review-val">{v}</span></div>
        ))}
      </div>
      {form.qualificationNeeded && (
        <div className="pj-review-desc" style={{ marginBottom: 16 }}>
          <p className="pj-review-key">Qualifications Needed</p>
          <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, marginTop: 6 }}>{form.qualificationNeeded}</p>
        </div>
      )}
      {form.description && (
        <div className="pj-review-desc">
          <p className="pj-review-key">Description</p>
          <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, marginTop: 6 }}>{form.description.slice(0, 300)}{form.description.length > 300 ? "…" : ""}</p>
        </div>
      )}
      {form.skills.length > 0 && (
        <div className="pj-review-desc" style={{ marginTop: 16 }}>
          <p className="pj-review-key">Skills</p>
          <div className="pj-tags" style={{ marginTop: 6 }}>
            {form.skills.map(s => <span key={s} className="pj-tag" style={{ cursor: "default" }}>{s}</span>)}
          </div>
        </div>
      )}
      <div className="pj-review-tip" style={{ marginTop: 24 }}>
        <Lightbulb size={14} /> <strong>Tip:</strong> Jobs with complete requirements get 3× more applications.
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────── */
export default function PostJob({ onBack, onSuccess }) {
  const [step,        setStep]        = useState(1);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [form,        setForm]        = useState(INITIAL_FORM);
  const [errors,      setErrors]      = useState({});
  const [submitted,   setSubmitted]   = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  const [dbCategories, setDbCategories] = useState([]);
  const [dbLocations,  setDbLocations]  = useState([]);
  const [dbSkills,     setDbSkills]     = useState([]);
  const [loadingDb,    setLoadingDb]    = useState(true);
  const [isEditMode,   setIsEditMode]   = useState(false);
  const [editId,       setEditId]       = useState(null);

  const { employer, loading, stats, refresh } = useEmployerDashboard();

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const editIdParam = query.get("edit");

    const loadPlatformData = async () => {
      try {
        const [cats, locs, sks] = await Promise.all([
          getCategories(),
          getLocations(),
          getSkills()
        ]);
        setDbCategories(cats);
        setDbLocations(locs);
        setDbSkills(sks);

        if (editIdParam) {
          setIsEditMode(true);
          setEditId(editIdParam);
          const job = await getJobDetail(editIdParam);
          setForm({
            title: job.title || "",
            categoryId: job.category?.id || "",
            type: job.jobType || "",
            locationId: job.location?.id || "",
            deadline: job.deadline || "",
            salaryMin: job.salaryMin ? parseInt(job.salaryMin.toString().replace(/[^0-9]/g, '')) : "",
            salaryMax: job.salaryMax ? parseInt(job.salaryMax.toString().replace(/[^0-9]/g, '')) : "",
            currency: "XAF",
            description: job.description || "",
            experience: job.experienceLevel || "",
            remote: job.location?.city === "Remote",
            skills: job.tags || [],
            benefits: [],
            languages: [],
            qualificationNeeded: job.qualificationNeeded || "",
            requiresInterview: job.requiresInterview || false,
          });
        }
      } catch (err) {
        console.error("Failed to load platform reference data:", err);
      } finally {
        setLoadingDb(false);
      }
    };
    loadPlatformData();
  }, []);

  const validate = (s) => {
    const e = {};
    if (s === 1 || isEditMode) {
      if (!form.title.trim())    e.title    = "Job title is required.";
      if (!form.categoryId)      e.categoryId = "Please select a category.";
      if (!form.type)            e.type     = "Please select a contract type.";
      if (!form.locationId)      e.locationId = "Location is required.";
      if (!form.deadline)        e.deadline = "Please set a deadline.";
    }
    if (s === 2 || isEditMode) {
      if (!form.description.trim())       e.description = "Description is required.";
      if (form.description.length > 3000) e.description = "Max 3000 characters.";
      if (!form.experience)               e.experience  = "Please select an experience level.";
      if (!form.qualificationNeeded?.trim()) e.qualificationNeeded = "Qualifications information is required.";
    }
    if (s === 3 || isEditMode) {
      if (form.skills.length === 0) e.skills = "Add at least one skill.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext    = () => { if (validate(step)) setStep(s => s + 1); };
  const handleBack    = () => { setErrors({}); setStep(s => s - 1); };

  const handlePublish = async () => {
    const validateStep = isEditMode ? 1 : 4;
    if (!validate(validateStep)) return;

    const selectedSkillIds = form.skills
      .map(name => dbSkills.find(s => s.name === name)?.id)
      .filter(Boolean);

    const payload = {
      title: form.title,
      description: form.description,
      categoryId: form.categoryId,
      companyId: employer?.companyId || 1,
      locationId: form.locationId || null,
      jobType: form.type,
      salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
      salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
      experienceLevel: form.experience,
      deadline: form.deadline,
      skillIds: selectedSkillIds,
      qualificationNeeded: form.qualificationNeeded,
      requiresInterview: form.requiresInterview,
      publishImmediately: true
    };

    try {
      if (isEditMode) {
        await updateJob(editId, payload);
      } else {
        await createJob(payload);
      }
      refresh();
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setErrors({ api: "Failed to publish listing. Please check details." });
    }
  };

  const handleDraft = async () => {
    if (!form.title.trim()) {
      setErrors({ title: "Job title is required to save draft." });
      return;
    }
    setSavingDraft(true);

    const selectedSkillIds = form.skills
      .map(name => dbSkills.find(s => s.name === name)?.id)
      .filter(Boolean);

    const payload = {
      title: form.title,
      description: form.description,
      categoryId: form.categoryId || null,
      companyId: employer?.companyId || 1,
      locationId: form.locationId || null,
      jobType: form.type || "FULL_TIME",
      salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
      salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
      experienceLevel: form.experience || "MID",
      deadline: form.deadline || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      skillIds: selectedSkillIds,
      qualificationNeeded: form.qualificationNeeded || "",
      requiresInterview: form.requiresInterview || false,
      publishImmediately: false
    };

    try {
      if (isEditMode) {
        await updateJob(editId, payload);
      } else {
        await createJob(payload);
      }
      refresh();
      onBack();
    } catch (err) {
      console.error(err);
      setErrors({ api: "Failed to save draft." });
    } finally {
      setSavingDraft(false);
    }
  };

  /* Shared shell wrapper */
  const Shell = ({ children }) => (
    <div className="ds-root employer">
      {/* Mobile */}
      {mobileOpen && <div className="ds-mobile-overlay" onClick={() => setMobileOpen(false)} />}

      <div className="ds-body">
        <aside className={`ds-sidebar${mobileOpen ? ' ds-sidebar--mobile-open' : ''}`}>
          <button className="ds-mobile-close" onClick={() => setMobileOpen(false)}><X size={16} /></button>
          <EmployerSidebar employer={employer} loading={loading} stats={stats} />
        </aside>
        <main className="ds-main">
          {/* FAB trigger (mobile) */}
          <button className="ds-mobile-trigger" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          {children}
        </main>
      </div>
    </div>
  );

  if (loadingDb || loading) {
    return (
      <Shell>
        <div className="mj-loading" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "400px" }}>
          <div className="mj-spinner" style={{ width: 40, height: 40, border: "3px solid #E5E7EB", borderTopColor: "var(--ds-accent)", borderRadius: "50%", animation: "mj-spin 0.8s linear infinite" }}/>
          <span style={{ marginTop: 12, fontSize: 14, color: "#6B7280" }}>Loading job editor…</span>
        </div>
      </Shell>
    );
  }

  if (submitted) {
    return (
      <Shell>
        <div className="ds-hero" style={{ flexDirection: "column", alignItems: "center", textAlign: "center", gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle size={32} />
          </div>
          <div>
            <h1 className="ds-hero-title">{isEditMode ? "Job Updated Successfully! 🎉" : "Job Posted Successfully! 🎉"}</h1>
            <p className="ds-hero-sub">"{form.title}" is now live. Candidates can start applying immediately.</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="ds-btn ds-btn-ghost" style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }} onClick={onBack}>
              <ArrowLeft size={14} /> Back to Jobs
            </button>
            {!isEditMode && (
              <button className="ds-btn" style={{ background: "#fff", color: "var(--ds-accent)", fontWeight: 700 }}
                onClick={() => { setSubmitted(false); setStep(1); setForm(INITIAL_FORM); setErrors({}); }}>
                <Plus size={14} /> Post Another
              </button>
            )}
          </div>
        </div>
      </Shell>
    );
  }

  /* Single-page form for Edit Mode */
  if (isEditMode) {
    const skillOpts = dbSkills.map(s => s.name);
    return (
      <Shell>
        <div className="ds-page-header">
          <div>
            <h1 className="ds-page-title">Edit Job Listing</h1>
            <p className="ds-page-sub">Update the details for your job posting on Kora.</p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button className="ds-btn ds-btn-ghost" onClick={onBack}><XCircle size={14} /> Cancel</button>
            <button className="ds-btn ds-btn-primary" onClick={handlePublish}><CheckCircle size={14} /> Confirm Changes</button>
          </div>
        </div>

        {errors.api && (
          <div style={{ background: "#FEF2F2", color: "#B91C1C", border: "1px solid #FCA5A5", borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 13 }}>
            {errors.api}
          </div>
        )}

        <div className="pj-form-layout" style={{ gridTemplateColumns: "1fr" }}>
          <div className="pj-form-card ds-card" style={{ display: "flex", flexDirection: "column", gap: 32, padding: "32px" }}>
            
            {/* Part 1: Basic Information */}
            <Step1 form={form} setForm={setForm} errors={errors} dbCategories={dbCategories} dbLocations={dbLocations} />
            
            <hr style={{ border: "none", borderTop: "1px solid #E5E7EB", margin: "10px 0" }} />

            {/* Part 2: Job Details & Qualifications */}
            <Step2 form={form} setForm={setForm} errors={errors} />

            <hr style={{ border: "none", borderTop: "1px solid #E5E7EB", margin: "10px 0" }} />

            {/* Part 3: Requirements & Skills */}
            <Step3 form={form} setForm={setForm} errors={errors} skillOpts={skillOpts} />

            {/* Actions footer */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, borderTop: "1px solid #E5E7EB", paddingTop: 24, marginTop: 12 }}>
              <button className="ds-btn ds-btn-ghost" style={{ border: "1.5px solid #D1D5DB" }} onClick={onBack}>
                Cancel
              </button>
              <button className="ds-btn ds-btn-primary" onClick={handlePublish}>
                <Save size={14} /> Confirm &amp; Save Changes
              </button>
            </div>

          </div>
        </div>
      </Shell>
    );
  }

  /* Standard step-by-step Wizard for Creating */
  const skillOpts = dbSkills.map(s => s.name);
  const locCity = dbLocations.find(l => l.id === form.locationId)?.city || "Location";
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

      {errors.api && (
        <div style={{ background: "#FEF2F2", color: "#B91C1C", border: "1px solid #FCA5A5", borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 13 }}>
          {errors.api}
        </div>
      )}

      {/* Step indicator */}
      <StepIndicator current={step} />

      {/* Form + Preview */}
      <div className="pj-form-layout">
        <div className="pj-form-card ds-card">
          {step === 1 && <Step1 form={form} setForm={setForm} errors={errors} dbCategories={dbCategories} dbLocations={dbLocations} />}
          {step === 2 && <Step2 form={form} setForm={setForm} errors={errors} />}
          {step === 3 && <Step3 form={form} setForm={setForm} errors={errors} skillOpts={skillOpts} />}
          {step === 4 && <Step4 form={form} dbCategories={dbCategories} dbLocations={dbLocations} />}

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
            <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 12px" }}>{employer?.companyName || "Your Company"} · {locCity}</p>
            {form.type && <span className="ds-job-type" style={{ marginRight: 6 }}>{form.type.replace("_", " ")}</span>}
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