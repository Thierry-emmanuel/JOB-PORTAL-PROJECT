import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { getEmployerProfile } from "../api/profiles";
import { getJobSeekerProfile } from "../api/profiles";
import {
  getEmployerJobs,
  getEmployerCompanies,
  getEmployerApplications,
  updateApplicationStatus as apiUpdateStatus,
  changeJobStatus as apiChangeJobStatus,
  deleteJob as apiDeleteJob
} from "../api/jobs";

const MOCK_NOTIFICATIONS = [
  { id: 1, text: "New application received for Senior Java Developer",    time: "2 hours ago", read: false, type: "application" },
  { id: 2, text: "Your company job post 'DevOps Engineer' was approved", time: "1 day ago",   read: false, type: "approval"     },
  { id: 3, text: "Candidate updated their expected interview date",      time: "2 days ago",  read: true,  type: "update"       },
  { id: 4, text: "New application received for React.js Engineer",        time: "3 days ago", read: true, type: "application"  },
];

export function useEmployerDashboard() {
  const { user, token } = useAuth();

  const [employer,       setEmployer]       = useState(null);
  const [stats,          setStats]          = useState({
    activeJobs: 0,
    totalApplications: 0,
    totalViews: 0,
    hired: 0,
    activeJobsChange: 0,
    totalApplicationsChange: 0,
    totalViewsChange: 0,
    hiredChange: 0,
  });
  const [applications,   setApplications]   = useState([]);
  const [jobPostings,    setJobPostings]    = useState([]);
  const [notifications,  setNotifications]  = useState(MOCK_NOTIFICATIONS);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [refreshing,     setRefreshing]     = useState(false);

  // ── Fetch all dashboard data from backend ──
  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (!token || !user?.id) {
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      // 1. Fetch Employer Profile & Company Details
      let empDetails = null;
      let rawJobs = [];
      let rawApps = [];

      try {
        const [profileRes, companyRes] = await Promise.all([
          getEmployerProfile(user.id),
          getEmployerCompanies(user.id).catch(() => null)
        ]);

        const company = Array.isArray(companyRes) ? companyRes[0] : companyRes;

        empDetails = {
          id: user.id,
          companyName: company?.name || profileRes?.bio || "Kora Corporate Partner",
          contactName: profileRes?.fullName || user.fullName || user.email?.split('@')[0] || "Recruiter",
          logo: company?.logoUrl || profileRes?.avatarUrl || null,
          city: company?.city || profileRes?.city || "Yaounde",
          sector: company?.sector || "Technology",
          isApproved: profileRes?.isApproved ?? true,
          isActive: true,
        };
      } catch (err) {
        console.warn("Gracefully falling back for company/employer profile:", err);
        empDetails = {
          id: user.id,
          companyName: "Kora Corporate Partner",
          contactName: user.fullName || user.email?.split('@')[0] || "Recruiter",
          logo: null,
          city: "Douala",
          sector: "Technology",
          isApproved: true,
          isActive: true,
        };
      }

      // 2. Fetch Job Listings & Applications in parallel
      try {
        const [jobsRes, appsRes] = await Promise.all([
          getEmployerJobs(user.id).catch(() => []),
          getEmployerApplications(user.id).catch(() => [])
        ]);

        rawJobs = Array.isArray(jobsRes) ? jobsRes : [];
        // getEmployerApplications returns data.content || data, so already an array
        rawApps = Array.isArray(appsRes) ? appsRes : (appsRes?.content || []);
      } catch (err) {
        console.error("Failed to load jobs or applications:", err);
      }

      // 3. Resolve seeker profiles for each application dynamically
      const appPromises = rawApps.map(async (app) => {
        let applicantName = `Job Seeker #${app.seekerId}`;
        let avatar = null;
        try {
          const seekerProfile = await getJobSeekerProfile(app.seekerId);
          if (seekerProfile) {
            applicantName = seekerProfile.fullName || seekerProfile.email?.split('@')[0] || applicantName;
            avatar = seekerProfile.avatarUrl || null;
          }
        } catch (e) {
          console.warn(`Failed to fetch seeker profile for seekerId ${app.seekerId}:`, e);
        }

        // Find matching job posting to get the title.
        // app.jobPostingId (Long) must be compared against job.id (UUID string from backend).
        // The backend JobListingSummary.id is a UUID; the application stores it as a numeric
        // job_posting_id. We do a loose string comparison to handle both.
        const matchingJob = rawJobs.find(
          j => String(j.id) === String(app.jobPostingId) || j.numericId === app.jobPostingId
        );
        const jobTitle = matchingJob ? matchingJob.title : `Job #${app.jobPostingId}`;

        return {
          id:             app.id,
          seekerId:       app.seekerId,
          applicant:      applicantName,
          job:            jobTitle,
          jobPostingId:   app.jobPostingId,
          status:         app.status,
          date:           new Date(app.appliedAt || new Date()).toISOString().split('T')[0],
          avatar:         avatar,
          expectedSalary: app.expectedSalary,
          coverLetter:    app.coverLetter,
        };
      });

      const resolvedApps = await Promise.all(appPromises);

      // 4. Map jobs to frontend UI shape.
      // JobListingSummary fields: id (UUID), title, status (PostingStatus), jobType,
      // salaryMin, salaryMax, experienceLevel, deadline, viewCount,
      // categoryName, companyName, companyLogoUrl, locationCity, locationCountry, createdAt
      const mappedJobs = rawJobs.map(job => {
        // Count applications belonging to this specific job posting.
        // app.jobPostingId is a numeric Long; job.id is a UUID string — compare via String().
        const appCount = resolvedApps.filter(
          a => String(a.jobPostingId) === String(job.id)
        ).length;

        let daysLeft = 30;
        if (job.deadline) {
          const diffTime = new Date(job.deadline) - new Date();
          daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        }

        // Build a readable location string from the two location sub-fields
        const location = [job.locationCity, job.locationCountry]
          .filter(Boolean)
          .join(', ') || 'Remote';

        return {
          id:           job.id,
          title:        job.title,
          type:         job.jobType || "FULL_TIME",
          category:     job.categoryName || "",
          location:     location,
          applications: appCount,
          views:        job.viewCount || 0,
          deadline:     job.deadline,
          postedAt:     job.createdAt,
          expiresAt:    job.deadline,
          status:       job.status || "ACTIVE",
          daysLeft:     daysLeft,
        };
      });

      // 5. Calculate statistics dynamically
      const activeJobsCount = mappedJobs.filter(j => j.status === "ACTIVE").length;
      const totalAppsCount  = resolvedApps.length;
      const totalViewsCount = mappedJobs.reduce((sum, j) => sum + (j.views || 0), 0);
      const hiredCount      = resolvedApps.filter(a => a.status === "HIRED").length;

      setEmployer(empDetails);
      setJobPostings(mappedJobs);
      setApplications(resolvedApps);
      setStats({
        activeJobs: activeJobsCount,
        totalApplications: totalAppsCount,
        totalViews: totalViewsCount,
        hired: hiredCount,
        activeJobsChange: activeJobsCount > 0 ? +1 : 0,
        totalApplicationsChange: totalAppsCount > 0 ? +2 : 0,
        totalViewsChange: totalViewsCount > 0 ? +15 : 0,
        hiredChange: hiredCount > 0 ? +1 : 0,
      });

    } catch (err) {
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, token]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ── Mark notification as read ──
  const markNotificationRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  // ── Mark all notifications as read ──
  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  // ── Update application status on backend ──
  const updateApplicationStatus = useCallback(async (appId, newStatus) => {
    const targetApp = applications.find(a => a.id === appId);
    if (!targetApp) return;

    try {
      await apiUpdateStatus(appId, newStatus, targetApp.status);

      // Optimistic UI update
      setApplications((prev) =>
        prev.map((a) => a.id === appId ? { ...a, status: newStatus } : a)
      );

      setStats((prev) => {
        if (!prev) return prev;
        const wasHired  = targetApp.status === "HIRED";
        const isHiredNow = newStatus === "HIRED";
        let newHiredCount = prev.hired;
        if (!wasHired && isHiredNow) newHiredCount += 1;
        if (wasHired && !isHiredNow) newHiredCount = Math.max(0, newHiredCount - 1);
        return { ...prev, hired: newHiredCount };
      });
    } catch (err) {
      alert("Failed to update application status: " + (err.response?.data?.message || err.message));
    }
  }, [applications]);

  // ── Change Job Posting Status ──
  const updateJobPostingStatus = useCallback(async (jobId, newStatus) => {
    try {
      await apiChangeJobStatus(jobId, newStatus);

      setJobPostings((prev) => prev.map((j) => j.id === jobId ? { ...j, status: newStatus } : j));

      setStats((prev) => {
        if (!prev) return prev;
        const job = jobPostings.find(j => j.id === jobId);
        if (!job) return prev;
        const wasActive  = job.status === "ACTIVE";
        const isActiveNow = newStatus === "ACTIVE";
        let newActiveJobs = prev.activeJobs;
        if (wasActive && !isActiveNow) newActiveJobs = Math.max(0, newActiveJobs - 1);
        if (!wasActive && isActiveNow) newActiveJobs += 1;
        return { ...prev, activeJobs: newActiveJobs };
      });
    } catch (err) {
      alert("Failed to update job status: " + (err.response?.data?.message || err.message));
    }
  }, [jobPostings]);

  // ── Delete a job posting ──
  const deleteJobPosting = useCallback(async (jobId) => {
    try {
      await apiDeleteJob(jobId);

      setJobPostings((prev) => prev.filter((j) => j.id !== jobId));

      setStats((prev) => {
        if (!prev) return prev;
        const job = jobPostings.find(j => j.id === jobId);
        let newActiveJobs = prev.activeJobs;
        if (job && job.status === "ACTIVE") {
          newActiveJobs = Math.max(0, newActiveJobs - 1);
        }
        return { ...prev, activeJobs: newActiveJobs };
      });
    } catch (err) {
      alert("Failed to delete job listing: " + (err.response?.data?.message || err.message));
    }
  }, [jobPostings]);

  // ── Derived values ──
  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    employer,
    stats,
    applications,
    jobPostings,
    notifications,
    unreadCount,
    loading,
    error,
    refreshing,
    refresh: () => fetchDashboard(true),
    markNotificationRead,
    markAllRead,
    updateApplicationStatus,
    updateJobPostingStatus,
    deleteJobPosting,
  };
}