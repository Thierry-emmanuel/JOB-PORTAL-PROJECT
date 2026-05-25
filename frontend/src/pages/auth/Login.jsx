import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import logo from "../../assets/absolute-size-logo.png";
import "../../styles/auth.css";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";

export default function Login() {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login({ email, password });

      // ✅ FIX 3: Backend AuthResponse.role is "ROLE_ADMIN", "ROLE_EMPLOYER",
      // or "ROLE_JOB_SEEKER" — always strip the prefix before comparing.
      const rawRole = (data.role || '').toUpperCase().replace('ROLE_', '');

      if (rawRole === 'ADMIN') {
        navigate('/admin/dashboard');          // go straight to the new admin dashboard
      } else if (rawRole === 'EMPLOYER') {
        navigate('/dashboard/employer');
      } else {
        navigate('/employee/dashboard');
      }
    } catch (err) {
      // Show the plain string the backend sends ("Error: Invalid email or password")
      const msg =
        typeof err.response?.data === 'string'
          ? err.response.data
          : err.message || t('auth.passwords_dont_match');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kora-auth-root">
      <div className="kora-auth-container">
        {/* Left Side */}
        <div className="kora-auth-left">
          <div className="kora-auth-left-wave" />
          <div className="kora-auth-logo-wrapper">
            <img src={logo} alt="KORA" className="kora-auth-logo" />
            <div className="kora-auth-brand-name">KORA</div>
          </div>
          <h1 className="kora-auth-left-title">{t('auth.welcome_back')}</h1>
          <p className="kora-auth-left-subtitle">
            {t('auth.sign_in_subtitle')}
          </p>
        </div>

        {/* Right Side */}
        <div className="kora-auth-right">
          <h2 className="kora-auth-title">{t('auth.sign_in')}</h2>
          <p className="kora-auth-subtitle">{t('auth.enter_details')}</p>

          <form className="kora-auth-form" onSubmit={handleSubmit}>
            {error && (
              <div style={{ color: '#dc2626', marginBottom: 10, fontSize: 14, background: '#fee2e2', padding: '10px 14px', borderRadius: 8, border: '1px solid #fca5a5' }}>
                {error}
              </div>
            )}

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

            <div className="kora-auth-options">
              <label className="kora-auth-checkbox">
                <input type="checkbox" />
                {t('auth.remember_me')}
              </label>
              <Link to="/forgot-password" style={{ color: '#666', textDecoration: 'none' }}>
                {t('auth.forgot_password')}
              </Link>
            </div>

            <button type="submit" className="kora-auth-btn" disabled={loading}>
              {loading ? t('auth.signing_in') : t('auth.sign_in')}
            </button>

            <div className="kora-auth-divider">{t('auth.or_continue_with')}</div>

            <a
              href="http://localhost:8083/oauth2/authorization/google"
              className="kora-auth-social-btn"
              style={{ textDecoration: 'none' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {t('auth.continue_google')}
            </a>
          </form>

          <div className="kora-auth-footer">
            {t('auth.new_here')} <Link to="/register" className="kora-auth-link">{t('auth.create_account')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}