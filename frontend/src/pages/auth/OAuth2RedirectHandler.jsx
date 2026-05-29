import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function OAuth2RedirectHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    if (token) {
      loginWithToken(token)
        .then((userData) => {
          const rawRole = (userData.role || '').toUpperCase().replace('ROLE_', '');
          if (rawRole === 'ADMIN') {
            navigate('/admin/dashboard', { replace: true });
          } else if (rawRole === 'EMPLOYER') {
            navigate('/dashboard/employer', { replace: true });
          } else {
            navigate('/employee/dashboard', { replace: true });
          }
        })
        .catch((err) => {
          console.error("OAuth2 session initialization failed:", err);
          setError("Session verification failed. Redirecting to login...");
          setTimeout(() => {
            navigate("/login", { replace: true });
          }, 3000);
        });
    } else {
      navigate("/login", { replace: true });
    }
  }, [location, navigate, loginWithToken]);

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#f8fafc',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        {error ? (
          <p style={{ color: '#dc2626', fontSize: 15, fontWeight: 600 }}>{error}</p>
        ) : (
          <>
            <div style={{ 
              width: 40, 
              height: 40, 
              border: '3px solid #e2e8f0', 
              borderTopColor: '#1A5C2E',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            <p style={{ color: '#64748b', fontSize: 14 }}>Finalizing your sign in...</p>
          </>
        )}
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
