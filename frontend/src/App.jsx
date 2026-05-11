import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";

// ── Global styles ─────────────────────────────────────────
import "./styles/theme.css";
import "./App.css";

// ── Page imports ───────────────────────────────────────────
import KoraHome from "./KoraHome";
import JobSeekerProfile from "./pages/profile/JobSeekerProfile";
import EmployerProfile from "./pages/profile/EmployerProfile";
import AdminProfile from "./pages/profile/AdminProfile";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import EmployerDashboard from "./pages/EmployerDashboard";
import ManageJobs from "./pages/employer/ManageJobs";
import PostJob from "./pages/employer/PostJob";
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import JobList from './pages/jobs/JobList';
import JobDetails from './pages/jobs/JobDetails';
import ApplyPage from './pages/jobs/ApplyPage';

// ── Shared styles for specific pages ──────────────────────
import './styles/employee-dashboard.css';
import './styles/job-list.css';
import './styles/apply-page.css';

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
  ];
  return (
    <nav
      style={{
        position: "fixed",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        background: "#0B2B26",
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

// ── App Component ──────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<KoraHome />} />
        <Route path="/profile/job-seeker" element={<JobSeekerProfile />} />
        <Route path="/profile/employer" element={<EmployerProfile />} />
        <Route path="/profile/admin" element={<AdminProfile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
        <Route path="/dashboard" element={<Navigate to="/employee/dashboard" replace />} />
        <Route path="/jobs" element={<JobList />} />
        <Route path="/jobs/:id" element={<JobDetails />} />
        <Route path="/jobs/:id/apply" element={<ApplyPage />} />
        <Route path="/dashboard/employer" element={<EmployerDashboard />} />
        <Route path="/employer/jobs" element={<EmployerJobsManager />} />
        <Route path="/employer/post-job" element={<EmployerJobsManager />} />
      </Routes>
      <DevNav />
    </BrowserRouter>
  );
}
