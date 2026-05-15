import { useState, useEffect, useCallback } from "react";

const simulateApiCall = (data, delay = 800) =>
  new Promise((resolve) => setTimeout(() => resolve(data), delay));

const MOCK_EMPLOYER = {
  id: 1,
  companyName: "TechCam Solutions",
  contactName: "Jean-Pierre MVONDO",
  logo: null,
  city: "Douala",
  sector: "Information Technology",
  isApproved: true,
  isActive: true,
};

const MOCK_STATS = {
  activeJobs: 3,
  totalApplications: 24,
  totalViews: 342,
  hired: 2,
  activeJobsChange: +1,
  totalApplicationsChange: +6,
  totalViewsChange: +48,
  hiredChange: +1,
  pendingReview: 5,
  shortlisted: 8,
};

const MOCK_APPLICATIONS = [
  { id: 1, applicant: "Lena Biloa Ekassi",    job: "Senior Java Developer",      status: "SHORTLISTED", date: "2025-05-10", avatar: null },
  { id: 2, applicant: "Thomas Nguisseu",       job: "React.js Frontend Engineer", status: "APPLIED",     date: "2025-05-09", avatar: null },
  { id: 3, applicant: "Marie Kana Tsolefack", job: "DevOps Engineer",            status: "APPLIED",     date: "2025-05-08", avatar: null },
  { id: 4, applicant: "Thierry Tsafack",       job: "Senior Java Developer",      status: "REJECTED",    date: "2025-05-07", avatar: null },
  { id: 5, applicant: "Marc Tsobeng",          job: "React.js Frontend Engineer", status: "HIRED",       date: "2025-05-06", avatar: null },
];

const MOCK_JOB_POSTINGS = [
  { id: 1, title: "Senior Java Developer",      type: "CDI", applications: 12, views: 145, deadline: "2025-06-15", status: "ACTIVE", daysLeft: 36 },
  { id: 2, title: "React.js Frontend Engineer", type: "CDD", applications: 8,  views: 112, deadline: "2025-05-30", status: "ACTIVE", daysLeft: 20 },
  { id: 3, title: "DevOps Engineer",            type: "CDI", applications: 4,  views: 85,  deadline: "2025-07-01", status: "ACTIVE", daysLeft: 52 },
];

const MOCK_NOTIFICATIONS = [
  { id: 1, text: "New application for Senior Java Developer",    time: "2 hours ago", read: false, type: "application" },
  { id: 2, text: "Your job post 'DevOps Engineer' was approved", time: "1 day ago",   read: false, type: "approval"     },
  { id: 3, text: "Thomas Nguisseu updated their application",    time: "2 days ago",  read: true,  type: "update"       },
  { id: 4, text: "New application for React.js Frontend Engineer", time: "3 days ago", read: true, type: "application"  },
];

// ── Custom Hook ───────────────────────────────────────────
export function useEmployerDashboard() {
  const [employer,       setEmployer]       = useState(null);
  const [stats,          setStats]          = useState(null);
  const [applications,   setApplications]   = useState([]);
  const [jobPostings,    setJobPostings]    = useState([]);
  const [notifications,  setNotifications]  = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [refreshing,     setRefreshing]     = useState(false);

  // ── Fetch all dashboard data ──
  const fetchDashboard = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      // Simulate parallel API calls
      // In production, replace with:
      // const [emp, st, apps, jobs, notifs] = await Promise.all([
      //   fetch("/api/v1/employers/me").then(r => r.json()),
      //   fetch("/api/v1/employers/me/stats").then(r => r.json()),
      //   fetch("/api/v1/employers/me/applications?limit=5").then(r => r.json()),
      //   fetch("/api/v1/employers/me/jobs?status=ACTIVE").then(r => r.json()),
      //   fetch("/api/v1/notifications?limit=4").then(r => r.json()),
      // ]);
      const [emp, st, apps, jobs, notifs] = await Promise.all([
        simulateApiCall(MOCK_EMPLOYER,       600),
        simulateApiCall(MOCK_STATS,          700),
        simulateApiCall(MOCK_APPLICATIONS,   800),
        simulateApiCall(MOCK_JOB_POSTINGS,   750),
        simulateApiCall(MOCK_NOTIFICATIONS,  650),
      ]);

      setEmployer(emp);
      setStats(st);
      setApplications(apps);
      setJobPostings(jobs);
      setNotifications(notifs);
    } catch (err) {
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ── Mark notification as read ──
  const markNotificationRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, read: true } : n)
    );
    // In production: await fetch(`/api/v1/notifications/${id}/read`, { method: "PATCH" });
  }, []);

  // ── Mark all notifications as read ──
  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    // In production: await fetch("/api/v1/notifications/read-all", { method: "PATCH" });
  }, []);

  // ── Update application status ──
  const updateApplicationStatus = useCallback((appId, newStatus) => {
    setApplications((prev) =>
      prev.map((a) => a.id === appId ? { ...a, status: newStatus } : a)
    );
    // Update stats dynamically
    if (newStatus === "HIRED") {
      setStats((prev) => prev ? { ...prev, hired: prev.hired + 1 } : prev);
    }
    // In production: await fetch(`/api/v1/applications/${appId}/status`, { method: "PATCH", body: JSON.stringify({ status: newStatus }) });
  }, []);

  // ── Close a job posting ──
  const closeJobPosting = useCallback((jobId) => {
    setJobPostings((prev) => prev.filter((j) => j.id !== jobId));
    setStats((prev) => prev ? { ...prev, activeJobs: Math.max(0, prev.activeJobs - 1) } : prev);
    // In production: await fetch(`/api/v1/jobs/${jobId}/close`, { method: "PATCH" });
  }, []);

  // ── Derived values ──
  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    // Data
    employer,
    stats,
    applications,
    jobPostings,
    notifications,
    unreadCount,
    // State
    loading,
    error,
    refreshing,
    // Actions
    refresh:                 () => fetchDashboard(true),
    markNotificationRead,
    markAllRead,
    updateApplicationStatus,
    closeJobPosting,
  };
}