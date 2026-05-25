import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase, Users, Eye, Star, Bell, Plus, ChevronRight,
  Clock, Video, Search, TrendingUp, RefreshCw, AlertTriangle
} from "lucide-react";

import { useEmployerDashboard } from "../hooks/useEmployerDashboard";
import InterviewScheduler from "../components/employer/InterviewScheduler";
import EmployerSidebar from "../components/employer/EmployerSidebar";

import DashboardLayout from "../components/shared/DashboardLayout";
import StatCard from "../components/shared/StatCard";

import "../styles/employee-dashboard.css";   // ← Main unified stylesheet

// Removed unnecessary imports:
// "../styles/employer-dashboard.css"
// "../styles/profile.css"
// "../styles/employer-profile.css"

export default function EmployerDashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [schedulerTarget, setSchedulerTarget] = useState(null);

  const {
    employer,
    stats,
    applications,
    jobPostings,
    notifications,
    unreadCount,
    loading,
    error,
    refreshing,
    refresh,
    markNotificationRead,
    markAllRead,
    updateApplicationStatus,
    updateJobPostingStatus,
  } = useEmployerDashboard();

  const filteredApplications = applications.filter((a) =>
    (a.applicant || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.job || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const firstName = employer?.contactName
    ? employer.contactName.split(" ")[0]
    : "Employer";

  const handleInterviewScheduled = () => {
    if (schedulerTarget) {
      updateApplicationStatus(schedulerTarget.id, "SHORTLISTED");
    }
    setTimeout(() => setSchedulerTarget(null), 1500);
  };

  const sidebar = (
    <aside className="ed-sidebar kora-sidebar">
      <EmployerSidebar
        employer={employer}
        loading={loading}
        stats={stats}
      />
    </aside>
  );

  return (
    <DashboardLayout
      sidebar={sidebar}
      error={error}
      loading={loading}
      onRefresh={refresh}
    >
      {schedulerTarget && (
        <InterviewScheduler
          application={schedulerTarget}
          onClose={() => setSchedulerTarget(null)}
          onScheduled={handleInterviewScheduled}
        />
      )}

      {/* Welcome Section */}
      <div className="ed-welcome">
        <div>
          <h1 className="ed-welcome-title">
            Welcome back, {loading ? "..." : firstName} 👋
          </h1>
          <p className="ed-welcome-sub">
            Here's what's happening with your company today.
          </p>
        </div>
        <button
          className="ed-find-jobs-btn"
          onClick={() => navigate("/employer/post-job")}
        >
          <Plus size={16} /> Post New Job
        </button>
      </div>

      {/* Stats */}
      <div className="ed-stats-row">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="ed-skeleton-card" style={{ height: "118px" }} />
          ))
        ) : (
          <>
            <StatCard icon={<Briefcase size={22} />} label="Active Jobs" value={stats?.activeJobs || 0} change={stats?.activeJobsChange} color="#0B2B26" />
            <StatCard icon={<Users size={22} />} label="Applications" value={stats?.totalApplications || 0} change={stats?.totalApplicationsChange} color="#E07B39" />
            <StatCard icon={<Eye size={22} />} label="Profile Views" value={stats?.totalViews || 0} change={stats?.totalViewsChange} color="#3B82F6" />
            <StatCard icon={<Star size={22} />} label="Candidates Hired" value={stats?.hired || 0} change={stats?.hiredChange} color="#10B981" />
          </>
        )}
      </div>

      {/* Two Column Layout */}
      <div className="ed-two-col">
        {/* Recent Applications */}
        <div className="kora-section ed-section-tall">
          <div className="kora-section-header">
            <div className="kora-section-title">
              <Users size={18} />
              <h2>Recent Applications</h2>
            </div>
            <button className="ed-view-all-btn" onClick={() => navigate("/employer/jobs")}>
              View All <ChevronRight size={14} />
            </button>
          </div>

          <div className="ed-search-bar">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search applicants or jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="ed-applications-list">
            {/* Your applications rendering code goes here */}
          </div>
        </div>

        {/* Right Column */}
        <div className="ed-right-col">
          {/* Active Jobs & Notifications go here */}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="kora-section">
        <div className="kora-section-header">
          <div className="kora-section-title">
            <TrendingUp size={18} />
            <h2>Quick Actions</h2>
          </div>
        </div>
        <div className="ed-quick-actions">
          {/* Your quick actions go here */}
        </div>
      </div>

    </DashboardLayout>
  );
}