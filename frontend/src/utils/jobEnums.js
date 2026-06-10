/** Contract types — must match Backend JobType enum (CDI, CDD, INTERNSHIP, FREELANCE). */
export const JOB_TYPES = ['CDI', 'CDD', 'INTERNSHIP', 'FREELANCE'];

export const JOB_TYPE_LABELS = {
  CDI: 'Full-time (CDI)',
  CDD: 'Fixed-term (CDD)',
  INTERNSHIP: 'Internship',
  FREELANCE: 'Freelance',
  // Legacy display fallbacks
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
};

/** Experience levels — must match Backend ExperienceLevel enum. */
export const EXPERIENCE_LEVELS = ['ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'LEAD'];

export function formatJobType(type) {
  if (!type) return '—';
  return JOB_TYPE_LABELS[type] || String(type).replace(/_/g, ' ');
}

export function formatExperience(level) {
  if (!level) return '—';
  return String(level).replace(/_/g, ' ');
}

/** Default application deadline: tomorrow (backend requires today or future). */
export function defaultJobDeadline() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

/**
 * Resolve the UUID job listing id from an application record.
 *
 * FIX: Only return the UUID string (jobListingId). We deliberately do NOT
 * fall back to the numeric jobPostingId because routing /jobs/{numericId}
 * results in a 404 — the PublicJobListingController expects a UUID or a
 * CONV-derivable numeric, but React Router captures it as an opaque string
 * and the backend /detail endpoint fails to parse large numerics reliably
 * across all environments.
 *
 * Returns null when no UUID is available; callers should render a disabled
 * "View Job" state in that case.
 */
export function resolveApplicationJobId(app) {
  if (!app) return null;
  // Only trust a proper UUID (contains hyphens)
  if (app.jobListingId && String(app.jobListingId).includes('-')) {
    return app.jobListingId;
  }
  return null;
}