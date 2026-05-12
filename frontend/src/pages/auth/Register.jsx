import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Lock, User, Briefcase, Eye, EyeOff } from "lucide-react";
import logo from "../../assets/absolute-size-logo.png";
import "../../styles/auth.css";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="kora-auth-root">
      <div className="kora-auth-container">
        {/* Left Side - Image/Branding */}
        <div className="kora-auth-left">
          <div className="kora-auth-left-wave" />
          <div className="kora-auth-logo-wrapper">
            <img src={logo} alt="KORA" className="kora-auth-logo" />
          </div>
          <h1 className="kora-auth-left-title">Join KORA</h1>
          <p className="kora-auth-left-subtitle">
            Create your account and start your journey to finding the perfect job.
          </p>
        </div>

        {/* Right Side - Form */}
        <div className="kora-auth-right" style={{ padding: '40px 50px' }}>
          <h2 className="kora-auth-title">Create Account</h2>
          <p className="kora-auth-subtitle">Join us today. It only takes a minute.</p>

          <form className="kora-auth-form" onSubmit={(e) => e.preventDefault()} style={{ gap: '15px' }}>
            <div className="kora-auth-field">
              <div className="kora-auth-input-wrapper">
                <User size={18} className="kora-auth-input-icon" />
                <input
                  type="text"
                  className="kora-auth-input"
                  placeholder="Full Name"
                />
              </div>
            </div>

            <div className="kora-auth-field">
              <div className="kora-auth-input-wrapper">
                <Mail size={18} className="kora-auth-input-icon" />
                <input
                  type="email"
                  className="kora-auth-input"
                  placeholder="Email Address"
                />
              </div>
            </div>

            <div className="kora-auth-field">
              <div className="kora-auth-input-wrapper">
                <Briefcase size={18} className="kora-auth-input-icon" />
                <select className="kora-auth-input" defaultValue="" style={{ appearance: 'none' }}>
                  <option value="" disabled>Select your role</option>
                  <option value="JOB_SEEKER">Job Seeker</option>
                  <option value="EMPLOYER">Employer</option>
                </select>
              </div>
            </div>

            <div className="kora-auth-field">
              <div className="kora-auth-input-wrapper">
                <Lock size={18} className="kora-auth-input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="kora-auth-input"
                  placeholder="Password"
                />
                <button
                  type="button"
                  className="kora-auth-input-right-icon"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="kora-auth-field">
              <div className="kora-auth-input-wrapper">
                <Lock size={18} className="kora-auth-input-icon" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="kora-auth-input"
                  placeholder="Confirm Password"
                />
                <button
                  type="button"
                  className="kora-auth-input-right-icon"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="kora-auth-options" style={{ marginTop: '0' }}>
              <label className="kora-auth-checkbox">
                <input type="checkbox" />
                <span style={{ fontSize: '12px' }}>I agree to the Terms and Privacy Policy</span>
              </label>
            </div>

            <button type="submit" className="kora-auth-btn" style={{ marginTop: '5px' }}>
              Create Account
            </button>

            <div className="kora-auth-divider">Or sign up with</div>

            <button type="button" className="kora-auth-social-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
          </form>

          <div className="kora-auth-footer" style={{ marginTop: '20px' }}>
            Already have an account? <Link to="/login" className="kora-auth-link">Sign in here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

