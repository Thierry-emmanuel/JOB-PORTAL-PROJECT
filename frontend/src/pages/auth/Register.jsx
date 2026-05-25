import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Briefcase, Eye, EyeOff } from "lucide-react";
import logo from "../../assets/absolute-size-logo.png";
import "../../styles/auth.css";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";

export default function Register() {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      return setError(t('auth.passwords_dont_match'));
    }
    
    if (!role) {
      return setError(t('auth.select_role_error'));
    }

    setLoading(true);
    
    try {
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      await register({
        email,
        password,
        firstName,
        lastName,
        role: role
      });
      
      // Successfully registered, navigate to home
      navigate('/');
    } catch (err) {
      setError(err.response?.data || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kora-auth-root">
      <div className="kora-auth-container">
        {/* Left Side - Image/Branding */}
        <div className="kora-auth-left">
          <div className="kora-auth-left-wave" />
          <div className="kora-auth-logo-wrapper">
            <img src={logo} alt="KORA" className="kora-auth-logo" />
          </div>
          <h1 className="kora-auth-left-title">{t('auth.join_kora')}</h1>
          <p className="kora-auth-left-subtitle">
            {t('auth.join_subtitle')}
          </p>
        </div>

        {/* Right Side - Form */}
        <div className="kora-auth-right" style={{ padding: '40px 50px' }}>
          <h2 className="kora-auth-title">{t('auth.create_account')}</h2>
          <p className="kora-auth-subtitle">{t('auth.join_today_subtitle')}</p>

          <form className="kora-auth-form" onSubmit={handleSubmit} style={{ gap: '15px' }}>
            {error && <div style={{color: 'red', marginBottom: '5px', fontSize: '14px'}}>{error}</div>}
            
            <div className="kora-auth-field">
              <div className="kora-auth-input-wrapper">
                <User size={18} className="kora-auth-input-icon" />
                <input
                  type="text"
                  className="kora-auth-input"
                  placeholder={t('auth.full_name')}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="kora-auth-field">
              <div className="kora-auth-input-wrapper">
                <Mail size={18} className="kora-auth-input-icon" />
                <input
                  type="email"
                  className="kora-auth-input"
                  placeholder={t('auth.email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="kora-auth-field">
              <div className="kora-auth-input-wrapper">
                <Briefcase size={18} className="kora-auth-input-icon" />
                <select 
                  className="kora-auth-input" 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{ appearance: 'none' }}
                  required
                >
                  <option value="" disabled>{t('auth.select_role')}</option>
                  <option value="JOB_SEEKER">{t('auth.job_seeker')}</option>
                  <option value="EMPLOYER">{t('auth.employer')}</option>
                </select>
              </div>
            </div>

            <div className="kora-auth-field">
              <div className="kora-auth-input-wrapper">
                <Lock size={18} className="kora-auth-input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="kora-auth-input"
                  placeholder={t('auth.password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
                  placeholder={t('auth.confirm_password')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
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
                <input type="checkbox" required />
                <span style={{ fontSize: '12px' }}>{t('auth.agree_terms')}</span>
              </label>
            </div>

            <button type="submit" className="kora-auth-btn" style={{ marginTop: '5px' }} disabled={loading}>
              {loading ? t('auth.creating') : t('auth.create_account')}
            </button>

            <div className="kora-auth-divider">{t('auth.or_continue_with')}</div>

            <button type="button" className="kora-auth-social-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {t('auth.continue_google')}
            </button>
          </form>

          <div className="kora-auth-footer" style={{ marginTop: '20px' }}>
            {t('auth.already_have_account')} <Link to="/login" className="kora-auth-link">{t('auth.sign_in_here')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
