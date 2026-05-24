/**
 * useEmployeeDashboard.js  (v2 — with inline Jobs Browser)
 * ─────────────────────────────────────────────────────────────
 * Added:
 *   activeSection  — 'dashboard' | 'jobs'
 *   setActiveSection
 *   allJobs, allJobsLoading, allJobsError
 *   jobSearch, setJobSearch
 *   jobFilters, setJobFilters
 *   jobPage, setJobPage   (client-side pagination)
 *   filteredJobs          (derived — search + filter applied)
 * ─────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserApplications, getJobs } from '../api/jobs';
import { getInterviewsBySeeker, cancelInterview } from '../api/interviews';
import { getJobSeekerProfile, updateJobSeekerProfile } from '../api/profiles';

/* ── Profile completion ──────────────────────────────────── */
export function profileCompletion(p) {
  if (!p) return 0;
  let score = 0;
  if (p.profilePhoto)            score += 15;
  if (p.summary)                 score += 15;
  if (p.phone)                   score += 10;
  if (p.cvUrl)                   score += 20;
  if (p.experiences?.length > 0) score += 15;
  if (p.education?.length > 0)   score += 10;
  if (p.skills?.length >= 3)     score += 10;
  if (p.languages?.length > 0)   score += 5;
  return Math.min(score, 100);
}

const EMPTY_PROFILE = {
  fullName: '', email: '', phone: '', city: '', region: '',
  profilePhoto: null, summary: '', cvUrl: null, cvFileName: null,
  experiences: [], education: [], skills: [], languages: [],
};

const JOBS_PER_PAGE = 9;

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload  = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
  });
}

export default function useEmployeeDashboard() {
  const { user, token } = useAuth();

  /* ── Core state ─────────────────────────────────────────── */
  const [profile,         setProfile]         = useState({ ...EMPTY_PROFILE, ...(user || {}) });
  const [applications,    setApplications]    = useState([]);
  const [appsLoading,     setAppsLoading]     = useState(true);
  const [appsError,       setAppsError]       = useState(null);
  const [interviews,      setInterviews]      = useState([]);
  const [interLoading,    setInterLoading]    = useState(true);
  const [recJobs,         setRecJobs]         = useState([]);
  const [jobsLoading,     setJobsLoading]     = useState(true);

  /* ── Jobs browser state ─────────────────────────────────── */
  const [activeSection,   setActiveSection]   = useState('dashboard'); // 'dashboard' | 'jobs'
  const [allJobs,         setAllJobs]         = useState([]);
  const [allJobsLoading,  setAllJobsLoading]  = useState(false);
  const [allJobsError,    setAllJobsError]    = useState(null);
  const [jobSearch,       setJobSearch]       = useState('');
  const [jobFilters,      setJobFilters]      = useState({ type: '', location: '' });
  const [jobPage,         setJobPage]         = useState(1);

  /* ── Derived ─────────────────────────────────────────────── */
  const completion = profileCompletion(profile);
  const firstName  = (
    profile.fullName?.split(' ')[0] ||
    profile.firstName ||
    profile.email?.split('@')[0] ||
    'there'
  );

  /* ── Filter + search jobs (client-side) ─────────────────── */
  const filteredJobs = useMemo(() => {
    let list = allJobs;
    const q = jobSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(j =>
        j.title?.toLowerCase().includes(q)        ||
        j.company?.toLowerCase().includes(q)      ||
        j.location?.toLowerCase().includes(q)     ||
        j.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    if (jobFilters.type) {
      list = list.filter(j => j.type === jobFilters.type);
    }
    if (jobFilters.location) {
      list = list.filter(j =>
        j.location?.toLowerCase().includes(jobFilters.location.toLowerCase())
      );
    }
    return list;
  }, [allJobs, jobSearch, jobFilters]);

  const paginatedJobs = useMemo(() => {
    const start = (jobPage - 1) * JOBS_PER_PAGE;
    return filteredJobs.slice(start, start + JOBS_PER_PAGE);
  }, [filteredJobs, jobPage]);

  const totalJobPages = Math.max(1, Math.ceil(filteredJobs.length / JOBS_PER_PAGE));

  /* ── Reset page when search/filter changes ──────────────── */
  useEffect(() => { setJobPage(1); }, [jobSearch, jobFilters]);

  /* ── Bootstrap dashboard data ───────────────────────────── */
  useEffect(() => {
    if (!token || !user?.id) return;
    const id = user.id;

    getJobSeekerProfile(id)
      .then(data => {
        if (data) setProfile(prev => ({
          ...prev, ...data,
          profilePhoto: data.avatarUrl || data.profilePhoto || null,
          summary:      data.profileSummary || data.summary || '',
        }));
      })
      .catch(err => console.error('[Dashboard] profile:', err));

    fetchApplications(id);

    getInterviewsBySeeker(id)
      .then(data => setInterviews(data || []))
      .catch(err => { console.error('[Dashboard] interviews:', err.message); setInterviews([]); })
      .finally(() => setInterLoading(false));

    // Recommended jobs (small set for dashboard widget)
    getJobs({ limit: 6 })
      .then(res => setRecJobs(res.data || []))
      .catch(() => {})
      .finally(() => setJobsLoading(false));
  }, [user, token]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Fetch all jobs (called once when user opens Jobs tab) ── */
  const fetchAllJobs = useCallback(() => {
    if (allJobs.length > 0) return; // already loaded — don't re-fetch
    setAllJobsLoading(true);
    setAllJobsError(null);
    getJobs({ limit: 100 })
      .then(res => setAllJobs(res.data || []))
      .catch(() => setAllJobsError('Could not load jobs. Please try again.'))
      .finally(() => setAllJobsLoading(false));
  }, [allJobs.length]);

  /* ── Switch section ─────────────────────────────────────── */
  const openJobsBrowser = useCallback(() => {
    setActiveSection('jobs');
    fetchAllJobs();
  }, [fetchAllJobs]);

  const openDashboard = useCallback(() => {
    setActiveSection('dashboard');
  }, []);

  const retryAllJobs = useCallback(() => {
    setAllJobs([]);      // clear so fetchAllJobs re-fetches
    setAllJobsLoading(true);
    setAllJobsError(null);
    getJobs({ limit: 100 })
      .then(res => setAllJobs(res.data || []))
      .catch(() => setAllJobsError('Could not load jobs. Please try again.'))
      .finally(() => setAllJobsLoading(false));
  }, []);

  /* ── Applications ───────────────────────────────────────── */
  const fetchApplications = useCallback((id) => {
    const seekerId = id || user?.id;
    if (!seekerId) return;
    setAppsLoading(true);
    setAppsError(null);
    getUserApplications(seekerId)
      .then(res => setApplications(res.data || []))
      .catch(() => {
        setAppsError('Could not load applications. Please try again.');
        setApplications([]);
      })
      .finally(() => setAppsLoading(false));
  }, [user]);

  const retryApps = useCallback(() => fetchApplications(), [fetchApplications]);

  /* ── Photo upload ────────────────────────────────────────── */
  const handlePhotoChange = useCallback(async (file) => {
    try {
      const base64 = await fileToBase64(file);
      const payload = { ...profile, profilePhoto: base64, avatarUrl: base64, profileSummary: profile.summary };
      const updated = await updateJobSeekerProfile(user?.id || 1, payload);
      setProfile(prev => ({
        ...prev, ...payload, ...updated,
        profilePhoto: updated.avatarUrl || base64,
        summary:      updated.profileSummary || profile.summary,
      }));
    } catch (err) {
      console.error('[Dashboard] photo upload failed:', err);
      alert('Failed to upload photo. Please try again.');
    }
  }, [profile, user]);

  /* ── Cancel interview ────────────────────────────────────── */
  const handleCancelInterview = useCallback(async (id) => {
    if (!window.confirm('Cancel this interview?')) return;
    try {
      await cancelInterview(id);
      setInterviews(prev => prev.filter(iv => iv.id !== id));
    } catch {
      alert('Failed to cancel. Please try again.');
    }
  }, []);

  return {
    /* Profile */
    profile, completion, firstName,
    /* Applications */
    applications, appsLoading, appsError, retryApps,
    /* Interviews */
    interviews, interLoading,
    /* Dashboard recommended jobs */
    recJobs, jobsLoading,
    /* Actions */
    handlePhotoChange, handleCancelInterview,
    /* ── Jobs browser ── */
    activeSection, openJobsBrowser, openDashboard,
    allJobs, allJobsLoading, allJobsError, retryAllJobs,
    jobSearch, setJobSearch,
    jobFilters, setJobFilters,
    jobPage, setJobPage,
    paginatedJobs, filteredJobs, totalJobPages,
    JOBS_PER_PAGE,
  };
}
