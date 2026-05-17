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

export const applyToJob = async (id, formData) => {
  const { data } = await apiClient.post(`/api/jobs/${id}/apply`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
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

const jobsService = {
  getJobs,
  getJob,
  applyToJob,
  rateJob,
  getUserApplications,
  getUserInterviews,
  saveJob,
};

export default jobsService;