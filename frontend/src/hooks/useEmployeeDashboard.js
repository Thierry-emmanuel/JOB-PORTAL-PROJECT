/**
 * useEmployeeDashboard.js
 * ─────────────────────────────────────────────────────────────
 * Central data-fetching hook for the Employee Dashboard.
 * Separates all async concerns from the UI component so the
 * dashboard JSX stays purely presentational.
 *
 * Returns:
 *   profile, completion, firstName
 *   applications, appsLoading, appsError, retryApps
 *   interviews, interLoading
 *   recJobs, jobsLoading
 *   handlePhotoChange, handleCancelInterview
 * ─────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserApplications, getJobs } from '../api/jobs';
import { getInterviewsBySeeker, cancelInterview } from '../api/interviews';
import { getJobSeekerProfile, updateJobSeekerProfile } from '../api/profiles';

/* ── Profile completion formula (mirrors JobSeekerProfile) ── */
export function profileCompletion(p) {
  if (!p) return 0;
  let score = 0;
  if (p.profilePhoto)              score += 15;
  if (p.summary)                   score += 15;
  if (p.phone)                     score += 10;
  if (p.cvUrl)                     score += 20;
  if (p.experiences?.length > 0)   score += 15;
  if (p.education?.length > 0)     score += 10;
  if (p.skills?.length >= 3)       score += 10;
  if (p.languages?.length > 0)     score += 5;
  return Math.min(score, 100);
}

const EMPTY_PROFILE = {
  fullName: '', email: '', phone: '', city: '', region: '',
  profilePhoto: null, summary: '', cvUrl: null, cvFileName: null,
  experiences: [], education: [], skills: [], languages: [],
};

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

  const [profile,       setProfile]       = useState({ ...EMPTY_PROFILE, ...(user || {}) });
  const [applications,  setApplications]  = useState([]);
  const [appsLoading,   setAppsLoading]   = useState(true);
  const [appsError,     setAppsError]     = useState(null);
  const [interviews,    setInterviews]    = useState([]);
  const [interLoading,  setInterLoading]  = useState(true);
  const [recJobs,       setRecJobs]       = useState([]);
  const [jobsLoading,   setJobsLoading]   = useState(true);

  const completion = profileCompletion(profile);
  const firstName  = (
    profile.fullName?.split(' ')[0] ||
    profile.firstName ||
    profile.email?.split('@')[0] ||
    'there'
  );

  /* ── Bootstrap all data ─────────────────────────────────── */
  useEffect(() => {
    if (!token || !user?.id) return;
    const id = user.id;

    // Profile
    getJobSeekerProfile(id)
      .then((data) => {
        if (data) setProfile(prev => ({
          ...prev, ...data,
          profilePhoto: data.avatarUrl || data.profilePhoto || null,
          summary:      data.profileSummary || data.summary || '',
        }));
      })
      .catch((err) => console.error('[Dashboard] profile fetch:', err));

    // Applications
    fetchApplications(id);

    // Interviews
    getInterviewsBySeeker(id)
      .then((data) => setInterviews(Array.isArray(data) ? data : []))
      .catch((err) => { console.error('[Dashboard] interviews:', err.message); setInterviews([]); })
      .finally(() => setInterLoading(false));

    // Recommended jobs
    getJobs({ limit: 6 })
      .then((res) => setRecJobs(res.data || []))
      .catch(() => {})
      .finally(() => setJobsLoading(false));
  }, [user, token]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Fetch / retry applications ──────────────────────────── */
  const fetchApplications = useCallback((id) => {
    const seekerId = id || user?.id;
    if (!seekerId) return;
    setAppsLoading(true);
    setAppsError(null);
    getUserApplications(seekerId)
      .then((res) => {
        // getUserApplications already extracts data.content || data from the
        // ApplicationPageResponse envelope, so res is the plain array here.
        setApplications(Array.isArray(res) ? res : (res?.content || []));
      })
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
      const payload = {
        ...profile,
        profilePhoto:   base64,
        avatarUrl:      base64,
        profileSummary: profile.summary,
      };
      const idToUpdate = user?.id || user?.jobSeekerId || 1;
      const updated = await updateJobSeekerProfile(idToUpdate, payload);
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
    /* Jobs */
    recJobs, jobsLoading,
    /* Actions */
    handlePhotoChange, handleCancelInterview,
  };
}