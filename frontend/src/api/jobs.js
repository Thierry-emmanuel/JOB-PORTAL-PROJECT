import apiClient from './client';

/** Derive numeric job posting id from UUID (matches backend CONV(SUBSTRING...)). */
export function uuidToNumericId(uuid) {
  if (!uuid || typeof uuid !== 'string') return null;
  if (!uuid.includes('-')) {
    const n = Number(uuid);
    return Number.isFinite(n) ? n : null;
  }
  const hex = uuid.split('-')[0];
  const n = parseInt(hex, 16);
  return Number.isFinite(n) ? n : null;
}

export function resolveJobPostingId(job) {
  if (!job) return null;
  if (job.numericId != null) return job.numericId;
  return uuidToNumericId(job.id);
}

/* ─── Job Listings ───────────────────────────────────────── */

export const getJobs = async (params = {}) => {
  const {
    page = 1, limit, size, search, location, type, category,
    experienceLevel, salaryMin, salaryMax, ...rest
  } = params;

  const backendParams = {
    page: Math.max(0, page - 1),
    size: limit || size || 10,
    ...rest,
  };
  if (search)          backendParams.keyword        = search;
  if (location)        backendParams.location       = location;
  if (type)            backendParams.jobType        = type;
  if (category)        backendParams.category       = category;
  if (experienceLevel) backendParams.experienceLevel = experienceLevel;
  if (salaryMin)       backendParams.salaryMin       = salaryMin;
  if (salaryMax)       backendParams.salaryMax       = salaryMax;

  const hasFilters = search || location || type || category || experienceLevel || salaryMin || salaryMax;
  const url = hasFilters ? '/api/jobs/search' : '/api/jobs';

  const { data: apiResp } = await apiClient.get(url, { params: backendParams });
  const pageData = apiResp?.data ?? apiResp;

  return {
    data:       (pageData?.content ?? []).map(mapJobSummary),
    total:      pageData?.totalElements ?? 0,
    totalPages: pageData?.totalPages    ?? 1,
  };
};

export const getJob = async (id) => {
  const { data } = await apiClient.get(`/api/jobs/${id}`);
  return mapJobDetail(data?.data ?? data);
};

/**
 * Fetches job details without filtering by ACTIVE status.
 * Used for view-only access from application history where the job
 * may have expired or been set to DRAFT.
 *
 * Accepts both UUID strings and numeric IDs — the backend
 * PublicJobListingController.getListingDetail handles both via
 * resolveNumericalIdToUuid().
 */
export const getJobDetail = async (id) => {
  const { data } = await apiClient.get(`/api/jobs/${id}/detail`);
  return mapJobDetail(data?.data ?? data);
};

/* ─── Mappers ────────────────────────────────────────────── */

const mapJobSummary = (job) => ({
  id:        job.id,
  numericId: job.numericId ?? uuidToNumericId(job.id),
  title:     job.title,
  company:   job.companyName || 'Unknown Company',
  logo:      job.companyLogoUrl || null,
  location:  job.locationCity
    ? `${job.locationCity}${job.locationCountry ? ', ' + job.locationCountry : ''}`
    : 'Remote',
  type:      job.jobType || 'Full-time',
  salary:    job.salaryMin
    ? `${Number(job.salaryMin).toLocaleString()} XAF${job.salaryMax ? ' – ' + Number(job.salaryMax).toLocaleString() + ' XAF' : ''}`
    : null,
  postedAt:    job.createdAt || new Date().toISOString(),
  saved:       false,
  applied:     false,
  description: '',
  tags:        job.categoryName ? [job.categoryName] : [],
});

const mapJobDetail = (job) => ({
  id:        job.id,
  numericId: job.numericId ?? uuidToNumericId(job.id),
  title:     job.title,
  company:   job.company?.name || job.companyName || 'Unknown Company',
  logo:      job.company?.logoUrl || job.companyLogoUrl || null,
  location:  job.location?.city
    ? `${job.location.city}${job.location.country ? ', ' + job.location.country : ''}`
    : 'Remote',
  type:            job.jobType || 'Full-time',
  salary:          job.salaryMin
    ? `${Number(job.salaryMin).toLocaleString()} XAF${job.salaryMax ? ' – ' + Number(job.salaryMax).toLocaleString() + ' XAF' : ''}`
    : null,
  postedAt:        job.createdAt || new Date().toISOString(),
  saved:           false,
  applied:         false,
  description:     job.description || '',
  tags:            job.skills?.map(s => s.name) ?? [],
  website:         job.company?.website || null,
  deadline:        job.deadline || null,
  experienceLevel: job.experienceLevel || null,
  companyId:       job.company?.id || null,
  // Preserve qualificationNeeded and requiresInterview for edit mode
  qualificationNeeded: job.qualificationNeeded || null,
  requiresInterview:   job.requiresInterview || false,
  // Category and location sub-objects for form pre-population
  category: job.category || null,
  location_obj: job.location || null,
});

/* ─── Applications (Job Seeker) ──────────────────────────── */

/**
 * Submit a new application.
 * Payload shape matches CreateApplicationRequest:
 *   { jobPostingId, coverLetter, expectedSalary, notes? }
 */
export const applyToJob = async (seekerId, requestBody) => {
  const { data } = await apiClient.post(
    `/api/v1/applications?seekerId=${seekerId}`,
    requestBody,
  );
  return data;
};

export const getApplication = async (id) => {
  const { data } = await apiClient.get(`/api/v1/applications/${id}`);
  return data?.data ?? data;
};

/**
 * Get all applications for a seeker with embedded interview data.
 * Returns plain array (content already extracted).
 */
export const getUserApplications = async (seekerId) => {
  const { data } = await apiClient.get(
    `/api/v1/applications/seekers/${seekerId}/with-interviews`,
  );
  return data?.content ?? data ?? [];
};

/** Get seeker interviews (alias used by useEmployeeDashboard) */
export const getUserInterviews = async (seekerId) => {
  const { data } = await apiClient.get(`/api/v1/interviews/seekers/${seekerId}`);
  return data?.content ?? data ?? [];
};

/* ─── Applications (Employer) ────────────────────────────── */

/**
 * Get all applications for a specific employer (across all their jobs).
 */
export const getEmployerApplications = async (employerId) => {
  const { data } = await apiClient.get(
    `/api/v1/applications?employerId=${employerId}`,
  );
  return data?.content ?? data ?? [];
};

/**
 * Update an application status.
 * Uses optimistic concurrency: sends both expectedStatus and newStatus.
 */
export const updateApplicationStatus = async (applicationId, newStatus, expectedStatus) => {
  const { data } = await apiClient.patch(
    `/api/v1/applications/${applicationId}/status`,
    { newStatus, expectedStatus },
  );
  return data;
};

/** Withdraw an application (job seeker action). */
export const withdrawApplication = async (applicationId, seekerId) => {
  await apiClient.delete(
    `/api/v1/applications/${applicationId}/withdraw?seekerId=${seekerId}`,
  );
};

/** Get application stats for a job posting or a seeker. */
export const getApplicationStats = async ({ jobPostingId, seekerId } = {}) => {
  const params = {};
  if (jobPostingId) params.jobPostingId = jobPostingId;
  if (seekerId)     params.seekerId     = seekerId;
  const { data } = await apiClient.get('/api/v1/applications/stats', { params });
  return data;
};

/* ─── Job Postings (Employer) ────────────────────────────── */

/**
 * Get paginated listings for a specific employer.
 *
 * FIX: Added page/size/sort/direction params so ManageJobs and other consumers
 * can drive server-side pagination instead of loading all records at once.
 * Defaults are set to match previous behaviour (page=0, size=100) so existing
 * callers that do not pass these params receive the full list as before.
 *
 * @param {number} employerId  - The employer's numeric user ID.
 * @param {object} [opts]       - Optional pagination/sort overrides.
 * @param {number} [opts.page=0]         - 0-based page index.
 * @param {number} [opts.size=100]       - Page size (capped at 50 server-side for public endpoints, but employer endpoint allows 100).
 * @param {string} [opts.sortBy='createdAt']
 * @param {string} [opts.direction='DESC']
 */
export const getEmployerJobs = async (employerId, opts = {}) => {
  const {
    page      = 0,
    size      = 100,   // large default keeps backward compatibility
    sortBy    = 'createdAt',
    direction = 'DESC',
  } = opts;

  const { data } = await apiClient.get(`/api/jobs/employer/${employerId}`, {
    params: { page, size, sortBy, direction },
  });

  // Backend wraps in ApiResponse<Page<JobListingSummary>>
  // data.data is the Page object; unwrap to a flat array for the hook.
  const pageObj = data?.data ?? data;
  if (pageObj && typeof pageObj === 'object' && Array.isArray(pageObj.content)) {
    return pageObj.content;
  }
  // Fallback for plain array responses
  return Array.isArray(pageObj) ? pageObj : (pageObj?.content ?? pageObj ?? []);
};

export const changeJobStatus = async (jobId, targetStatus) => {
  const { data } = await apiClient.patch(`/api/jobs/${jobId}/status`, {
    status: targetStatus,
  });
  return data;
};

export const deleteJob = async (jobId) => {
  const { data } = await apiClient.delete(`/api/jobs/${jobId}`);
  return data;
};

/* ─── Companies ──────────────────────────────────────────── */

export const getEmployerCompanies = async (employerId) => {
  const { data } = await apiClient.get(`/api/v1/companies/employer/${employerId}`);
  return data;
};

export const createEmployerCompany = async (employerId, companyBody) => {
  const { data } = await apiClient.post(`/api/v1/companies/${employerId}`, companyBody);
  return data;
};

export const getCompanies = async () => {
  const { data } = await apiClient.get('/api/v1/companies');
  return data;
};

/* ─── Categories ─────────────────────────────────────────── */

export const getCategories = async () => {
  const { data } = await apiClient.get('/api/jobs/categories');
  return data?.data ?? data ?? [];
};

/* ─── Misc ───────────────────────────────────────────────── */

export const saveJob = async (id) => {
  const { data } = await apiClient.post(`/api/jobs/${id}/save`);
  return data;
};

export const rateJob = async (id, rating) => {
  const { data } = await apiClient.post(`/api/jobs/${id}/rate`, { rating });
  return data;
};

export const updateApplicationReview = async (applicationId, reviewText) => {
  const { data } = await apiClient.put(`/api/v1/applications/${applicationId}/review`, {
    review: reviewText,
  });
  return data;
};

export const toggleCompanyLike = async (companyId, seekerId) => {
  const { data } = await apiClient.post(`/api/v1/companies/${companyId}/like/${seekerId}`);
  return data;
};

export const getCompanyStats = async (companyId, seekerId) => {
  const params = {};
  if (seekerId) params.seekerId = seekerId;
  const { data } = await apiClient.get(`/api/v1/companies/${companyId}/stats`, { params });
  return data;
};

export const createJob = async (requestBody) => {
  const { data } = await apiClient.post('/api/jobs', requestBody);
  return data?.data ?? data;
};

export const updateJob = async (id, requestBody) => {
  const { data } = await apiClient.put(`/api/jobs/${id}`, requestBody);
  return data?.data ?? data;
};

export const getLocations = async () => {
  const { data } = await apiClient.get('/api/jobs/locations');
  return data?.data ?? data ?? [];
};

export const getSkills = async () => {
  const { data } = await apiClient.get('/api/jobs/skills');
  return data?.data ?? data ?? [];
};

const jobsService = {
  getJobs, getJob, getJobDetail, getApplication,
  applyToJob, getUserApplications, getUserInterviews,
  getEmployerApplications, updateApplicationStatus,
  withdrawApplication, getApplicationStats,
  getEmployerJobs, changeJobStatus, deleteJob,
  getEmployerCompanies, getCompanies, getCategories,
  saveJob, rateJob,
  updateApplicationReview, toggleCompanyLike, getCompanyStats,
  createJob, updateJob, getLocations, getSkills,
};

export default jobsService;