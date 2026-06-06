import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail, Lock, User, Briefcase, Eye, EyeOff,
  Phone, MapPin, Globe, Building2, FileText,
  ChevronRight, ChevronLeft, CheckCircle, Shield
} from "lucide-react";
import logo from "../../assets/absolute-size-logo.png";
import "../../styles/auth.css";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/client";

/* ── Employer Step 2 API call ────────────────── */
const submitEmployerVerification = async (data) =>
  apiClient.patch("/api/v1/employer/profile", data);

/* ── Input wrapper component ─────────────────── */
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

/* ═══════════════════════════════════════════════
   NON-EMPLOYER: single-step registration (unchanged)
   ═══════════════════════════════════════════════ */
function StandardRegister({ role, setRole }) {
  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName,            setFullName]            = useState("");
  const [email,               setEmail]               = useState("");
  const [password,            setPassword]            = useState("");
  const [confirmPassword,     setConfirmPassword]     = useState("");
  const [error,               setError]               = useState("");
  const [loading,             setLoading]             = useState(false);

  const { register } = useAuth();
  const navigate     = useNavigate();

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
        lastName:  nameParts.slice(1).join(" ") || "",
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
        <AuthField icon={Lock}
          placeholder="Password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="new-password" required
          rightIcon={
            <button type="button" className="kora-auth-input-right-icon"
              onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
            </button>
          }/>
      </div>
      <div className="kora-auth-field">
        <AuthField icon={Lock}
          placeholder="Confirm Password"
          type={showConfirmPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          autoComplete="new-password" required
          rightIcon={
            <button type="button" className="kora-auth-input-right-icon"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
            </button>
          }/>
      </div>

      <div className="kora-auth-options" style={{ marginTop: 0 }}>
        <label className="kora-auth-checkbox">
          <input type="checkbox" required/>
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
        style={{ textDecoration: "none", display: "flex", justifyContent: "center", alignItems: "center" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue as Job Seeker with Google
      </a>
    </form>
  );
}

/* ═══════════════════════════════════════════════
   EMPLOYER 2-STEP REGISTRATION
   ═══════════════════════════════════════════════ */
function EmployerRegister({ setRole }) {
  const [empStep, setEmpStep] = useState(1); // 1 = personal, 2 = verification

  /* Step 1 state */
  const [fullName,            setFullName]            = useState("");
  const [email,               setEmail]               = useState("");
  const [password,            setPassword]            = useState("");
  const [confirmPassword,     setConfirmPassword]     = useState("");
  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phone,               setPhone]               = useState("");
  const [city,                setCity]                = useState("");

  /* Step 2 state */
  const [companyName, setCompanyName] = useState("");
  const [sector,      setSector]      = useState("");
  const [website,     setWebsite]     = useState("");
  const [jobTitle,    setJobTitle]    = useState("");
  const [bio,         setBio]         = useState("");

  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate     = useNavigate();

  /* Step 1 — create account */
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
        lastName:  nameParts.slice(1).join(" ") || "",
        role: "EMPLOYER",
      });
      setEmpStep(2);
    } catch (err) {
      setError(err.response?.data || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* Step 2 — submit verification info */
  const handleStep2 = async (e) => {
    e.preventDefault();
    setError("");
    if (!companyName.trim()) return setError("Company name is required.");
    if (!sector)             return setError("Please select your industry sector.");
    setLoading(true);
    try {
      await submitEmployerVerification({
        contactName: fullName,
        phone, city, sector, website,
        jobTitle, bio,
        companyName,
      });
      navigate("/employer/dashboard");
    } catch (err) {
      /* Non-critical: navigate anyway, employer can complete profile later */
      console.warn("Verification info save failed:", err);
      navigate("/employer/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const SECTORS = [
    "Technology","Finance","Healthcare","Education","Retail",
    "Manufacturing","Marketing","Legal","Engineering","Consulting","Other"
  ];

  /* ── Shared progress indicator ───────────────── */
  const StepProgress = () => (
    <div className="kora-emp-steps">
      {[
        { n:1, label:"Personal Info" },
        { n:2, label:"Verification"  },
      ].map(({ n, label }, i) => (
        <div key={n} className={`kora-emp-step${empStep===n?" active":empStep>n?" done":""}`}>
          <div className="kora-emp-step-circle">
            {empStep > n ? <CheckCircle size={13}/> : n}
          </div>
          <span className="kora-emp-step-label">{label}</span>
          {i === 0 && <div className={`kora-emp-step-line${empStep>1?" done":""}`}/>}
        </div>
      ))}
    </div>
  );

  /* ── Step 1 form ─────────────────────────────── */
  if (empStep === 1) {
    return (
      <>
        <StepProgress/>
        <p className="kora-auth-subtitle" style={{marginBottom:18}}>
          Start with your personal account details.
        </p>
        <form className="kora-auth-form" onSubmit={handleStep1} style={{ gap:"14px" }}>
          {error && <div className="kora-auth-error">{error}</div>}

          <div className="kora-auth-field">
            <AuthField icon={User} placeholder="Full Name" value={fullName}
              onChange={e=>setFullName(e.target.value)} autoComplete="name" required/>
          </div>
          <div className="kora-auth-field">
            <AuthField icon={Mail} placeholder="Work Email" type="email" value={email}
              onChange={e=>setEmail(e.target.value)} autoComplete="email" required/>
          </div>
          <div className="kora-emp-row">
            <div className="kora-auth-field" style={{flex:1}}>
              <div className="kora-auth-input-wrapper">
                <Phone size={18} className="kora-auth-input-icon"/>
                <input type="tel" className="kora-auth-input"
                  placeholder="Phone number" value={phone}
                  onChange={e=>setPhone(e.target.value)} autoComplete="tel"/>
              </div>
            </div>
            <div className="kora-auth-field" style={{flex:1}}>
              <div className="kora-auth-input-wrapper">
                <MapPin size={18} className="kora-auth-input-icon"/>
                <input type="text" className="kora-auth-input"
                  placeholder="City" value={city}
                  onChange={e=>setCity(e.target.value)} autoComplete="address-level2"/>
              </div>
            </div>
          </div>
          <div className="kora-auth-field">
            <AuthField icon={Lock}
              placeholder="Password"
              type={showPassword?"text":"password"}
              value={password}
              onChange={e=>setPassword(e.target.value)}
              autoComplete="new-password" required
              rightIcon={
                <button type="button" className="kora-auth-input-right-icon"
                  onClick={()=>setShowPassword(!showPassword)}>
                  {showPassword?<EyeOff size={18}/>:<Eye size={18}/>}
                </button>
              }/>
          </div>
          <div className="kora-auth-field">
            <AuthField icon={Lock}
              placeholder="Confirm Password"
              type={showConfirmPassword?"text":"password"}
              value={confirmPassword}
              onChange={e=>setConfirmPassword(e.target.value)}
              autoComplete="new-password" required
              rightIcon={
                <button type="button" className="kora-auth-input-right-icon"
                  onClick={()=>setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword?<EyeOff size={18}/>:<Eye size={18}/>}
                </button>
              }/>
          </div>

          <div className="kora-auth-options" style={{marginTop:0}}>
            <label className="kora-auth-checkbox">
              <input type="checkbox" required/>
              <span style={{fontSize:12}}>I agree to the Terms and Privacy Policy</span>
            </label>
          </div>

          <button type="submit" className="kora-auth-btn kora-auth-btn--employer"
            style={{marginTop:5}} disabled={loading}>
            {loading ? "Creating account…" : <>Continue <ChevronRight size={16}/></>}
          </button>

          <div className="kora-auth-divider">Or sign up with</div>
          <a
            href={`${import.meta.env.VITE_API_BASE_URL||""}/oauth2/authorization/google?role=EMPLOYER&origin=${encodeURIComponent(window.location.origin)}`}
            className="kora-auth-social-btn"
            style={{textDecoration:"none",display:"flex",justifyContent:"center",alignItems:"center"}}>
            <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue as Employer with Google
          </a>
        </form>
        <div style={{marginTop:14,textAlign:"center",fontSize:13,color:"#9ca3af"}}>
          Not an employer?{" "}
          <button type="button" onClick={()=>setRole("")}
            style={{background:"none",border:"none",cursor:"pointer",color:"var(--kora-primary)",fontWeight:600,fontSize:13}}>
            Switch role
          </button>
        </div>
      </>
    );
  }

  /* ── Step 2 form ─────────────────────────────── */
  return (
    <>
      <StepProgress/>

      <div className="kora-emp-verify-banner">
        <Shield size={16}/>
        <div>
          <strong>Account created!</strong> Complete your verification so our admin team can review and approve your employer account. You can't post jobs until verified.
        </div>
      </div>

      <form className="kora-auth-form" onSubmit={handleStep2} style={{gap:"13px",marginTop:16}}>
        {error && <div className="kora-auth-error">{error}</div>}

        <div className="kora-auth-field">
          <div className="kora-auth-input-wrapper">
            <Building2 size={18} className="kora-auth-input-icon"/>
            <input type="text" className="kora-auth-input"
              placeholder="Company Name *" value={companyName}
              onChange={e=>setCompanyName(e.target.value)} required/>
          </div>
        </div>

        <div className="kora-auth-field">
          <div className="kora-auth-input-wrapper">
            <Briefcase size={18} className="kora-auth-input-icon"/>
            <select className="kora-auth-input" value={sector}
              onChange={e=>setSector(e.target.value)} style={{appearance:"none"}} required>
              <option value="" disabled>Industry / Sector *</option>
              {SECTORS.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="kora-emp-row">
          <div className="kora-auth-field" style={{flex:1}}>
            <div className="kora-auth-input-wrapper">
              <Globe size={18} className="kora-auth-input-icon"/>
              <input type="url" className="kora-auth-input"
                placeholder="Company website" value={website}
                onChange={e=>setWebsite(e.target.value)}/>
            </div>
          </div>
          <div className="kora-auth-field" style={{flex:1}}>
            <div className="kora-auth-input-wrapper">
              <User size={18} className="kora-auth-input-icon"/>
              <input type="text" className="kora-auth-input"
                placeholder="Your job title" value={jobTitle}
                onChange={e=>setJobTitle(e.target.value)}/>
            </div>
          </div>
        </div>

        <div className="kora-auth-field">
          <div className="kora-auth-input-wrapper kora-auth-input-wrapper--textarea">
            <FileText size={18} className="kora-auth-input-icon kora-auth-input-icon--top"/>
            <textarea className="kora-auth-input kora-auth-textarea"
              placeholder="Brief description of your company and hiring needs (optional)…"
              value={bio} onChange={e=>setBio(e.target.value)} rows={3}/>
          </div>
        </div>

        <button type="submit" className="kora-auth-btn kora-auth-btn--employer"
          disabled={loading} style={{marginTop:4}}>
          {loading ? "Submitting…" : <><Shield size={15}/> Submit for Verification</>}
        </button>

        <button type="button"
          onClick={()=>{navigate("/employer/dashboard");}}
          className="kora-auth-btn"
          style={{background:"transparent",color:"var(--kora-text-muted)",border:"1px solid var(--kora-border)",marginTop:0}}>
          Skip for now — complete later
        </button>
      </form>
    </>
  );
}

/* ═══════════════════════════════════════════════
   ROOT REGISTER COMPONENT
   ═══════════════════════════════════════════════ */
export default function Register() {
  const [role, setRole] = useState("");

  const isEmployer = role === "EMPLOYER";

  /* When no role selected yet — show role picker */
  if (!role) {
    return (
      <div className={`kora-auth-root`}>
        <Link to="/" style={{position:"fixed",top:16,left:20,display:"flex",alignItems:"center",gap:6,fontSize:13,fontWeight:600,color:"#374151",textDecoration:"none",background:"#fff",padding:"7px 14px",borderRadius:10,boxShadow:"0 1px 6px rgba(0,0,0,0.1)",zIndex:10}}>
          ← Home
        </Link>
        <div className="kora-auth-container kora-role-picker-container">
          <div className="kora-auth-left">
            <div className="kora-auth-left-wave"/>
            <div className="kora-auth-logo-wrapper">
              <img src={logo} alt="KORA" className="kora-auth-logo"/>
            </div>
            <h1 className="kora-auth-left-title">Join KORA</h1>
            <p className="kora-auth-left-subtitle">
              Connect talent with opportunity. Create your free account today.
            </p>
          </div>
          <div className="kora-auth-right kora-role-picker">
            <h2 className="kora-auth-title">Create Account</h2>
            <p className="kora-auth-subtitle">Who are you joining as?</p>

            <div className="kora-role-cards">
              <button className="kora-role-card" onClick={()=>setRole("JOB_SEEKER")}>
                <div className="kora-role-card-icon kora-role-card-icon--seeker">
                  <User size={26}/>
                </div>
                <div className="kora-role-card-content">
                  <span className="kora-role-card-title">Job Seeker</span>
                  <span className="kora-role-card-sub">Find your dream job and grow your career</span>
                </div>
                <ChevronRight size={18} className="kora-role-card-arrow"/>
              </button>

              <button className="kora-role-card" onClick={()=>setRole("EMPLOYER")}>
                <div className="kora-role-card-icon kora-role-card-icon--employer">
                  <Building2 size={26}/>
                </div>
                <div className="kora-role-card-content">
                  <span className="kora-role-card-title">Employer</span>
                  <span className="kora-role-card-sub">Post jobs and find the right talent fast</span>
                </div>
                <ChevronRight size={18} className="kora-role-card-arrow"/>
              </button>
            </div>

            <div className="kora-auth-footer" style={{marginTop:32}}>
              Already have an account?{" "}
              <Link to="/login" className="kora-auth-link">Sign in here</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`kora-auth-root ${isEmployer ? "employer" : "job-seeker"}`}>
      <Link to="/" style={{position:"fixed",top:16,left:20,display:"flex",alignItems:"center",gap:6,fontSize:13,fontWeight:600,color:"#374151",textDecoration:"none",background:"#fff",padding:"7px 14px",borderRadius:10,boxShadow:"0 1px 6px rgba(0,0,0,0.1)",zIndex:10}}>
        ← Home
      </Link>

      <div className="kora-auth-container">
        {/* Left Side */}
        <div className="kora-auth-left">
          <div className="kora-auth-left-wave"/>
          <div className="kora-auth-logo-wrapper">
            <img src={logo} alt="KORA" className="kora-auth-logo"/>
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
              {["Verified employers","AI-matched candidates","Real-time analytics"].map(b=>(
                <div key={b} className="kora-auth-left-badge"><CheckCircle size={13}/>{b}</div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side */}
        <div className="kora-auth-right" style={{padding:"36px 48px"}}>
          <h2 className="kora-auth-title">
            {isEmployer ? "Employer Registration" : "Create Account"}
          </h2>

          {isEmployer
            ? <EmployerRegister setRole={setRole}/>
            : (
              <>
                <p className="kora-auth-subtitle">Join us today. It only takes a minute.</p>
                <StandardRegister role={role} setRole={setRole}/>
                <div className="kora-auth-footer" style={{marginTop:20}}>
                  Already have an account?{" "}
                  <Link to="/login" className="kora-auth-link">Sign in here</Link>
                </div>
              </>
            )
          }

          {isEmployer && (
            <div className="kora-auth-footer" style={{marginTop:16}}>
              Already have an account?{" "}
              <Link to="/login" className="kora-auth-link">Sign in here</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}