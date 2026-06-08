import React, { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";

// ── Global styles ──────────────────────────────────────────
import "./styles/theme.css";
import "./App.css";
import './styles/employee-dashboard.css';
import './styles/job-list.css';
import './styles/apply-page.css';

// ── Lazy pages ─────────────────────────────────────────────
const AdminDashboard   = lazy(() => import('./pages/admin/AdminDashboard'));
const KoraHome         = lazy(() => import("./KoraHome"));
const JobSeekerProfile = lazy(() => import("./pages/profile/JobSeekerProfile"));
const EmployerProfile  = lazy(() => import("./pages/profile/EmployerProfile"));
const AdminProfile     = lazy(() => import("./pages/profile/AdminProfile"));
const Login            = lazy(() => import("./pages/auth/Login"));
const Register         = lazy(() => import("./pages/auth/Register"));
const OAuth2RedirectHandler = lazy(() => import("./pages/auth/OAuth2RedirectHandler"));
const EmployerDashboard= lazy(() => import("./pages/EmployerDashboard"));
const ManageJobs       = lazy(() => import("./pages/employer/ManageJobs"));
const PostJob          = lazy(() => import("./pages/employer/PostJobs"));
const EmployeeDashboard= lazy(() => import('./pages/employee/EmployeeDashboard'));
const ApplicationsPage = lazy(() => import('./pages/employee/applications/ApplicationsPage'));
const SavedJobsPage    = lazy(() => import('./pages/employee/saved/SavedJobsPage'));
const InterviewsPage   = lazy(() => import('./pages/employee/interviews/InterviewsPage'));
const BrowseJobsPage   = lazy(() => import('./pages/employee/jobs/BrowseJobsPage'));
const InsightsDashPage = lazy(() => import('./pages/employee/insights/InsightsDashPage'));
const JobList          = lazy(() => import('./pages/jobs/JobList'));
const JobDetails       = lazy(() => import('./pages/jobs/JobDetails'));
const ApplyPage        = lazy(() => import('./pages/jobs/ApplyPage'));
const InterviewManagement = lazy(() => import('./pages/employer/InterviewManagement'));
const EmployerInsightsDashPage = lazy(() => import('./pages/employer/EmployerInsightsDashPage'));
const InsightsPage     = lazy(() => import('./pages/shared/InsightsPage'));
const ApplicationDetailPage = lazy(() => import('./pages/shared/ApplicationDetailPage'));
const ContactPage          = lazy(() => import('./pages/shared/ContactPage'));

// ── Employer combined view ─────────────────────────────────
function EmployerJobsManager() {
  const location = useLocation();
  const navigate = useNavigate();
  const isPostRoute = location.pathname === "/employer/post-job";

  if (isPostRoute) {
    return <PostJob onBack={() => navigate("/employer/jobs")} onSuccess={() => navigate("/employer/jobs")} />;
  }
  return <ManageJobs onPostJob={() => navigate("/employer/post-job")} />;
}

// ── ProtectedRoute ─────────────────────────────────────────
// ✅ FIX 4: Unified prop — always use `role` (string).
//    The AdminDashboard route was accidentally using `allowedRoles` (an array)
//    which this component never read, so the role check was silently skipped
//    and any authenticated user could access /admin/dashboard.
//
// ✅ FIX 5: The backend returns role as "ROLE_ADMIN" in AuthResponse.role.
//    Normalise both sides before comparing so "ROLE_ADMIN" === "ADMIN" works.
//
// ✅ FIX 6: Don't render {!loading && children} at the provider level —
//    the loading flag is only true during a login() call, not on mount,
//    so wrapping children caused a blank screen on every page load.
//    (Fixed in AuthContext — loading is always false outside login()).
function ProtectedRoute({ children, role }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role) {
    // Normalise: strip "ROLE_" prefix from both sides before comparing
    const userRole     = (user?.role || '').toUpperCase().replace('ROLE_', '');
    const requiredRole = role.toUpperCase().replace('ROLE_', '');
    if (!userRole.includes(requiredRole)) {
      return <Navigate to="/login" replace />;
    }
  }

  return children;
}

const GlobalLoader = () => (
  <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', background:'#F9FAFB' }}>
    <div className="kora-spinner" />
  </div>
);

const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 }
};

const pageTransition = {
  type: "spring",
  stiffness: 380,
  damping: 35,
  mass: 1
};

function PageWrapper({ children }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={pageTransition}
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        willChange: "transform, opacity"
      }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const wrap = (component, role = null) => {
    const wrappedComp = <PageWrapper>{component}</PageWrapper>;
    if (role) {
      return <ProtectedRoute role={role}>{wrappedComp}</ProtectedRoute>;
    }
    return wrappedComp;
  };

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={wrap(<KoraHome />)} />

        {/* ── Admin ── */}
        <Route path="/admin/dashboard" element={wrap(<AdminDashboard />, "ADMIN")} />
        <Route path="/profile/admin"   element={wrap(<AdminProfile />, "ADMIN")} />

        {/* ── Job Seeker ── */}
        <Route path="/profile/job-seeker"    element={wrap(<JobSeekerProfile />, "JOB_SEEKER")} />
        <Route path="/employee/dashboard"    element={wrap(<EmployeeDashboard />, "JOB_SEEKER")} />
        <Route path="/employee/applications" element={wrap(<ApplicationsPage />, "JOB_SEEKER")} />
        <Route path="/employee/saved"        element={wrap(<SavedJobsPage />, "JOB_SEEKER")} />
        <Route path="/employee/interviews"   element={wrap(<InterviewsPage />, "JOB_SEEKER")} />
        <Route path="/employee/jobs"         element={wrap(<BrowseJobsPage />, "JOB_SEEKER")} />
        <Route path="/employee/insights"     element={wrap(<InsightsDashPage />, "JOB_SEEKER")} />

        {/* ── Employer ── */}
        <Route path="/profile/employer"      element={wrap(<EmployerProfile />, "EMPLOYER")} />
        <Route path="/dashboard/employer"    element={wrap(<EmployerDashboard />, "EMPLOYER")} />
        <Route path="/employer/dashboard"    element={wrap(<EmployerDashboard />, "EMPLOYER")} />
        <Route path="/employer/jobs"         element={wrap(<EmployerJobsManager />, "EMPLOYER")} />
        <Route path="/employer/post-job"     element={wrap(<EmployerJobsManager />, "EMPLOYER")} />
        <Route path="/employer/interviews"   element={wrap(<InterviewManagement />, "EMPLOYER")} />
        <Route path="/employer/insights"     element={wrap(<EmployerInsightsDashPage />, "EMPLOYER")} />

        {/* ── Public ── */}
        <Route path="/login"           element={wrap(<Login />)} />
        <Route path="/register"        element={wrap(<Register />)} />
        <Route path="/oauth2/redirect" element={wrap(<OAuth2RedirectHandler />)} />
        <Route path="/dashboard"       element={<Navigate to="/employee/dashboard" replace />} />
        <Route path="/jobs"            element={wrap(<JobList />)} />
        <Route path="/jobs/:id"        element={wrap(<JobDetails />)} />
        <Route path="/jobs/:id/apply"  element={wrap(<ApplyPage />)} />
        <Route path="/insights"        element={wrap(<InsightsPage />)} />
        <Route path="/applications/:id" element={wrap(<ApplicationDetailPage />)} />
        <Route path="/contact"         element={wrap(<ContactPage />)} />
      </Routes>
    </AnimatePresence>
  );
}

import KoraNav from "./components/KoraNav";

// ── App Content ────────────────────────────────────────────
function AppContent() {
  const location = useLocation();
  // Hide nav on auth pages AND all dashboard/profile pages (they have sidebar)
  const DASHBOARD_PREFIXES = [
    '/employee', '/employer', '/admin',
    '/dashboard', '/profile',
  ];
  const NO_NAV_EXACT = ['/login', '/register', '/oauth2/redirect'];
  const showNav = !NO_NAV_EXACT.includes(location.pathname) &&
                  !DASHBOARD_PREFIXES.some(p => location.pathname.startsWith(p));

  return (
    <div className={`app-container${showNav ? '' : ' app-container--no-nav'}`}>
      {showNav && <KoraNav />}
      <Suspense fallback={<GlobalLoader />}>
        <AnimatedRoutes />
      </Suspense>
    </div>
  );
}

// ── App ────────────────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}