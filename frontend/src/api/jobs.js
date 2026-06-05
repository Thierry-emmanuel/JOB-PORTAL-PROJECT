import apiClient from './client';

/* ─── Job Listings ───────────────────────────────────────── */

export const getJobs = async (params = {}) => {
  const { page = 1, limit, size, search, location, type, ...rest } = params;
  const backendParams = {
    page: Math.max(0, page - 1),
    size: limit || size || 10,
    ...rest,
  };
  if (search)   backendParams.keyword  = search;
  if (location) backendParams.location = location;
  if (type)     backendParams.jobType  = type;

  const hasFilters = search || location || type;
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
 */
export const getJobDetail = async (id) => {
  const { data } = await apiClient.get(`/api/jobs/${id}/detail`);
  return mapJobDetail(data?.data ?? data);
};

/* ─── Mappers ────────────────────────────────────────────── */

const mapJobSummary = (job) => ({
  id:       job.id,
  title:    job.title,
  company:  job.companyName || 'Unknown Company',
  logo:     job.companyLogoUrl || null,
  location: job.locationCity
    ? `${job.locationCity}${job.locationCountry ? ', ' + job.locationCountry : ''}`
    : 'Remote',
  type:     job.jobType || 'Full-time',
  salary:   job.salaryMin
    ? `${Number(job.salaryMin).toLocaleString()} XAF${job.salaryMax ? ' – ' + Number(job.salaryMax).toLocaleString() + ' XAF' : ''}`
    : null,
  postedAt:   job.createdAt || new Date().toISOString(),
  saved:      false,
  applied:    false,
  description:'',
  tags:       [],
});

const mapJobDetail = (job) => ({
  id:       job.id,
  title:    job.title,
  company:  job.company?.name || job.companyName || 'Unknown Company',
  logo:     job.company?.logoUrl || job.companyLogoUrl || null,
  location: job.location?.city
    ? `${job.location.city}${job.location.country ? ', ' + job.location.country : ''}`
    : 'Remote',
  type:        job.jobType || 'Full-time',
  salary:      job.salaryMin
    ? `${Number(job.salaryMin).toLocaleString()} XAF${job.salaryMax ? ' – ' + Number(job.salaryMax).toLocaleString() + ' XAF' : ''}`
    : null,
  postedAt:    job.createdAt || new Date().toISOString(),
  saved:       false,
  applied:     false,
  description: job.description || '',
  tags:        job.skills?.map(s => s.name) ?? [],
  website:     job.company?.website || null,
  deadline:    job.deadline || null,
  experienceLevel: job.experienceLevel || null,
  companyId:   job.company?.id || null,
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

export const getEmployerJobs = async (employerId) => {
  const { data } = await apiClient.get(`/api/jobs/employer/${employerId}`);
  return data?.data?.content ?? data?.data ?? data?.content ?? data ?? [];
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

const jobsService = {
  getJobs, getJob, getJobDetail,
  applyToJob, getUserApplications, getUserInterviews,
  getEmployerApplications, updateApplicationStatus,
  withdrawApplication, getApplicationStats,
  getEmployerJobs, changeJobStatus, deleteJob,
  getEmployerCompanies, getCompanies, getCategories,
  saveJob, rateJob,
  updateApplicationReview, toggleCompanyLike, getCompanyStats,
};

export default jobsService;