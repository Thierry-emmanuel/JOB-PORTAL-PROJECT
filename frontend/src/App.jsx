import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import JobSeekerProfile from "./pages/profile/JobSeekerProfile";
import EmployerProfile from "./pages/profile/EmployerProfile";
import AdminProfile from "./pages/profile/AdminProfile";
import EmployerDashboard from "./pages/EmployerDashboard";
import "./App.css";

// Demo nav to switch between pages for development
function DevNav() {
  const location = useLocation();

  const links = [
    { to: "/profile/job-seeker",   label: "Job Seeker"  },
    { to: "/profile/employer",     label: "Employer"    },
    { to: "/profile/admin",        label: "Admin"       },
    { to: "/dashboard/employer",   label: "Dashboard"   },
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
        padding: "10px 20px",
        display: "flex",
        gap: "12px",
        zIndex: 9999,
        boxShadow: "0 8px 32px rgba(11,43,38,0.4)",
      }}
    >
      {links.map(({ to, label }) => {
        const isActive = location.pathname === to;
        return (
          <Link
            key={to}
            to={to}
            style={{
              color: isActive ? "white" : "rgba(255,255,255,0.7)",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 600,
              padding: "6px 14px",
              borderRadius: "999px",
              background: isActive ? "rgba(255,255,255,0.15)" : "transparent",
              transition: "all 0.18s",
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                      element={<Navigate to="/profile/job-seeker" replace />} />
        <Route path="/profile/job-seeker"    element={<JobSeekerProfile />} />
        <Route path="/profile/employer"      element={<EmployerProfile />} />
        <Route path="/profile/admin"         element={<AdminProfile />} />
        <Route path="/dashboard/employer"    element={<EmployerDashboard />} />
      </Routes>
      <DevNav />
    </BrowserRouter>
  );
}