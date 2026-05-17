import apiClient from './client';

/**
 * Fetch paginated + filtered job listings.
 *
 * JobList.jsx passes { page (1-indexed), limit, search, location, type }.
 * The backend expects:
 *   - page  → 0-indexed  (Spring PageRequest)
 *   - size  → page size   (not "limit")
 *   - keyword / location / jobType  (search endpoint)
 *
 * Backend response shape:
 *   ApiResponse { data: SpringPage { content:[], totalElements, totalPages } }
 *
 * Returns: { data: Job[], total: number, totalPages: number }
 */
export const getJobs = async (params = {}) => {
  const { page = 1, limit, size, search, location, type, ...rest } = params;

  const backendParams = {
    page: Math.max(0, page - 1),        // 1-indexed → 0-indexed
    size: limit || size || 10,           // normalise "limit" → "size"
    ...rest,
  };

  // Map frontend filter names → backend param names
  if (search)   backendParams.keyword  = search;
  if (location) backendParams.location = location;
  if (type)     backendParams.jobType  = type;

  // Use /search endpoint only when a filter is active
  const hasFilters = search || location || type;
  const url = hasFilters ? '/api/jobs/search' : '/api/jobs';

  const { data: apiResp } = await apiClient.get(url, { params: backendParams });

  // Unwrap ApiResponse → Spring Page
  const pageData = apiResp?.data ?? apiResp;
  const rawJobs = pageData?.content ?? [];
  
  const mappedJobs = rawJobs.map(job => ({
    id: job.id,
    title: job.title,
    company: job.companyName || 'Unknown Company',
    logo: job.companyLogoUrl || null,
    location: job.locationCity && job.locationCountry 
      ? `${job.locationCity}, ${job.locationCountry}` 
      : job.locationCity || job.locationCountry || 'Remote',
    type: job.jobType || 'Full-time',
    salary: job.salaryMin && job.salaryMax ? `$${job.salaryMin} - $${job.salaryMax}` : null,
    description: job.description,
    tags: job.skills ? job.skills.map(s => s.name) : [],
    postedAt: job.createdAt || job.updatedAt || new Date().toISOString(),
    saved: false,
    applied: false
  }));

  return {
    data:       mappedJobs,
    total:      pageData?.totalElements ?? 0,
    totalPages: pageData?.totalPages    ?? 1,
  };
};

export const getJob = async (id) => {
  const { data: apiResp } = await apiClient.get(`/api/jobs/${id}`);
  
  // Unwrap ApiResponse → JobListingResponse
  const data = apiResp?.data ?? apiResp;
  
  // Map backend JobListingResponse → frontend expected shape
  return {
    id: data.id,
    title: data.title,
    company: data.company?.name || 'Unknown Company',
    logo: data.company?.logoUrl || null,
    location: data.location ? `${data.location.city || ''}, ${data.location.country || ''}`.replace(/^, |^,/g, '').trim() : 'Remote',
    type: data.jobType || 'Full-time',
    salary: data.salaryMin && data.salaryMax ? `$${data.salaryMin} - $${data.salaryMax}` : null,
    description: data.description,
    tags: data.skills ? data.skills.map(s => s.name) : [],
    postedAt: data.createdAt || data.updatedAt || new Date().toISOString(),
    saved: false,
    applied: false
  };
};

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