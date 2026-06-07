import { useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail, Lock, User, Briefcase, Eye, EyeOff,
  Phone, MapPin, Globe, Building2, FileText,
  ChevronRight, ChevronLeft, CheckCircle, Shield,
  Upload, X, AlertTriangle, Clock, Hash,
  Info, FileBadge, Landmark, Users, ArrowLeft
} from "lucide-react";
import logo from "../../assets/absolute-size-logo.png";
import "../../styles/auth.css";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/client";

/* ── API calls ───────────────────────────────── */
const submitEmployerVerification = async (data) =>
  apiClient.patch("/api/v1/employer/profile", data);

const submitEmployerDocuments = async (formData) =>
  apiClient.post("/api/v1/employer/documents", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

/* ── File upload zone ────────────────────────── */
function DocUploadZone({ label, hint, accept, required, file, onFile, onRemove, error }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  }, [onFile]);

  const fmtSize = (b) => b < 1024 * 1024
    ? `${(b / 1024).toFixed(0)} KB`
    : `${(b / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div className="kora-doc-upload-wrap">
      <div className="kora-doc-upload-label">
        {label}
        {required && <span className="kora-doc-required"> *</span>}
        {hint && <span className="kora-doc-hint"> — {hint}</span>}
      </div>
      {file ? (
        <div className="kora-doc-file-row">
          <div className="kora-doc-file-icon"><FileText size={18} /></div>
          <div className="kora-doc-file-info">
            <span className="kora-doc-file-name">{file.name}</span>
            <span className="kora-doc-file-size">{fmtSize(file.size)}</span>
          </div>
          <button type="button" className="kora-doc-file-remove" onClick={onRemove}>
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          className={`kora-doc-drop-zone${dragging ? " dragging" : ""}${error ? " error" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            style={{ display: "none" }}
            onChange={(e) => e.target.files[0] && onFile(e.target.files[0])}
          />
          <Upload size={18} className="kora-doc-drop-icon" />
          <span className="kora-doc-drop-text">
            <strong>Click to upload</strong> or drag & drop
          </span>
          <span className="kora-doc-drop-sub">PDF, JPG, PNG · Max 10 MB</span>
        </div>
      )}
      {error && <p className="kora-doc-field-error">{error}</p>}
    </div>
  );
}

/* ── Input field wrapper ─────────────────────── */
function AuthField({ icon: Icon, rightIcon, placeholder, type = "text", value, onChange, required, autoComplete }) {
  return (
    <div className="kora-auth-input-wrapper">
      <Icon size={18} className="kora-auth-input-icon" />
      <input
        type={type}
        className="kora-auth-input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required={required}
      />
      {rightIcon}
    </div>
  );
}

/* ── Mobile brand header (visible when left panel hidden) ── */
function MobileHeader({ isEmployer }) {
  return (
    <div className="kora-mobile-header">
      <img src={logo} alt="KORA" />
      <span className="kora-mobile-header-title">
        {isEmployer ? "Hire on KORA" : "KORA"}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   NON-EMPLOYER: single-step registration
───────────────────────────────────────────────────── */
function StandardRegister({ role, setRole }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) return setError("Passwords do not match");
    if (!role) return setError("Please select a role");
    setLoading(true);
    try {
      const nameParts = fullName.trim().split(" ");
      await register({
        email, password,
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        role,
      });
      navigate("/");
    } catch (err) {
      setError(err.response?.data || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="kora-auth-form" onSubmit={handleSubmit} style={{ gap: "15px" }}>
      {error && <div className="kora-auth-error">{error}</div>}
      <div className="kora-auth-field">
        <AuthField icon={User} placeholder="Full Name" value={fullName}
          onChange={e => setFullName(e.target.value)} autoComplete="name" required />
      </div>
      <div className="kora-auth-field">
        <AuthField icon={Mail} placeholder="Email Address" type="email" value={email}
          onChange={e => setEmail(e.target.value)} autoComplete="email" required />
      </div>
      <div className="kora-auth-field">
        <div className="kora-auth-input-wrapper">
          <Briefcase size={18} className="kora-auth-input-icon" />
          <select className="kora-auth-input" value={role}
            onChange={e => setRole(e.target.value)} style={{ appearance: "none" }} required>
            <option value="" disabled>Select your role</option>
            <option value="JOB_SEEKER">Job Seeker</option>
            <option value="EMPLOYER">Employer</option>
          </select>
        </div>
      </div>
      <div className="kora-auth-field">
        <AuthField icon={Lock} placeholder="Password"
          type={showPassword ? "text" : "password"} value={password}
          onChange={e => setPassword(e.target.value)} autoComplete="new-password" required
          rightIcon={
            <button type="button" className="kora-auth-input-right-icon" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          } />
      </div>
      <div className="kora-auth-field">
        <AuthField icon={Lock} placeholder="Confirm Password"
          type={showConfirmPassword ? "text" : "password"} value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" required
          rightIcon={
            <button type="button" className="kora-auth-input-right-icon" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          } />
      </div>
      <div className="kora-auth-options" style={{ marginTop: 0 }}>
        <label className="kora-auth-checkbox">
          <input type="checkbox" required />
          <span style={{ fontSize: 12 }}>I agree to the Terms and Privacy Policy</span>
        </label>
      </div>
      <button type="submit" className="kora-auth-btn" style={{ marginTop: 5 }} disabled={loading}>
        {loading ? "Creating…" : "Create Account"}
      </button>
      <div className="kora-auth-divider">Or sign up with</div>
      <a
        href={`${import.meta.env.VITE_API_BASE_URL || ""}/oauth2/authorization/google?role=${role || "JOB_SEEKER"}&origin=${encodeURIComponent(window.location.origin)}`}
        className="kora-auth-social-btn"
        style={{ textDecoration: "none" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Continue as Job Seeker with Google
      </a>
    </form>
  );
}

/* ─────────────────────────────────────────────────────
   EMPLOYER 3-STEP REGISTRATION
───────────────────────────────────────────────────── */
function EmployerRegister({ setRole }) {
  const [empStep, setEmpStep] = useState(1);

  /* Step 1 */
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

  /* Step 2 company fields */
  const [companyName, setCompanyName] = useState("");
  const [sector, setSector] = useState("");
  const [website, setWebsite] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [taxId, setTaxId] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [bio, setBio] = useState("");

  /* Step 2 documents */
  const [docRCCM, setDocRCCM] = useState(null);
  const [docTaxCert, setDocTaxCert] = useState(null);
  const [docStatutes, setDocStatutes] = useState(null);
  const [docId, setDocId] = useState(null);
  const [docErrors, setDocErrors] = useState({});

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const SECTORS = [
    "Technology", "Finance & Banking", "Healthcare", "Education", "Retail & Commerce",
    "Manufacturing", "Marketing & Media", "Legal Services", "Engineering & Construction",
    "Agriculture", "Tourism & Hospitality", "Transport & Logistics",
    "Telecommunications", "Oil & Energy", "Consulting", "NGO / Non-profit", "Other",
  ];

  const SIZES = [
    "1 – 10 employees", "11 – 50 employees", "51 – 200 employees",
    "201 – 500 employees", "500+ employees",
  ];

  const ACCEPTED_DOCS = ".pdf,.jpg,.jpeg,.png";

  /* ── Step progress bar ────────────────── */
  const STEPS = [
    { n: 1, label: "Account" },
    { n: 2, label: "Documents" },
    { n: 3, label: "Review" },
  ];

  const StepProgress = () => (
    <div className="kora-emp-steps">
      {STEPS.map(({ n, label }, i) => (
        <div key={n} className={`kora-emp-step${empStep === n ? " active" : empStep > n ? " done" : ""}`}>
          <div className="kora-emp-step-circle">
            {empStep > n ? <CheckCircle size={12} /> : n}
          </div>
          <span className="kora-emp-step-label">{label}</span>
          {i < STEPS.length - 1 && (
            <div className={`kora-emp-step-line${empStep > n ? " done" : ""}`} />
          )}
        </div>
      ))}
    </div>
  );

  /* ── Step 1 submit ────────────────────── */
  const handleStep1 = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) return setError("Passwords do not match");
    setLoading(true);
    try {
      const nameParts = fullName.trim().split(" ");
      await register({
        email, password,
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        role: "EMPLOYER",
      });
      setEmpStep(2);
    } catch (err) {
      setError(err.response?.data || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 2 submit ────────────────────── */
  const handleStep2 = async (e) => {
    e.preventDefault();
    setError("");

    const errs = {};
    if (!docRCCM)    errs.rccm    = "RCCM / Business Registration certificate is required";
    if (!docTaxCert) errs.taxCert = "Tax Compliance Certificate (NIU) is required";
    if (!docId)      errs.id      = "Legal representative ID is required";
    if (Object.keys(errs).length) { setDocErrors(errs); return; }
    setDocErrors({});

    if (!companyName.trim()) return setError("Company name is required.");
    if (!sector)             return setError("Please select your industry sector.");
    if (!regNumber.trim())   return setError("RCCM registration number is required.");
    if (!taxId.trim())       return setError("NIU tax identification number is required.");

    setLoading(true);
    try {
      await submitEmployerVerification({
        contactName: fullName, phone, city, sector, website, jobTitle, bio,
        companyName, companySize, companyAddress,
        registrationNumber: regNumber,
        taxIdentificationNumber: taxId,
      });

      try {
        const fd = new FormData();
        if (docRCCM)     fd.append("rccm",             docRCCM);
        if (docTaxCert)  fd.append("taxCertificate",   docTaxCert);
        if (docStatutes) fd.append("companyStatutes",  docStatutes);
        if (docId)       fd.append("representativeId", docId);
        fd.append("companyName", companyName);
        await submitEmployerDocuments(fd);
      } catch (docErr) {
        console.warn("Document upload failed (non-fatal):", docErr);
      }

      setEmpStep(3);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ════════ STEP 1 ════════ */
  if (empStep === 1) return (
    <>
      <StepProgress />
      <p className="kora-auth-subtitle" style={{ marginBottom: 14 }}>
        Start with your personal account credentials.
      </p>
      <form className="kora-auth-form" onSubmit={handleStep1} style={{ gap: "12px" }}>
        {error && <div className="kora-auth-error">{error}</div>}

        <div className="kora-auth-field">
          <AuthField icon={User} placeholder="Full Name (Legal Representative)" value={fullName}
            onChange={e => setFullName(e.target.value)} autoComplete="name" required />
        </div>
        <div className="kora-auth-field">
          <AuthField icon={Mail} placeholder="Work Email" type="email" value={email}
            onChange={e => setEmail(e.target.value)} autoComplete="email" required />
        </div>
        <div className="kora-emp-row">
          <div className="kora-auth-field" style={{ flex: 1 }}>
            <div className="kora-auth-input-wrapper">
              <Phone size={18} className="kora-auth-input-icon" />
              <input type="tel" className="kora-auth-input" placeholder="Phone number"
                value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" />
            </div>
          </div>
          <div className="kora-auth-field" style={{ flex: 1 }}>
            <div className="kora-auth-input-wrapper">
              <MapPin size={18} className="kora-auth-input-icon" />
              <input type="text" className="kora-auth-input" placeholder="City"
                value={city} onChange={e => setCity(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="kora-auth-field">
          <AuthField icon={Lock} placeholder="Password"
            type={showPassword ? "text" : "password"} value={password}
            onChange={e => setPassword(e.target.value)} autoComplete="new-password" required
            rightIcon={
              <button type="button" className="kora-auth-input-right-icon" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            } />
        </div>
        <div className="kora-auth-field">
          <AuthField icon={Lock} placeholder="Confirm Password"
            type={showConfirmPassword ? "text" : "password"} value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" required
            rightIcon={
              <button type="button" className="kora-auth-input-right-icon" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            } />
        </div>
        <div className="kora-auth-options" style={{ marginTop: 0 }}>
          <label className="kora-auth-checkbox">
            <input type="checkbox" required />
            <span style={{ fontSize: 12 }}>I agree to the Terms and Privacy Policy</span>
          </label>
        </div>
        <button type="submit" className="kora-auth-btn kora-auth-btn--employer"
          style={{ marginTop: 4 }} disabled={loading}>
          {loading ? "Creating account…" : <span style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>Continue <ChevronRight size={16} /></span>}
        </button>
        <div className="kora-auth-divider">Or sign up with</div>
        <a
          href={`${import.meta.env.VITE_API_BASE_URL || ""}/oauth2/authorization/google?role=EMPLOYER&origin=${encodeURIComponent(window.location.origin)}`}
          className="kora-auth-social-btn"
          style={{ textDecoration: "none" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue as Employer with Google
        </a>
      </form>
      <div style={{ marginTop: 14, textAlign: "center", fontSize: 13, color: "#9ca3af" }}>
        Not an employer?{" "}
        <button type="button" onClick={() => setRole("")}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--kora-primary)", fontWeight: 600, fontSize: 13 }}>
          Switch role
        </button>
      </div>
    </>
  );

  /* ════════ STEP 3 — pending review ════════ */
  if (empStep === 3) return (
    <div className="kora-emp-pending-screen">
      <div className="kora-emp-pending-icon">
        <Clock size={32} />
      </div>
      <h3 className="kora-emp-pending-title">Application Submitted!</h3>
      <p className="kora-emp-pending-sub">
        Thank you, <strong>{fullName || "employer"}</strong>. Your company documents are
        pending review by our compliance team.
      </p>

      <div className="kora-emp-pending-timeline">
        {[
          { icon: CheckCircle, label: "Account created",                           done: true  },
          { icon: FileBadge,   label: "Documents submitted",                       done: true  },
          { icon: Shield,      label: "Compliance review — 1 to 2 business days",  done: false },
          { icon: Landmark,    label: "Account approved and activated",             done: false },
        ].map(({ icon: Icon, label, done }, i) => (
          <div key={i} className={`kora-emp-timeline-row${done ? " done" : ""}`}>
            <div className={`kora-emp-timeline-dot${done ? " done" : ""}`}>
              <Icon size={13} />
            </div>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="kora-emp-pending-notice">
        <Info size={14} />
        <span>
          You'll receive a confirmation email at <strong>{email}</strong> once your
          account is approved. You can log in but won't be able to post jobs until verified.
        </span>
      </div>

      <button className="kora-auth-btn kora-auth-btn--employer" style={{ marginTop: 20 }}
        onClick={() => navigate("/employer/dashboard")}>
        Go to Dashboard
      </button>
    </div>
  );

  /* ════════ STEP 2 — company + documents ════════ */
  return (
    <>
      <StepProgress />

      <div className="kora-emp-verify-banner" style={{ marginBottom: 14 }}>
        <Shield size={15} />
        <div>
          <strong>Verification required.</strong> Cameroonian law requires formal company
          documents before you can post jobs. All documents are reviewed by our compliance team.
        </div>
      </div>

      <form className="kora-auth-form" onSubmit={handleStep2} style={{ gap: "10px" }}>
        {error && <div className="kora-auth-error">{error}</div>}

        {/* Company identity */}
        <div className="kora-emp-section-head">
          <Building2 size={13} />
          <span>Company Identity</span>
        </div>

        <div className="kora-auth-field">
          <div className="kora-auth-input-wrapper">
            <Building2 size={18} className="kora-auth-input-icon" />
            <input type="text" className="kora-auth-input" placeholder="Legal Company Name *"
              value={companyName} onChange={e => setCompanyName(e.target.value)} required />
          </div>
        </div>

        <div className="kora-emp-row">
          <div className="kora-auth-field" style={{ flex: 1 }}>
            <div className="kora-auth-input-wrapper">
              <Hash size={18} className="kora-auth-input-icon" />
              <input type="text" className="kora-auth-input" placeholder="RCCM Number *"
                value={regNumber} onChange={e => setRegNumber(e.target.value)} required
                title="Registre du Commerce et du Crédit Mobilier" />
            </div>
          </div>
          <div className="kora-auth-field" style={{ flex: 1 }}>
            <div className="kora-auth-input-wrapper">
              <Landmark size={18} className="kora-auth-input-icon" />
              <input type="text" className="kora-auth-input" placeholder="NIU (Tax ID) *"
                value={taxId} onChange={e => setTaxId(e.target.value)} required
                title="Numéro d'Identification Unique" />
            </div>
          </div>
        </div>

        <div className="kora-emp-row">
          <div className="kora-auth-field" style={{ flex: 1 }}>
            <div className="kora-auth-input-wrapper">
              <Briefcase size={18} className="kora-auth-input-icon" />
              <select className="kora-auth-input" value={sector}
                onChange={e => setSector(e.target.value)} style={{ appearance: "none" }} required>
                <option value="" disabled>Industry / Sector *</option>
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="kora-auth-field" style={{ flex: 1 }}>
            <div className="kora-auth-input-wrapper">
              <Users size={18} className="kora-auth-input-icon" />
              <select className="kora-auth-input" value={companySize}
                onChange={e => setCompanySize(e.target.value)} style={{ appearance: "none" }}>
                <option value="">Company Size</option>
                {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="kora-emp-row">
          <div className="kora-auth-field" style={{ flex: 1 }}>
            <div className="kora-auth-input-wrapper">
              <Globe size={18} className="kora-auth-input-icon" />
              <input type="url" className="kora-auth-input" placeholder="Company website"
                value={website} onChange={e => setWebsite(e.target.value)} />
            </div>
          </div>
          <div className="kora-auth-field" style={{ flex: 1 }}>
            <div className="kora-auth-input-wrapper">
              <User size={18} className="kora-auth-input-icon" />
              <input type="text" className="kora-auth-input" placeholder="Your job title"
                value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="kora-auth-field">
          <div className="kora-auth-input-wrapper">
            <MapPin size={18} className="kora-auth-input-icon" />
            <input type="text" className="kora-auth-input" placeholder="Registered company address"
              value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} />
          </div>
        </div>

        <div className="kora-auth-field">
          <div className="kora-auth-input-wrapper kora-auth-input-wrapper--textarea">
            <FileText size={18} className="kora-auth-input-icon kora-auth-input-icon--top" />
            <textarea className="kora-auth-input kora-auth-textarea"
              placeholder="Brief description of your company and hiring needs (optional)…"
              value={bio} onChange={e => setBio(e.target.value)} rows={2} />
          </div>
        </div>

        {/* Legal documents */}
        <div className="kora-emp-section-head" style={{ marginTop: 4 }}>
          <FileBadge size={13} />
          <span>Legal Documents</span>
        </div>

        <div className="kora-doc-notice">
          <AlertTriangle size={13} />
          <span>
            Required documents must be official, legible, and under 10 MB.
            Accepted formats: PDF, JPG, PNG.
          </span>
        </div>

        <DocUploadZone
          label="RCCM Certificate"
          hint="Registre du Commerce et du Crédit Mobilier"
          accept={ACCEPTED_DOCS} required
          file={docRCCM} onFile={setDocRCCM} onRemove={() => setDocRCCM(null)}
          error={docErrors.rccm}
        />
        <DocUploadZone
          label="Tax Compliance Certificate (NIU)"
          hint="Attestation de conformité fiscale"
          accept={ACCEPTED_DOCS} required
          file={docTaxCert} onFile={setDocTaxCert} onRemove={() => setDocTaxCert(null)}
          error={docErrors.taxCert}
        />
        <DocUploadZone
          label="Company Statutes / Articles of Association"
          hint="Optional but strongly recommended"
          accept={ACCEPTED_DOCS}
          file={docStatutes} onFile={setDocStatutes} onRemove={() => setDocStatutes(null)}
        />
        <DocUploadZone
          label="ID of Legal Representative"
          hint="CNI, Passport, or Titre de séjour"
          accept={ACCEPTED_DOCS} required
          file={docId} onFile={setDocId} onRemove={() => setDocId(null)}
          error={docErrors.id}
        />

        <button type="submit" className="kora-auth-btn kora-auth-btn--employer"
          disabled={loading} style={{ marginTop: 8 }}>
          {loading
            ? "Submitting…"
            : <span style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                <Shield size={15} /> Submit Documents for Review
              </span>}
        </button>
      </form>
    </>
  );
}

/* ─────────────────────────────────────────────────────
   ROOT REGISTER COMPONENT
───────────────────────────────────────────────────── */
export default function Register() {
  const [role, setRole] = useState("");
  const isEmployer = role === "EMPLOYER";

  /* ── Role picker ─────────────────── */
  if (!role) return (
    <div className="kora-auth-root">
      <Link to="/"
        style={{ position: "fixed", top: 16, left: 16, display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#374151", textDecoration: "none", background: "#fff", padding: "7px 12px", borderRadius: 10, boxShadow: "0 1px 6px rgba(0,0,0,0.1)", zIndex: 10 }}>
        <ArrowLeft size={14} /> Home
      </Link>
      <div className="kora-auth-container kora-role-picker-container">
        <div className="kora-auth-left">
          <div className="kora-auth-left-wave" />
          <div className="kora-auth-logo-wrapper">
            <img src={logo} alt="KORA" className="kora-auth-logo" />
          </div>
          <h1 className="kora-auth-left-title">Join KORA</h1>
          <p className="kora-auth-left-subtitle">Connect talent with opportunity. Create your free account today.</p>
        </div>
        <div className="kora-auth-right kora-role-picker">
          <MobileHeader isEmployer={false} />
          <h2 className="kora-auth-title">Create Account</h2>
          <p className="kora-auth-subtitle">Who are you joining as?</p>
          <div className="kora-role-cards">
            <button className="kora-role-card" onClick={() => setRole("JOB_SEEKER")}>
              <div className="kora-role-card-icon kora-role-card-icon--seeker"><User size={24} /></div>
              <div className="kora-role-card-content">
                <span className="kora-role-card-title">Job Seeker</span>
                <span className="kora-role-card-sub">Find your dream job and grow your career</span>
              </div>
              <ChevronRight size={18} className="kora-role-card-arrow" />
            </button>
            <button className="kora-role-card" onClick={() => setRole("EMPLOYER")}>
              <div className="kora-role-card-icon kora-role-card-icon--employer"><Building2 size={24} /></div>
              <div className="kora-role-card-content">
                <span className="kora-role-card-title">Employer</span>
                <span className="kora-role-card-sub">Post jobs and find talent — verification required</span>
              </div>
              <ChevronRight size={18} className="kora-role-card-arrow" />
            </button>
          </div>
          <div className="kora-auth-footer" style={{ marginTop: 28 }}>
            Already have an account?{" "}
            <Link to="/login" className="kora-auth-link">Sign in here</Link>
          </div>
        </div>
      </div>
    </div>
  );

  /* ── Registration form ───────────── */
  return (
    <div className={`kora-auth-root ${isEmployer ? "employer" : "job-seeker"}`}>
      <Link to="/"
        style={{ position: "fixed", top: 16, left: 16, display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#374151", textDecoration: "none", background: "#fff", padding: "7px 12px", borderRadius: 10, boxShadow: "0 1px 6px rgba(0,0,0,0.1)", zIndex: 10 }}>
        <ArrowLeft size={14} /> Home
      </Link>

      <div className="kora-auth-container" style={isEmployer ? { maxWidth: 1020 } : {}}>
        {/* Left panel — desktop only */}
        <div className="kora-auth-left">
          <div className="kora-auth-left-wave" />
          <div className="kora-auth-logo-wrapper">
            <img src={logo} alt="KORA" className="kora-auth-logo" />
          </div>
          <h1 className="kora-auth-left-title">
            {isEmployer ? "Hire on KORA" : "Join KORA"}
          </h1>
          <p className="kora-auth-left-subtitle">
            {isEmployer
              ? "Post jobs, manage applications, and find verified talent across Cameroon and beyond."
              : "Create your account and start your journey to finding the perfect job."}
          </p>
          {isEmployer && (
            <div className="kora-auth-left-badges">
              {["Verified employers only", "Admin-reviewed accounts", "Real-time analytics"].map(b => (
                <div key={b} className="kora-auth-left-badge"><CheckCircle size={13} />{b}</div>
              ))}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="kora-auth-right" style={{ padding: isEmployer ? "32px 44px" : "36px 48px" }}>
          {/* Mobile only brand header */}
          <MobileHeader isEmployer={isEmployer} />

          <h2 className="kora-auth-title">
            {isEmployer ? "Employer Registration" : "Create Account"}
          </h2>

          {isEmployer
            ? <EmployerRegister setRole={setRole} />
            : (
              <>
                <p className="kora-auth-subtitle">Join us today. It only takes a minute.</p>
                <StandardRegister role={role} setRole={setRole} />
                <div className="kora-auth-footer" style={{ marginTop: 20 }}>
                  Already have an account?{" "}
                  <Link to="/login" className="kora-auth-link">Sign in here</Link>
                </div>
              </>
            )}

          {isEmployer && (
            <div className="kora-auth-footer" style={{ marginTop: 16 }}>
              Already have an account?{" "}
              <Link to="/login" className="kora-auth-link">Sign in here</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}