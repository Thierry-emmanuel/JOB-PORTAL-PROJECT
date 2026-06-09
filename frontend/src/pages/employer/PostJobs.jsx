import { useState, useEffect, useCallback, memo } from "react";
import {
  Briefcase, MapPin, DollarSign, Calendar, FileText,
  Tag, CheckCircle, X, Plus, ArrowLeft, ArrowRight,
  Eye, Lightbulb, Save, XCircle, Menu, Building2,
  Globe, Users, ChevronRight, Sparkles, AlertCircle
} from "lucide-react";
import EmployerSidebar from "../../components/employer/EmployerSidebar";
import { useEmployerDashboard } from "../../hooks/useEmployerDashboard";
import {
  createJob, updateJob, getLocations, getSkills, getCategories, getJobDetail, createEmployerCompany,
} from "../../api/jobs";
import "../../styles/dashboard-shell.css";
import "../../styles/PostJobs.css";

/* ── Constants ─────────────────────────────────────────────── */
const STEPS = [
  { id: 1, label: "Basic Info",   icon: Briefcase  },
  { id: 2, label: "Details",      icon: FileText   },
  { id: 3, label: "Requirements", icon: Tag        },
  { id: 4, label: "Review",       icon: Eye        },
];

const INITIAL_FORM = {
  // Company
  companyName: "", sector: "", website: "", companySize: "", companyDescription: "",
  // Basic
  title: "", categoryId: "", type: "", locationId: "", deadline: "",
  salaryMin: "", salaryMax: "", currency: "XAF",
  // Details
  description: "", experience: "", remote: false,
  qualificationNeeded: "", requiresInterview: false,
  // Requirements
  skills: [], benefits: [], languages: [],
};

const JOB_TYPES    = ["FULL_TIME","PART_TIME","CONTRACT","INTERNSHIP","FREELANCE"];
const LEVELS       = ["ENTRY","JUNIOR","MID","SENIOR","LEAD","EXECUTIVE"];
const COMPANY_SIZES = ["1–10","11–50","51–200","201–500","500+"];
const SECTORS      = [
  "Technology","Finance","Healthcare","Education","Retail",
  "Manufacturing","Marketing","Legal","Engineering","Other"
];
const BENEFIT_OPTS = [
  "Health Insurance","Remote Work","Paid Leave","Transport Allowance",
  "Performance Bonus","Training Budget","Flexible Hours","Stock Options"
];

/* ── Helpers ────────────────────────────────────────────────── */
const Field = memo(function Field({ label, required, error, hint, children }) {
  return (
    <div className="pj-field">
      {label && (
        <label className="pj-label">
          {label}{required && <span className="pj-req"> *</span>}
        </label>
      )}
      {children}
      {hint  && !error && <p className="pj-hint">{hint}</p>}
      {error && <p className="pj-error"><AlertCircle size={11} />{error}</p>}
    </div>
  );
});

const TagInput = memo(function TagInput({ items, options, placeholder, onAdd, onRemove }) {
  const [input, setInput] = useState("");
  const filtered = options?.filter(
    o => !items.includes(o) && o.toLowerCase().includes(input.toLowerCase())
  ) ?? [];
  return (
    <div className="pj-tag-input">
      <div className="pj-tags">
        {items.map(tag => (
          <span key={tag} className="pj-tag">
            {tag}<button type="button" onClick={() => onRemove(tag)}><X size={11}/></button>
          </span>
        ))}
        <input
          placeholder={placeholder}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key==="Enter"&&input.trim()){e.preventDefault();onAdd(input.trim());setInput("");}
            if (e.key==="Backspace"&&!input&&items.length) onRemove(items[items.length-1]);
          }}
        />
      </div>
      {input && filtered.length>0 && (
        <ul className="pj-suggestions">
          {filtered.slice(0,6).map(s=>(
            <li key={s} onClick={()=>{onAdd(s);setInput("");}}>
              <Plus size={11}/>{s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

/* ── Company profile (read-only, from employer account) ───── */
const CompanyProfileCard = memo(function CompanyProfileCard({ employer }) {
  if (!employer?.companyId) {
    return (
      <div className="pj-company-card pj-company-card--warn">
        <AlertCircle size={16} />
        <div>
          <strong>Company profile required</strong>
          <p>Complete your company profile before posting. <a href="/profile/employer">Go to Company Profile</a></p>
        </div>
      </div>
    );
  }
  return (
    <div className="pj-company-card">
      <div className="pj-company-card-logo">{(employer.companyName || '?')[0]}</div>
      <div>
        <div className="pj-company-card-name">{employer.companyName}</div>
        <div className="pj-company-card-meta">
          {[employer.sector, employer.city].filter(Boolean).join(' · ') || 'Company profile'}
        </div>
        <p className="pj-company-card-hint">Pulled automatically from your company profile — no need to re-enter.</p>
      </div>
    </div>
  );
});

/* ── Legacy step (unused in wizard) ────────────────────────── */
const Step1Company = memo(function Step1Company({ form, updateField, errors }) {
  return (
    <div className="pj-step-body">
      <div className="pj-step-header">
        <div className="pj-step-icon-pill" style={{background:"#EFF6FF",color:"#2563EB"}}>
          <Building2 size={16}/>
        </div>
        <div>
          <h2 className="pj-step-title">Company Information</h2>
          <p className="pj-step-sub">Tell candidates about your company</p>
        </div>
      </div>

      <div className="pj-form-grid">
        <Field label="Company Name" required error={errors.companyName}>
          <div className="pj-input-icon">
            <Building2 size={15}/>
            <input className="pj-input pj-input-with-icon" placeholder="e.g. Acme Corp"
              value={form.companyName} onChange={e=>updateField("companyName",e.target.value)}/>
          </div>
        </Field>

        <Field label="Industry / Sector" required error={errors.sector}>
          <select className="pj-input" value={form.sector} onChange={e=>updateField("sector",e.target.value)}>
            <option value="">Select sector…</option>
            {SECTORS.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </Field>

        <Field label="Company Website" hint="Include https://">
          <div className="pj-input-icon">
            <Globe size={15}/>
            <input className="pj-input pj-input-with-icon" placeholder="https://yourcompany.com"
              value={form.website} onChange={e=>updateField("website",e.target.value)}/>
          </div>
        </Field>

        <Field label="Company Size" error={errors.companySize}>
          <div className="pj-input-icon">
            <Users size={15}/>
            <select className="pj-input pj-input-with-icon" value={form.companySize}
              onChange={e=>updateField("companySize",e.target.value)}>
              <option value="">Select size…</option>
              {COMPANY_SIZES.map(s=><option key={s} value={s}>{s} employees</option>)}
            </select>
          </div>
        </Field>

        <div className="pj-field pj-field-full">
          <Field label="About the Company"
            hint="A short description helps candidates understand your mission and culture.">
            <textarea className="pj-textarea" rows={4}
              placeholder="Describe your company culture, mission, products/services…"
              value={form.companyDescription}
              onChange={e=>updateField("companyDescription",e.target.value)}/>
            <span className="pj-char-count">{form.companyDescription.length}/500</span>
          </Field>
        </div>
      </div>
    </div>
  );
});

/* ── Step 2 — Basic Info ────────────────────────────────────── */
const Step2Basic = memo(function Step2Basic({ form, updateField, errors, dbCategories, dbLocations }) {
  return (
    <div className="pj-step-body">
      <div className="pj-step-header">
        <div className="pj-step-icon-pill" style={{background:"#F0FDF4",color:"#16A34A"}}>
          <Briefcase size={16}/>
        </div>
        <div>
          <h2 className="pj-step-title">Basic Information</h2>
          <p className="pj-step-sub">The essentials that appear in job search results</p>
        </div>
      </div>

      <div className="pj-form-grid">
        <Field label="Job Title" required error={errors.title}>
          <input className="pj-input" placeholder="e.g. Senior Java Developer"
            value={form.title} onChange={e=>updateField("title",e.target.value)}/>
        </Field>

        <Field label="Category" required error={errors.categoryId}>
          <select className="pj-input" value={form.categoryId}
            onChange={e=>updateField("categoryId",e.target.value)}>
            <option value="">Select category…</option>
            {dbCategories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>

        <Field label="Contract Type" required error={errors.type}>
          <select className="pj-input" value={form.type} onChange={e=>updateField("type",e.target.value)}>
            <option value="">Select type…</option>
            {JOB_TYPES.map(t=><option key={t} value={t}>{t.replace(/_/g," ")}</option>)}
          </select>
        </Field>

        <Field label="Location" required error={errors.locationId}>
          <div className="pj-input-icon"><MapPin size={15}/>
            <select className="pj-input pj-input-with-icon" value={form.locationId}
              onChange={e=>updateField("locationId",e.target.value)}>
              <option value="">Select location…</option>
              {dbLocations.map(l=>
                <option key={l.id} value={l.id}>{l.city}{l.country?`, ${l.country}`:""}</option>
              )}
            </select>
          </div>
        </Field>

        <Field label="Application Deadline" required error={errors.deadline}>
          <div className="pj-input-icon"><Calendar size={15}/>
            <input type="date" className="pj-input pj-input-with-icon"
              value={form.deadline} min={new Date().toISOString().split("T")[0]}
              onChange={e=>updateField("deadline",e.target.value)}/>
          </div>
        </Field>

        <div className="pj-field pj-field-salary">
          <label className="pj-label">Salary Range <span className="pj-currency-badge">XAF</span></label>
          <div className="pj-salary-row">
            <div className="pj-input-icon"><DollarSign size={15}/>
              <input className="pj-input pj-input-with-icon" type="number"
                placeholder="Min" value={form.salaryMin}
                onChange={e=>updateField("salaryMin",e.target.value)}/>
            </div>
            <span className="pj-salary-sep">–</span>
            <div className="pj-input-icon"><DollarSign size={15}/>
              <input className="pj-input pj-input-with-icon" type="number"
                placeholder="Max" value={form.salaryMax}
                onChange={e=>updateField("salaryMax",e.target.value)}/>
            </div>
            <select className="pj-input pj-currency" value={form.currency}
              onChange={e=>updateField("currency",e.target.value)}>
              {["XAF","USD","EUR","GBP"].map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="pj-field">
          <label className="pj-checkbox pj-checkbox-card">
            <input type="checkbox" checked={form.remote}
              onChange={e=>updateField("remote",e.target.checked)}/>
            <div className="pj-checkbox-card-content">
              <span className="pj-checkbox-card-title">Remote / Hybrid position</span>
              <span className="pj-checkbox-card-sub">Open to remote candidates</span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
});

/* ── Step 3 — Details ───────────────────────────────────────── */
const Step3Details = memo(function Step3Details({ form, updateField, errors }) {
  return (
    <div className="pj-step-body">
      <div className="pj-step-header">
        <div className="pj-step-icon-pill" style={{background:"#FFF7ED",color:"#EA580C"}}>
          <FileText size={16}/>
        </div>
        <div>
          <h2 className="pj-step-title">Job Details</h2>
          <p className="pj-step-sub">Full description and qualifications</p>
        </div>
      </div>

      <Field label="Job Description" required error={errors.description}
        hint="Include responsibilities, team context, day-to-day tasks.">
        <textarea className="pj-textarea pj-textarea-lg" rows={7}
          placeholder="Describe the role, responsibilities, team culture…"
          value={form.description} onChange={e=>updateField("description",e.target.value)}/>
        <div className="pj-char-row">
          <span className="pj-char-count">{form.description.length}/3000</span>
          {form.description.length < 100 && (
            <span className="pj-char-warn">Aim for at least 100 characters</span>
          )}
        </div>
      </Field>

      <Field label="Qualifications Needed" required error={errors.qualificationNeeded}
        hint="Education, certifications, years of experience.">
        <textarea className="pj-textarea" rows={3}
          placeholder="Bachelor's degree in CS, 3+ years experience, certifications, etc."
          value={form.qualificationNeeded}
          onChange={e=>updateField("qualificationNeeded",e.target.value)}/>
      </Field>

      <Field label="Experience Level" required error={errors.experience}>
        <div className="pj-pills">
          {LEVELS.map(l=>(
            <button key={l} type="button"
              className={`pj-pill${form.experience===l?" active":""}`}
              onClick={()=>updateField("experience",l)}>
              {l}
            </button>
          ))}
        </div>
      </Field>

      <div className="pj-row">
        <label className="pj-checkbox pj-checkbox-card pj-checkbox-card--accent">
          <input type="checkbox" checked={form.requiresInterview}
            onChange={e=>updateField("requiresInterview",e.target.checked)}/>
          <div className="pj-checkbox-card-content">
            <span className="pj-checkbox-card-title">Requires Interview Process</span>
            <span className="pj-checkbox-card-sub">Candidates will go through a formal interview</span>
          </div>
        </label>
      </div>

      <Field label="Benefits">
        <div className="pj-check-grid">
          {BENEFIT_OPTS.map(b=>(
            <label key={b} className="pj-checkbox pj-checkbox-chip">
              <input type="checkbox" checked={form.benefits.includes(b)}
                onChange={e=>updateField("benefits",e.target.checked
                  ? [...form.benefits,b]
                  : form.benefits.filter(x=>x!==b))}/>
              <span>{b}</span>
            </label>
          ))}
        </div>
      </Field>
    </div>
  );
});

/* ── Step 4 — Requirements / Skills ────────────────────────── */
const Step4Requirements = memo(function Step4Requirements({ form, updateField, errors, skillOpts }) {
  const addSkill = s => !form.skills.includes(s) && updateField("skills",[...form.skills,s]);
  const addLang  = l => !form.languages.includes(l) && updateField("languages",[...form.languages,l]);
  return (
    <div className="pj-step-body">
      <div className="pj-step-header">
        <div className="pj-step-icon-pill" style={{background:"#FDF4FF",color:"#9333EA"}}>
          <Tag size={16}/>
        </div>
        <div>
          <h2 className="pj-step-title">Requirements &amp; Skills</h2>
          <p className="pj-step-sub">Skills and languages candidates should have</p>
        </div>
      </div>

      <Field label="Required Skills" required error={errors.skills}
        hint="Type a skill or pick from suggestions, then press Enter.">
        <TagInput items={form.skills} options={skillOpts}
          placeholder="e.g. React, Java, SQL…"
          onAdd={addSkill} onRemove={s=>updateField("skills",form.skills.filter(x=>x!==s))}/>
      </Field>

      <Field label="Languages"
        hint="Optional — add if language proficiency matters for this role.">
        <TagInput items={form.languages}
          options={["English","French","Spanish","Arabic","Portuguese","German","Mandarin"]}
          placeholder="Add language…"
          onAdd={addLang} onRemove={l=>updateField("languages",form.languages.filter(x=>x!==l))}/>
      </Field>

      <div className="pj-tip-banner">
        <Sparkles size={14}/>
        <span><strong>Pro tip:</strong> Jobs listing 5–10 specific skills attract 3× more qualified applicants than vague requirements.</span>
      </div>
    </div>
  );
});

/* ── Step 5 — Review ────────────────────────────────────────── */
const Step5Review = memo(function Step5Review({ form, dbCategories, dbLocations, employer }) {
  const catName = dbCategories.find(c=>c.id===form.categoryId)?.name || "—";
  const locCity = dbLocations.find(l=>l.id===form.locationId)?.city || "—";

  const Section = ({ title, icon: Icon, children }) => (
    <div className="pj-review-section">
      <div className="pj-review-section-title"><Icon size={14}/>{title}</div>
      {children}
    </div>
  );

  const Row = ({ k, v }) => (
    <div className="pj-review-row">
      <span className="pj-review-key">{k}</span>
      <span className="pj-review-val">{v}</span>
    </div>
  );

  return (
    <div className="pj-step-body">
      <div className="pj-step-header">
        <div className="pj-step-icon-pill" style={{background:"#F0FDF4",color:"#16A34A"}}>
          <Eye size={16}/>
        </div>
        <div>
          <h2 className="pj-step-title">Review &amp; Publish</h2>
          <p className="pj-step-sub">Double-check everything before going live</p>
        </div>
      </div>

      <Section title="Company" icon={Building2}>
        <Row k="Company" v={employer?.companyName || "—"}/>
        <Row k="Sector"  v={employer?.sector || "—"}/>
        <Row k="Location" v={employer?.city || "—"}/>
      </Section>

      <Section title="Job Details" icon={Briefcase}>
        <Row k="Title"      v={form.title||"—"}/>
        <Row k="Category"   v={catName}/>
        <Row k="Type"       v={form.type||"—"}/>
        <Row k="Location"   v={locCity}/>
        <Row k="Experience" v={form.experience||"—"}/>
        <Row k="Deadline"   v={form.deadline||"—"}/>
        <Row k="Interview?" v={form.requiresInterview?"Yes, required":"No"}/>
        <Row k="Salary"
          v={form.salaryMin&&form.salaryMax
            ? `${Number(form.salaryMin).toLocaleString()} – ${Number(form.salaryMax).toLocaleString()} ${form.currency}`
            : "Not specified"}/>
        <Row k="Remote" v={form.remote?"Yes":"No"}/>
      </Section>

      {form.qualificationNeeded && (
        <Section title="Qualifications" icon={FileText}>
          <p className="pj-review-text">{form.qualificationNeeded}</p>
        </Section>
      )}

      {form.description && (
        <Section title="Description" icon={FileText}>
          <p className="pj-review-text">
            {form.description.slice(0,320)}{form.description.length>320?"…":""}
          </p>
        </Section>
      )}

      {form.skills.length>0 && (
        <Section title="Skills" icon={Tag}>
          <div className="pj-tags" style={{marginTop:6}}>
            {form.skills.map(s=><span key={s} className="pj-tag" style={{cursor:"default"}}>{s}</span>)}
          </div>
        </Section>
      )}

      <div className="pj-publish-callout">
        <CheckCircle size={16}/>
        <div>
          <strong>Ready to publish?</strong> Your listing will go live immediately and be visible to thousands of candidates on Kora.
        </div>
      </div>
    </div>
  );
});

/* ── Shell — defined OUTSIDE PostJob to avoid remount on re-render ───── */
function PostJobShell({ children, mobileOpen, setMobileOpen, employer, loading, stats }) {
  return (
    <div className="ds-root employer">
      {mobileOpen && <div className="ds-mobile-overlay" onClick={() => setMobileOpen(false)}/>}
      <div className="ds-body">
        <aside className={`ds-sidebar${mobileOpen ? " ds-sidebar--mobile-open" : ""}`}>
          <button className="ds-mobile-close" onClick={() => setMobileOpen(false)}><X size={16}/></button>
          <EmployerSidebar employer={employer} loading={loading} stats={stats}/>
        </aside>
        <main className="ds-main">
          <button className="ds-mobile-trigger" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu size={20}/>
          </button>
          {children}
        </main>
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────── */
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

  // Stable field updater — prevents re-renders that lose focus
  const updateField = useCallback((k, v) => setForm(p => ({ ...p, [k]: v })), []);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const editIdParam = query.get("edit");

    const loadPlatformData = async () => {
      try {
        const [cats, locs, sks] = await Promise.all([
          getCategories(), getLocations(), getSkills()
        ]);
        setDbCategories(cats);
        setDbLocations(locs);
        setDbSkills(sks);

        if (editIdParam) {
          setIsEditMode(true);
          setEditId(editIdParam);
          const job = await getJobDetail(editIdParam);
          setForm({
            companyName: job.company?.name || "",
            sector: "", website: job.website || "",
            companySize: "", companyDescription: "",
            title: job.title || "",
            categoryId: job.category?.id || "",
            type: job.jobType || "",
            locationId: job.location?.id || "",
            deadline: job.deadline || "",
            salaryMin: job.salaryMin ? parseInt(job.salaryMin.toString().replace(/[^0-9]/g,"")) : "",
            salaryMax: job.salaryMax ? parseInt(job.salaryMax.toString().replace(/[^0-9]/g,"")) : "",
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
      if (!form.title.trim())    e.title      = "Job title is required.";
      if (!form.categoryId)      e.categoryId = "Please select a category.";
      if (!form.type)            e.type       = "Please select a contract type.";
      if (!form.locationId)      e.locationId = "Location is required.";
      if (!form.deadline)        e.deadline   = "Please set a deadline.";
    }
    if (s === 2 || isEditMode) {
      if (!form.description.trim())          e.description         = "Description is required.";
      if (form.description.length > 3000)    e.description         = "Max 3000 characters.";
      if (!form.experience)                  e.experience          = "Please select an experience level.";
      if (!form.qualificationNeeded?.trim()) e.qualificationNeeded = "Qualifications are required.";
    }
    if (s === 3 || isEditMode) {
      if (form.skills.length === 0) e.skills = "Add at least one skill.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => { if (validate(step)) setStep(s => s + 1); };
  const handleBack = () => { setErrors({}); setStep(s => s - 1); };

  const buildPayload = (publish = true) => {
    const selectedSkillIds = form.skills
      .map(name => dbSkills.find(s => s.name === name)?.id)
      .filter(Boolean);
    return {
      title: form.title,
      description: form.description,
      categoryId: form.categoryId,
      companyId: employer?.companyId,           // ✅ no fallback to 1
      locationId: form.locationId || null,
      jobType: form.type || "FULL_TIME",
      salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
      salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
      experienceLevel: form.experience || "MID",
      deadline: form.deadline || new Date(Date.now() + 30*86400000).toISOString().split("T")[0],
      skillIds: selectedSkillIds,
      qualificationNeeded: form.qualificationNeeded || "",
      requiresInterview: form.requiresInterview || false,
      publishImmediately: publish,
    };
  };

  // ✅ Guard: employer must have a company before posting
  const checkCompany = async () => {
    if (employer?.companyId) return true;
    if (!employer?.id) {
      setErrors({ api: "Employer session not loaded. Please refresh and try again." });
      return false;
    }
    try {
      const created = await createEmployerCompany(employer.id, {
        name: employer.companyName || employer.contactName || 'My Company',
        sector: employer.sector || 'Technology',
        city: employer.city || 'Yaounde',
        country: 'Cameroon',
      });
      if (created?.id) {
        await refresh();
        return true;
      }
    } catch { /* fall through */ }
    setErrors({ api: "Complete your company profile before posting. Go to Company Profile in the sidebar." });
    return false;
  };

  const handlePublish = async () => {
    const validateStep = isEditMode ? 1 : 4;
    if (!validate(validateStep)) return;
    if (!(await checkCompany())) return;
    try {
      if (isEditMode) {
        await updateJob(editId, buildPayload(true));
      } else {
        await createJob(buildPayload(true));
      }
      refresh();
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.detail || err.response?.data?.message || "Failed to publish listing. Please check the details.";
      setErrors({ api: msg });
    }
  };

  const handleDraft = async () => {
    if (!form.title.trim()) {
      setErrors({ title: "Job title is required to save draft." });
      return;
    }
    if (!(await checkCompany())) return;
    setSavingDraft(true);
    try {
      if (isEditMode) {
        await updateJob(editId, buildPayload(false));
      } else {
        await createJob(buildPayload(false));
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

  /* Shell is defined outside — see top of file */

  if (loadingDb || loading) {
    return (
      <PostJobShell mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} employer={employer} loading={loading} stats={stats}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:400}}>
          <div className="pj-spinner"/>
          <span style={{marginTop:12,fontSize:14,color:"#6B7280"}}>Loading job editor…</span>
        </div>
      </PostJobShell>
    );
  }

  if (submitted) {
    return (
      <PostJobShell mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} employer={employer} loading={loading} stats={stats}>
        <div className="pj-success-screen">
          <div className="pj-success-confetti"/>
          <div className="pj-success-icon">
            <CheckCircle size={36}/>
          </div>
          <h1 className="pj-success-title">
            {isEditMode ? "Job Updated Successfully!" : "Job Posted Successfully!"}
          </h1>
          <p className="pj-success-sub">
            <strong>"{form.title}"</strong> is now live on Kora.{" "}
            Candidates can start discovering and applying immediately.
          </p>
          <div className="pj-success-actions">
            <button className="ds-btn ds-btn-ghost" onClick={onBack}>
              <ArrowLeft size={14}/> Back to Jobs
            </button>
            {!isEditMode && (
              <button className="ds-btn ds-btn-primary"
                onClick={() => { setSubmitted(false); setStep(1); setForm(INITIAL_FORM); setErrors({}); }}>
                <Plus size={14}/> Post Another Job
              </button>
            )}
          </div>
        </div>
      </PostJobShell>
    );
  }

  /* Edit Mode — single page */
  if (isEditMode) {
    const skillOpts = dbSkills.map(s => s.name);
    return (
      <PostJobShell mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} employer={employer} loading={loading} stats={stats}>
        <div className="ds-page-header">
          <div>
            <h1 className="ds-page-title">Edit Job Listing</h1>
            <p className="ds-page-sub">Update the details for your job posting on Kora.</p>
          </div>
          <div style={{display:"flex",gap:12}}>
            <button className="ds-btn ds-btn-ghost" onClick={onBack}><XCircle size={14}/> Cancel</button>
            <button className="ds-btn ds-btn-primary" onClick={handlePublish}><CheckCircle size={14}/> Save Changes</button>
          </div>
        </div>

        {errors.api && <div className="pj-api-error"><AlertCircle size={14}/>{errors.api}</div>}

        <div className="pj-form-layout" style={{gridTemplateColumns:"1fr"}}>
          <div className="pj-form-card ds-card" style={{display:"flex",flexDirection:"column",gap:32,padding:32}}>
            <CompanyProfileCard employer={employer} />
            <div className="pj-section-divider"/>
            <Step2Basic form={form} updateField={updateField} errors={errors} dbCategories={dbCategories} dbLocations={dbLocations}/>
            <div className="pj-section-divider"/>
            <Step3Details form={form} updateField={updateField} errors={errors}/>
            <div className="pj-section-divider"/>
            <Step4Requirements form={form} updateField={updateField} errors={errors} skillOpts={skillOpts}/>
            <div style={{display:"flex",justifyContent:"flex-end",gap:12,borderTop:"1px solid #E5E7EB",paddingTop:24}}>
              <button className="ds-btn ds-btn-ghost" onClick={onBack}>Cancel</button>
              <button className="ds-btn ds-btn-primary" onClick={handlePublish}>
                <Save size={14}/> Save Changes
              </button>
            </div>
          </div>
        </div>
      </PostJobShell>
    );
  }

  /* Wizard Mode */
  const skillOpts = dbSkills.map(s => s.name);
  const locCity = dbLocations.find(l => l.id === form.locationId)?.city || "Location";

  return (
    <PostJobShell mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} employer={employer} loading={loading} stats={stats}>
      <div className="pj-wizard-header">
        <div>
          <h1 className="ds-page-title">Post a New Job</h1>
          <p className="ds-page-sub">Fill in the details to publish your listing on Kora.</p>
        </div>
        <div className="ds-page-actions">
          <button className="ds-btn ds-btn-ghost" onClick={onBack}><ArrowLeft size={14}/> Back</button>
          <button className="ds-btn ds-btn-ghost" onClick={handleDraft} disabled={savingDraft}>
            <Save size={14}/>{savingDraft ? "Saving…" : "Save Draft"}
          </button>
        </div>
      </div>

      {errors.api && <div className="pj-api-error"><AlertCircle size={14}/>{errors.api}</div>}

      {/* Step Indicator */}
      <div className="pj-steps">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const state = step === s.id ? "active" : step > s.id ? "done" : "";
          return (
            <div key={s.id} className={`pj-step${state ? " "+state : ""}`}>
              <div className="pj-step-circle">
                {step > s.id ? <CheckCircle size={14}/> : <Icon size={13}/>}
              </div>
              <span className="pj-step-label">{s.label}</span>
              {i < STEPS.length-1 && <div className={`pj-step-line${step > s.id ? " done" : ""}`}/>}
            </div>
          );
        })}
      </div>

      <div className="pj-form-layout">
        <div className="pj-form-card ds-card">
          <CompanyProfileCard employer={employer} />
          {step === 1 && <Step2Basic form={form} updateField={updateField} errors={errors} dbCategories={dbCategories} dbLocations={dbLocations}/>}
          {step === 2 && <Step3Details form={form} updateField={updateField} errors={errors}/>}
          {step === 3 && <Step4Requirements form={form} updateField={updateField} errors={errors} skillOpts={skillOpts}/>}
          {step === 4 && <Step5Review form={form} dbCategories={dbCategories} dbLocations={dbLocations} employer={employer}/>}

          <div className="pj-step-nav">
            <div>
              {step > 1 && (
                <button className="ds-btn ds-btn-ghost" onClick={handleBack}>
                  <ArrowLeft size={14}/> Back
                </button>
              )}
            </div>
            <div className="pj-step-nav-right">
              <span className="pj-step-counter">Step {step} of {STEPS.length}</span>
              {step < STEPS.length
                ? <button className="ds-btn ds-btn-primary" onClick={handleNext}>
                    Next <ChevronRight size={14}/>
                  </button>
                : <button className="ds-btn ds-btn-primary pj-publish-btn" onClick={handlePublish}>
                    <Sparkles size={14}/> Publish Job
                  </button>
              }
            </div>
          </div>
        </div>

        {/* Live Preview Sidebar */}
        <div className="ds-card pj-preview-card">
          <div className="pj-preview-header">
            <Eye size={13}/>
            <span>Live Preview</span>
            {form.title && <span className="pj-preview-badge">Active</span>}
          </div>
          <div className="pj-preview-body">
            {form.title || employer?.companyName ? (
              <>
                <div className="pj-preview-company-row">
                  <div className="pj-preview-logo">
                    {(employer?.companyName || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="pj-preview-company-name">
                      {employer?.companyName || "Your Company"}
                    </div>
                    {employer?.sector && <div className="pj-preview-sector">{employer.sector}</div>}
                  </div>
                </div>
                <h4 className="pj-preview-job-title">{form.title || "Job Title"}</h4>
                <div className="pj-preview-chips">
                  {form.type && <span className="pj-preview-chip">{form.type.replace(/_/g," ")}</span>}
                  {form.remote && <span className="pj-preview-chip pj-preview-chip--green">Remote</span>}
                  {form.experience && <span className="pj-preview-chip">{form.experience}</span>}
                </div>
                {form.locationId && (
                  <div className="pj-preview-meta">
                    <MapPin size={11}/>{locCity}
                  </div>
                )}
                {form.salaryMin && (
                  <div className="pj-preview-salary">
                    {Number(form.salaryMin).toLocaleString()}
                    {form.salaryMax ? ` – ${Number(form.salaryMax).toLocaleString()}` : "+"} {form.currency}
                  </div>
                )}
                {form.description && (
                  <p className="pj-preview-desc">
                    {form.description.slice(0,120)}{form.description.length>120?"…":""}
                  </p>
                )}
                {form.skills.length > 0 && (
                  <div className="pj-preview-skills">
                    {form.skills.slice(0,4).map(s=><span key={s} className="pj-preview-skill-tag">{s}</span>)}
                    {form.skills.length > 4 && <span className="pj-preview-more">+{form.skills.length-4}</span>}
                  </div>
                )}
              </>
            ) : (
              <div className="pj-preview-empty">
                <Eye size={24} style={{opacity:0.2,margin:"0 auto 8px",display:"block"}}/>
                Fill in the form to see a live preview of your job listing.
              </div>
            )}
          </div>

          <div className="pj-tips-card">
            <div className="pj-tips-title"><Lightbulb size={13}/> Posting Tips</div>
            <ul className="pj-tips-list">
              {[
                "Clear titles get 50% more clicks",
                "List 5–10 specific required skills",
                "Salary transparency increases applications",
                "Describe team culture, not just tasks",
              ].map(t=>(
                <li key={t} className="pj-tip"><ChevronRight size={11}/>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </PostJobShell>
  );
}