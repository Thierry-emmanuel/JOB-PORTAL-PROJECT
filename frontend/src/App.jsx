import React, { useState, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";

// ── Global styles ─────────────────────────────────────────
import "./styles/theme.css";
import "./App.css";
import './styles/employee-dashboard.css';
import './styles/job-list.css';
import './styles/apply-page.css';



const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

// ── Lazy Loaded Pages ───────────────────────────────────────
const KoraHome = lazy(() => import("./KoraHome"));
const JobSeekerProfile = lazy(() => import("./pages/profile/JobSeekerProfile"));
const EmployerProfile = lazy(() => import("./pages/profile/EmployerProfile"));
const AdminProfile = lazy(() => import("./pages/profile/AdminProfile"));
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const OAuth2RedirectHandler = lazy(() => import("./pages/auth/OAuth2RedirectHandler"));
const EmployerDashboard = lazy(() => import("./pages/EmployerDashboard"));
const ManageJobs = lazy(() => import("./pages/employer/ManageJobs"));
const PostJob = lazy(() => import("./pages/employer/PostJobs"));
const EmployeeDashboard = lazy(() => import('./pages/employee/EmployeeDashboard'));
const JobList = lazy(() => import('./pages/jobs/JobList'));
const JobDetails = lazy(() => import('./pages/jobs/JobDetails'));
const ApplyPage = lazy(() => import('./pages/jobs/ApplyPage'));
const InterviewManagement = lazy(() => import('./pages/employer/InterviewManagement'));
const InsightsPage = lazy(() => import('./pages/shared/InsightsPage'));

// ── Development navigation overlay ────────────────────────
function DevNav() {
  const location = useLocation();
  const links = [
    { to: "/",                    label: "Home"         },
    { to: "/login",               label: "Login"        },
    { to: "/register",            label: "Register"     },
    { to: "/profile/job-seeker",  label: "Job Seeker"   },
    { to: "/profile/employer",    label: "Employer"     },
    { to: "/profile/admin",       label: "Admin"        },
    { to: "/dashboard/employer",  label: "Employer DB"  },
    { to: "/employer/jobs",       label: "Manage Jobs"  },
    { to: "/employer/post-job",   label: "Post Job"     },
    { to: "/employee/dashboard",  label: "Employee DB"  },
    { to: "/jobs",                label: "Jobs"         },
    { to: "/insights",            label: "Insights"     },
    { to: "/admin/dashboard", label: "Admin DB" }
  ];

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        background: "#1A5C2E",
        borderRadius: "999px",
        padding: "14px 24px",
        display: "flex",
        gap: "10px",
        zIndex: 9999,
        boxShadow: "0 8px 32px rgba(11,43,38,0.4)",
        flexWrap: "wrap",
        justifyContent: "center",
        maxWidth: "90vw",
      }}
    >
      {links.map(({ to, label }) => {
        const isActive = location.pathname === to;
        return (
          <Link
            key={to}
            to={to}
            style={{
              color: isActive ? "white" : "rgba(255,255,255,0.65)",
              textDecoration: "none",
              fontSize: "12.5px",
              fontWeight: 600,
              padding: "6px 14px",
              borderRadius: "999px",
              background: isActive ? "rgba(255,255,255,0.15)" : "transparent",
              transition: "all 0.18s",
              fontFamily: "DM Sans, sans-serif",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

// ── Employer Jobs Manager ─────────────────────────────────
function EmployerJobsManager() {
  const [view, setView] = useState("manage");
  if (view === "post") {
    return (
      <PostJob
        onBack={() => setView("manage")}
        onSuccess={() => setView("manage")}
      />
    );
  }
  return <ManageJobs onPostJob={() => setView("post")} />;
}

// ── Protected Route Helper ────────────────────────────────
function ProtectedRoute({ children, role }) {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}><div className="kora-spinner" /></div>;

  // Debug: log auth state to console
  console.log('[ProtectedRoute] isAuthenticated:', isAuthenticated, '| user:', user, '| required role:', role);

  if (!isAuthenticated) {
    console.log('[ProtectedRoute] ❌ Not authenticated → redirecting to /login');
    return <Navigate to="/login" replace />;
  }
  
  if (role) {
    const rawUserRole = user?.role || user?.type || "";
    const userRole = rawUserRole.toUpperCase().replace("ROLE_", "");
    const requiredRole = role.toUpperCase().replace("ROLE_", "");
    console.log('[ProtectedRoute] rawUserRole:', rawUserRole, '| normalized:', userRole, '| required:', requiredRole, '| match:', userRole.includes(requiredRole));
    if (!userRole.includes(requiredRole)) {
      console.log('[ProtectedRoute] ❌ Role mismatch → redirecting to /login');
      return <Navigate to="/login" replace />;
    }
  }

  console.log('[ProtectedRoute] ✅ Access granted');
  return children;
}

const GlobalLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F9FAFB' }}>
    <div className="kora-spinner" />
  </div>
);

// ── App Component ──────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Suspense fallback={<GlobalLoader />}>
              <Routes>
                <Route path="/" element={<KoraHome />} />
                
                {/* Private Routes */}

                <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>}  />
                <Route path="/profile/job-seeker" element={<ProtectedRoute role="JOB_SEEKER"><JobSeekerProfile /></ProtectedRoute>} />
                <Route path="/profile/employer"   element={<ProtectedRoute role="EMPLOYER"><EmployerProfile /></ProtectedRoute>} />
                <Route path="/profile/admin"      element={<ProtectedRoute role="ADMIN"><AdminProfile /></ProtectedRoute>} />
                
                <Route path="/employee/dashboard" element={<ProtectedRoute role="JOB_SEEKER"><EmployeeDashboard /></ProtectedRoute>} />
                <Route path="/dashboard/employer" element={<ProtectedRoute role="EMPLOYER"><EmployerDashboard /></ProtectedRoute>} />
                
                <Route path="/employer/jobs"      element={<ProtectedRoute role="EMPLOYER"><EmployerJobsManager /></ProtectedRoute>} />
                <Route path="/employer/post-job"  element={<ProtectedRoute role="EMPLOYER"><EmployerJobsManager /></ProtectedRoute>} />
                <Route path="/employer/interviews" element={<ProtectedRoute role="EMPLOYER"><InterviewManagement /></ProtectedRoute>} />
  
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
                <Route path="/dashboard" element={<Navigate to="/employee/dashboard" replace />} />
                <Route path="/jobs" element={<JobList />} />
                <Route path="/jobs/:id" element={<JobDetails />} />
                <Route path="/jobs/:id/apply" element={<ApplyPage />} />
                <Route path="/insights" element={<InsightsPage />} />
              </Routes>
              <DevNav />
            </Suspense>
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

