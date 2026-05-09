import { BrowserRouter, Routes, Route, Link ,Navigate} from "react-router-dom";
import JobSeekerProfile from "./pages/profile/JobSeekerProfile";
import EmployerProfile from "./pages/profile/EmployerProfile";
import AdminProfile from "./pages/profile/AdminProfile";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import KoraHome from "./KoraHome";
import "./App.css";
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import JobList    from './pages/jobs/JobList';
import JobDetails from './pages/jobs/JobDetails';
import ApplyPage  from './pages/jobs/ApplyPage';
import './styles/employee-dashboard.css';
import './styles/job-list.css';
 import './styles/apply-page.css';

// Demo nav to switch between profile types for development
function DevNav() {
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
        gap: "12px",
        zIndex: 9999,
        boxShadow: "0 8px 32px rgba(11,43,38,0.4)",
      }}
    >
      <Link
        to="/"
        style={{
          color: "rgba(255,255,255,0.7)",
          textDecoration: "none",
          fontSize: "13px",
          fontWeight: 600,
          padding: "6px 14px",
          borderRadius: "999px",
          transition: "all 0.18s",
          fontFamily: "DM Sans, sans-serif",
        }}
        onClick={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.15)";
          e.currentTarget.style.color = "white";
        }}
      >
        Home
      </Link>
      {[

        { to: "/login", label: "Login" },
        { to: "/register", label: "Register" },

        { to: "/profile/job-seeker", label: "Job Seeker" },
        { to: "/profile/employer", label: "Employer" },
        { to: "/profile/admin", label: "Admin" },
      ].map(({ to, label }) => (
        <Link
          key={to}
          to={to}
          style={{
            color: "rgba(255,255,255,0.7)",
            textDecoration: "none",
            fontSize: "13px",
            fontWeight: 600,
            padding: "6px 14px",
            borderRadius: "999px",
            transition: "all 0.18s",
            fontFamily: "DM Sans, sans-serif",
          }}
          onClick={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.15)";
            e.currentTarget.style.color = "white";
          }}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<KoraHome />} />
        <Route path="/profile/job-seeker" element={<JobSeekerProfile />} />
        <Route path="/profile/employer" element={<EmployerProfile />} />
        <Route path="/profile/admin" element={<AdminProfile />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
        <Route path="/dashboard"          element={<Navigate to="/employee/dashboard" replace />} />
       <Route path="/jobs"               element={<JobList />} />
             <Route path="/jobs/:id"           element={<JobDetails />} />
             <Route path="/jobs/:id/apply"     element={<ApplyPage />} />


      </Routes>
      <DevNav />
    </BrowserRouter>
  );
}