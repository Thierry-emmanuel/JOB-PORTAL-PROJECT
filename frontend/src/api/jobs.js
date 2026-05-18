import apiClient from './client';

/**
 * Fetch paginated + filtered job listings.
 */
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
  const jobData = data?.data ?? data;
  return mapJobDetail(jobData);
};

// Map JobListingSummary (list view) to frontend component shape
const mapJobSummary = (job) => ({
  id: job.id,
  title: job.title,
  company: job.companyName || 'Unknown Company',
  logo: job.companyLogoUrl || null,
  location: job.locationCity ? `${job.locationCity}, ${job.locationCountry || ''}`.replace(/,\s*$/, '') : 'Remote',
  type: job.jobType || 'Full-time',
  salary: job.salaryMin ? `${job.salaryMin} XAF${job.salaryMax ? ` - ${job.salaryMax} XAF` : ''}` : null,
  postedAt: job.createdAt || new Date().toISOString(),
  saved: false,
  applied: false,
  description: '',
  tags: []
});

// Map JobListingResponse (detail view) to frontend component shape
const mapJobDetail = (job) => ({
  id: job.id,
  title: job.title,
  company: job.company?.name || 'Unknown Company',
  logo: job.company?.logoUrl || null,
  location: job.location?.city ? `${job.location.city}, ${job.location.country || ''}`.replace(/,\s*$/, '') : 'Remote',
  type: job.jobType || 'Full-time',
  salary: job.salaryMin ? `${job.salaryMin} XAF${job.salaryMax ? ` - ${job.salaryMax} XAF` : ''}` : null,
  postedAt: job.createdAt || new Date().toISOString(),
  saved: false,
  applied: false,
  description: job.description || '',
  tags: job.skills?.map(s => s.name) || [],
  website: null // the backend currently does not include company website
});

export const applyToJob = async (seekerId, requestBody) => {
  const { data } = await apiClient.post(`/api/v1/applications?seekerId=${seekerId}`, requestBody);
  return data;
};

export const rateJob = async (id, rating) => {
  const { data } = await apiClient.post(`/api/jobs/${id}/rate`, { rating });
  return data;
};

export const getUserApplications = async (seekerId) => {
  const { data } = await apiClient.get(`/api/v1/applications/seekers/${seekerId}/with-interviews`);
  return data.content || data;
};

export const getUserInterviews = async (seekerId) => {
  const { data } = await apiClient.get(`/api/v1/interviews/seekers/${seekerId}`);
  return data.content || data;
};

export const saveJob = async (id) => {
  const { data } = await apiClient.post(`/api/jobs/${id}/save`);
  return data;
};

export const getCategories = async () => {
  const { data } = await apiClient.get('/api/jobs/categories');
  return data.data || data; // Extract from ApiResponse
};

export const getCompanies = async () => {
  const { data } = await apiClient.get('/api/v1/companies');
  return data;
};

// ── Employer/Recruiter Endpoints ─────────────────────────────────────────────

export const getEmployerJobs = async (employerId) => {
  const { data } = await apiClient.get(`/api/jobs/employer/${employerId}`);
  // Return unzipped page content
  return data.data?.content || data.data || data.content || data || [];
};

export const getEmployerCompanies = async (employerId) => {
  const { data } = await apiClient.get(`/api/v1/companies/employer/${employerId}`);
  return data;
};

export const getEmployerApplications = async (employerId) => {
  const { data } = await apiClient.get(`/api/v1/applications?employerId=${employerId}`);
  return data.content || data;
};

export const updateApplicationStatus = async (applicationId, newStatus, expectedStatus) => {
  const { data } = await apiClient.patch(`/api/v1/applications/${applicationId}/status`, {
    newStatus,
    expectedStatus
  });
  return data;
};

export const changeJobStatus = async (jobId, targetStatus) => {
  const { data } = await apiClient.patch(`/api/jobs/${jobId}/status`, {
    status: targetStatus
  });
  return data;
};

export const deleteJob = async (jobId) => {
  const { data } = await apiClient.delete(`/api/jobs/${jobId}`);
  return data;
};

const jobsService = {
  getJobs,
  getJob,
  applyToJob,
  rateJob,
  getUserApplications,
  getUserInterviews,
  saveJob,
  getCategories,
  getCompanies,
  getEmployerJobs,
  getEmployerCompanies,
  getEmployerApplications,
  updateApplicationStatus,
  changeJobStatus,
  deleteJob,
};

export default jobsService;
